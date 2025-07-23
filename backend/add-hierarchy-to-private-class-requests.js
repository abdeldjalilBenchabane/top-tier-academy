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

async function addHierarchyToPrivateClassRequests() {
  const client = await pool.connect();
  try {
    console.log('🚀 Adding hierarchy columns to private_class_requests table...');
    
    // Add hierarchy columns
    await client.query(`
      ALTER TABLE private_class_requests 
      ADD COLUMN IF NOT EXISTS level_id INTEGER REFERENCES levels(id),
      ADD COLUMN IF NOT EXISTS year_id INTEGER REFERENCES years(id),
      ADD COLUMN IF NOT EXISTS speciality_id INTEGER REFERENCES specialities(id),
      ADD COLUMN IF NOT EXISTS material_id INTEGER REFERENCES materials(id);
    `);
    
    console.log('🎉 Hierarchy columns added successfully!');
  } catch (err) {
    console.error('❌ Error adding hierarchy columns:', err);
  } finally {
    client.release();
    process.exit();
  }
}

addHierarchyToPrivateClassRequests(); 