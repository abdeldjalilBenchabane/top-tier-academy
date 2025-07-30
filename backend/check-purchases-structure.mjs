import pool from './db.js';

const checkPurchasesStructure = async () => {
  try {
    console.log('🔍 Checking purchases table structure...\n');

    // Check table structure
    const structureQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'purchases'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 PURCHASES TABLE STRUCTURE:');
    structureQuery.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Check sample data
    const sampleData = await pool.query(`
      SELECT * FROM purchases LIMIT 5
    `);
    
    console.log('\n📊 SAMPLE PURCHASES DATA:');
    sampleData.rows.forEach((row, index) => {
      console.log(`  Purchase ${index + 1}:`);
      console.log(`    ID: ${row.id}`);
      console.log(`    Session ID: ${row.session_id}`);
      console.log(`    Student ID: ${row.student_id}`);
      console.log(`    Amount Paid: ${row.amount_paid}`);
      console.log(`    Purchased At: ${row.purchased_at}`);
      console.log('');
    });

    // Check if there are any live sessions that might have payment status
    const liveSessionsWithPayment = await pool.query(`
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
      LEFT JOIN purchases p ON ls.id = p.session_id
      WHERE ls.professor_id = 12
      ORDER BY ls.created_at DESC
      LIMIT 10
    `);
    
    console.log('\n🎬 LIVE SESSIONS WITH PURCHASES:');
    liveSessionsWithPayment.rows.forEach(row => {
      console.log(`  Session: ${row.title} (ID: ${row.id})`);
      console.log(`    Professor ID: ${row.professor_id}`);
      console.log(`    Price: ${row.price}`);
      console.log(`    Purchase ID: ${row.purchase_id || 'None'}`);
      console.log(`    Student ID: ${row.student_id || 'None'}`);
      console.log(`    Amount Paid: ${row.amount_paid || 'None'}`);
      console.log(`    Purchased At: ${row.purchased_at || 'None'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking purchases structure:', error);
  } finally {
    await pool.end();
  }
};

checkPurchasesStructure(); 