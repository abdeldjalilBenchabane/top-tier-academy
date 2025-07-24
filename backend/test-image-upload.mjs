import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImageUpload() {
  try {
    console.log('🧪 Testing image upload setup...');
    
    // Check upload directories
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const liveSessionsDir = path.join(uploadsDir, 'live-sessions');
    
    console.log('📁 Checking directories:');
    console.log('  - Uploads dir:', uploadsDir, fs.existsSync(uploadsDir) ? '✅' : '❌');
    console.log('  - Live sessions dir:', liveSessionsDir, fs.existsSync(liveSessionsDir) ? '✅' : '❌');
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    }
    
    if (!fs.existsSync(liveSessionsDir)) {
      fs.mkdirSync(liveSessionsDir, { recursive: true });
      console.log('✅ Created live-sessions directory');
    }
    
    // Test file creation
    const testFileName = `test-${Date.now()}.txt`;
    const testFilePath = path.join(liveSessionsDir, testFileName);
    
    fs.writeFileSync(testFilePath, 'Test file content');
    console.log('✅ Test file created:', testFileName);
    
    // Check if file exists
    if (fs.existsSync(testFilePath)) {
      console.log('✅ File exists and is readable');
      
      // Clean up test file
      fs.unlinkSync(testFilePath);
      console.log('✅ Test file cleaned up');
    }
    
    console.log('🎉 Image upload setup test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImageUpload(); 