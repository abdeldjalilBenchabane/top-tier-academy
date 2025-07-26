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

async function createCompleteLiveSessionsTable() {
  try {
    console.log('🔧 Creating complete live_sessions table...');

    // Drop existing table if it exists (be careful with this in production!)
    await pool.query('DROP TABLE IF EXISTS live_sessions CASCADE');
    console.log('🗑️  Dropped existing live_sessions table');

    // Create the complete live_sessions table with all columns
    await pool.query(`
      CREATE TABLE live_sessions (
        id SERIAL PRIMARY KEY,
        professor_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        professor_name VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
        cover_image_url VARCHAR(500),
        section_id INTEGER REFERENCES live_sections(id) ON DELETE CASCADE,
        
        -- Status and approval fields
        is_published BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT FALSE,
        is_rejected BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled', 'starting', 'paused', 'technical_issues')),
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        
        -- Meeting and streaming fields
        meeting_url VARCHAR(500),
        agora_channel VARCHAR(100),
        agora_token TEXT,
        
        -- Attendance and recording fields
        attendees_count INTEGER DEFAULT 0,
        max_attendees INTEGER DEFAULT 100,
        recording_url VARCHAR(500),
        is_recorded BOOLEAN DEFAULT FALSE,
        
        -- Additional fields
        tags TEXT[],
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Complete live_sessions table created successfully!');

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sessions_professor_id 
      ON live_sessions(professor_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sessions_section_id 
      ON live_sessions(section_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sessions_start_time 
      ON live_sessions(start_time);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sessions_status 
      ON live_sessions(status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sessions_is_approved 
      ON live_sessions(is_approved);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sessions_material_id 
      ON live_sessions(material_id);
    `);

    console.log('✅ Indexes created successfully!');

    // Create trigger to update updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_live_sessions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_update_live_sessions_updated_at 
      ON live_sessions;
    `);

    await pool.query(`
      CREATE TRIGGER trigger_update_live_sessions_updated_at
        BEFORE UPDATE ON live_sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_live_sessions_updated_at();
    `);

    console.log('✅ Trigger created successfully!');

    // Show the complete table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Complete live_sessions table structure:');
    structureResult.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'not null';
      const defaultValue = row.column_default ? ` (default: ${row.column_default})` : '';
      console.log(`  - ${row.column_name}: ${row.data_type} (${nullable})${defaultValue}`);
    });

    console.log('\n🎉 Complete Live sessions table setup completed!');
    console.log('\n📝 Table includes all features:');
    console.log('  ✅ Basic info (title, description, start_time, duration, price)');
    console.log('  ✅ Professor info (professor_id, professor_name)');
    console.log('  ✅ Material and section relationships');
    console.log('  ✅ Cover image support');
    console.log('  ✅ Approval workflow (is_approved, approved_by, approved_at)');
    console.log('  ✅ Status management (status, is_published, is_rejected)');
    console.log('  ✅ Meeting and streaming (meeting_url, agora_channel, agora_token)');
    console.log('  ✅ Attendance tracking (attendees_count, max_attendees)');
    console.log('  ✅ Recording support (recording_url, is_recorded)');
    console.log('  ✅ Tags and timestamps');

  } catch (error) {
    console.error('❌ Error creating complete live_sessions table:', error);
  } finally {
    await pool.end();
  }
}

createCompleteLiveSessionsTable(); 