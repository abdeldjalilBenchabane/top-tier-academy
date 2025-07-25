import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
});

async function createLiveSectionsTable() {
  try {
    console.log('🔧 Creating live_sections table...');

    // Create live_sections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS live_sections (
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
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ live_sections table created successfully!');

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sections_professor_id 
      ON live_sections(professor_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sections_status 
      ON live_sections(status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sections_created_at 
      ON live_sections(created_at);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sections_root_type 
      ON live_sections(root_type);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sections_material_id 
      ON live_sections(material_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_sections_language_id 
      ON live_sections(language_id);
    `);

    console.log('✅ Indexes created successfully!');

    // Create trigger to update updated_at timestamp
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
      DROP TRIGGER IF EXISTS trigger_update_live_sections_updated_at 
      ON live_sections;
    `);

    await pool.query(`
      CREATE TRIGGER trigger_update_live_sections_updated_at
        BEFORE UPDATE ON live_sections
        FOR EACH ROW
        EXECUTE FUNCTION update_live_sections_updated_at();
    `);

    console.log('✅ Trigger created successfully!');

    console.log('🎉 Live sections table setup completed!');

  } catch (error) {
    console.error('❌ Error creating live_sections table:', error);
  } finally {
    await pool.end();
  }
}

createLiveSectionsTable(); 