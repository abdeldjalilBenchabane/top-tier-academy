import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
});

async function checkTelegramField() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking telegram_channel field in live_sessions table...');
    
    // Check if telegram_channel column exists
    const columnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' 
      AND column_name = 'telegram_channel'
    `);
    
    if (columnExists.rows.length > 0) {
      console.log('✅ telegram_channel field exists in live_sessions table');
      
      // Get the column details
      const columnDetails = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'live_sessions' 
        AND column_name = 'telegram_channel'
      `);
      
      const column = columnDetails.rows[0];
      console.log('📋 Column details:', {
        name: column.column_name,
        type: column.data_type,
        nullable: column.is_nullable,
        default: column.column_default
      });
    } else {
      console.log('❌ telegram_channel field does NOT exist in live_sessions table');
      console.log('🔧 Adding telegram_channel field...');
      
      // Add the telegram_channel field
      await client.query(`
        ALTER TABLE live_sessions 
        ADD COLUMN telegram_channel TEXT
      `);
      
      console.log('✅ Added telegram_channel field to live_sessions table');
    }
    
  } catch (error) {
    console.error('❌ Error checking telegram field:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTelegramField(); 