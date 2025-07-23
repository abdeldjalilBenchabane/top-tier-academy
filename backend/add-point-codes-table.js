import pool from './db.js';

async function createPointCodesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS point_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(16) UNIQUE NOT NULL,
        package_id INTEGER REFERENCES point_packages(id) ON DELETE CASCADE,
        is_used BOOLEAN DEFAULT false,
        used_by INTEGER REFERENCES users(id),
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_point_codes_code ON point_codes(code);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_point_codes_used_by ON point_codes(used_by);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_point_codes_package_id ON point_codes(package_id);');
    console.log('point_codes table created or already exists.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating point_codes table:', err);
    process.exit(1);
  }
}

createPointCodesTable(); 