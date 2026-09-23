import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;

dotenv.config();

// Use the same database configuration as db.js
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function createUserSessionsTable() {
  try {
    console.log('🔧 Creating user_sessions table for single-session authentication...');
    console.log(`📡 Connecting to database: ${process.env.DB_NAME || 'tth_database'} as ${process.env.DB_USER || 'postgres'}`);
    
    // Create the user_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        device_info TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    
    console.log('✅ Successfully created user_sessions table');
    
    // Create indexes for better performance
    console.log('🔧 Creating indexes...');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active)
    `);
    
    console.log('✅ Successfully created indexes');
    
    // Show current table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'user_sessions' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 User sessions table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });
    
    console.log('\n✅ Single-session authentication is now enabled!');
    console.log('📝 Next step: Restart your backend server (pm2 restart all)');
    
  } catch (error) {
    console.error('❌ Error creating user_sessions table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createUserSessionsTable();

