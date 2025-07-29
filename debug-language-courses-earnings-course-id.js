import pool from './backend/db.js';

async function debugLanguageCoursesEarningsByCourseId() {
  console.log('🔍 Debugging Language Courses Earnings by COURSE ID for prof (math)...\n');
  
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
    
    // 2. Check if language_course_prices has course_id column
    console.log('1. Checking language_course_prices table structure:');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'language_course_prices'
      ORDER BY ordinal_position
    `);
    
    console.log('language_course_prices columns:');
    tableStructure.rows.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
    // 3. Get unique language courses by this professor
    console.log('2. Unique Language Courses by this professor:');
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
    
    // 4. Check if there are prices by course_id
    console.log('3. Checking language_course_prices by course_id:');
    const pricesByCourseId = await pool.query(`
      SELECT 
        lcp.id,
        lcp.course_id,
        lcp.price,
        c.title as course_title
      FROM language_course_prices lcp
      LEFT JOIN courses c ON lcp.course_id = c.id
      WHERE lcp.course_id IS NOT NULL
      ORDER BY lcp.course_id, lcp.price
    `);
    
    if (pricesByCourseId.rows.length > 0) {
      console.log(`Found ${pricesByCourseId.rows.length} prices by course_id:`);
      pricesByCourseId.rows.forEach((price, index) => {
        console.log(`  ${index + 1}. Course: ${price.course_title || 'Unknown'} (ID: ${price.course_id})`);
        console.log(`     Price: ${price.price} DZD`);
        console.log('');
      });
    } else {
      console.log('❌ No prices found by course_id');
    }
    
    // 5. Check if there are prices by language_level_id (current method)
    console.log('4. Checking language_course_prices by language_level_id (current method):');
    const pricesByLanguageLevel = await pool.query(`
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
    
    console.log(`Found ${pricesByLanguageLevel.rows.length} prices by language_level_id:`);
    pricesByLanguageLevel.rows.forEach((price, index) => {
      console.log(`  ${index + 1}. Language: ${price.language_name || 'Unknown'}, Level: ${price.level_name || 'Unknown'}`);
      console.log(`     Language Level ID: ${price.language_level_id}, Price: ${price.price} DZD`);
      console.log('');
    });
    
    // 6. Get unique student enrollments
    console.log('5. Unique Student Enrollments for Language Courses:');
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
    
    // 7. Calculate earnings based on course_id prices (if they exist)
    console.log('6. Earnings Calculation by Course ID:');
    let totalEarningsByCourseId = 0;
    let totalStudentsByCourseId = 0;
    const studentSetByCourseId = new Set();
    
    uniqueEnrollments.rows.forEach((enrollment) => {
      // Try to find price by course_id first
      const coursePrice = pricesByCourseId.rows.find(p => p.course_id === enrollment.course_id);
      
      if (coursePrice) {
        totalEarningsByCourseId += parseFloat(coursePrice.price);
        studentSetByCourseId.add(enrollment.student_id);
        console.log(`  + ${coursePrice.price} DZD (Student ${enrollment.student_id} - ${enrollment.course_title})`);
        console.log(`     Course ID: ${enrollment.course_id}, Price: ${coursePrice.price} DZD`);
      } else {
        console.log(`  ⚠️  No course-specific price found for Student ${enrollment.student_id} - ${enrollment.course_title}`);
        console.log(`     Course ID: ${enrollment.course_id}`);
      }
    });
    
    totalStudentsByCourseId = studentSetByCourseId.size;
    
    console.log(`\n💰 Earnings by Course ID Results:`);
    console.log(`  Total Earnings: ${totalEarningsByCourseId} DZD`);
    console.log(`  Total Unique Students: ${totalStudentsByCourseId}`);
    
    // 8. Calculate earnings based on language_level_id (current method)
    console.log('\n7. Earnings Calculation by Language Level ID (current method):');
    let totalEarningsByLevel = 0;
    let totalStudentsByLevel = 0;
    const studentSetByLevel = new Set();
    
    // Get latest price per language level
    const latestPricesByLevel = await pool.query(`
      SELECT DISTINCT ON (lcp.language_level_id)
        lcp.language_level_id,
        lcp.price
      FROM language_course_prices lcp
      ORDER BY lcp.language_level_id, lcp.id DESC
    `);
    
    uniqueEnrollments.rows.forEach((enrollment) => {
      // Find the latest price for this language level
      const levelPrice = latestPricesByLevel.rows.find(p => p.language_level_id === enrollment.language_level_id);
      
      if (levelPrice) {
        totalEarningsByLevel += parseFloat(levelPrice.price);
        studentSetByLevel.add(enrollment.student_id);
        console.log(`  + ${levelPrice.price} DZD (Student ${enrollment.student_id} - ${enrollment.course_title})`);
        console.log(`     Language Level: ${enrollment.language_level_id}, Price: ${levelPrice.price} DZD`);
      } else {
        console.log(`  ⚠️  No level price found for Student ${enrollment.student_id} - ${enrollment.course_title}`);
      }
    });
    
    totalStudentsByLevel = studentSetByLevel.size;
    
    console.log(`\n💰 Earnings by Language Level Results:`);
    console.log(`  Total Earnings: ${totalEarningsByLevel} DZD`);
    console.log(`  Total Unique Students: ${totalStudentsByLevel}`);
    
    // 9. Compare methods
    console.log('\n8. Comparison:');
    console.log(`  By Course ID: ${totalEarningsByCourseId} DZD`);
    console.log(`  By Language Level: ${totalEarningsByLevel} DZD`);
    console.log(`  Difference: ${Math.abs(totalEarningsByCourseId - totalEarningsByLevel)} DZD`);
    
    // 10. Show which method should be used
    console.log('\n9. Recommendation:');
    if (pricesByCourseId.rows.length > 0) {
      console.log('✅ Use Course ID method - prices exist per course');
    } else {
      console.log('⚠️  Use Language Level method - no course-specific prices found');
    }
    
  } catch (error) {
    console.error('❌ Error debugging language courses earnings:', error.message);
  } finally {
    await pool.end();
  }
}

debugLanguageCoursesEarningsByCourseId(); 