import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
};

const pool = new Pool(dbConfig);

async function addTelegramChannelToLiveSections() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding telegram_channel field to live_sections table...');
    
    // Add telegram_channel column
    await client.query(`
      ALTER TABLE live_sections 
      ADD COLUMN IF NOT EXISTS telegram_channel VARCHAR(255)
    `);
    
    console.log('✅ Successfully added telegram_channel field to live_sections table');
    
    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'live_sections' AND column_name = 'telegram_channel'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verification successful: telegram_channel column exists');
      console.log('   Column details:', result.rows[0]);
    } else {
      console.log('❌ Verification failed: telegram_channel column not found');
    }
    
  } catch (error) {
    console.error('❌ Error adding telegram_channel field:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addTelegramChannelToLiveSections()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }); 