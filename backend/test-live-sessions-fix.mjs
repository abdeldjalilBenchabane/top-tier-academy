import pool from './db.js';

const testLiveSessionsFix = async () => {
  try {
    console.log('🔍 Testing Live Sessions Fix...\n');

    const professorId = 12;
    console.log(`📊 Testing for Professor ID: ${professorId}\n`);

    // Test the old query (live_session_participants)
    console.log('📚 1. OLD QUERY (live_session_participants):');
    const oldQuery = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ls.title as content_title,
        ls.id as content_id
      FROM live_session_participants lsp
      JOIN users u ON lsp.user_id = u.id
      JOIN live_sessions ls ON lsp.session_id = ls.id
      WHERE ls.professor_id = $1
    `, [professorId]);
    
    console.log(`Found ${oldQuery.rows.length} participants`);
    oldQuery.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.content_title}`);
    });

    // Test the new query (purchases table)
    console.log('\n🎥 2. NEW QUERY (purchases table):');
    const newQuery = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ls.title as content_title,
        ls.id as content_id,
        p.purchased_at
      FROM purchases p
      JOIN users u ON p.student_id = u.id
      JOIN live_sessions ls ON p.session_id = ls.id
      WHERE ls.professor_id = $1
    `, [professorId]);
    
    console.log(`Found ${newQuery.rows.length} purchases`);
    newQuery.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.content_title} (purchased: ${row.purchased_at})`);
    });

    // Check all purchases in the system
    console.log('\n📋 3. ALL PURCHASES IN SYSTEM:');
    const allPurchases = await pool.query(`
      SELECT 
        p.id,
        p.session_id,
        p.student_id,
        p.amount_paid,
        p.purchased_at,
        u.name as student_name,
        ls.title as session_title,
        ls.professor_id
      FROM purchases p
      JOIN users u ON p.student_id = u.id
      JOIN live_sessions ls ON p.session_id = ls.id
      ORDER BY p.purchased_at DESC
    `);
    
    console.log(`Total purchases in system: ${allPurchases.rows.length}`);
    allPurchases.rows.forEach(row => {
      console.log(`  ${row.student_name}: ${row.session_title} (professor_id: ${row.professor_id}, amount: ${row.amount_paid})`);
    });

    // Check all live sessions for this professor
    console.log('\n🎬 4. ALL LIVE SESSIONS FOR PROFESSOR:');
    const professorSessions = await pool.query(`
      SELECT 
        ls.id,
        ls.title,
        ls.professor_id,
        ls.price,
        ls.created_at
      FROM live_sessions ls
      WHERE ls.professor_id = $1
      ORDER BY ls.created_at DESC
    `, [professorId]);
    
    console.log(`Total live sessions for professor: ${professorSessions.rows.length}`);
    professorSessions.rows.forEach(row => {
      console.log(`  ${row.title} (ID: ${row.id}, Price: ${row.price})`);
    });

  } catch (error) {
    console.error('❌ Error testing live sessions fix:', error);
  } finally {
    await pool.end();
  }
};

testLiveSessionsFix(); 