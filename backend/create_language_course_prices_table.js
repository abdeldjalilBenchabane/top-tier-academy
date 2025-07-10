// Migration script to create language_course_prices table
import pool from './db.js';



const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS language_course_prices (
      id SERIAL PRIMARY KEY,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      language_level_id INTEGER REFERENCES language_levels(id) ON DELETE CASCADE,
      price NUMERIC(10,2) NOT NULL
    );
  `);
  console.log('language_course_prices table created');
  await pool.end();
};

createTable().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 