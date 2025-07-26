const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Running migration: Add updated_at to live_sessions...');
    
    // Add updated_at column
    await client.query(`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
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