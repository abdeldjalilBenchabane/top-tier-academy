import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getRow, getRows, query } from '../db.js';
import { debugLog } from '../utils/logger.js';

const router = express.Router();

/**
 * A student's school path, and the content that matches it.
 *
 * The student says where they are in school — level, year, and in secondary a
 * speciality — and the feed narrows to that. They never pick a subject:
 * picking a subject would narrow the feed to one course, while picking a year
 * opens everything taught in that year.
 *
 * CHOOSING IS OPTIONAL
 * A student who has not chosen, or who skipped the question, gets the whole
 * catalogue rather than an empty screen. The path is a filter someone opts
 * into, not a gate they have to pass. `path_set` in the response says which of
 * the two they are looking at, so the app can offer the picker without having
 * to guess why the list looks the way it does.
 *
 * SCHOOL ONLY
 * Languages have their own page in the app, so they are not part of the path.
 *
 * HOW DEEP THE PATH GOES DEPENDS ON THE LEVEL — measured against live data:
 *     التعليم الابتدائي   3 years,  0 specialities
 *     التعليم المتوسط     4 years,  0 specialities
 *     التعليم الثانوي     3 years, 14 specialities
 * and in secondary every material hangs off a speciality, none off a year
 * directly. So the speciality step exists for secondary and nowhere else.
 *
 * HOW CONTENT IS MATCHED
 * The three content tables classify themselves differently, which is why the
 * feed is three queries rather than one:
 *   live_sections   carry level_id / year_id / speciality_id directly
 *   courses         carry only material_id
 *   live_sessions   carry material_id, usually NULL — they inherit from the
 *                   دورة they belong to
 *
 * A material reaches the hierarchy by one of two routes, and both are checked
 * because which applies depends on the level:
 *   material -> speciality -> year -> level     (secondary)
 *   material -> year -> level                   (primary, middle)
 */

// Turning a material into a path — the same joins wherever a material is all
// the classification a row has.
const materialPath = (col) => `
  LEFT JOIN materials    mat ON mat.id = ${col}
  LEFT JOIN specialities sp  ON sp.id  = mat.speciality_id
  LEFT JOIN years        ysp ON ysp.id = sp.year_id
  LEFT JOIN years        ymt ON ymt.id = mat.year_id
`;

/** Is this material in the student's year, and their speciality if they have one? */
const materialMatches = (year, spec) => `(
  COALESCE(ysp.id, ymt.id) = $${year}
  AND ($${spec}::int IS NULL OR mat.speciality_id IS NULL OR mat.speciality_id = $${spec})
)`;

async function loadPath(userId) {
  return getRow(`
    SELECT u.level_id, u.year_id, u.speciality_id, u.path_set_at,
           l.name AS level_name,
           y.name AS year_name,
           s.name AS speciality_name
      FROM users u
      LEFT JOIN levels       l ON l.id = u.level_id
      LEFT JOIN years        y ON y.id = u.year_id
      LEFT JOIN specialities s ON s.id = u.speciality_id
     WHERE u.id = $1
  `, [userId]);
}

/** A path filters the feed only once it names a year. */
const isSet = (p) => !!(p && p.level_id && p.year_id);

