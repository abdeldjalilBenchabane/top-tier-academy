import pool from './backend/db.js';

async function checkMaterialsPrices() {
  console.log('🔍 Checking Materials Prices and Date Filtering...\n');
  
  try {
    // Check materials with prices
    console.log('1. Checking materials with prices...');
    const materialsWithPrices = await pool.query(`
      SELECT id, name, price
      FROM materials 
      WHERE price IS NOT NULL AND price > 0
      LIMIT 5
    `);
    console.log('✅ Materials with prices:', materialsWithPrices.rows);
    
    // Check courses with their creation dates
    console.log('\n2. Checking courses with creation dates...');
    const coursesWithDates = await pool.query(`
      SELECT id, title, created_at, material_id, created_by
      FROM courses 
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log('✅ Courses with dates:', coursesWithDates.rows);
    
    // Check if any courses match the current month (2025-07)
    console.log('\n3. Checking courses for current month (2025-07)...');
    const currentMonthCourses = await pool.query(`
      SELECT id, title, created_at, material_id, created_by
      FROM courses 
      WHERE EXTRACT(YEAR FROM created_at) = 2025 
      AND EXTRACT(MONTH FROM created_at) = 7
    `);
    console.log('✅ Courses for current month:', currentMonthCourses.rows);
    
    // Check student_courses for current month
    console.log('\n4. Checking student_courses for current month...');
    const currentMonthStudentCourses = await pool.query(`
      SELECT sc.course_id, c.title, COUNT(*) as student_count
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE EXTRACT(YEAR FROM c.created_at) = 2025 
      AND EXTRACT(MONTH FROM c.created_at) = 7
      GROUP BY sc.course_id, c.title
    `);
    console.log('✅ Student courses for current month:', currentMonthStudentCourses.rows);
    
    // Test without date filtering
    console.log('\n5. Testing without date filtering...');
    const noDateFilter = await pool.query(`
      SELECT 
        u.name,
        COUNT(c.id) as courses_count,
        COUNT(sc.student_id) as total_students,
        SUM(COALESCE(c.price, m.price, 0) * sc.student_count) as calculated_earnings
      FROM users u
      LEFT JOIN courses c ON u.id = c.created_by
      LEFT JOIN materials m ON c.material_id = m.id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as student_count
        FROM student_courses 
        GROUP BY course_id
      ) sc ON c.id = sc.course_id
      WHERE u.role = 'professor' AND u.name = 'prof (math)'
      GROUP BY u.id, u.name
    `);
    console.log('✅ No date filter calculation:', noDateFilter.rows);
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    await pool.end();
  }
}

checkMaterialsPrices(); 