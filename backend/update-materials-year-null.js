import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function updateMaterialsYearNull() {
  const client = await pool.connect();
  try {
    console.log('🚀 Updating materials year_id to null for old path...');
    
    // Set year_id to null for materials that have speciality_id (old path)
    console.log('📝 Setting year_id to null for materials with speciality_id...');
    const result = await client.query(`
      UPDATE materials 
      SET year_id = NULL 
      WHERE speciality_id IS NOT NULL
    `);
    
    console.log(`✅ Updated ${result.rowCount} materials`);
    console.log('🎉 Successfully updated materials!');
    console.log('📋 Now:');
    console.log('   - Materials with speciality_id have year_id = NULL');
    console.log('   - Materials with year_id have speciality_id = NULL');
    console.log('   - This ensures proper separation between old and new paths');
    
  } catch (error) {
    console.error('❌ Error updating materials:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateMaterialsYearNull().catch(console.error); 