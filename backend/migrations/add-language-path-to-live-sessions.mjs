// A live session could only ever be filed under an education material. Sessions
// belonging to a language دورة had nowhere to store that path.
import pool from '../db.js';
const c = await pool.connect();
try {
  await c.query('BEGIN');
  await c.query(`ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS language_id INTEGER REFERENCES languages(id) ON DELETE SET NULL`);
  await c.query(`ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS language_level_id INTEGER REFERENCES language_levels(id) ON DELETE SET NULL`);
  await c.query(`ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS root_type VARCHAR(20)`);
  // Existing rows: anything with a material is an education path.
  const r = await c.query(`UPDATE live_sessions SET root_type = 'education'
                            WHERE root_type IS NULL AND material_id IS NOT NULL`);
  await c.query('COMMIT');
  console.error(`MIG_OK columns_ready backfilled_root_type=${r.rowCount}`);
} catch (e) {
  await c.query('ROLLBACK');
  console.error('MIG_FAIL ' + e.message);
} finally { c.release(); process.exit(0); }
