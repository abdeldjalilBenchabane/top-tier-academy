import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

async function createCourseCommentsAndRepliesTables() {
  const client = await pool.connect();
  try {
    console.log('🚀 Creating course_comments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_comments (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        section_id INTEGER REFERENCES course_sections(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        comment TEXT NOT NULL,
        tab VARCHAR(32) NOT NULL, -- overview, curriculum, ask, reviews
        rating INTEGER, -- nullable, only for reviews
        reply TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('🎉 course_comments table created successfully!');

    console.log('🚀 Creating comment_replies table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS comment_replies (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES course_comments(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(100),
        user_role VARCHAR(32),
        reply_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('🎉 comment_replies table created successfully!');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
  } finally {
    client.release();
    process.exit();
  }
}

createCourseCommentsAndRepliesTables(); 