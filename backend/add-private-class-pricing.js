import pool from './db.js';

const addPrivateClassPricing = async () => {
  const client = await pool.connect();
  try {
    console.log('🚀 Adding private class pricing and duration fields...');
    
    // Add pricing and duration fields to private_class_requests table
    await client.query(`
      ALTER TABLE private_class_requests 
      ADD COLUMN IF NOT EXISTS price_per_session NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 60
    `);
    
    // Create private_class_settings table for admin configuration
    await client.query(`
      CREATE TABLE IF NOT EXISTS private_class_settings (
        id SERIAL PRIMARY KEY,
        price_per_session NUMERIC(10,2) NOT NULL DEFAULT 0,
        session_duration INTEGER NOT NULL DEFAULT 60,
        available_start_time TIME DEFAULT '08:00:00',
        available_end_time TIME DEFAULT '23:00:00',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default settings if table is empty
    const settingsCount = await client.query('SELECT COUNT(*) FROM private_class_settings');
    if (parseInt(settingsCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO private_class_settings (price_per_session, session_duration, available_start_time, available_end_time)
        VALUES (1000, 60, '08:00:00', '23:00:00')
      `);
    }
    
    console.log('🎉 Private class pricing and duration fields added successfully!');
  } catch (err) {
    console.error('❌ Error adding private class pricing fields:', err);
  } finally {
    client.release();
    process.exit();
  }
};

addPrivateClassPricing(); 