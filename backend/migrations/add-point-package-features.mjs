// A package becomes a titled group; each feature is what a student actually buys.
import pool from '../db.js';

const client = await pool.connect();
try {
  await client.query('BEGIN');

  await client.query(`
    CREATE TABLE IF NOT EXISTS point_package_features (
      id            SERIAL PRIMARY KEY,
      package_id    INTEGER NOT NULL REFERENCES point_packages(id) ON DELETE CASCADE,
      name          VARCHAR(255) NOT NULL,
      points        INTEGER NOT NULL DEFAULT 0,
      price         NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency      VARCHAR(10) NOT NULL DEFAULT 'DZD',
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active     BOOLEAN NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

  await client.query(`CREATE INDEX IF NOT EXISTS idx_ppf_package ON point_package_features(package_id)`);

  // Every existing package keeps working: its own points/price become its
  // first feature, so nothing that students can buy today disappears.
  const seeded = await client.query(`
    INSERT INTO point_package_features (package_id, name, points, price, currency, display_order)
    SELECT p.id, p.name, p.points, p.price, COALESCE(p.currency, 'DZD'), 0
      FROM point_packages p
     WHERE NOT EXISTS (SELECT 1 FROM point_package_features f WHERE f.package_id = p.id)
    RETURNING id`);

  await client.query('COMMIT');
  console.error(`MIG_OK table_ready seeded_features=${seeded.rowCount}`);
} catch (e) {
  await client.query('ROLLBACK');
  console.error('MIG_FAIL ' + e.message);
} finally {
  client.release();
  process.exit(0);
}
