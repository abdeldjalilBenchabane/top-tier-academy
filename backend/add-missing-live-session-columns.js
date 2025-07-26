import pool from './db.js';

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to live_sessions table...');

  try {
    // Add is_approved column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added is_approved column');

    // Add approved_by column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('✅ Added approved_by column');

    // Add approved_at column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP
    `);
    console.log('✅ Added approved_at column');

    // Add status column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled' 
      CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled', 'starting', 'paused', 'technical_issues'))
    `);
    console.log('✅ Added status column');

    // Add attendees_count column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS attendees_count INTEGER DEFAULT 0
    `);
    console.log('✅ Added attendees_count column');

    // Add max_attendees column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS max_attendees INTEGER DEFAULT 100
    `);
    console.log('✅ Added max_attendees column');

    // Add recording_url column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS recording_url VARCHAR(500)
    `);
    console.log('✅ Added recording_url column');

    // Add is_recorded column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS is_recorded BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added is_recorded column');

    // Add meeting_url column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS meeting_url VARCHAR(500)
    `);
    console.log('✅ Added meeting_url column');

    // Add agora_channel column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS agora_channel VARCHAR(100)
    `);
    console.log('✅ Added agora_channel column');

    // Add agora_token column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS agora_token TEXT
    `);
    console.log('✅ Added agora_token column');

    // Add description column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS description TEXT
    `);
    console.log('✅ Added description column');

    // Add tags column
    await pool.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS tags TEXT[]
    `);
    console.log('✅ Added tags column');

    console.log('🎉 All missing columns added successfully!');

  } catch (error) {
    console.error('❌ Error adding columns:', error);
  } finally {
    await pool.end();
  }
}

addMissingColumns(); 