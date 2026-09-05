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

const DEFAULTS = {
  showPoints: true,
  sections: { recorded: true, private: true, live: true, programs: true, languages: true },
  courses:      { mode: 'all', ids: [] },
  liveSections: { mode: 'all', ids: [] },
  liveSessions: { mode: 'all', ids: [] },
  languages:    { mode: 'all', ids: [] },
  freeCourseIds: [],
  freeLiveSectionIds: [],
};

const MODES = ['all', 'selected', 'none'];
const SECTION_KEYS = ['recorded', 'private', 'live', 'programs', 'languages'];

const intList = (v) => Array.isArray(v)
  ? [...new Set(v.map(n => parseInt(n, 10)).filter(Number.isInteger))]
  : [];

const picker = (raw, fallback) => {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    mode: MODES.includes(src.mode) ? src.mode : fallback.mode,
    ids: intList(src.ids),
  };
};

// Never trust whatever happens to be stored: always return a complete,
// well-shaped config so the app can rely on every field existing.
const normalize = (raw) => {
  const c = raw && typeof raw === 'object' ? raw : {};
  const sections = {};
  SECTION_KEYS.forEach(k => {
    sections[k] = c.sections && typeof c.sections[k] === 'boolean'
      ? c.sections[k] : DEFAULTS.sections[k];
  });
  return {
    showPoints: typeof c.showPoints === 'boolean' ? c.showPoints : DEFAULTS.showPoints,
    sections,
    courses:      picker(c.courses, DEFAULTS.courses),
    liveSections: picker(c.liveSections, DEFAULTS.liveSections),
    liveSessions: picker(c.liveSessions, DEFAULTS.liveSessions),
    languages:    picker(c.languages, DEFAULTS.languages),
    freeCourseIds: intList(c.freeCourseIds),
    freeLiveSectionIds: intList(c.freeLiveSectionIds),
  };
};

const readConfig = async () => {
  const row = await getRow('SELECT config FROM mobile_app_settings WHERE id = 1');
  return normalize(row?.config);
};

// GET /api/mobile-config — read by the app itself, so no auth.
router.get('/mobile-config', async (req, res) => {
  try {
    const config = await readConfig();

    // The app only ever sees language *names* on a course, never ids, so the
    // selected language ids are resolved here rather than in the client.
    let languageNames = [];
    if (config.languages.mode === 'selected' && config.languages.ids.length) {
      const rows = await getRows('SELECT name FROM languages WHERE id = ANY($1)', [config.languages.ids]);
      languageNames = rows.map(r => r.name).filter(Boolean);
    }

    res.json({ config: { ...config, languageNames } });
  } catch (error) {
    console.error('Error reading mobile config:', error);
    // The app must still work if this fails.
    res.json({ config: DEFAULTS });
  }
});

// GET /api/admin/mobile-config — config plus the catalogue the admin picks from.
router.get('/admin/mobile-config', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [config, courses, liveSections, liveSessions, languages] = await Promise.all([
      readConfig(),
      getRows(`SELECT c.id, c.title, c.price, m.name AS material_name
                 FROM courses c LEFT JOIN materials m ON m.id = c.material_id
                WHERE c.status = 'approved' ORDER BY c.title`),
      getRows(`SELECT ls.id, ls.title, ls.price, u.name AS professor_name
                 FROM live_sections ls LEFT JOIN users u ON u.id = ls.professor_id
                WHERE ls.status = 'approved' ORDER BY ls.title`),
      getRows(`SELECT id, title, price FROM live_sessions ORDER BY title`),
      getRows(`SELECT id, name FROM languages ORDER BY name`),
    ]);
    res.json({ config, catalogue: { courses, liveSections, liveSessions, languages } });
  } catch (error) {
    console.error('Error loading mobile config for admin:', error);
    res.status(500).json({ error: 'Failed to load mobile settings' });
  }
});

// PUT /api/admin/mobile-config
router.put('/admin/mobile-config', verifyToken, requireAdmin, async (req, res) => {
  try {
    const config = normalize(req.body?.config);
    const result = await pool.query(
      `INSERT INTO mobile_app_settings (id, config, updated_by, updated_at)
       VALUES (1, $1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE
         SET config = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING config`,
      [JSON.stringify(config), req.user.id]);

    console.log(`Mobile app settings updated by admin ${req.user.id}`);
    res.json({ success: true, config: normalize(result.rows[0].config) });
  } catch (error) {
    console.error('Error saving mobile config:', error);
    res.status(500).json({ error: 'Failed to save mobile settings' });
  }
});

export default router;
