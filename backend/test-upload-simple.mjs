import pool from './db.js';

async function testUpload() {
  try {
    console.log('🧪 Testing live session creation...');
    
    // Test creating a live session without image
    const result = await pool.query(`
      INSERT INTO live_sessions (professor_id, title, description, start_time, duration, price, material_id, cover_image, is_approved) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [
      3, // professor_id
      'Test Session',
      'Test description',
      new Date(),
      60,
      100,
      1,
      '/images/module_icon.png',
      true
    ]);
    
    console.log('✅ Test session created:', result.rows[0]);
    
    // Test fetching sessions
    const sessions = await pool.query(`
      SELECT ls.*, u.name as professor_name 
      FROM live_sessions ls 
      LEFT JOIN users u ON ls.professor_id = u.id 
      WHERE ls.is_approved = TRUE 
      ORDER BY ls.start_time DESC
    `);
    
    console.log('📊 Found sessions:', sessions.rows.length);
    sessions.rows.forEach(session => {
      console.log(`  - ${session.title} (${session.cover_image || 'no image'})`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testUpload(); 