import pool from './db.js';

async function debugEarnings() {
  try {
    console.log('🔍 Debugging Earnings Analytics...\n');

    // Test the monthly earnings query
    console.log('📊 Testing Monthly Earnings Query:');
    try {
      const monthlyEarnings = await pool.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COALESCE(SUM(amount), 0) as total_revenue,
          COALESCE(COUNT(*), 0) as transaction_count,
          COALESCE(SUM(CASE 
            WHEN transaction_type = 'purchase' AND status = 'completed' THEN amount 
            ELSE 0 
          END), 0) as point_package_revenue,
          COALESCE(SUM(CASE 
            WHEN transaction_type = 'spend' AND status = 'completed' THEN amount 
            ELSE 0 
          END), 0) as course_live_revenue
        FROM point_transactions 
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `);
      
      console.log('✅ Monthly Earnings Query Result:');
      console.log(monthlyEarnings.rows);
    } catch (error) {
      console.log('❌ Monthly Earnings Query Error:', error.message);
    }

    // Test professor sales query
    console.log('\n👨‍🏫 Testing Professor Sales Query:');
    try {
      const professorSales = await pool.query(`
        SELECT 
          u.id as professor_id,
          u.name as professor_name,
          u.email as professor_email,
          DATE_TRUNC('month', pt.created_at) as month,
          COALESCE(SUM(CASE 
            WHEN pt.transaction_type = 'spend' THEN pt.amount * 0.7
            ELSE 0 
          END), 0) as total_sales,
          COALESCE(SUM(CASE 
            WHEN pt.transaction_type = 'spend' AND pt.amount > 1000 THEN pt.amount * 0.7
            ELSE 0 
          END), 0) as course_sales,
          COALESCE(SUM(CASE 
            WHEN pt.transaction_type = 'spend' AND pt.amount <= 1000 THEN pt.amount * 0.7
            ELSE 0 
          END), 0) as live_session_sales,
          COUNT(DISTINCT pt.user_id) as student_count
        FROM users u
        LEFT JOIN point_transactions pt ON pt.metadata->>'professor_id' = u.id::text
        WHERE u.role = 'professor'
        AND pt.created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY u.id, u.name, u.email, DATE_TRUNC('month', pt.created_at)
        ORDER BY total_sales DESC
      `);
      
      console.log('✅ Professor Sales Query Result:');
      console.log(professorSales.rows);
    } catch (error) {
      console.log('❌ Professor Sales Query Error:', error.message);
    }

    // Check if we have any professors
    console.log('\n👨‍🏫 Checking Professors:');
    const professors = await pool.query('SELECT id, name, email FROM users WHERE role = \'professor\'');
    console.log(professors.rows);

    // Check if we have any spending transactions with professor_id in metadata
    console.log('\n💰 Checking Spending Transactions with Professor IDs:');
    const spendingWithProf = await pool.query(`
      SELECT COUNT(*) as count, 
             metadata->>'professor_id' as professor_id
      FROM point_transactions 
      WHERE transaction_type = 'spend' 
      AND metadata->>'professor_id' IS NOT NULL
      GROUP BY metadata->>'professor_id'
    `);
    console.log(spendingWithProf.rows);

    // Check all spending transactions
    console.log('\n💰 All Spending Transactions:');
    const allSpending = await pool.query(`
      SELECT id, user_id, amount, metadata, created_at
      FROM point_transactions 
      WHERE transaction_type = 'spend' 
      LIMIT 5
    `);
    console.log(allSpending.rows);

  } catch (error) {
    console.error('❌ Debug Error:', error);
  } finally {
    await pool.end();
  }
}

debugEarnings(); 