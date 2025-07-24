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

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to live_sessions table...\n');

    // Add description column
    try {
      await pool.query('ALTER TABLE live_sessions ADD COLUMN description TEXT;');
      console.log('✅ Added description column');
    } catch (error) {
      if (error.code === '42701') {
        console.log('ℹ️  description column already exists');
      } else {
        console.error('❌ Error adding description column:', error.message);
      }
    }

    // Add material_id column
    try {
      await pool.query('ALTER TABLE live_sessions ADD COLUMN material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL;');
      console.log('✅ Added material_id column');
    } catch (error) {
      if (error.code === '42701') {
        console.log('ℹ️  material_id column already exists');
      } else {
        console.error('❌ Error adding material_id column:', error.message);
      }
    }

    // Check table structure
    console.log('\n📋 Current table structure:');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' 
      ORDER BY ordinal_position;
    `);
    
    structureResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addMissingColumns(); 