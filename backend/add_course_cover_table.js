import pool from './db.js';

async function addCourseCoverTable() {
  try {
    console.log('Adding course_covers table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_covers (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        cover VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(course_id)
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_course_covers_course_id ON course_covers(course_id);
    `);
    console.log('Migration completed: course_covers table ensured.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addCourseCoverTable(); 