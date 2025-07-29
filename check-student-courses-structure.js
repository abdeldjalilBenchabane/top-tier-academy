import pool from './backend/db.js';

async function checkStudentCoursesStructure() {
  console.log('🔍 Checking student_courses table structure...\n');
  
  try {
    // Check table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'student_courses'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ student_courses table columns:');
    tableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${row.column_default ? `default: ${row.column_default}` : ''}`);
    });
    
    // Check sample data
    const sampleData = await pool.query(`
      SELECT * FROM student_courses LIMIT 3
    `);
    
    console.log('\n✅ Sample data:');
    sampleData.rows.forEach((row, index) => {
      console.log(`  Row ${index + 1}:`, row);
    });
    
    // Check if buy_at column already exists
    const buyAtExists = tableInfo.rows.some(row => row.column_name === 'buy_at');
    console.log(`\n🔍 buy_at column exists: ${buyAtExists ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await pool.end();
  }
}

checkStudentCoursesStructure(); 