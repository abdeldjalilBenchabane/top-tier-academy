import pool from './backend/db.js';

async function debugLanguageCoursesEarningsFixed() {
  console.log('🔍 Debugging Language Courses Earnings (FIXED) for prof (math)...\n');
  
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
    
    // 2. Get unique language courses by this professor (no duplicates)
    console.log('1. Unique Language Courses by this professor:');
    const uniqueLanguageCourses = await pool.query(`
      SELECT DISTINCT
        c.id,
        c.title,
        c.language_level_id
      FROM courses c
      WHERE c.created_by = $1 AND c.language_level_id IS NOT NULL
      ORDER BY c.id
    `, [professorId]);
    
    console.log(`Found ${uniqueLanguageCourses.rows.length} unique language courses:`);
    uniqueLanguageCourses.rows.forEach((course, index) => {
      console.log(`  ${index + 1}. Course: ${course.title} (ID: ${course.id})`);
      console.log(`     Language Level ID: ${course.language_level_id}`);
      console.log('');
    });
    
    // 3. Get unique student enrollments (no duplicates)
    console.log('2. Unique Student Enrollments for Language Courses:');
    const uniqueEnrollments = await pool.query(`
      SELECT DISTINCT
        sc.student_id,
        sc.course_id,
        sc.buy_at,
        c.title as course_title,
        c.language_level_id
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE c.created_by = $1 
        AND c.language_level_id IS NOT NULL
        AND EXTRACT(YEAR FROM sc.buy_at) = $2 
        AND EXTRACT(MONTH FROM sc.buy_at) = $3
      ORDER BY sc.student_id, sc.course_id
    `, [professorId, year, monthNum]);
    
    console.log(`Found ${uniqueEnrollments.rows.length} unique enrollments in ${year}-${monthNum}:`);
    uniqueEnrollments.rows.forEach((enrollment, index) => {
      console.log(`  ${index + 1}. Student ${enrollment.student_id} enrolled in "${enrollment.course_title}"`);
      console.log(`     Course ID: ${enrollment.course_id}, Language Level: ${enrollment.language_level_id}`);
      console.log(`     Buy Date: ${enrollment.buy_at}`);
      console.log('');
    });
    
    // 4. Check language_course_prices table (show duplicates)
    console.log('3. Language Course Prices Table (showing duplicates):');
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
      ORDER BY lcp.language_level_id, lcp.price
    `);
    
    console.log(`Found ${languagePrices.rows.length} language course prices (including duplicates):`);
    languagePrices.rows.forEach((price, index) => {
      console.log(`  ${index + 1}. Language: ${price.language_name || 'Unknown'}, Level: ${price.level_name || 'Unknown'}`);
      console.log(`     Language Level ID: ${price.language_level_id}, Price: ${price.price} DZD`);
      console.log('');
    });
    
    // 5. Get the LATEST price for each language level (most recent)
    console.log('4. Latest Language Course Prices (most recent per level):');
    const latestPrices = await pool.query(`
      SELECT DISTINCT ON (lcp.language_level_id)
        lcp.language_level_id,
        lcp.price,
        ll.name as level_name,
        l.name as language_name
      FROM language_course_prices lcp
      LEFT JOIN language_levels ll ON lcp.language_level_id = ll.id
      LEFT JOIN languages l ON ll.language_id = l.id
      ORDER BY lcp.language_level_id, lcp.id DESC
    `);
    
    console.log(`Found ${latestPrices.rows.length} latest prices per language level:`);
    latestPrices.rows.forEach((price, index) => {
      console.log(`  ${index + 1}. Language: ${price.language_name || 'Unknown'}, Level: ${price.level_name || 'Unknown'}`);
      console.log(`     Language Level ID: ${price.language_level_id}, Latest Price: ${price.price} DZD`);
      console.log('');
    });
    
    // 6. Calculate earnings with latest prices
    console.log('5. Earnings Calculation with Latest Prices:');
    let totalEarnings = 0;
    let totalStudents = 0;
    const studentSet = new Set();
    
    uniqueEnrollments.rows.forEach((enrollment) => {
      // Find the latest price for this language level
      const latestPrice = latestPrices.rows.find(p => p.language_level_id === enrollment.language_level_id);
      
      if (latestPrice) {
        totalEarnings += parseFloat(latestPrice.price);
        studentSet.add(enrollment.student_id);
        console.log(`  + ${latestPrice.price} DZD (Student ${enrollment.student_id} - ${enrollment.course_title})`);
        console.log(`     Language Level: ${enrollment.language_level_id}, Price: ${latestPrice.price} DZD`);
      } else {
        console.log(`  ⚠️  No price found for Student ${enrollment.student_id} - ${enrollment.course_title}`);
      }
    });
    
    totalStudents = studentSet.size;
    
    console.log(`\n💰 Corrected Calculation Results:`);
    console.log(`  Total Earnings: ${totalEarnings} DZD`);
    console.log(`  Total Unique Students: ${totalStudents}`);
    
    // 7. Compare with the current query result
    console.log('\n6. Current Query Result (with duplicates):');
    const currentQueryResult = await pool.query(`
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
    
    const currentEarnings = parseFloat(currentQueryResult.rows[0]?.earnings || 0);
    const currentStudents = parseInt(currentQueryResult.rows[0]?.students || 0);
    
    console.log(`  Current Query Earnings: ${currentEarnings} DZD`);
    console.log(`  Current Query Students: ${currentStudents}`);
    console.log(`  Difference: ${currentEarnings - totalEarnings} DZD`);
    
    // 8. Show the problem: multiple prices for same language level
    console.log('\n7. Problem Analysis:');
    console.log('The issue is that there are multiple prices for the same language level:');
    const duplicatePrices = await pool.query(`
      SELECT 
        lcp.language_level_id,
        COUNT(*) as price_count,
        array_agg(lcp.price) as prices
      FROM language_course_prices lcp
      GROUP BY lcp.language_level_id
      HAVING COUNT(*) > 1
    `);
    
    if (duplicatePrices.rows.length > 0) {
      console.log('Language levels with multiple prices:');
      duplicatePrices.rows.forEach((duplicate, index) => {
        console.log(`  ${index + 1}. Language Level ID: ${duplicate.language_level_id}`);
        console.log(`     Prices: ${duplicate.prices.join(', ')} DZD (${duplicate.price_count} different prices)`);
        console.log('');
      });
    } else {
      console.log('✅ No duplicate prices found');
    }
    
  } catch (error) {
    console.error('❌ Error debugging language courses earnings:', error.message);
  } finally {
    await pool.end();
  }
}

debugLanguageCoursesEarningsFixed(); 