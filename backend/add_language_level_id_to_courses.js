import pool from './db.js';

async function addLanguageLevelIdToCourses() {
  try {
    console.log('Adding language_level_id column to courses table...');
    // Add the column only if it does not exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='courses' AND column_name='language_level_id'
        ) THEN
          ALTER TABLE courses ADD COLUMN language_level_id INTEGER;
        END IF;
      END$$;
    `);
    // Optionally add a foreign key constraint if language_levels table exists
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'language_levels') THEN
          BEGIN
            ALTER TABLE courses
            ADD CONSTRAINT fk_language_level_id FOREIGN KEY (language_level_id) REFERENCES language_levels(id) ON DELETE SET NULL;
          EXCEPTION WHEN duplicate_object THEN NULL; END;
        END IF;
      END$$;
    `);
    console.log('Migration completed: language_level_id column added.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addLanguageLevelIdToCourses();