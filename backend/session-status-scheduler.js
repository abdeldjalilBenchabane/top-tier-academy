// Session status scheduler - runs every minute
import { updateSessionStatuses } from './auto-update-session-status.js';

console.log('🚀 Starting session status scheduler...');

// Run immediately
updateSessionStatuses();

// Then run every minute
setInterval(updateSessionStatuses, 60000); // 60 seconds

console.log('⏰ Scheduler is running. Checking session statuses every minute...');

// Keep the process alive
process.on('SIGINT', () => {
  console.log('🛑 Shutting down session status scheduler...');
  process.exit(0);
}); 