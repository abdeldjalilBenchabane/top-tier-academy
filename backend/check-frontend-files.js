// Check frontend files for timezone fixes
import fs from 'fs';
import path from 'path';

console.log('🔍 CHECKING FRONTEND FILES FOR TIMEZONE FIXES');
console.log('=============================================\n');

const frontendFilesToCheck = [
  {
    path: '../src/lib/utils.ts',
    requiredContent: ['formatTimeForDisplay', 'formatDateForDisplay']
  },
  {
    path: '../src/components/professor/LiveSessions.tsx',
    requiredContent: ['formatTimeForDisplay', 'formatDateForDisplay']
  },
  {
    path: '../src/components/admin/LiveSessionsOverview.tsx',
    requiredContent: ['formatTimeForDisplay', 'formatDateForDisplay']
  }
];

let allFilesOk = true;

frontendFilesToCheck.forEach(file => {
  console.log(`📁 Checking: ${file.path}`);
  
  try {
    if (!fs.existsSync(file.path)) {
      console.log(`   ❌ File does not exist`);
      allFilesOk = false;
      return;
    }
    
    const content = fs.readFileSync(file.path, 'utf8');
    let fileOk = true;
    
    file.requiredContent.forEach(required => {
      if (!content.includes(required)) {
        console.log(`   ❌ Missing: ${required}`);
        fileOk = false;
      }
    });
    
    if (fileOk) {
      console.log(`   ✅ File exists and contains required content`);
    } else {
      allFilesOk = false;
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    allFilesOk = false;
  }
  
  console.log('');
});

if (allFilesOk) {
  console.log('🎉 All frontend files are properly updated!');
} else {
  console.log('❌ Some frontend files are missing or not updated');
  console.log('   You need to upload the updated frontend files to your VPS');
}

console.log('\n📋 NEXT STEPS:');
console.log('1. Restart your Node.js server');
console.log('2. Rebuild your frontend if using a build process');
console.log('3. Clear browser cache');
console.log('4. Test creating a live session');
