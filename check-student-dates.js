import pool from './backend/db.js';

async function checkStudentDates() {
  console.log('🔍 Checking Student Course Dates...\n');
  
  try {
    // Check student_courses with last_accessed dates
    console.log('1. Checking student_courses with last_accessed dates...');
    const studentCoursesWithDates = await pool.query(`
      SELECT sc.course_id, c.title, sc.last_accessed, sc.student_id
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      ORDER BY sc.last_accessed DESC
      LIMIT 10
    `);
    console.log('✅ Student courses with dates:', studentCoursesWithDates.rows);
    
    // Check if any student_courses match current month (2025-07)
    console.log('\n2. Checking student_courses for current month (2025-07)...');
    const currentMonthStudentCourses = await pool.query(`
      SELECT sc.course_id, c.title, sc.last_accessed, COUNT(*) as student_count
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE EXTRACT(YEAR FROM sc.last_accessed) = 2025 
      AND EXTRACT(MONTH FROM sc.last_accessed) = 7
      GROUP BY sc.course_id, c.title, sc.last_accessed
    `);
    console.log('✅ Student courses for current month:', currentMonthStudentCourses.rows);
    
    // Test without any date filtering
    console.log('\n3. Testing without any date filtering...');
    const noDateFilter = await pool.query(`
      SELECT 
        u.name,
        COUNT(c.id) as courses_count,
        SUM(sc.student_count) as total_students,
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
    
    // Check what materials are linked to courses
    console.log('\n4. Checking materials linked to courses...');
    const materialsLinkedToCourses = await pool.query(`
      SELECT c.id, c.title, c.material_id, m.name as material_name, m.price as material_price
      FROM courses c
      LEFT JOIN materials m ON c.material_id = m.id
      WHERE c.created_by = 12
      LIMIT 10
    `);
    console.log('✅ Materials linked to courses:', materialsLinkedToCourses.rows);
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    await pool.end();
  }
}

checkStudentDates(); 