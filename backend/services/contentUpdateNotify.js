import { getRow, getRows } from '../db.js';
import NotificationService from './notificationService.js';
import { debugLog } from '../utils/logger.js';

/**
 * Tells the students who bought a course or a دورة that the teacher added
 * something to it.
 *
 * Uploading a section with five videos is one piece of news, not six, so the
 * same course cannot announce itself again for a while. The window is held in
 * memory: a restart at worst allows one extra announcement, which is a far
 * cheaper failure than five notifications for one upload.
 */
const ANNOUNCE_WINDOW_MS = 30 * 60 * 1000;
const lastAnnounced = new Map(); // `${kind}:${id}` -> timestamp

function withinWindow(key) {
  const last = lastAnnounced.get(key);
  if (last && Date.now() - last < ANNOUNCE_WINDOW_MS) return true;
  lastAnnounced.set(key, Date.now());
  return false;
}

async function fanOut(recipients, type, title, message, metadata) {
  let created = 0;
  for (const id of recipients) {
    try {
      await NotificationService.createNotification(
        id, type, title, message, JSON.stringify(metadata));
      created += 1;
    } catch { /* one bad row must not stop the rest */ }
  }
  return created;
}

// ---------------------------------------------------------------------------
// A course (الحصص المسجلة) gained a section or a file.
// ---------------------------------------------------------------------------
export async function notifyCourseContentAdded(courseId) {
  if (!courseId) return;
  const key = `course:${courseId}`;
  if (withinWindow(key)) return;

  const course = await getRow('SELECT title FROM courses WHERE id = $1', [courseId]);
  if (!course) return;

  const buyers = await getRows(
    'SELECT DISTINCT student_id FROM student_courses WHERE course_id = $1', [courseId]);
  if (buyers.length === 0) return;

  const created = await fanOut(
    buyers.map((b) => b.student_id),
    'course_content_added',
    'محتوى جديد في دورتك',
    `تمت إضافة محتوى جديد إلى «${course.title || 'دورتك'}» — اطّلع عليه الآن`,
    { course_id: Number(courseId) });

  debugLog(`[content-added] course ${courseId}: ${created}/${buyers.length} students notified`);
}

// ---------------------------------------------------------------------------
// A دورة (live section) gained a section or a file.
// ---------------------------------------------------------------------------
export async function notifyLiveSectionContentAdded(liveSectionId) {
  if (!liveSectionId) return;
  const key = `live_section:${liveSectionId}`;
  if (withinWindow(key)) return;

  const section = await getRow('SELECT title FROM live_sections WHERE id = $1', [liveSectionId]);
  if (!section) return;

  const buyers = await getRows(
    'SELECT DISTINCT student_id FROM live_section_purchases WHERE live_section_id = $1',
    [liveSectionId]);
  if (buyers.length === 0) return;

  const created = await fanOut(
    buyers.map((b) => b.student_id),
    'live_section_content_added',
    'محتوى جديد في دورتك',
    `تمت إضافة محتوى جديد إلى «${section.title || 'دورتك'}» — اطّلع عليه الآن`,
    { live_section_id: Number(liveSectionId) });

  debugLog(`[content-added] دورة ${liveSectionId}: ${created}/${buyers.length} students notified`);
}

// A block only knows its section; these resolve the parent it belongs to.
export async function courseIdOfSection(sectionId) {
  const row = await getRow('SELECT course_id FROM course_sections WHERE id = $1', [sectionId]);
  return row?.course_id ?? null;
}

export async function liveSectionIdOfSection(sectionId) {
  const row = await getRow(
    'SELECT live_section_id FROM live_section_sections WHERE id = $1', [sectionId]);
  return row?.live_section_id ?? null;
}
