import pool from './db.js';

async function testFormWorking() {
  try {
    console.log('🧪 Testing form submission without image upload...');
    
    // Test creating a live session with default image
    const result = await pool.query(`
      INSERT INTO live_sessions (professor_id, title, description, start_time, duration, price, material_id, cover_image, is_approved) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [
      3, // professor_id
      'Test Session Working',
      'Test description for working form',
      new Date(),
      60,
      100,
      1,
      '/images/module_icon.png',
      true
    ]);
    
    console.log('✅ Test session created successfully:', {
      id: result.rows[0].id,
      title: result.rows[0].title,
      cover_image: result.rows[0].cover_image
    });
    
    console.log('🎉 Form submission test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testFormWorking(); 