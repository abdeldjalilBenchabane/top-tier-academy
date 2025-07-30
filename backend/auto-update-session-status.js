// Auto-update live session statuses based on time
import pool from './db.js';

export async function updateSessionStatuses() {
  try {
    console.log('🕐 Checking for session status updates...');
    
    const now = new Date();
    
    // Get all sessions that need status updates
    const sessions = await pool.query(`
      SELECT id, status, start_time, duration, title
      FROM live_sessions 
      WHERE status IN ('scheduled', 'live')
      AND start_time IS NOT NULL
    `);
    
    for (const session of sessions.rows) {
      const sessionStartTime = new Date(session.start_time);
      const sessionEndTime = new Date(sessionStartTime.getTime() + (session.duration || 60) * 60 * 1000);
      
      let newStatus = session.status;
      
      // Check if session should be live
      if (session.status === 'scheduled' && now >= sessionStartTime && now <= sessionEndTime) {
        newStatus = 'live';
        console.log(`🟢 Session "${session.title}" (${session.id}) is now LIVE`);
      }
      // Check if session should be ended
      else if (session.status === 'live' && now > sessionEndTime) {
        newStatus = 'ended';
        console.log(`🔴 Session "${session.title}" (${session.id}) has ENDED`);
      }
      
      // Update status if it changed
      if (newStatus !== session.status) {
        await pool.query(
          'UPDATE live_sessions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newStatus, session.id]
        );
        console.log(`✅ Updated session ${session.id} status from "${session.status}" to "${newStatus}"`);
      }
    }
    
    console.log('✅ Session status check completed');
  } catch (error) {
    console.error('❌ Error updating session statuses:', error);
  }
}

// Run the update function if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSessionStatuses()
    .then(() => {
      console.log('🎉 Auto-update script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Auto-update script failed:', error);
      process.exit(1);
    });
} 