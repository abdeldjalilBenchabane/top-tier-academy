// Fix notification timezone issue
import fs from 'fs';

console.log('🔧 FIXING NOTIFICATION TIMEZONE ISSUE');
console.log('=====================================\n');

const sessionReminderFile = 'services/sessionReminderService.js';

try {
  if (!fs.existsSync(sessionReminderFile)) {
    console.log('❌ Session reminder service file not found');
    process.exit(1);
  }

  let content = fs.readFileSync(sessionReminderFile, 'utf8');
  
  // Add timezone utility import at the top
  if (!content.includes('import { formatTimeForDisplay, formatDateForDisplay }')) {
    console.log('📝 Adding timezone utility import...');
    
    const importMatch = content.match(/(import.*from.*['"]\.\.\/services\/emailService\.js['"];)/);
    if (importMatch) {
      const newImport = `import { sendLiveSessionReminderEmailToStudent, sendLiveSessionReminderEmailToProfessor, sendPrivateClassReminderEmailToStudent, sendPrivateClassReminderEmailToProfessor } from './emailService.js';
import { formatTimeForDisplay, formatDateForDisplay } from '../utils/timezone.js';`;
      content = content.replace(importMatch[1], newImport);
    }
  }

  // Replace all instances of toLocaleString() with proper timezone formatting
  console.log('📝 Updating time formatting in notifications...');
  
  // Replace for live session notifications
  content = content.replace(
    /new Date\(session\.start_time\)\.toLocaleString\(\)/g,
    'formatTimeForDisplay(session.start_time) + " " + formatDateForDisplay(session.start_time)'
  );
  
  // Replace for private class notifications
  content = content.replace(
    /new Date\(privateClass\.scheduled_at\)\.toLocaleString\(\)/g,
    'formatTimeForDisplay(privateClass.scheduled_at) + " " + formatDateForDisplay(privateClass.scheduled_at)'
  );

  // Write the updated content back
  fs.writeFileSync(sessionReminderFile, content, 'utf8');
  
  console.log('✅ Session reminder service updated!');
  console.log('   - Added timezone utility imports');
  console.log('   - Updated time formatting to use proper timezone utilities');
  console.log('   - Notifications will now show time in user\'s local timezone');
  
} catch (error) {
  console.log('❌ Error updating session reminder service:', error.message);
}

console.log('\n📋 WHAT THIS FIXES:');
console.log('   - Notification: "3:20:00 PM" → Will now show correct local time');
console.log('   - Live sessions page: "04:20 PM" → Will match notification time');
console.log('   - Both will use the same timezone utilities for consistency');

console.log('\n📋 NEXT STEPS:');
console.log('1. Restart your Node.js server');
console.log('2. Test creating a live session');
console.log('3. Check if notification time matches live sessions page time');
