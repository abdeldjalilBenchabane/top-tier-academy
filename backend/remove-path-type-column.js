import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function removePathTypeColumn() {
  const client = await pool.connect();
  try {
    console.log('🚀 Removing path_type column from years table...');
    
    // Remove path_type column from years table
    console.log('📝 Dropping path_type column from years table...');
    await client.query(`
      ALTER TABLE years 
      DROP COLUMN IF EXISTS path_type
    `);
    
    console.log('✅ Removed path_type column from years table');
    console.log('🎉 Successfully cleaned up years table!');
    console.log('📋 Now years table only has:');
    console.log('   - id, name, level_id');
    console.log('   - No path_type column needed');
    
  } catch (error) {
    console.error('❌ Error removing path_type column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

removePathTypeColumn().catch(console.error); 