// ---------------------------------------------------------------------------
// GET /api/student/path/options
// One step at a time, so the app fills each list as the student taps the
// previous answer instead of downloading the whole tree up front.
//   ?level_id=14&year_id=28
// ---------------------------------------------------------------------------
router.get('/student/path/options', verifyToken, async (req, res) => {
  try {
    const num = (v) => (v ? parseInt(v, 10) : null);
    const levelId = num(req.query.level_id);
    const yearId  = num(req.query.year_id);

    const levels = await getRows('SELECT id, name FROM levels ORDER BY id');
    const years = levelId
      ? await getRows('SELECT id, name FROM years WHERE level_id = $1 ORDER BY id', [levelId])
      : [];
    const specialities = yearId
      ? await getRows('SELECT id, name FROM specialities WHERE year_id = $1 ORDER BY id', [yearId])
      : [];

    res.json({
      levels,
      years,
      specialities,
      // Told outright rather than inferred from an empty array, which could
      // equally mean "none exist" or "not loaded yet".
      speciality_required: yearId ? specialities.length > 0 : null,
    });
  } catch (error) {
    console.error('Error loading path options:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/student/path
// ---------------------------------------------------------------------------
router.get('/student/path', verifyToken, async (req, res) => {
  try {
    const path = await loadPath(req.user.id);
    if (!path) return res.status(404).json({ error: 'User not found' });
    res.json({
      ...path,
      is_set: isSet(path),
      // Never asked, or asked and skipped — the app may want to prompt once
      // more in the first case and leave them alone in the second.
      was_asked: !!path.path_set_at,
    });
  } catch (error) {
    console.error('Error loading student path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/student/path   { level_id, year_id, speciality_id? }
// Send { skip: true } to record that they were asked and chose not to answer;
// the feed then shows everything.
// ---------------------------------------------------------------------------
router.put('/student/path', verifyToken, async (req, res) => {
  try {
    const num = (v) => (v ? parseInt(v, 10) : null);

    if (req.body.skip === true) {
      // Clears any previous choice and marks the question as asked, so the
      // student is not prompted again on every launch.
      await query(`
        UPDATE users
           SET level_id = NULL, year_id = NULL, speciality_id = NULL,
               path_set_at = CURRENT_TIMESTAMP
         WHERE id = $1
      `, [req.user.id]);
      debugLog(`[PATH] user ${req.user.id} skipped`);
      return res.json({
        message: 'سيتم عرض كل المحتوى',
        is_set: false, was_asked: true,
      });
    }

    const level_id = num(req.body.level_id);
    const year_id  = num(req.body.year_id);
    const speciality_id = num(req.body.speciality_id);

    if (!level_id || !year_id) {
      return res.status(400).json({ error: 'المستوى والسنة مطلوبان' });
    }

    // Each part must belong to the one above it. Without this a client could
    // store a third-year speciality against a first-year student, and the feed
    // would return nothing for the rest of the year with no explanation.
    const year = await getRow('SELECT id, level_id FROM years WHERE id = $1', [year_id]);
    if (!year) return res.status(400).json({ error: 'السنة غير موجودة' });
    if (year.level_id !== level_id) {
      return res.status(400).json({ error: 'هذه السنة لا تنتمي إلى المستوى المختار' });
    }

    const specialities = await getRows(
      'SELECT id FROM specialities WHERE year_id = $1', [year_id]);

    if (specialities.length > 0) {
      if (!speciality_id) {
        return res.status(400).json({ error: 'التخصص مطلوب لهذه السنة' });
      }
      if (!specialities.some(s => s.id === speciality_id)) {
        return res.status(400).json({ error: 'هذا التخصص لا ينتمي إلى السنة المختارة' });
      }
    }

    await query(`
      UPDATE users
         SET level_id = $2, year_id = $3, speciality_id = $4,
             path_set_at = CURRENT_TIMESTAMP
       WHERE id = $1
    `, [req.user.id, level_id, year_id,
        // A year with no specialities cannot carry one, whatever was sent.
        specialities.length > 0 ? speciality_id : null]);

    const path = await loadPath(req.user.id);
    debugLog(`[PATH] user ${req.user.id} -> level ${level_id} year ${year_id}`);
    res.json({ message: 'تم حفظ مسارك الدراسي', ...path, is_set: true, was_asked: true });
  } catch (error) {
    console.error('Error saving student path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/student/path — go back to seeing everything
// ---------------------------------------------------------------------------
router.delete('/student/path', verifyToken, async (req, res) => {
  try {
    await query(`
      UPDATE users
         SET level_id = NULL, year_id = NULL, speciality_id = NULL,
             path_set_at = CURRENT_TIMESTAMP
       WHERE id = $1
    `, [req.user.id]);
    res.json({ message: 'تم إلغاء التصفية — سيظهر كل المحتوى', is_set: false, was_asked: true });
  } catch (error) {
    console.error('Error clearing student path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/student/feed        ?limit= (default 20, max 50)
//
// With a path: the content of that year. Without one: everything.
// ---------------------------------------------------------------------------
router.get('/student/feed', verifyToken, async (req, res) => {
  try {
    const path = await loadPath(req.user.id);
    const filtered = isSet(path);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    // The year and speciality are passed in either way. When there is no path
    // they are NULL, and each query's `$1 IS NULL OR …` turns the filter off
    // rather than needing a second set of queries to maintain.
    const year = filtered ? path.year_id : null;
    const spec = filtered ? path.speciality_id : null;

    const liveSections = await getRows(`
      SELECT ls.id, ls.title, ls.description, ls.price, ls.cover_image_url,
             ls.professor_id, u.name AS professor_name,
             ls.level_id, ls.year_id, ls.speciality_id, ls.material_id,
             m.name AS material_name,
             (SELECT COUNT(*) FROM live_sessions s WHERE s.section_id = ls.id)::int AS sessions_count
        FROM live_sections ls
        LEFT JOIN users u     ON u.id = ls.professor_id
        LEFT JOIN materials m ON m.id = ls.material_id
       WHERE ls.status = 'approved'
         AND ($1::int IS NULL OR ls.year_id = $1)
         AND ($2::int IS NULL OR ls.speciality_id IS NULL OR ls.speciality_id = $2)
       ORDER BY ls.id DESC LIMIT $3
    `, [year, spec, limit]);

    const courses = await getRows(`
      SELECT c.id, c.title, c.description, c.price,
             cc.cover AS cover_image_url,
             c.created_by AS professor_id, pu.name AS professor_name,
             c.material_id, mat.name AS material_name,
             COALESCE(ysp.id, ymt.id) AS year_id, mat.speciality_id
        FROM courses c
        LEFT JOIN course_covers cc ON cc.course_id = c.id
        LEFT JOIN users pu ON pu.id = c.created_by
        ${materialPath('c.material_id')}
       WHERE c.status = 'approved'
         AND ($1::int IS NULL OR ${materialMatches(1, 2)})
       ORDER BY c.id DESC LIMIT $3
    `, [year, spec, limit]);

    const liveSessions = await getRows(`
      SELECT ls.id, ls.title, ls.description, ls.price, ls.cover_image_url,
             ls.start_time, ls.duration, ls.status,
             ls.professor_id, ls.professor_name,
             ls.section_id, sec.title AS section_title
        FROM live_sessions ls
        LEFT JOIN live_sections sec ON sec.id = ls.section_id
        ${materialPath('ls.material_id')}
       WHERE ls.is_approved = TRUE AND ls.is_rejected = FALSE
         AND ls.status <> 'ended'
         AND ($1::int IS NULL OR (
              -- inherited from the دورة it belongs to
              (sec.id IS NOT NULL AND sec.year_id = $1
               AND ($2::int IS NULL OR sec.speciality_id IS NULL OR sec.speciality_id = $2))
              -- or classified on its own
              OR (ls.material_id IS NOT NULL AND ${materialMatches(1, 2)})
             ))
       ORDER BY ls.start_time ASC LIMIT $3
    `, [year, spec, limit]);

    res.json({
      // false means the student is seeing everything, not that something failed.
      path_set: filtered,
      was_asked: !!path?.path_set_at,
      path: filtered ? {
        level_id: path.level_id,           level_name: path.level_name,
        year_id: path.year_id,             year_name: path.year_name,
        speciality_id: path.speciality_id, speciality_name: path.speciality_name,
      } : null,
      counts: {
        courses: courses.length,
        live_sections: liveSections.length,
        live_sessions: liveSessions.length,
      },
      courses,
      live_sections: liveSections,
      live_sessions: liveSessions,
    });
  } catch (error) {
    console.error('Error building student feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
