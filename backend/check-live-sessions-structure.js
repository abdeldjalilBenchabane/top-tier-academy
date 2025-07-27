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

async function checkLiveSessionsStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking live_sessions table structure...');
    
    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'live_sessions'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ live_sessions table does not exist!');
      return;
    }
    
    console.log('✅ live_sessions table exists');
    
    // Get all columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current live_sessions table structure:');
    columns.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'not null';
      const defaultValue = row.column_default ? ` (default: ${row.column_default})` : '';
      console.log(`  - ${row.column_name}: ${row.data_type} (${nullable})${defaultValue}`);
    });
    
    console.log(`\n📊 Total columns: ${columns.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkLiveSessionsStructure(); 