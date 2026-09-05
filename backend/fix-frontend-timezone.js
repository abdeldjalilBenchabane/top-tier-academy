// Fix frontend to send UTC time
import fs from 'fs';

console.log('🔧 FIXING FRONTEND TO SEND UTC TIME');
console.log('===================================\n');

const frontendFiles = [
  '../src/components/forms/LiveSessionForm.tsx',
  '../src/components/forms/LiveSectionForm.tsx'
];

frontendFiles.forEach(filePath => {
  console.log(`📁 Checking: ${filePath}`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Find where start_time is appended to FormData and convert to UTC
    if (content.includes('formData.append(\'start_time\', scheduledAt)')) {
      console.log(`   📝 Updating start_time to send UTC time...`);
      
      // Replace the line that sends local time with UTC time
      const oldLine = /formData\.append\('start_time', scheduledAt\);/g;
      const newLine = `// Convert local time to UTC before sending
      const localDate = new Date(scheduledAt);
      const utcTime = localDate.toISOString();
      formData.append('start_time', utcTime);`;
      
      content = content.replace(oldLine, newLine);
      updated = true;
    }

    if (content.includes('formData.append(\'start_time\', block.scheduledAt)')) {
      console.log(`   📝 Updating block.scheduledAt to send UTC time...`);
      
      // Replace the line that sends local time with UTC time
      const oldLine = /formData\.append\('start_time', block\.scheduledAt\);/g;
      const newLine = `// Convert local time to UTC before sending
        const localDate = new Date(block.scheduledAt);
        const utcTime = localDate.toISOString();
        formData.append('start_time', utcTime);`;
      
      content = content.replace(oldLine, newLine);
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   ✅ Updated successfully`);
    } else {
      console.log(`   ⚠️  No changes needed`);
    }

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
});

console.log('📋 SOLUTION EXPLANATION:');
console.log('   - Frontend now converts local time to UTC before sending to backend');
console.log('   - When you select 2 AM local time, frontend sends 1 AM UTC');
console.log('   - Backend stores 1 AM UTC');
console.log('   - When displayed, 1 AM UTC shows as 2 AM local time');
console.log('   - This eliminates the 1-hour shift');

console.log('\n📋 NEXT STEPS:');
console.log('1. Restart your Node.js server');
console.log('2. Clear browser cache');
console.log('3. Test creating a live session with 2 AM');
console.log('4. It should now display as 2 AM (not 3 AM)');
