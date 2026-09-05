import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function addPhoneToPrivateClassRequests() {
  const client = await pool.connect();
  try {
    console.log('🚀 Adding phone column to private_class_requests...');

    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'private_class_requests' AND column_name = 'phone';
    `);

    if (colCheck.rows.length > 0) {
      console.log('ℹ️  Column private_class_requests.phone already exists — skipping.');
    } else {
      await client.query(`
        ALTER TABLE private_class_requests
        ADD COLUMN phone VARCHAR(50);
      `);
      console.log('✅ private_class_requests.phone added.');
    }

    console.log('🎉 Migration completed. Existing rows have phone = NULL.');
  } catch (err) {
    console.error('❌ Error running migration:', err);
  } finally {
    client.release();
    process.exit();
  }
}

addPhoneToPrivateClassRequests();
