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

async function addSectionIdToLiveSessions() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding section_id column to live_sessions table...');
    
    // Add section_id column if it doesn't exist
    await client.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES live_sections(id) ON DELETE CASCADE
    `);
    
    console.log('✅ Added section_id column to live_sessions table');
    
    // Show the updated table structure
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated live_sessions table structure:');
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

addSectionIdToLiveSessions()
  .then(() => {
    console.log('🎉 Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }); 