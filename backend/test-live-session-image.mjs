import pool from './db.js';

async function testLiveSessionImage() {
  try {
    console.log('🧪 Testing live session image upload functionality...');
    
    // Test creating a live session with image
    const result = await pool.query(`
      INSERT INTO live_sessions (professor_id, title, description, start_time, duration, price, material_id, cover_image, is_approved) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [
      3, // professor_id
      'Test Live Session with Image',
      'Test description for live session with image',
      new Date(),
      60,
      100,
      1,
      '/uploads/live-sessions/cover-1234567890-test.jpg',
      true
    ]);
    
    console.log('✅ Test live session created with image:', {
      id: result.rows[0].id,
      title: result.rows[0].title,
      cover_image: result.rows[0].cover_image
    });
    
    // Test fetching live sessions with images
    const sessions = await pool.query(`
      SELECT ls.*, u.name as professor_name 
      FROM live_sessions ls 
      LEFT JOIN users u ON ls.professor_id = u.id 
      WHERE ls.is_approved = TRUE 
      ORDER BY ls.start_time DESC
      LIMIT 5
    `);
    
    console.log('📊 Live sessions with images:');
    sessions.rows.forEach(session => {
      console.log(`  - ${session.title} (${session.cover_image || 'no image'})`);
    });
    
    console.log('🎉 Live session image test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testLiveSessionImage(); 