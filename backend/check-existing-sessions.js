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

async function checkExistingSessions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking existing live sessions...');
    
    // Check sessions for section 10
    const result = await client.query(`
      SELECT 
        id, 
        title, 
        description, 
        start_time, 
        duration, 
        section_id,
        created_at
      FROM live_sessions 
      WHERE section_id = 10
      ORDER BY created_at DESC
    `);
    
    console.log('\n📊 Sessions for section 10:');
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Session ID: ${row.id}`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Description: ${row.description}`);
      console.log(`   Start Time: ${row.start_time} (type: ${typeof row.start_time})`);
      console.log(`   Duration: ${row.duration} minutes`);
      console.log(`   Section ID: ${row.section_id}`);
      console.log(`   Created: ${row.created_at}`);
    });
    
    // Check all recent sessions
    const allSessions = await client.query(`
      SELECT 
        id, 
        title, 
        start_time, 
        section_id,
        created_at
      FROM live_sessions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📊 Recent live sessions:');
    allSessions.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Session ID: ${row.id}`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Start Time: ${row.start_time} (type: ${typeof row.start_time})`);
      console.log(`   Section ID: ${row.section_id}`);
      console.log(`   Created: ${row.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkExistingSessions()
  .then(() => {
    console.log('🎉 Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }); 