import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getRow, getRows } from '../db.js';
import pool from '../db.js';

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

const num = (v) => parseInt(v ?? 0, 10) || 0;

// ---------------------------------------------------------------------------
// This route clears STUDENT ACCESS only. Courses, live sections, their content
// and every file in R2 are never touched here.
// ---------------------------------------------------------------------------

// GET /api/admin/year-reset/preview
// What a full access reset would remove.
router.get('/preview', verifyToken, requireAdmin, async (req, res) => {
  try {
    const r = await getRow(`
      SELECT
        (SELECT COUNT(*) FROM student_courses)::int                       AS course_access,
        (SELECT COUNT(DISTINCT student_id) FROM student_courses)::int     AS course_students,
        (SELECT COUNT(*) FROM live_section_purchases)::int                AS live_access,
        (SELECT COUNT(DISTINCT student_id) FROM live_section_purchases)::int AS live_students,
        (SELECT COUNT(*) FROM courses)::int                               AS courses_kept,
        (SELECT COUNT(*) FROM live_sections)::int                         AS live_sections_kept,
        (SELECT COUNT(*) FROM course_files)::int                          AS course_files_kept,
        (SELECT COUNT(*) FROM live_section_files)::int                    AS live_files_kept,
        (SELECT COUNT(*) FROM purchases)::int                             AS purchase_records_kept`);

    const students = await getRow(`
      SELECT COUNT(*)::int AS n FROM (
        SELECT student_id FROM student_courses
        UNION
        SELECT student_id FROM live_section_purchases
      ) x`);

    res.json({
      removes: {
        courseAccess: num(r.course_access),
        liveAccess: num(r.live_access),
        studentsAffected: num(students.n),
      },
      keeps: {
        courses: num(r.courses_kept),
        liveSections: num(r.live_sections_kept),
        courseFiles: num(r.course_files_kept),
        liveSectionFiles: num(r.live_files_kept),
        purchaseRecords: num(r.purchase_records_kept),
      },
      empty: num(r.course_access) + num(r.live_access) === 0,
      confirmPhrase: 'CLEAR ALL ACCESS',
    });
  } catch (error) {
    console.error('Error building access-reset preview:', error);
    res.status(500).json({ error: 'Failed to build preview' });
  }
});

// POST /api/admin/year-reset
// Removes every student's access to every course and live section.
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  if (req.body?.confirm !== 'CLEAR ALL ACCESS') {
    return res.status(400).json({ error: 'Confirmation mismatch.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const a = await client.query('DELETE FROM student_courses');
    const b = await client.query('DELETE FROM live_section_purchases');
    await client.query('COMMIT');

    console.log(`✅ Student access cleared by admin ${req.user.id}: ` +
      `${a.rowCount} course enrollments, ${b.rowCount} live section purchases. ` +
      `No courses, content or files were deleted.`);

    res.json({ success: true, deleted: { courseAccess: a.rowCount, liveAccess: b.rowCount } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Access reset failed, rolled back:', error);
    res.status(500).json({ error: `Reset failed and was rolled back. Nothing changed. (${error.message})` });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// Per-course / per-live-section access management.
// ---------------------------------------------------------------------------

// GET /api/admin/year-reset/items?type=course|live
router.get('/items', verifyToken, requireAdmin, async (req, res) => {
  try {
    const type = req.query.type === 'live' ? 'live' : 'course';
    const rows = type === 'course'
      ? await getRows(`
          SELECT c.id, c.title, COUNT(sc.id)::int AS students
            FROM courses c LEFT JOIN student_courses sc ON sc.course_id = c.id
           GROUP BY c.id, c.title ORDER BY students DESC, c.title ASC`)
      : await getRows(`
          SELECT ls.id, ls.title, COUNT(p.id)::int AS students
            FROM live_sections ls LEFT JOIN live_section_purchases p ON p.live_section_id = ls.id
           GROUP BY ls.id, ls.title ORDER BY students DESC, ls.title ASC`);
    res.json({ type, items: rows });
  } catch (error) {
    console.error('Error listing items:', error);
    res.status(500).json({ error: 'Failed to list items' });
  }
});

// GET /api/admin/year-reset/items/:id/students?type=course|live
router.get('/items/:id/students', verifyToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const type = req.query.type === 'live' ? 'live' : 'course';

    const rows = type === 'course'
      ? await getRows(`
          SELECT u.id, u.name, u.email, sc.buy_at AS acquired_at, sc.progress
            FROM student_courses sc JOIN users u ON u.id = sc.student_id
           WHERE sc.course_id = $1 ORDER BY u.name ASC`, [id])
      : await getRows(`
          SELECT u.id, u.name, u.email, p.purchase_date AS acquired_at, p.points_spent
            FROM live_section_purchases p JOIN users u ON u.id = p.student_id
           WHERE p.live_section_id = $1 ORDER BY u.name ASC`, [id]);

    res.json({ type, id, students: rows });
  } catch (error) {
    console.error('Error listing students:', error);
    res.status(500).json({ error: 'Failed to list students' });
  }
});

// POST /api/admin/year-reset/revoke
// Removes access for the selected students only.
router.post('/revoke', verifyToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.body?.id, 10);
    const type = req.body?.type === 'live' ? 'live' : 'course';
    const studentIds = Array.isArray(req.body?.studentIds)
      ? req.body.studentIds.map(n => parseInt(n, 10)).filter(Number.isInteger)
      : [];

    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    if (!studentIds.length) return res.status(400).json({ error: 'No students selected' });

    const result = type === 'course'
      ? await pool.query('DELETE FROM student_courses WHERE course_id = $1 AND student_id = ANY($2)', [id, studentIds])
      : await pool.query('DELETE FROM live_section_purchases WHERE live_section_id = $1 AND student_id = ANY($2)', [id, studentIds]);

    console.log(`Access revoked by admin ${req.user.id}: ${result.rowCount} student(s) on ${type} ${id}`);
    res.json({ success: true, revoked: result.rowCount });
  } catch (error) {
    console.error('Error revoking access:', error);
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

export default router;
