import SessionReminderService from './services/sessionReminderService.js';

class SessionReminderScheduler {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('⚠️  Session reminder scheduler is already running');
      return;
    }

    console.log('🚀 Starting session reminder scheduler...');
    this.isRunning = true;

    // Run immediately on start
    this.runReminderCheck();

    // Then run every minute
    this.interval = setInterval(() => {
      this.runReminderCheck();
    }, 60 * 1000); // 60 seconds

    console.log('✅ Session reminder scheduler started (checking every minute)');
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Session reminder scheduler is not running');
      return;
    }

    console.log('🛑 Stopping session reminder scheduler...');
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    console.log('✅ Session reminder scheduler stopped');
  }

  // Run the reminder check
  async runReminderCheck() {
    try {
      console.log('🕐 Running session reminder check...');
      await SessionReminderService.runReminderChecks();
    } catch (error) {
      console.error('❌ Error in session reminder check:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: new Date().toISOString()
    };
  }
}

// Create and export the scheduler instance
const sessionReminderScheduler = new SessionReminderScheduler();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down session reminder scheduler...');
  sessionReminderScheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down session reminder scheduler...');
  sessionReminderScheduler.stop();
  process.exit(0);
});

export default sessionReminderScheduler; 