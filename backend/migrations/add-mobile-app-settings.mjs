// One row holding how the mobile app should behave. Kept as JSONB so new
// switches can be added without another migration.
import pool from '../db.js';

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

const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(`
    CREATE TABLE IF NOT EXISTS mobile_app_settings (
      id         INTEGER PRIMARY KEY DEFAULT 1,
      config     JSONB NOT NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT mobile_app_settings_single_row CHECK (id = 1)
    )`);
  const r = await client.query(
    `INSERT INTO mobile_app_settings (id, config) VALUES (1, $1)
     ON CONFLICT (id) DO NOTHING RETURNING id`, [JSON.stringify(DEFAULTS)]);
  await client.query('COMMIT');
  console.error(`MIG_OK table_ready seeded=${r.rowCount}`);
} catch (e) {
  await client.query('ROLLBACK');
  console.error('MIG_FAIL ' + e.message);
} finally { client.release(); process.exit(0); }
