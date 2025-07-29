import pool from './backend/db.js';

async function debugEarningsCalculation() {
  console.log('🔍 Debugging Earnings Calculation - Why are numbers so high?\n');
  
  const year = '2025';
  const monthNum = '07';
  
  try {
    // 1. Check courses and their student counts
    console.log('1. Checking courses and student counts...');
    const coursesData = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.price as course_price,
        m.price as material_price,
        COALESCE(c.price, m.price, 0) as final_price,
        COUNT(sc.student_id) as student_count,
        COALESCE(c.price, m.price, 0) * COUNT(sc.student_id) as calculated_earnings
      FROM courses c
      LEFT JOIN materials m ON c.material_id = m.id
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      WHERE c.created_by = 12
      GROUP BY c.id, c.title, c.price, m.price
      ORDER BY calculated_earnings DESC
    `);
    console.log('✅ Courses earnings breakdown:');
    coursesData.rows.forEach(row => {
      console.log(`  Course: ${row.title}`);
      console.log(`    Course Price: ${row.course_price || 'NULL'}`);
      console.log(`    Material Price: ${row.material_price || 'NULL'}`);
      console.log(`    Final Price: ${row.final_price}`);
      console.log(`    Students: ${row.student_count}`);
      console.log(`    Earnings: ${row.calculated_earnings}`);
      console.log('');
    });
    
    // 2. Check live sessions and their purchases
    console.log('2. Checking live sessions and purchases...');
    const liveSessionsData = await pool.query(`
      SELECT 
        lses.id,
        lses.title,
        lses.price,
        COUNT(p.student_id) as student_count,
        lses.price * COUNT(p.student_id) as calculated_earnings
      FROM live_sessions lses
      LEFT JOIN purchases p ON lses.id = p.session_id
      WHERE lses.professor_id = 12
      GROUP BY lses.id, lses.title, lses.price
      ORDER BY calculated_earnings DESC
    `);
    console.log('✅ Live sessions earnings breakdown:');
    liveSessionsData.rows.forEach(row => {
      console.log(`  Session: ${row.title}`);
      console.log(`    Price: ${row.price}`);
      console.log(`    Students: ${row.student_count}`);
      console.log(`    Earnings: ${row.calculated_earnings}`);
      console.log('');
    });
    
    // 3. Check point transactions for this professor
    console.log('3. Checking point transactions for professor...');
    const pointTransactionsData = await pool.query(`
      SELECT 
        pt.id,
        pt.amount,
        pt.transaction_type,
        pt.metadata,
        pt.created_at
      FROM point_transactions pt
      WHERE pt.metadata->>'professor_id' = '12'
        AND EXTRACT(YEAR FROM pt.created_at) = $1 
        AND EXTRACT(MONTH FROM pt.created_at) = $2
        AND pt.status = 'completed'
        AND pt.transaction_type = 'spend'
      ORDER BY pt.created_at DESC
    `, [year, monthNum]);
    console.log('✅ Point transactions for professor:');
    console.log('Found', pointTransactionsData.rows.length, 'transactions');
    pointTransactionsData.rows.forEach(row => {
      console.log(`  Transaction: ${row.id}`);
      console.log(`    Amount: ${row.amount}`);
      console.log(`    Type: ${row.transaction_type}`);
      console.log(`    Metadata:`, row.metadata);
      console.log(`    Date: ${row.created_at}`);
      console.log('');
    });
    
    // 4. Check total student count calculation
    console.log('4. Checking total student count calculation...');
    const studentCountData = await pool.query(`
      SELECT 
        'Courses' as source,
        COUNT(DISTINCT sc.student_id) as unique_students
      FROM courses c
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      WHERE c.created_by = 12
      
      UNION ALL
      
      SELECT 
        'Live Sections' as source,
        COUNT(DISTINCT lsp.student_id) as unique_students
      FROM live_sections ls
      LEFT JOIN live_section_purchases lsp ON ls.id = lsp.live_section_id
      WHERE ls.professor_id = 12
      
      UNION ALL
      
      SELECT 
        'Live Sessions' as source,
        COUNT(DISTINCT p.student_id) as unique_students
      FROM live_sessions lses
      LEFT JOIN purchases p ON lses.id = p.session_id
      WHERE lses.professor_id = 12
    `);
    console.log('✅ Student count breakdown:');
    studentCountData.rows.forEach(row => {
      console.log(`  ${row.source}: ${row.unique_students} unique students`);
    });
    
    // 5. Check if there's a multiplication issue
    console.log('5. Checking for multiplication issues...');
    const multiplicationCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_courses,
        SUM(COALESCE(c.price, m.price, 0)) as total_prices,
        SUM(COUNT(sc.student_id)) as total_student_enrollments,
        SUM(COALESCE(c.price, m.price, 0) * COUNT(sc.student_id)) as total_calculated
      FROM courses c
      LEFT JOIN materials m ON c.material_id = m.id
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      WHERE c.created_by = 12
      GROUP BY c.id, c.price, m.price
    `);
    console.log('✅ Multiplication check:');
    console.log('Total courses:', multiplicationCheck.rows.length);
    if (multiplicationCheck.rows.length > 0) {
      console.log('Total prices sum:', multiplicationCheck.rows[0].total_prices);
      console.log('Total student enrollments:', multiplicationCheck.rows[0].total_student_enrollments);
      console.log('Total calculated:', multiplicationCheck.rows[0].total_calculated);
    }
    
  } catch (error) {
    console.error('❌ Error debugging earnings:', error.message);
  } finally {
    await pool.end();
  }
}

debugEarningsCalculation(); 