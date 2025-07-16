import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateCourseFiles() {
  try {
    console.log('Starting course files migration...');

    // Create upload directories
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const coursesDir = path.join(uploadsDir, 'courses');
    const coversDir = path.join(coursesDir, 'covers');
    const contentDir = path.join(coursesDir, 'content');

    // Create directories if they don't exist
    [uploadsDir, coursesDir, coversDir, contentDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });

    // Create course_covers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_covers (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        cover VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(course_id)
      );
    `);
    console.log('Created course_covers table');

    // Create course_files table for content files
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_files (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        section_id INTEGER REFERENCES course_sections(id) ON DELETE CASCADE,
        block_id INTEGER REFERENCES section_blocks(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INTEGER,
        original_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created course_files table');

    // Add indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_course_covers_course_id ON course_covers(course_id);
      CREATE INDEX IF NOT EXISTS idx_course_files_course_id ON course_files(course_id);
      CREATE INDEX IF NOT EXISTS idx_course_files_section_id ON course_files(section_id);
      CREATE INDEX IF NOT EXISTS idx_course_files_block_id ON course_files(block_id);
    `);
    console.log('Created indexes');

    // Add status column to courses table if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='status') THEN
          ALTER TABLE courses ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';
        END IF;
      END$$;
    `);
    console.log('Added status column to courses table (if not exists)');

    // Change default value of status column to 'draft'
    await pool.query(`
      ALTER TABLE courses ALTER COLUMN status SET DEFAULT 'draft';
    `);
    console.log('Changed default value of status column in courses table to draft');

    console.log('Course files migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateCourseFiles().catch(console.error); 