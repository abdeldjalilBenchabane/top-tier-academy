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

async function testHierarchyColumns() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking private_class_requests table structure...');
    
    // Check if hierarchy columns exist
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'private_class_requests' 
      AND column_name IN ('level_id', 'year_id', 'speciality_id', 'material_id')
      ORDER BY column_name;
    `);
    
    console.log('📋 Found hierarchy columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if there are any existing records
    const countResult = await client.query('SELECT COUNT(*) FROM private_class_requests');
    console.log(`📊 Total records in private_class_requests: ${countResult.rows[0].count}`);
    
    // Check if there are any records with hierarchy data
    const hierarchyResult = await client.query(`
      SELECT COUNT(*) as count_with_hierarchy 
      FROM private_class_requests 
      WHERE level_id IS NOT NULL OR year_id IS NOT NULL OR speciality_id IS NOT NULL OR material_id IS NOT NULL
    `);
    console.log(`📊 Records with hierarchy data: ${hierarchyResult.rows[0].count_with_hierarchy}`);
    
  } catch (err) {
    console.error('❌ Error checking hierarchy columns:', err);
  } finally {
    client.release();
    process.exit();
  }
}

testHierarchyColumns(); 