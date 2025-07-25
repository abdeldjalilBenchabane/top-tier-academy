import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function addMaterialIdToYears() {
  const client = await pool.connect();
  try {
    console.log('🚀 Updating years table for dual-path structure...');
    
    // Check if speciality_id column exists
    const specialityIdExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'years' AND column_name = 'speciality_id'
    `);
    
    if (specialityIdExists.rows.length === 0) {
      // Add speciality_id column to years table
      await client.query(`
        ALTER TABLE years 
        ADD COLUMN speciality_id INTEGER REFERENCES specialities(id) ON DELETE CASCADE
      `);
      console.log('✅ Added speciality_id column to years table');
    } else {
      console.log('ℹ️ speciality_id column already exists');
    }
    
    // Check if material_id column exists
    const materialIdExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'years' AND column_name = 'material_id'
    `);
    
    if (materialIdExists.rows.length === 0) {
      // Add material_id column to years table
      await client.query(`
        ALTER TABLE years 
        ADD COLUMN material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE
      `);
      console.log('✅ Added material_id column to years table');
    } else {
      console.log('ℹ️ material_id column already exists');
    }
    
    // Check if constraint exists
    const constraintExists = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'years' AND constraint_name = 'check_year_path'
    `);
    
    if (constraintExists.rows.length === 0) {
      // Add constraint to ensure a year has either material_id or speciality_id but not both
      await client.query(`
        ALTER TABLE years 
        ADD CONSTRAINT check_year_path 
        CHECK (
          (material_id IS NOT NULL AND speciality_id IS NULL) OR 
          (material_id IS NULL AND speciality_id IS NOT NULL) OR 
          (material_id IS NULL AND speciality_id IS NULL)
        )
      `);
      console.log('✅ Added constraint to ensure proper path structure');
    } else {
      console.log('ℹ️ check_year_path constraint already exists');
    }
    
    console.log('🎉 Successfully updated database schema for dual-path education structure!');
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMaterialIdToYears().catch(console.error); 