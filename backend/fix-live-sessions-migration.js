import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Database configuration (same as db.js)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000,
};

const pool = new Pool(dbConfig);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Running migration: Add updated_at to live_sessions...');
    
    // Add updated_at column
    await client.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✅ Added updated_at column');
    
    // Create or replace the update function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('✅ Created update function');
    
    // Create trigger (drop if exists first)
    await client.query(`
      DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions
    `);
    
    await client.query(`
      CREATE TRIGGER update_live_sessions_updated_at
        BEFORE UPDATE ON live_sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Created trigger');
    
    // Update existing records to have updated_at = created_at
    await client.query(`
      UPDATE live_sessions 
      SET updated_at = created_at 
      WHERE updated_at IS NULL
    `);
    console.log('✅ Updated existing records');
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ live_sessions table now has updated_at column with auto-update trigger');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('🎉 Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  }); 