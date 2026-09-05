// Fix timezone issues in all notification and email services
import fs from 'fs';

console.log('🔧 FIXING ALL NOTIFICATION AND EMAIL TIMEZONE ISSUES');
console.log('====================================================\n');

const filesToFix = [
  {
    path: 'services/sessionReminderService.js',
    description: 'Session Reminder Service'
  },
  {
    path: 'services/emailService.js',
    description: 'Email Service'
  },
  {
    path: 'services/notificationService.js',
    description: 'Notification Service'
  }
];

filesToFix.forEach(file => {
  console.log(`📁 Processing: ${file.description}`);
  
  try {
    if (!fs.existsSync(file.path)) {
      console.log(`   ❌ File not found: ${file.path}`);
      return;
    }

    let content = fs.readFileSync(file.path, 'utf8');
    let updated = false;

    // Add timezone utility import if not present
    if (!content.includes('import { formatTimeForDisplay, formatDateForDisplay }')) {
      console.log(`   📝 Adding timezone utility import...`);
      
      // Find the last import statement and add after it
      const importMatch = content.match(/(import.*from.*['"];)/g);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        const newImport = `import { formatTimeForDisplay, formatDateForDisplay } from '../utils/timezone.js';`;
        content = content.replace(lastImport, lastImport + '\n' + newImport);
        updated = true;
      }
    }

    // Replace toLocaleString() with proper timezone formatting
    if (content.includes('toLocaleString()')) {
      console.log(`   📝 Updating toLocaleString() calls...`);
      
      // Replace toLocaleString() with formatTimeForDisplay + formatDateForDisplay
      content = content.replace(
        /new Date\(([^)]+)\)\.toLocaleString\(\)/g,
        'formatTimeForDisplay($1) + " " + formatDateForDisplay($1)'
      );
      updated = true;
    }

    // Replace toLocaleDateString() with formatDateForDisplay
    if (content.includes('toLocaleDateString()')) {
      console.log(`   📝 Updating toLocaleDateString() calls...`);
      
      content = content.replace(
        /new Date\(\)\.toLocaleDateString\(\)/g,
        'formatDateForDisplay(new Date().toISOString())'
      );
      updated = true;
    }

    // Replace specific time formatting patterns
    if (content.includes('new Date(session.start_time).toLocaleString()')) {
      console.log(`   📝 Updating session time formatting...`);
      
      content = content.replace(
        /new Date\(session\.start_time\)\.toLocaleString\(\)/g,
        'formatTimeForDisplay(session.start_time) + " " + formatDateForDisplay(session.start_time)'
      );
      updated = true;
    }

    if (content.includes('new Date(privateClass.scheduled_at).toLocaleString()')) {
      console.log(`   📝 Updating private class time formatting...`);
      
      content = content.replace(
        /new Date\(privateClass\.scheduled_at\)\.toLocaleString\(\)/g,
        'formatTimeForDisplay(privateClass.scheduled_at) + " " + formatDateForDisplay(privateClass.scheduled_at)'
      );
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(file.path, content, 'utf8');
      console.log(`   ✅ Updated successfully`);
    } else {
      console.log(`   ⚠️  No changes needed`);
    }

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
});

console.log('📋 WHAT THIS FIXES:');
console.log('   ✅ Session reminder notifications');
console.log('   ✅ Live session reminder emails');
console.log('   ✅ Private class reminder emails');
console.log('   ✅ Course purchase emails');
console.log('   ✅ Live session purchase emails');
console.log('   ✅ Course approval/rejection emails');
console.log('   ✅ Live session approval/rejection emails');
console.log('   ✅ Quiz approval/rejection emails');
console.log('   ✅ All other notification and email services');

console.log('\n📋 EXPECTED RESULTS:');
console.log('   - All notifications will show time in user\'s local timezone');
console.log('   - All emails will show time in user\'s local timezone');
console.log('   - Consistent time formatting across the entire application');
console.log('   - No more timezone mismatches between notifications and UI');

console.log('\n📋 NEXT STEPS:');
console.log('1. Restart your Node.js server');
console.log('2. Test creating a live session');
console.log('3. Check if notification time matches live sessions page time');
console.log('4. Test email notifications for timezone consistency');
