import pool from './db.js';

const checkMissingPrivateClass = async () => {
  try {
    console.log('🔍 Checking for missing private class request...\n');

    // Check all private class requests for Sultan Abdo
    const allRequestsQuery = await pool.query(`
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
      WHERE pcr.student_id = 4
        AND pcr.status = 'مؤكد'
        AND pcr.payment_status = 'paid'
      ORDER BY pcr.created_at DESC
    `);
    
    console.log('✅ ALL ACCEPTED AND PAID REQUESTS FOR SULTAN ABDO:');
    allRequestsQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.title} (ID: ${row.id})`);
      console.log(`     Teacher: ${row.teacher_name}`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Payment Status: ${row.payment_status}`);
      console.log(`     Payment Date: ${row.payment_date}`);
      console.log(`     Points Used: ${row.points_used}`);
      console.log('');
    });

    // Check which ones are showing up for professor 12
    const professorRequestsQuery = await pool.query(`
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
      WHERE pcr.student_id = 4
        AND pcr.status = 'مؤكد'
        AND pcr.payment_status = 'paid'
        AND pcr.teacher_name = (SELECT name FROM users WHERE id = 12)
      ORDER BY pcr.created_at DESC
    `);
    
    console.log('👨‍🏫 ACCEPTED AND PAID REQUESTS FOR PROFESSOR 12:');
    professorRequestsQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.title} (ID: ${row.id})`);
      console.log(`     Teacher: ${row.teacher_name}`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Payment Status: ${row.payment_status}`);
      console.log(`     Payment Date: ${row.payment_date}`);
      console.log(`     Points Used: ${row.points_used}`);
      console.log('');
    });

    // Find the missing one
    const allIds = allRequestsQuery.rows.map(row => row.id);
    const professorIds = professorRequestsQuery.rows.map(row => row.id);
    const missingIds = allIds.filter(id => !professorIds.includes(id));
    
    console.log('🔍 MISSING REQUESTS:');
    if (missingIds.length === 0) {
      console.log('  No missing requests found');
    } else {
      missingIds.forEach(id => {
        const missingRequest = allRequestsQuery.rows.find(row => row.id === id);
        console.log(`  ID: ${id} - ${missingRequest.title}`);
        console.log(`     Teacher: ${missingRequest.teacher_name}`);
        console.log(`     This request is for a different teacher!`);
        console.log('');
      });
    }

    // Check what teachers Sultan Abdo has requests with
    const teachersQuery = await pool.query(`
      SELECT DISTINCT 
        pcr.teacher_name,
        COUNT(*) as request_count
      FROM private_class_requests pcr
      WHERE pcr.student_id = 4
        AND pcr.status = 'مؤكد'
        AND pcr.payment_status = 'paid'
      GROUP BY pcr.teacher_name
    `);
    
    console.log('👨‍🏫 TEACHERS FOR SULTAN ABDO\'S PAID REQUESTS:');
    teachersQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.teacher_name}: ${row.request_count} requests`);
    });

  } catch (error) {
    console.error('❌ Error checking missing private class:', error);
  } finally {
    await pool.end();
  }
};

checkMissingPrivateClass(); 