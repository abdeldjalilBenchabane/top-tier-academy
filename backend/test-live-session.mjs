import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testLiveSession() {
  try {
    console.log('🧪 Testing live session creation and retrieval...\n');

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

    // 2. Create a test live session
    const professor = professorResult.rows[0] || (await pool.query('SELECT id, name FROM users WHERE role = $1 LIMIT 1', ['professor'])).rows[0];
    
    console.log('\n📝 Creating test live session...');
    const testSession = {
      title: 'درس تجريبي - الرياضيات',
      description: 'درس تجريبي لاختبار نظام البث المباشر',
      start_time: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      duration: 60,
      price: 300,
      professor_id: professor.id,
      is_approved: true
    };

    const insertResult = await pool.query(
      'INSERT INTO live_sessions (professor_id, title, description, start_time, duration, price, is_approved) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [testSession.professor_id, testSession.title, testSession.description, testSession.start_time, testSession.duration, testSession.price, testSession.is_approved]
    );

    const createdSession = insertResult.rows[0];
    console.log('✅ Created live session:', createdSession.title);
    console.log('   ID:', createdSession.id);
    console.log('   Approved:', createdSession.is_approved);
    console.log('   Time:', new Date(createdSession.start_time).toLocaleString('ar-SA'));

    // 3. Test the API endpoint
    console.log('\n🔍 Testing API endpoint...');
    const apiResponse = await fetch('http://localhost:3000/api/live-sessions');
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API Response:', apiData);
      console.log('   Number of sessions:', apiData.length);
      
      if (apiData.length > 0) {
        console.log('   First session:', apiData[0]);
      }
    } else {
      console.log('❌ API Error:', apiResponse.status, apiResponse.statusText);
    }

    // 4. Check database directly
    console.log('\n🗄️  Checking database directly...');
    const dbResult = await pool.query(`
      SELECT ls.*, u.name as professor_name 
      FROM live_sessions ls 
      LEFT JOIN users u ON ls.professor_id = u.id 
      WHERE ls.is_approved = TRUE 
      ORDER BY ls.start_time DESC
    `);
    
    console.log('✅ Database query result:');
    console.log('   Number of approved sessions:', dbResult.rows.length);
    dbResult.rows.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.title} (${session.professor_name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testLiveSession(); 