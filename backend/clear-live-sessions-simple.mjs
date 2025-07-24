import pool from './db.js';

async function clearLiveSessions() {
  try {
    console.log('🗑️  Clearing all live sessions from database...\n');

    // First, let's see what we're about to delete
    const countResult = await pool.query('SELECT COUNT(*) as total FROM live_sessions');
    const totalSessions = countResult.rows[0].total;
    
    console.log(`📊 Found ${totalSessions} live sessions to delete`);

    if (totalSessions === 0) {
      console.log('✅ No live sessions found to delete');
      return;
    }

    // Show some examples of what will be deleted
    const sampleResult = await pool.query(`
      SELECT id, title, professor_id, created_at 
      FROM live_sessions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample sessions to be deleted:');
    sampleResult.rows.forEach((session, index) => {
      console.log(`   ${index + 1}. ID: ${session.id} - "${session.title}" (Prof ID: ${session.professor_id})`);
    });

    console.log('\n⚠️  WARNING: This will permanently delete ALL live sessions!');
    console.log('   This action cannot be undone.');
    
    // For safety, let's add a small delay
    console.log('\n⏳ Proceeding with deletion in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete all live sessions
    const deleteResult = await pool.query('DELETE FROM live_sessions');
    
    console.log(`✅ Successfully deleted ${deleteResult.rowCount} live sessions`);

    // Verify deletion
    const verifyResult = await pool.query('SELECT COUNT(*) as remaining FROM live_sessions');
    const remainingSessions = verifyResult.rows[0].remaining;
    
    console.log(`📊 Remaining live sessions: ${remainingSessions}`);

    if (remainingSessions === 0) {
      console.log('🎉 All live sessions have been successfully cleared!');
    } else {
      console.log('⚠️  Some sessions may still exist');
    }

  } catch (error) {
    console.error('❌ Error clearing live sessions:', error);
  } finally {
    await pool.end();
  }
}

clearLiveSessions(); 