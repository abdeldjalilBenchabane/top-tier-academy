import pool from './backend/db.js';

async function debugLanguageCoursesEarnings() {
  console.log('🔍 Debugging Language Courses Earnings for prof (math)...\n');
  
  const professorId = 12; // prof (math)
  const year = '2025';
  const monthNum = '07';
  
  try {
    // 1. Get professor info
    const professorInfo = await pool.query(`
      SELECT id, name, email FROM users WHERE id = $1
    `, [professorId]);
    
    console.log(`📊 Professor: ${professorInfo.rows[0]?.name} (${professorInfo.rows[0]?.email})`);
    console.log('');
    
    // 2. Get all language courses by this professor
    console.log('1. Language Courses by this professor:');
    const languageCourses = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.language_level_id,
        c.price as course_price,
        lcp.price as language_price,
        lcp.language_level_id as lcp_language_level_id
      FROM courses c
      LEFT JOIN language_course_prices lcp ON c.language_level_id = lcp.language_level_id
      WHERE c.created_by = $1 AND c.language_level_id IS NOT NULL
    `, [professorId]);
    
    console.log(`Found ${languageCourses.rows.length} language courses:`);
    languageCourses.rows.forEach((course, index) => {
      console.log(`  ${index + 1}. Course: ${course.title} (ID: ${course.id})`);
      console.log(`     Language Level ID: ${course.language_level_id}`);
      console.log(`     Course Price: ${course.course_price || 'NULL'}`);
      console.log(`     Language Price: ${course.language_price || 'NULL'}`);
      console.log(`     LCP Language Level ID: ${course.lcp_language_level_id || 'NULL'}`);
      console.log('');
    });
    
    // 3. Get student enrollments for these courses
    console.log('2. Student Enrollments for Language Courses:');
    const enrollments = await pool.query(`
      SELECT 
        sc.id,
        sc.student_id,
        sc.course_id,
        sc.buy_at,
        c.title as course_title,
        c.language_level_id,
        lcp.price as language_price
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      LEFT JOIN language_course_prices lcp ON c.language_level_id = lcp.language_level_id
      WHERE c.created_by = $1 
        AND c.language_level_id IS NOT NULL
        AND EXTRACT(YEAR FROM sc.buy_at) = $2 
        AND EXTRACT(MONTH FROM sc.buy_at) = $3
      ORDER BY sc.buy_at DESC
    `, [professorId, year, monthNum]);
    
    console.log(`Found ${enrollments.rows.length} enrollments in ${year}-${monthNum}:`);
    enrollments.rows.forEach((enrollment, index) => {
      console.log(`  ${index + 1}. Student ${enrollment.student_id} enrolled in "${enrollment.course_title}"`);
      console.log(`     Course ID: ${enrollment.course_id}, Language Level: ${enrollment.language_level_id}`);
      console.log(`     Language Price: ${enrollment.language_price || 'NULL'}`);
      console.log(`     Buy Date: ${enrollment.buy_at}`);
      console.log('');
    });
    
    // 4. Check language_course_prices table
    console.log('3. Language Course Prices Table:');
    const languagePrices = await pool.query(`
      SELECT 
        lcp.id,
        lcp.language_level_id,
        lcp.price,
        ll.name as level_name,
        l.name as language_name
      FROM language_course_prices lcp
      LEFT JOIN language_levels ll ON lcp.language_level_id = ll.id
      LEFT JOIN languages l ON ll.language_id = l.id
      ORDER BY lcp.language_level_id
    `);
    
    console.log(`Found ${languagePrices.rows.length} language course prices:`);
    languagePrices.rows.forEach((price, index) => {
      console.log(`  ${index + 1}. Language: ${price.language_name || 'Unknown'}, Level: ${price.level_name || 'Unknown'}`);
      console.log(`     Language Level ID: ${price.language_level_id}, Price: ${price.price} DZD`);
      console.log('');
    });
    
    // 5. Calculate total earnings manually
    console.log('4. Manual Earnings Calculation:');
    let totalEarnings = 0;
    let totalStudents = 0;
    
    enrollments.rows.forEach((enrollment) => {
      if (enrollment.language_price) {
        totalEarnings += parseFloat(enrollment.language_price);
        totalStudents++;
        console.log(`  + ${enrollment.language_price} DZD (Student ${enrollment.student_id} - ${enrollment.course_title})`);
      } else {
        console.log(`  ⚠️  No price found for Student ${enrollment.student_id} - ${enrollment.course_title}`);
      }
    });
    
    console.log(`\n💰 Manual Calculation Results:`);
    console.log(`  Total Earnings: ${totalEarnings} DZD`);
    console.log(`  Total Students: ${totalStudents}`);
    
    // 6. Compare with the query result
    console.log('\n5. Query Result Comparison:');
    const queryResult = await pool.query(`
      SELECT 
        COALESCE(SUM(lcp.price), 0) as earnings,
        COUNT(DISTINCT sc.student_id) as students
      FROM courses c
      LEFT JOIN language_course_prices lcp ON c.language_level_id = lcp.language_level_id
      JOIN student_courses sc ON c.id = sc.course_id
      WHERE c.created_by = $1 
        AND c.language_level_id IS NOT NULL
        AND EXTRACT(YEAR FROM sc.buy_at) = $2 
        AND EXTRACT(MONTH FROM sc.buy_at) = $3
    `, [professorId, year, monthNum]);
    
    const queryEarnings = parseFloat(queryResult.rows[0]?.earnings || 0);
    const queryStudents = parseInt(queryResult.rows[0]?.students || 0);
    
    console.log(`  Query Earnings: ${queryEarnings} DZD`);
    console.log(`  Query Students: ${queryStudents}`);
    console.log(`  Match: ${totalEarnings === queryEarnings ? '✅' : '❌'}`);
    
    // 7. Check for any missing language_course_prices
    console.log('\n6. Missing Language Course Prices:');
    const missingPrices = await pool.query(`
      SELECT DISTINCT
        c.id,
        c.title,
        c.language_level_id,
        ll.name as level_name,
        l.name as language_name
      FROM courses c
      LEFT JOIN language_levels ll ON c.language_level_id = ll.id
      LEFT JOIN languages l ON ll.language_id = l.id
      LEFT JOIN language_course_prices lcp ON c.language_level_id = lcp.language_level_id
      WHERE c.created_by = $1 
        AND c.language_level_id IS NOT NULL
        AND lcp.price IS NULL
    `, [professorId]);
    
    if (missingPrices.rows.length > 0) {
      console.log(`Found ${missingPrices.rows.length} courses with missing prices:`);
      missingPrices.rows.forEach((course, index) => {
        console.log(`  ${index + 1}. ${course.title} (Language: ${course.language_name}, Level: ${course.level_name})`);
        console.log(`     Language Level ID: ${course.language_level_id}`);
        console.log('');
      });
    } else {
      console.log('✅ All language courses have prices defined');
    }
    
  } catch (error) {
    console.error('❌ Error debugging language courses earnings:', error.message);
  } finally {
    await pool.end();
  }
}

debugLanguageCoursesEarnings(); 