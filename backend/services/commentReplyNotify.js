import { getRow } from '../db.js';
import NotificationService from './notificationService.js';

// Tells a comment's author that someone replied, as an in-app notification
// plus a push to their phone. Nobody is notified about their own reply.
// kind: 'course' (الحصص المسجلة) or 'live_section' (الدورات).
export async function notifyCommentReply(kind, commentId, replierId, replierName, replyText) {
  const comment = await getRow(
    kind === 'course'
      ? `SELECT c.user_id, c.course_id, crs.title
           FROM course_comments c JOIN courses crs ON crs.id = c.course_id
          WHERE c.id = $1`
      : `SELECT c.user_id, c.live_section_id, ls.title
           FROM live_section_comments c JOIN live_sections ls ON ls.id = c.live_section_id
          WHERE c.id = $1`,
    [commentId]);
  if (!comment || !comment.user_id || String(comment.user_id) === String(replierId)) return;

  const text = String(replyText || '').trim();
  const snippet = text.length > 90 ? `${text.slice(0, 90)}…` : text;
  const metadata = {
    comment_id: Number(commentId),
    ...(kind === 'course'
      ? { course_id: comment.course_id }
      : { live_section_id: comment.live_section_id }),
  };
  await NotificationService.createNotification(
    comment.user_id,
    'comment_reply',
    `${replierName || 'مستخدم'} ردّ على تعليقك`,
    `في «${comment.title || 'الدورة'}»: ${snippet}`,
    JSON.stringify(metadata));
}
