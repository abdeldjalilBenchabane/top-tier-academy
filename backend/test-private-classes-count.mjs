import pool from './db.js';

const testPrivateClassesCount = async () => {
  try {
    console.log('🔍 Testing Private Classes count for Sultan Abdo...\n');

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

    // Check all private class requests for this student
    const allPrivateClassesQuery = await pool.query(`
      SELECT 
        pcr.id,
        pcr.title,
        pcr.teacher_name,
        pcr.status,
        pcr.payment_status,
        pcr.payment_date,
        pcr.points_used,
        pcr.created_at,
        pcr.updated_at
      FROM private_class_requests pcr
      WHERE pcr.student_id = $1
      ORDER BY pcr.created_at DESC
    `, [user.id]);
    
    console.log('🎯 ALL PRIVATE CLASS REQUESTS FOR SULTAN ABDO:');
    let totalRequests = 0;
    let acceptedRequests = 0;
    let paidRequests = 0;
    let acceptedAndPaidRequests = 0;
    
    allPrivateClassesQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.title} (ID: ${row.id})`);
      console.log(`     Teacher: ${row.teacher_name}`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Payment Status: ${row.payment_status || 'None'}`);
      console.log(`     Payment Date: ${row.payment_date || 'None'}`);
      console.log(`     Points Used: ${row.points_used || 'None'}`);
      console.log(`     Created: ${row.created_at}`);
      console.log(`     Updated: ${row.updated_at}`);
      
      totalRequests++;
      if (row.status === 'مؤكد') {
        acceptedRequests++;
      }
      if (row.payment_status === 'paid') {
        paidRequests++;
      }
      if (row.status === 'مؤكد' && row.payment_status === 'paid') {
        acceptedAndPaidRequests++;
      }
      console.log('');
    });

    console.log(`📊 SUMMARY:`);
    console.log(`  Total requests: ${totalRequests}`);
    console.log(`  Accepted requests: ${acceptedRequests}`);
    console.log(`  Paid requests: ${paidRequests}`);
    console.log(`  Accepted AND paid requests: ${acceptedAndPaidRequests}`);

    // Check the current API query that's being used
    const currentApiQuery = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url as avatar,
        pcr.created_at as enrollment_date,
        pcr.updated_at as last_activity,
        pcr.title as content_title,
        pcr.id as content_id,
        'private_class' as content_type,
        pcr.status
      FROM private_class_requests pcr
      JOIN users u ON pcr.student_id = u.id
      WHERE pcr.teacher_name = (SELECT name FROM users WHERE id = 12)
        AND pcr.status = 'مؤكد'
        AND pcr.payment_status = 'paid'
        AND u.id = $1
    `, [user.id]);

    console.log('\n🎯 CURRENT API QUERY RESULTS:');
    console.log(`  Private classes found by API: ${currentApiQuery.rows.length}`);
    currentApiQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.content_title} (ID: ${row.content_id})`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Created: ${row.enrollment_date}`);
    });

    // Check if there are any other private class requests for this professor
    const professorPrivateClassesQuery = await pool.query(`
      SELECT 
        pcr.id,
        pcr.title,
        pcr.student_id,
        pcr.status,
        pcr.payment_status,
        pcr.payment_date,
        pcr.points_used,
        u.name as student_name,
        u.email as student_email
      FROM private_class_requests pcr
      JOIN users u ON pcr.student_id = u.id
      WHERE pcr.teacher_name = (SELECT name FROM users WHERE id = 12)
      ORDER BY pcr.created_at DESC
    `);
    
    console.log('\n👨‍🏫 ALL PRIVATE CLASS REQUESTS FOR PROFESSOR 12:');
    let professorTotalRequests = 0;
    let professorAcceptedRequests = 0;
    let professorPaidRequests = 0;
    let professorAcceptedAndPaidRequests = 0;
    
    professorPrivateClassesQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.title} (ID: ${row.id})`);
      console.log(`     Student: ${row.student_name} (${row.student_email})`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Payment Status: ${row.payment_status || 'None'}`);
      console.log(`     Payment Date: ${row.payment_date || 'None'}`);
      console.log(`     Points Used: ${row.points_used || 'None'}`);
      
      professorTotalRequests++;
      if (row.status === 'مؤكد') {
        professorAcceptedRequests++;
      }
      if (row.payment_status === 'paid') {
        professorPaidRequests++;
      }
      if (row.status === 'مؤكد' && row.payment_status === 'paid') {
        professorAcceptedAndPaidRequests++;
      }
      console.log('');
    });

    console.log(`📊 PROFESSOR SUMMARY:`);
    console.log(`  Total requests: ${professorTotalRequests}`);
    console.log(`  Accepted requests: ${professorAcceptedRequests}`);
    console.log(`  Paid requests: ${professorPaidRequests}`);
    console.log(`  Accepted AND paid requests: ${professorAcceptedAndPaidRequests}`);

  } catch (error) {
    console.error('❌ Error testing private classes count:', error);
  } finally {
    await pool.end();
  }
};

testPrivateClassesCount(); 