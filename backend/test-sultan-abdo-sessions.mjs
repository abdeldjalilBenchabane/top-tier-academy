import pool from './db.js';

const testSultanAbdoSessions = async () => {
  try {
    console.log('🔍 Testing Sultan Abdo\'s live session data...\n');

    // First, find Sultan Abdo's user ID
    const userQuery = await pool.query(`
      SELECT id, name, email FROM users WHERE email = 'abdoess396@gmail.com'
    `);
    
    if (userQuery.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userQuery.rows[0];
    console.log(`👤 Found user: ${user.name} (ID: ${user.id}, Email: ${user.email})\n`);

    // Check all live sessions for professor ID 12 (the professor)
    const allSessionsQuery = await pool.query(`
      SELECT 
        ls.id,
        ls.title,
        ls.professor_id,
        ls.price,
        ls.created_at,
        p.id as purchase_id,
        p.student_id,
        p.amount_paid,
        p.purchased_at
      FROM live_sessions ls
      LEFT JOIN purchases p ON ls.id = p.session_id AND p.student_id = $1
      WHERE ls.professor_id = 12
      ORDER BY ls.created_at DESC
    `, [user.id]);
    
    console.log('🎬 ALL LIVE SESSIONS FOR PROFESSOR 12:');
    let totalSessions = 0;
    let paidSessions = 0;
    
    allSessionsQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. Session: ${row.title} (ID: ${row.id})`);
      console.log(`     Price: ${row.price}`);
      console.log(`     Purchase ID: ${row.purchase_id || 'None'}`);
      console.log(`     Student ID: ${row.student_id || 'None'}`);
      console.log(`     Amount Paid: ${row.amount_paid || 'None'}`);
      console.log(`     Purchased At: ${row.purchased_at || 'None'}`);
      
      totalSessions++;
      if (row.purchase_id) {
        paidSessions++;
      }
      console.log('');
    });

    console.log(`📊 SUMMARY:`);
    console.log(`  Total sessions: ${totalSessions}`);
    console.log(`  Paid sessions: ${paidSessions}`);
    console.log(`  Unpaid sessions: ${totalSessions - paidSessions}`);

    // Check the current query that's being used in the API
    const currentApiQuery = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url as avatar,
        p.purchased_at as enrollment_date,
        p.purchased_at as last_activity,
        ls.title as content_title,
        ls.id as content_id,
        'live_session' as content_type,
        'enrolled' as status
      FROM purchases p
      JOIN users u ON p.student_id = u.id
      JOIN live_sessions ls ON p.session_id = ls.id
      WHERE ls.professor_id = 12 AND u.id = $1
    `, [user.id]);

    console.log('\n🎯 CURRENT API QUERY RESULTS:');
    console.log(`  Sessions found by API: ${currentApiQuery.rows.length}`);
    currentApiQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.content_title} (ID: ${row.content_id})`);
      console.log(`     Purchased: ${row.enrollment_date}`);
    });

    // Check if there are any other purchase records for this user
    const allPurchasesQuery = await pool.query(`
      SELECT 
        p.id,
        p.session_id,
        p.student_id,
        p.amount_paid,
        p.purchased_at,
        ls.title as session_title,
        ls.professor_id
      FROM purchases p
      JOIN live_sessions ls ON p.session_id = ls.id
      WHERE p.student_id = $1
      ORDER BY p.purchased_at DESC
    `, [user.id]);

    console.log('\n💳 ALL PURCHASES FOR SULTAN ABDO:');
    allPurchasesQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. Session: ${row.session_title} (ID: ${row.session_id})`);
      console.log(`     Professor ID: ${row.professor_id}`);
      console.log(`     Amount Paid: ${row.amount_paid}`);
      console.log(`     Purchased At: ${row.purchased_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error testing Sultan Abdo sessions:', error);
  } finally {
    await pool.end();
  }
};

testSultanAbdoSessions(); 