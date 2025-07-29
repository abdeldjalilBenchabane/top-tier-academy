import pool from './backend/db.js';

async function debugEarningsData() {
  console.log('🔍 Debugging Earnings Data...\n');
  
  try {
    // Check courses with prices
    console.log('1. Checking courses with prices...');
    const coursesWithPrices = await pool.query(`
      SELECT id, title, price, material_id, language_level_id, created_by
      FROM courses 
      WHERE price IS NOT NULL AND price > 0
      LIMIT 5
    `);
    console.log('✅ Courses with prices:', coursesWithPrices.rows);
    
    // Check student_courses data
    console.log('\n2. Checking student_courses data...');
    const studentCoursesData = await pool.query(`
      SELECT course_id, COUNT(*) as student_count
      FROM student_courses 
      GROUP BY course_id
      LIMIT 5
    `);
    console.log('✅ Student courses data:', studentCoursesData.rows);
    
    // Check live_sections with prices
    console.log('\n3. Checking live_sections with prices...');
    const liveSectionsWithPrices = await pool.query(`
      SELECT id, title, price, material_id, professor_id
      FROM live_sections 
      WHERE price IS NOT NULL AND price > 0
      LIMIT 5
    `);
    console.log('✅ Live sections with prices:', liveSectionsWithPrices.rows);
    
    // Check live_section_purchases data
    console.log('\n4. Checking live_section_purchases data...');
    const liveSectionPurchasesData = await pool.query(`
      SELECT live_section_id, COUNT(*) as student_count
      FROM live_section_purchases 
      GROUP BY live_section_id
      LIMIT 5
    `);
    console.log('✅ Live section purchases data:', liveSectionPurchasesData.rows);
    
    // Check private_class_requests data
    console.log('\n5. Checking private_class_requests data...');
    const privateClassRequestsData = await pool.query(`
      SELECT id, teacher_name, price_per_session, status, student_id
      FROM private_class_requests 
      WHERE status = 'completed' AND price_per_session IS NOT NULL
      LIMIT 5
    `);
    console.log('✅ Private class requests data:', privateClassRequestsData.rows);
    
    // Test a simple calculation
    console.log('\n6. Testing simple calculation for one professor...');
    const simpleCalculation = await pool.query(`
      SELECT 
        u.name,
        COUNT(c.id) as courses_count,
        SUM(c.price) as total_course_prices,
        COUNT(sc.student_id) as total_students,
        SUM(c.price * sc.student_count) as calculated_earnings
      FROM users u
      LEFT JOIN courses c ON u.id = c.created_by
      LEFT JOIN (
        SELECT course_id, COUNT(*) as student_count
        FROM student_courses 
        GROUP BY course_id
      ) sc ON c.id = sc.course_id
      WHERE u.role = 'professor' AND u.name = 'prof (math)'
      GROUP BY u.id, u.name
    `);
    console.log('✅ Simple calculation:', simpleCalculation.rows);
    
  } catch (error) {
    console.error('❌ Error debugging data:', error.message);
  } finally {
    await pool.end();
  }
}

debugEarningsData(); 