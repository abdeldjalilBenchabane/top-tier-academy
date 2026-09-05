// Fix admin component timezone display
import fs from 'fs';
import path from 'path';

console.log('🔧 FIXING ADMIN COMPONENT TIMEZONE DISPLAY');
console.log('==========================================\n');

const adminComponentPath = '../src/components/admin/LiveSessionsOverview.tsx';

try {
  if (!fs.existsSync(adminComponentPath)) {
    console.log('❌ Admin component file not found');
    process.exit(1);
  }

  let content = fs.readFileSync(adminComponentPath, 'utf8');
  
  // Check if import already exists
  if (!content.includes('import { formatTimeForDisplay, formatDateForDisplay }')) {
    console.log('📝 Adding timezone utility import...');
    
    // Find the import section and add the new import
    const importMatch = content.match(/(import.*from.*['"]@\/lib\/toast['"];)/);
    if (importMatch) {
      const newImport = `import { toast } from '@/lib/toast';
import { formatTimeForDisplay, formatDateForDisplay } from '@/lib/utils';`;
      content = content.replace(importMatch[1], newImport);
    }
  }

  // Check if formatTime function needs updating
  if (content.includes('const formatTime = (dateString: string) => {') && 
      !content.includes('formatTimeForDisplay')) {
    console.log('📝 Updating formatTime function...');
    
    const oldFormatTime = /const formatTime = \(dateString: string\) => \{[\s\S]*?\};/;
    const newFormatTime = `const formatTime = (dateString: string) => {
    return formatTimeForDisplay(dateString, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }`;
    
    content = content.replace(oldFormatTime, newFormatTime);
  }

  // Check if direct time display needs updating
  if (content.includes('toLocaleTimeString()') && !content.includes('formatTimeForDisplay')) {
    console.log('📝 Updating direct time display...');
    content = content.replace(
      /new Date\(session\.scheduledAt\)\.toLocaleTimeString\(\)/g,
      'formatTimeForDisplay(session.scheduledAt)'
    );
  }

  // Write the updated content back
  fs.writeFileSync(adminComponentPath, content, 'utf8');
  
  console.log('✅ Admin component updated successfully!');
  console.log('   - Added timezone utility imports');
  console.log('   - Updated formatTime function');
  console.log('   - Updated direct time display');
  
} catch (error) {
  console.log('❌ Error updating admin component:', error.message);
}

console.log('\n📋 NEXT STEPS:');
console.log('1. Restart your Node.js server');
console.log('2. Rebuild your frontend if using a build process');
console.log('3. Clear browser cache');
console.log('4. Test creating a live session');
