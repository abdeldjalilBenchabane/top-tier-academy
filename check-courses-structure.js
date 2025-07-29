import pool from './backend/db.js';

async function checkCoursesStructure() {
  console.log('🔍 Checking courses table structure...\n');
  
  try {
    // Check courses table structure
    const coursesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'courses'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ courses table columns:');
    coursesStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check live_sections table structure
    const liveSectionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'live_sections'
      ORDER BY ordinal_position
    `);
    
    console.log('\n✅ live_sections table columns:');
    liveSectionsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await pool.end();
  }
}

checkCoursesStructure(); 