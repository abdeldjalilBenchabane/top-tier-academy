import pool from './db.js';

const sampleImages = [
  '/images/module_icon.png',
  '/images/img_image_16.png',
  '/images/time_icon.png'
];

async function addSampleCoverImages() {
  try {
    console.log('🖼️  Adding sample cover images to live sessions...');
    
    // Get all live sessions without cover images
    const result = await pool.query(`
      SELECT id, title FROM live_sessions 
      WHERE cover_image_url IS NULL OR cover_image_url = ''
    `);
    
    console.log(`📊 Found ${result.rows.length} live sessions without cover images`);
    
    for (let i = 0; i < result.rows.length; i++) {
      const session = result.rows[i];
      const randomImage = sampleImages[i % sampleImages.length];
      
      await pool.query(
        'UPDATE live_sessions SET cover_image_url = $1 WHERE id = $2',
        [randomImage, session.id]
      );
      
      console.log(`✅ Added cover image to session "${session.title}": ${randomImage}`);
    }
    
    console.log('🎉 All sample cover images added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample cover images:', error);
  } finally {
    await pool.end();
  }
}

addSampleCoverImages(); 