import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
});

async function addLiveSessionFields() {
  try {
    console.log('🔧 Adding live session fields to live_sections table...');

    // Add new fields to live_sections table
    await pool.query(`
      ALTER TABLE live_sections 
      ADD COLUMN IF NOT EXISTS scheduled_date DATE,
      ADD COLUMN IF NOT EXISTS scheduled_time TIME,
      ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 90;
    `);

    console.log('✅ Live session fields added successfully!');

    // Create index for scheduled date
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sections_scheduled_date 
      ON live_sections(scheduled_date);
    `);

    console.log('✅ Index created successfully!');

    console.log('🎉 Live session fields setup completed!');

  } catch (error) {
    console.error('❌ Error adding live session fields:', error);
  } finally {
    await pool.end();
  }
}

addLiveSessionFields(); 