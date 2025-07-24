import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixLiveSessions() {
  try {
    console.log('🔧 Fixing live_sessions table...\n');

    // Check if cover_image column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' AND column_name = 'cover_image'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('📝 Adding cover_image column...');
      await pool.query('ALTER TABLE live_sessions ADD COLUMN cover_image VARCHAR(500);');
      console.log('✅ cover_image column added successfully');
    } else {
      console.log('ℹ️  cover_image column already exists');
    }

    // Check table structure
    console.log('\n📋 Current live_sessions table structure:');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' 
      ORDER BY ordinal_position;
    `);
    
    structureResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Test inserting a simple live session
    console.log('\n🧪 Testing live session creation...');
    const professorResult = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['professor']);
    
    if (professorResult.rows.length > 0) {
      const professorId = professorResult.rows[0].id;
      
      const testResult = await pool.query(`
        INSERT INTO live_sessions (professor_id, title, description, start_time, duration, price, is_approved) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id, title
      `, [
        professorId, 
        'Test Session', 
        'Test description', 
        new Date(Date.now() + 1 * 60 * 60 * 1000), 
        60, 
        100, 
        true
      ]);
      
      console.log('✅ Test live session created:', testResult.rows[0]);
      
      // Clean up test data
      await pool.query('DELETE FROM live_sessions WHERE title = $1', ['Test Session']);
      console.log('🧹 Test data cleaned up');
    } else {
      console.log('⚠️  No professor found for testing');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixLiveSessions(); 