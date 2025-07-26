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

async function checkAndFixSectionId() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking if section_id column exists in live_sessions table...');
    
    // Check if section_id column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' 
      AND column_name = 'section_id'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ section_id column does not exist. Adding it...');
      
      // Add section_id column
      await client.query(`
        ALTER TABLE live_sessions 
        ADD COLUMN section_id INTEGER REFERENCES live_sections(id) ON DELETE CASCADE
      `);
      
      console.log('✅ Added section_id column to live_sessions table');
    } else {
      console.log('✅ section_id column already exists');
    }
    
    // Show current table structure
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current live_sessions table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndFixSectionId()
  .then(() => {
    console.log('🎉 Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }); 