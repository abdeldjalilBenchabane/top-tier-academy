import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function createCourseCommentsTable() {
  const client = await pool.connect();
  try {
    console.log('🚀 Creating course_comments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_comments (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(100) NOT NULL,
        comment TEXT NOT NULL,
        tab VARCHAR(32) NOT NULL, -- overview, curriculum, ask, reviews
        rating INTEGER, -- nullable, only for reviews
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('🎉 course_comments table created successfully!');
  } catch (err) {
    console.error('❌ Error creating course_comments table:', err);
  } finally {
    client.release();
    process.exit();
  }
}

async function addReplyColumn() {
  const client = await pool.connect();
  try {
    console.log('🚀 Adding reply column to course_comments table...');
    await client.query(`
      ALTER TABLE course_comments
      ADD COLUMN IF NOT EXISTS reply TEXT;
    `);
    console.log('🎉 reply column added successfully!');
  } catch (err) {
    console.error('❌ Error adding reply column:', err);
  } finally {
    client.release();
    process.exit();
  }
}

createCourseCommentsTable();
addReplyColumn(); 