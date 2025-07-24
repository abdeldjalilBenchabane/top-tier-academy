import pool from './db.js';

async function addEndedColumns() {
  try {
    console.log('🔧 Adding ended columns to live_sessions table...');
    
    // Add is_ended column if it doesn't exist
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS is_ended BOOLEAN DEFAULT FALSE
    `);
    
    // Add ended_at column if it doesn't exist
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP
    `);
    
    console.log('✅ Successfully added ended columns to live_sessions table');
    
    // Show current table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Current live_sessions table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding ended columns:', error);
  } finally {
    await pool.end();
  }
}

addEndedColumns(); 