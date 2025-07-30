import pool from './db.js';

const testPrivateClassesFix = async () => {
  try {
    console.log('🔍 Testing Private Classes Fix...\n');

    const professorId = 12;
    console.log(`📊 Testing for Professor ID: ${professorId}\n`);

    // Get professor name
    const professorName = await pool.query('SELECT name FROM users WHERE id = $1', [professorId]);
    const professorNameValue = professorName.rows[0]?.name;
    console.log(`👨‍🏫 Professor: ${professorNameValue}\n`);

    // Test the old query (all private class requests)
    console.log('📚 1. OLD QUERY (all private class requests):');
    const oldQuery = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        pcr.title as content_title,
        pcr.status,
        pcr.payment_status,
        pcr.price_per_session
      FROM private_class_requests pcr
      JOIN users u ON pcr.student_id = u.id
      WHERE pcr.teacher_name = $1
      ORDER BY pcr.created_at DESC
    `, [professorNameValue]);
    
    console.log(`Found ${oldQuery.rows.length} total requests`);
    oldQuery.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.content_title} - Status: ${row.status}, Payment: ${row.payment_status}, Price: ${row.price_per_session}`);
    });

    // Test the new query (only accepted and paid)
    console.log('\n🎥 2. NEW QUERY (only accepted and paid):');
    const newQuery = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        pcr.title as content_title,
        pcr.status,
        pcr.payment_status,
        pcr.price_per_session,
        pcr.points_used
      FROM private_class_requests pcr
      JOIN users u ON pcr.student_id = u.id
      WHERE pcr.teacher_name = $1
        AND pcr.status = 'مؤكد'
        AND pcr.payment_status = 'paid'
      ORDER BY pcr.created_at DESC
    `, [professorNameValue]);
    
    console.log(`Found ${newQuery.rows.length} accepted and paid requests`);
    newQuery.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.content_title} - Status: ${row.status}, Payment: ${row.payment_status}, Points: ${row.points_used}`);
    });

    // Check all private class requests for this professor
    console.log('\n📋 3. ALL PRIVATE CLASS REQUESTS FOR PROFESSOR:');
    const allRequests = await pool.query(`
      SELECT 
        pcr.id,
        pcr.title,
        pcr.status,
        pcr.payment_status,
        pcr.price_per_session,
        pcr.points_used,
        pcr.created_at,
        pcr.payment_date,
        u.name as student_name
      FROM private_class_requests pcr
      JOIN users u ON pcr.student_id = u.id
      WHERE pcr.teacher_name = $1
      ORDER BY pcr.created_at DESC
    `, [professorNameValue]);
    
    console.log(`Total requests: ${allRequests.rows.length}`);
    
    // Group by status and payment
    const statusCounts = {};
    const paymentCounts = {};
    
    allRequests.rows.forEach(row => {
      // Count by status
      statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
      
      // Count by payment status
      paymentCounts[row.payment_status] = (paymentCounts[row.payment_status] || 0) + 1;
    });
    
    console.log('\n📊 STATUS BREAKDOWN:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n💰 PAYMENT STATUS BREAKDOWN:');
    Object.entries(paymentCounts).forEach(([payment, count]) => {
      console.log(`  ${payment}: ${count}`);
    });

    // Show detailed breakdown
    console.log('\n📋 4. DETAILED BREAKDOWN:');
    allRequests.rows.forEach(row => {
      console.log(`  ${row.student_name}: ${row.title}`);
      console.log(`    Status: ${row.status}, Payment: ${row.payment_status}`);
      console.log(`    Price: ${row.price_per_session}, Points Used: ${row.points_used || 'N/A'}`);
      console.log(`    Created: ${row.created_at}, Paid: ${row.payment_date || 'Not paid'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error testing private classes fix:', error);
  } finally {
    await pool.end();
  }
};

testPrivateClassesFix(); 