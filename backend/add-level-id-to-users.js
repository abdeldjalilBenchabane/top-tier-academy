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

async function addLevelIdToUsers() {
  const client = await pool.connect();

  try {
    console.log('🚀 Adding level_id column to users table...');

    // Check if column already exists
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'level_id';
    `);

    if (colCheck.rows.length > 0) {
      console.log('ℹ️  Column users.level_id already exists — skipping.');
    } else {
      await client.query(`
        ALTER TABLE users
        ADD COLUMN level_id INTEGER REFERENCES levels(id) ON DELETE SET NULL;
      `);
      console.log('✅ users.level_id column added.');
    }

    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_level_id ON users(level_id);`);
    console.log('✅ Index idx_users_level_id ready.');

    console.log('🎉 Migration completed. Existing rows have level_id = NULL.');
  } catch (err) {
    console.error('❌ Error running migration:', err);
  } finally {
    client.release();
    process.exit();
  }
}

addLevelIdToUsers();
