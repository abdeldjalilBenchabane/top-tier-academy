import pool from './db.js';

async function addPointsColumn() {
  try {
    await pool.query('ALTER TABLE point_codes ADD COLUMN IF NOT EXISTS points INTEGER;');
    console.log('points column added to point_codes table (if it did not exist).');
    process.exit(0);
  } catch (err) {
    console.error('Error adding points column:', err);
    process.exit(1);
  }
}

addPointsColumn(); 