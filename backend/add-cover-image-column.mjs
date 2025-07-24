import pool from './db.js';

async function addCoverImageColumn() {
  try {
    console.log('🖼️  Adding cover_image column to live_sessions table...');
    
    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' AND column_name = 'cover_image'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ cover_image column already exists');
      return;
    }
    
    // Add the column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN cover_image VARCHAR(255)
    `);
    
    console.log('✅ cover_image column added successfully!');
  } catch (error) {
    console.error('❌ Error adding cover_image column:', error);
  } finally {
    await pool.end();
  }
}

addCoverImageColumn(); 