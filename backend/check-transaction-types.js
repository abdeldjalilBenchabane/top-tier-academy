import pool from './db.js';

async function checkTransactionTypes() {
  try {
    console.log('🔍 Checking transaction types and metadata...\n');

    // Check all transaction types
    const transactionTypes = await pool.query(`
      SELECT 
        transaction_type,
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM point_transactions 
      GROUP BY transaction_type, status
      ORDER BY transaction_type, status
    `);
    
    console.log('📊 Transaction Types Summary:');
    console.log(transactionTypes.rows);

    // Check metadata types for spend transactions
    const spendMetadata = await pool.query(`
      SELECT 
        metadata->>'type' as metadata_type,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM point_transactions 
      WHERE transaction_type = 'spend'
      GROUP BY metadata->>'type'
      ORDER BY count DESC
    `);
    
    console.log('\n💰 Spend Transaction Metadata Types:');
    console.log(spendMetadata.rows);

    // Check sample metadata for each type
    const sampleMetadata = await pool.query(`
      SELECT 
        id,
        transaction_type,
        amount,
        metadata,
        created_at
      FROM point_transactions 
      WHERE transaction_type = 'spend'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📋 Sample Spend Transaction Metadata:');
    sampleMetadata.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id}, Amount: ${row.amount}, Type: ${row.metadata?.type || 'N/A'}`);
      console.log('   Metadata:', JSON.stringify(row.metadata, null, 2));
    });

    // Check if we have any private class transactions
    const privateClassTransactions = await pool.query(`
      SELECT COUNT(*) as count, SUM(amount) as total_amount
      FROM point_transactions 
      WHERE transaction_type = 'spend' 
      AND metadata->>'type' = 'private_class_purchase'
    `);
    
    console.log('\n🏠 Private Class Transactions:');
    console.log(privateClassTransactions.rows);

    // Check course and live session transactions
    const courseTransactions = await pool.query(`
      SELECT COUNT(*) as count, SUM(amount) as total_amount
      FROM point_transactions 
      WHERE transaction_type = 'spend' 
      AND metadata->>'type' = 'course_purchase'
    `);
    
    console.log('\n📚 Course Transactions:');
    console.log(courseTransactions.rows);

    const liveSessionTransactions = await pool.query(`
      SELECT COUNT(*) as count, SUM(amount) as total_amount
      FROM point_transactions 
      WHERE transaction_type = 'spend' 
      AND metadata->>'type' = 'live_session_purchase'
    `);
    
    console.log('\n🎥 Live Session Transactions:');
    console.log(liveSessionTransactions.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTransactionTypes(); 