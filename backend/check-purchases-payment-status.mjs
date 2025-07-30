import pool from './db.js';

const checkPurchasesPaymentStatus = async () => {
  try {
    console.log('🔍 Checking purchases table for payment status fields...\n');

    // Check if there are any payment status related columns
    const columnsQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'purchases'
      AND column_name LIKE '%payment%' OR column_name LIKE '%status%'
    `);
    
    console.log('📋 PAYMENT/STATUS RELATED COLUMNS:');
    if (columnsQuery.rows.length === 0) {
      console.log('  No payment or status related columns found');
    } else {
      columnsQuery.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }

    // Check if there are any payment status fields in related tables
    const relatedTablesQuery = await pool.query(`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name IN ('point_transactions', 'live_sessions', 'users')
      AND (column_name LIKE '%payment%' OR column_name LIKE '%status%')
      ORDER BY table_name, column_name
    `);
    
    console.log('\n📋 PAYMENT/STATUS COLUMNS IN RELATED TABLES:');
    if (relatedTablesQuery.rows.length === 0) {
      console.log('  No payment or status related columns found in related tables');
    } else {
      relatedTablesQuery.rows.forEach(row => {
        console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
      });
    }

    // Check if there are any point transactions related to live session purchases
    const pointTransactionsQuery = await pool.query(`
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
      WHERE pt.metadata::text LIKE '%live_session%'
      ORDER BY pt.created_at DESC
      LIMIT 10
    `);
    
    console.log('\n💳 POINT TRANSACTIONS FOR LIVE SESSIONS:');
    pointTransactionsQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. Transaction ID: ${row.id}`);
      console.log(`     User ID: ${row.user_id}`);
      console.log(`     Type: ${row.transaction_type}`);
      console.log(`     Points: ${row.points}`);
      console.log(`     Amount: ${row.amount}`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Metadata: ${row.metadata}`);
      console.log(`     Created: ${row.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
  } finally {
    await pool.end();
  }
};

checkPurchasesPaymentStatus(); 