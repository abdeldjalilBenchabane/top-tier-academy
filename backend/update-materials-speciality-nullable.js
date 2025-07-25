import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function updateMaterialsSpecialityNullable() {
  const client = await pool.connect();
  try {
    console.log('🚀 Making speciality_id nullable in materials table...');
    
    // Make speciality_id nullable
    await client.query(`
      ALTER TABLE materials 
      ALTER COLUMN speciality_id DROP NOT NULL
    `);
    
    console.log('✅ Made speciality_id nullable in materials table');
    
    console.log('🎉 Successfully updated materials table to support materials without speciality!');
    
  } catch (error) {
    console.error('❌ Error updating materials table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateMaterialsSpecialityNullable().catch(console.error); 