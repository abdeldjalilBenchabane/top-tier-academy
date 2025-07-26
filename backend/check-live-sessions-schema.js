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

async function checkLiveSessionsSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking live_sessions table schema...');
    
    // Get table structure
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Live sessions table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if start_time column exists
    const startTimeExists = structureResult.rows.some(row => row.column_name === 'start_time');
    console.log(`\n✅ start_time column exists: ${startTimeExists}`);
    
    // Check if duration column exists
    const durationExists = structureResult.rows.some(row => row.column_name === 'duration');
    console.log(`✅ duration column exists: ${durationExists}`);
    
    // Show some sample data
    const sampleData = await client.query(`
      SELECT id, title, start_time, duration, section_id 
      FROM live_sessions 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('\n📊 Sample live sessions data:');
    sampleData.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Title: ${row.title}, Start Time: ${row.start_time}, Duration: ${row.duration}, Section ID: ${row.section_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkLiveSessionsSchema()
  .then(() => {
    console.log('🎉 Schema check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema check failed:', error);
    process.exit(1);
  }); 