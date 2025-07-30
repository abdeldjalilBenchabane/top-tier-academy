import pool from './db.js';

const checkPointTransactionsStatus = async () => {
  try {
    console.log('🔍 Checking point transaction statuses for live session purchases...\n');

    // Check all point transactions for user 4 (Sultan Abdo) related to live sessions
    const transactionsQuery = await pool.query(`
      SELECT 
        pt.id,
        pt.user_id,
        pt.transaction_type,
        pt.points,
        pt.amount,
        pt.status,
        pt.metadata,
        pt.created_at,
        p.id as purchase_id,
        p.session_id,
        ls.title as session_title
      FROM point_transactions pt
      LEFT JOIN purchases p ON pt.user_id = p.student_id 
        AND pt.metadata::text LIKE '%live_session%'
        AND pt.metadata::json->>'session_id' = p.session_id::text
      LEFT JOIN live_sessions ls ON p.session_id = ls.id
      WHERE pt.user_id = 4 
        AND pt.transaction_type = 'spend'
        AND pt.metadata::text LIKE '%live_session%'
      ORDER BY pt.created_at DESC
    `);
    
    console.log('💳 POINT TRANSACTIONS FOR SULTAN ABDO (LIVE SESSIONS):');
    let completedCount = 0;
    let otherCount = 0;
    
    transactionsQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. Transaction ID: ${row.id}`);
      console.log(`     Type: ${row.transaction_type}`);
      console.log(`     Points: ${row.points}`);
      console.log(`     Amount: ${row.amount}`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Session: ${row.session_title || 'Unknown'} (ID: ${row.session_id || 'Unknown'})`);
      console.log(`     Purchase ID: ${row.purchase_id || 'None'}`);
      console.log(`     Created: ${row.created_at}`);
      
      if (row.status === 'completed') {
        completedCount++;
      } else {
        otherCount++;
      }
      console.log('');
    });

    console.log(`📊 SUMMARY:`);
    console.log(`  Completed transactions: ${completedCount}`);
    console.log(`  Other status transactions: ${otherCount}`);
    console.log(`  Total transactions: ${transactionsQuery.rows.length}`);

    // Check if there are any failed or pending transactions
    const failedTransactionsQuery = await pool.query(`
      SELECT 
        pt.id,
        pt.user_id,
        pt.transaction_type,
        pt.points,
        pt.amount,
        pt.status,
        pt.metadata,
        pt.created_at
      FROM point_transactions pt
      WHERE pt.user_id = 4 
        AND pt.transaction_type = 'spend'
        AND pt.metadata::text LIKE '%live_session%'
        AND pt.status != 'completed'
      ORDER BY pt.created_at DESC
    `);
    
    console.log('\n❌ FAILED/PENDING TRANSACTIONS:');
    if (failedTransactionsQuery.rows.length === 0) {
      console.log('  No failed or pending transactions found');
    } else {
      failedTransactionsQuery.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. Transaction ID: ${row.id}`);
        console.log(`     Status: ${row.status}`);
        console.log(`     Points: ${row.points}`);
        console.log(`     Amount: ${row.amount}`);
        console.log(`     Created: ${row.created_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error checking point transaction statuses:', error);
  } finally {
    await pool.end();
  }
};

checkPointTransactionsStatus(); 