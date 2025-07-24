import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testLiveSessionWithImage() {
  try {
    console.log('🧪 Testing live session with image creation...\n');

    // 1. Check if we have any professors
    const professorResult = await pool.query('SELECT id, name FROM users WHERE role = $1 LIMIT 1', ['professor']);
    
    if (professorResult.rows.length === 0) {
      console.log('❌ No professor found. Creating a test professor...');
      const createProfessorResult = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name',
        ['أستاذ أحمد', 'ahmed@test.com', '$2b$10$test', 'professor']
      );
      const professor = createProfessorResult.rows[0];
      console.log('✅ Created professor:', professor.name, 'ID:', professor.id);
    } else {
      const professor = professorResult.rows[0];
      console.log('✅ Found professor:', professor.name, 'ID:', professor.id);
    }

    // 2. Create a test live session with image
    const professor = professorResult.rows[0] || (await pool.query('SELECT id, name FROM users WHERE role = $1 LIMIT 1', ['professor'])).rows[0];
    
    console.log('\n📝 Creating test live session with image...');
    const testSession = {
      title: 'درس الرياضيات مع الصورة',
      description: 'درس تجريبي لاختبار نظام البث المباشر مع الصورة',
      start_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      duration: 90,
      price: 400,
      professor_id: professor.id,
      cover_image: '/uploads/live-sessions/test-cover.jpg',
      is_approved: true
    };

    const insertResult = await pool.query(
      'INSERT INTO live_sessions (professor_id, title, description, start_time, duration, price, cover_image, is_approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [testSession.professor_id, testSession.title, testSession.description, testSession.start_time, testSession.duration, testSession.price, testSession.cover_image, testSession.is_approved]
    );

    const createdSession = insertResult.rows[0];
    console.log('✅ Created live session with image:', createdSession.title);
    console.log('   ID:', createdSession.id);
    console.log('   Cover Image:', createdSession.cover_image);
    console.log('   Approved:', createdSession.is_approved);
    console.log('   Time:', new Date(createdSession.start_time).toLocaleString('en-US'));

    // 3. Check all live sessions with images
    console.log('\n🗄️  Checking all live sessions with images:');
    const dbResult = await pool.query(`
      SELECT ls.*, u.name as professor_name 
      FROM live_sessions ls 
      LEFT JOIN users u ON ls.professor_id = u.id 
      WHERE ls.is_approved = TRUE 
      ORDER BY ls.start_time DESC
      LIMIT 5
    `);
    
    console.log('✅ Recent live sessions:');
    dbResult.rows.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.title} (${session.professor_name})`);
      console.log(`      Cover Image: ${session.cover_image || 'No image'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testLiveSessionWithImage(); 