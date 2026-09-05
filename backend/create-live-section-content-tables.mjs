import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function createLiveSectionContentTables() {
  try {
    console.log('🔧 Creating live section content tables (sections and blocks)...\n');

    // Read the SQL file
    const sqlFilePath = join(__dirname, 'migrations', 'create-live-section-content-tables.sql');
    const sqlScript = readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL script
    await pool.query(sqlScript);

    console.log('✅ Live section content tables created successfully!');
    console.log('   - live_section_sections');
    console.log('   - live_section_blocks');
    console.log('   - live_section_files');
    console.log('   - Indexes created for performance optimization');

  } catch (error) {
    console.error('❌ Error creating live section content tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createLiveSectionContentTables()
  .then(() => {
    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  });

