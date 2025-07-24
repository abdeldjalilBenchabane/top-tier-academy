import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function fixEducationStructure() {
  const client = await pool.connect();
  try {
    console.log('🚀 Fixing education structure...');
    
    // Step 1: Add year_id column to materials table
    console.log('📝 Adding year_id to materials table...');
    await client.query(`
      ALTER TABLE materials 
      ADD COLUMN year_id INTEGER REFERENCES years(id) ON DELETE CASCADE
    `);
    console.log('✅ Added year_id to materials table');
    
    // Step 2: Remove speciality_id and material_id from years table
    console.log('📝 Removing speciality_id and material_id from years table...');
    await client.query(`
      ALTER TABLE years 
      DROP COLUMN IF EXISTS speciality_id
    `);
    await client.query(`
      ALTER TABLE years 
      DROP COLUMN IF EXISTS material_id
    `);
    console.log('✅ Removed speciality_id and material_id from years table');
    
    // Step 3: Add path_type column to years table to track the choice
    console.log('📝 Adding path_type to years table...');
    await client.query(`
      ALTER TABLE years 
      ADD COLUMN path_type VARCHAR(20) CHECK (path_type IN ('speciality', 'material'))
    `);
    console.log('✅ Added path_type to years table');
    
    // Step 4: Update existing materials to link to years
    console.log('📝 Updating existing materials to link to years...');
    await client.query(`
      UPDATE materials m
      SET year_id = (
        SELECT y.id 
        FROM years y 
        JOIN specialities s ON s.year_id = y.id 
        WHERE s.id = m.speciality_id
      )
      WHERE m.speciality_id IS NOT NULL
    `);
    console.log('✅ Updated existing materials');
    
    // Step 5: Update years to have path_type based on existing data
    console.log('📝 Setting path_type for existing years...');
    await client.query(`
      UPDATE years 
      SET path_type = 'speciality' 
      WHERE id IN (
        SELECT DISTINCT year_id 
        FROM specialities 
        WHERE year_id IS NOT NULL
      )
    `);
    console.log('✅ Set path_type for years with specialities');
    
    console.log('🎉 Successfully fixed education structure!');
    console.log('📋 New structure:');
    console.log('   - Materials have both year_id and speciality_id');
    console.log('   - Years have path_type to indicate the choice');
    console.log('   - Specialities remain linked to years');
    
  } catch (error) {
    console.error('❌ Error fixing education structure:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixEducationStructure().catch(console.error); 