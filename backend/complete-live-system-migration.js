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

async function createCompleteLiveSystem() {
  try {
    console.log('🚀 Creating Complete Live System...\n');

    // 1. Create live_sections table
    console.log('📋 Creating live_sections table...');
    await pool.query('DROP TABLE IF EXISTS live_sections CASCADE');
    
    await pool.query(`
      CREATE TABLE live_sections (
        id SERIAL PRIMARY KEY,
        professor_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        cover_image_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
        
        -- Hierarchy fields (for educational structure)
        level_id INTEGER REFERENCES levels(id) ON DELETE SET NULL,
        year_id INTEGER REFERENCES years(id) ON DELETE SET NULL,
        speciality_id INTEGER REFERENCES specialities(id) ON DELETE SET NULL,
        material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
        
        -- Language fields (for language courses)
        language_id INTEGER REFERENCES languages(id) ON DELETE SET NULL,
        language_level_id INTEGER REFERENCES language_levels(id) ON DELETE SET NULL,
        
        -- Root type to distinguish between education and language paths
        root_type VARCHAR(20) CHECK (root_type IN ('education', 'language')),
        
        -- Approval fields
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        rejected_reason TEXT,
        
        -- Live session specific fields
        scheduled_date DATE,
        scheduled_time TIME,
        duration_minutes INTEGER DEFAULT 90,
        
        -- Telegram channel field
        telegram_channel VARCHAR(255),
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ live_sections table created successfully!');

    // 2. Create live_sessions table
    console.log('📋 Creating live_sessions table...');
    await pool.query('DROP TABLE IF EXISTS live_sessions CASCADE');
    
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
    console.log('✅ live_sessions table created successfully!');

    // 3. Create live_section_purchases table
    console.log('📋 Creating live_section_purchases table...');
    await pool.query('DROP TABLE IF EXISTS live_section_purchases CASCADE');
    
    await pool.query(`
      CREATE TABLE live_section_purchases (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        live_section_id INTEGER NOT NULL REFERENCES live_sections(id) ON DELETE CASCADE,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        points_spent INTEGER NOT NULL,
        UNIQUE(student_id, live_section_id)
      );
    `);
    console.log('✅ live_section_purchases table created successfully!');

    // 4. Create indexes for better performance
    console.log('🔍 Creating indexes...');

    // live_sections indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sections_professor_id ON live_sections(professor_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sections_status ON live_sections(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sections_created_at ON live_sections(created_at);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sections_root_type ON live_sections(root_type);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sections_material_id ON live_sections(material_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sections_language_id ON live_sections(language_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sections_scheduled_date ON live_sections(scheduled_date);`);

    // live_sessions indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sessions_professor_id ON live_sessions(professor_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sessions_section_id ON live_sessions(section_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sessions_start_time ON live_sessions(start_time);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sessions_is_approved ON live_sessions(is_approved);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_sessions_material_id ON live_sessions(material_id);`);

    // live_section_purchases indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_section_purchases_student ON live_section_purchases(student_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_section_purchases_section ON live_section_purchases(live_section_id);`);

    console.log('✅ All indexes created successfully!');

    // 5. Create triggers for updated_at timestamps
    console.log('⚡ Creating triggers...');

    // Function for live_sections
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_live_sections_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_update_live_sections_updated_at ON live_sections;
    `);

    await pool.query(`
      CREATE TRIGGER trigger_update_live_sections_updated_at
        BEFORE UPDATE ON live_sections
        FOR EACH ROW
        EXECUTE FUNCTION update_live_sections_updated_at();
    `);

    // Function for live_sessions
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
      DROP TRIGGER IF EXISTS trigger_update_live_sessions_updated_at ON live_sessions;
    `);

    await pool.query(`
      CREATE TRIGGER trigger_update_live_sessions_updated_at
        BEFORE UPDATE ON live_sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_live_sessions_updated_at();
    `);

    console.log('✅ All triggers created successfully!');

    // 6. Show table structures
    console.log('\n📋 Live Sections Table Structure:');
    const sectionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'live_sections'
      ORDER BY ordinal_position
    `);
    
    sectionsStructure.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'not null';
      const defaultValue = row.column_default ? ` (default: ${row.column_default})` : '';
      console.log(`  - ${row.column_name}: ${row.data_type} (${nullable})${defaultValue}`);
    });

    console.log('\n📋 Live Sessions Table Structure:');
    const sessionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions'
      ORDER BY ordinal_position
    `);
    
    sessionsStructure.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'not null';
      const defaultValue = row.column_default ? ` (default: ${row.column_default})` : '';
      console.log(`  - ${row.column_name}: ${row.data_type} (${nullable})${defaultValue}`);
    });

    console.log('\n📋 Live Section Purchases Table Structure:');
    const purchasesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'live_section_purchases'
      ORDER BY ordinal_position
    `);
    
    purchasesStructure.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'not null';
      const defaultValue = row.column_default ? ` (default: ${row.column_default})` : '';
      console.log(`  - ${row.column_name}: ${row.data_type} (${nullable})${defaultValue}`);
    });

    console.log('\n🎉 Complete Live System Setup Completed!');
    console.log('\n📝 System includes:');
    console.log('  ✅ Live Sections (container for multiple sessions)');
    console.log('  ✅ Live Sessions (individual streaming events)');
    console.log('  ✅ Purchase tracking (student purchases)');
    console.log('  ✅ Educational hierarchy support');
    console.log('  ✅ Language course support');
    console.log('  ✅ Approval workflow');
    console.log('  ✅ Telegram channel integration');
    console.log('  ✅ Cover image support');
    console.log('  ✅ Streaming integration (Agora)');
    console.log('  ✅ Recording support');
    console.log('  ✅ Performance indexes');
    console.log('  ✅ Automatic timestamps');

  } catch (error) {
    console.error('❌ Error creating complete live system:', error);
  } finally {
    await pool.end();
  }
}

createCompleteLiveSystem(); 