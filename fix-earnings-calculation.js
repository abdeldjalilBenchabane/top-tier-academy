import pool from './backend/db.js';

async function fixEarningsCalculation() {
  console.log('🔧 Fixing Earnings Calculation...\n');
  
  const year = '2025';
  const monthNum = '07';
  
  try {
    // Test a simplified calculation step by step
    console.log('1. Testing simplified courses earnings...');
    const simpleCoursesEarnings = await pool.query(`
      SELECT 
        u.id as professor_id,
        u.name as professor_name,
        SUM(COALESCE(c.price, m.price, 0) * sc.student_count) as courses_earnings
      FROM users u
      LEFT JOIN courses c ON u.id = c.created_by
      LEFT JOIN materials m ON c.material_id = m.id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as student_count
        FROM student_courses 
        GROUP BY course_id
      ) sc ON c.id = sc.course_id
      WHERE u.role = 'professor' AND u.id = 12
      GROUP BY u.id, u.name
    `);
    console.log('✅ Simple courses earnings:', simpleCoursesEarnings.rows);
    
    console.log('\n2. Testing simplified live sessions earnings...');
    const simpleLiveSessionsEarnings = await pool.query(`
      SELECT 
        u.id as professor_id,
        u.name as professor_name,
        SUM(lses.price * p.student_count) as live_sessions_earnings
      FROM users u
      LEFT JOIN live_sessions lses ON u.id = lses.professor_id
      LEFT JOIN (
        SELECT session_id, COUNT(*) as student_count
        FROM purchases 
        WHERE EXTRACT(YEAR FROM purchased_at) = $1 
        AND EXTRACT(MONTH FROM purchased_at) = $2
        GROUP BY session_id
      ) p ON lses.id = p.session_id
      WHERE u.role = 'professor' AND u.id = 12
      GROUP BY u.id, u.name
    `, [year, monthNum]);
    console.log('✅ Simple live sessions earnings:', simpleLiveSessionsEarnings.rows);
    
    console.log('\n3. Testing simplified point transactions earnings...');
    const simplePointTransactionsEarnings = await pool.query(`
      SELECT 
        u.id as professor_id,
        u.name as professor_name,
        SUM(pt.amount) as point_transactions_earnings
      FROM users u
      LEFT JOIN point_transactions pt ON pt.metadata->>'professor_id' = u.id::text
        AND EXTRACT(YEAR FROM pt.created_at) = $1 
        AND EXTRACT(MONTH FROM pt.created_at) = $2
        AND pt.status = 'completed'
        AND pt.transaction_type = 'spend'
      WHERE u.role = 'professor' AND u.id = 12
      GROUP BY u.id, u.name
    `, [year, monthNum]);
    console.log('✅ Simple point transactions earnings:', simplePointTransactionsEarnings.rows);
    
    console.log('\n4. Testing the problematic complex query...');
    const complexQuery = await pool.query(`
      WITH professor_data AS (
        SELECT 
          u.id as professor_id,
          u.name as professor_name,
          u.email as professor_email,
          
          -- Education courses earnings
          COALESCE(SUM(
            CASE WHEN c.material_id IS NOT NULL THEN 
              COALESCE(c.price, m.price, 0) * sc.student_count 
            ELSE 0 END
          ), 0) as courses_earnings,
          
          -- Live sessions earnings
          COALESCE(SUM(
            CASE WHEN lses.material_id IS NOT NULL THEN lses.price * p.student_count ELSE 0 END
          ), 0) as live_sessions_earnings,
          
          -- Point transactions earnings
          COALESCE(SUM(
            CASE WHEN pt.metadata->>'type' = 'course_purchase' AND pt.metadata->>'professor_id' = u.id::text THEN pt.amount
                 WHEN pt.metadata->>'type' = 'live_session_purchase' AND pt.metadata->>'professor_id' = u.id::text THEN pt.amount
                 WHEN pt.metadata->>'type' = 'live_section_purchase' AND pt.metadata->>'professor_id' = u.id::text THEN pt.amount
                 WHEN pt.metadata->>'type' = 'private_class_purchase' AND pt.metadata->>'professor_id' = u.id::text THEN pt.amount
                 ELSE 0 END
          ), 0) as point_transactions_earnings
          
        FROM users u
        LEFT JOIN courses c ON u.id = c.created_by
        LEFT JOIN materials m ON c.material_id = m.id
        LEFT JOIN (
          SELECT course_id, COUNT(*) as student_count
          FROM student_courses 
          GROUP BY course_id
        ) sc ON c.id = sc.course_id
        
        LEFT JOIN live_sessions lses ON u.id = lses.professor_id
        LEFT JOIN (
          SELECT session_id, COUNT(*) as student_count
          FROM purchases 
          WHERE EXTRACT(YEAR FROM purchased_at) = $1 
          AND EXTRACT(MONTH FROM purchased_at) = $2
          GROUP BY session_id
        ) p ON lses.id = p.session_id
        
        LEFT JOIN point_transactions pt ON pt.metadata->>'professor_id' = u.id::text
          AND EXTRACT(YEAR FROM pt.created_at) = $1 
          AND EXTRACT(MONTH FROM pt.created_at) = $2
          AND pt.status = 'completed'
          AND pt.transaction_type = 'spend'
        
        WHERE u.role = 'professor' AND u.id = 12
        GROUP BY u.id, u.name, u.email
      )
      SELECT 
        professor_id,
        professor_name,
        professor_email,
        courses_earnings + live_sessions_earnings + point_transactions_earnings as total_earnings,
        courses_earnings,
        live_sessions_earnings,
        point_transactions_earnings
      FROM professor_data
    `, [year, monthNum]);
    console.log('✅ Complex query result:', complexQuery.rows);
    
    // The issue is likely that the JOINs are creating a cartesian product
    // Let me test without the point_transactions JOIN to see if that's the problem
    console.log('\n5. Testing without point_transactions JOIN...');
    const withoutPointTransactions = await pool.query(`
      WITH professor_data AS (
        SELECT 
          u.id as professor_id,
          u.name as professor_name,
          u.email as professor_email,
          
          -- Education courses earnings
          COALESCE(SUM(
            CASE WHEN c.material_id IS NOT NULL THEN 
              COALESCE(c.price, m.price, 0) * sc.student_count 
            ELSE 0 END
          ), 0) as courses_earnings,
          
          -- Live sessions earnings
          COALESCE(SUM(
            CASE WHEN lses.material_id IS NOT NULL THEN lses.price * p.student_count ELSE 0 END
          ), 0) as live_sessions_earnings
          
        FROM users u
        LEFT JOIN courses c ON u.id = c.created_by
        LEFT JOIN materials m ON c.material_id = m.id
        LEFT JOIN (
          SELECT course_id, COUNT(*) as student_count
          FROM student_courses 
          GROUP BY course_id
        ) sc ON c.id = sc.course_id
        
        LEFT JOIN live_sessions lses ON u.id = lses.professor_id
        LEFT JOIN (
          SELECT session_id, COUNT(*) as student_count
          FROM purchases 
          WHERE EXTRACT(YEAR FROM purchased_at) = $1 
          AND EXTRACT(MONTH FROM purchased_at) = $2
          GROUP BY session_id
        ) p ON lses.id = p.session_id
        
        WHERE u.role = 'professor' AND u.id = 12
        GROUP BY u.id, u.name, u.email
      )
      SELECT 
        professor_id,
        professor_name,
        professor_email,
        courses_earnings + live_sessions_earnings as total_earnings,
        courses_earnings,
        live_sessions_earnings
      FROM professor_data
    `, [year, monthNum]);
    console.log('✅ Without point_transactions JOIN:', withoutPointTransactions.rows);
    
  } catch (error) {
    console.error('❌ Error fixing earnings:', error.message);
  } finally {
    await pool.end();
  }
}

fixEarningsCalculation(); 