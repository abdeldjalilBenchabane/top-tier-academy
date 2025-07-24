import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupUploads() {
  try {
    console.log('📁 Setting up uploads directory...');
    
    // Create uploads directories
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const liveSessionsDir = path.join(uploadsDir, 'live-sessions');
    const coursesDir = path.join(uploadsDir, 'courses');
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory:', uploadsDir);
    }
    
    if (!fs.existsSync(liveSessionsDir)) {
      fs.mkdirSync(liveSessionsDir, { recursive: true });
      console.log('✅ Created live-sessions directory:', liveSessionsDir);
    }
    
    if (!fs.existsSync(coursesDir)) {
      fs.mkdirSync(coursesDir, { recursive: true });
      console.log('✅ Created courses directory:', coursesDir);
    }
    
    console.log('🎉 Upload directories setup complete!');
    
    // List contents
    console.log('\n📋 Directory contents:');
    if (fs.existsSync(uploadsDir)) {
      const contents = fs.readdirSync(uploadsDir);
      contents.forEach(item => {
        const itemPath = path.join(uploadsDir, item);
        const stats = fs.statSync(itemPath);
        console.log(`  - ${item} (${stats.isDirectory() ? 'directory' : 'file'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error setting up uploads:', error);
  }
}

setupUploads(); 