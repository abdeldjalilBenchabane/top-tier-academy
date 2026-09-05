import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function createLiveSectionCommentsAndRepliesTables() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating live_section_comments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_section_comments (
        id SERIAL PRIMARY KEY,
        live_section_id INTEGER REFERENCES live_sections(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        comment TEXT NOT NULL,
        tab VARCHAR(32) NOT NULL,
        rating INTEGER,
        reply TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('🎉 live_section_comments table created successfully!');

    console.log('🚀 Creating live_section_comment_replies table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_section_comment_replies (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES live_section_comments(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(100),
        user_role VARCHAR(32),
        reply_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('🎉 live_section_comment_replies table created successfully!');

    await client.query(`CREATE INDEX IF NOT EXISTS idx_lsc_section ON live_section_comments(live_section_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_lscr_comment ON live_section_comment_replies(comment_id);`);
    console.log('🎉 Indexes created.');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
  } finally {
    client.release();
    process.exit();
  }
}

createLiveSectionCommentsAndRepliesTables();
