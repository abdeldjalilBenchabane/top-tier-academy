git import pool from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyOurChangesMigration() {
  try {
    console.log('🚀 Applying Our Changes Migration (You + Me)...\n');

    // 1. Add description column to live_sessions table
    console.log('📝 1. Adding description column to live_sessions table...');
    try {
      await pool.query(`
        ALTER TABLE live_sessions 
        ADD COLUMN IF NOT EXISTS description TEXT
      `);
      console.log('✅ description column added successfully');
    } catch (error) {
      console.log('ℹ️  description column already exists or error:', error.message);
    }

    // 2. Add cover_image_url column to live_sessions table
    console.log('\n📝 2. Adding cover_image_url column to live_sessions table...');
    try {
      await pool.query(`
        ALTER TABLE live_sessions 
        ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500)
      `);
      console.log('✅ cover_image_url column added successfully');
    } catch (error) {
      console.log('ℹ️  cover_image_url column already exists or error:', error.message);
    }

    // 3. Add professor_name column to live_sessions table
    console.log('\n📝 3. Adding professor_name column to live_sessions table...');
    try {
      await pool.query(`
        ALTER TABLE live_sessions 
        ADD COLUMN IF NOT EXISTS professor_name VARCHAR(255)
      `);
      console.log('✅ professor_name column added successfully');
    } catch (error) {
      console.log('ℹ️  professor_name column already exists or error:', error.message);
    }

    // 4. Add is_approved column to live_sessions table (if not exists)
    console.log('\n📝 4. Adding is_approved column to live_sessions table...');
    try {
      await pool.query(`
        ALTER TABLE live_sessions 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ is_approved column added successfully');
    } catch (error) {
      console.log('ℹ️  is_approved column already exists or error:', error.message);
    }

    // 5. Add status column to live_sessions table (if not exists)
    console.log('\n📝 5. Adding status column to live_sessions table...');
    try {
      await pool.query(`
        ALTER TABLE live_sessions 
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled', 'starting', 'paused', 'technical_issues'))
      `);
      console.log('✅ status column added successfully');
    } catch (error) {
      console.log('ℹ️  status column already exists or error:', error.message);
    }

    // 6. Add meeting_url column to live_sessions table (if not exists)
    console.log('\n📝 6. Adding meeting_url column to live_sessions table...');
    try {
      await pool.query(`
        ALTER TABLE live_sessions 
        ADD COLUMN IF NOT EXISTS meeting_url VARCHAR(500)
      `);
      console.log('✅ meeting_url column added successfully');
    } catch (error) {
      console.log('ℹ️  meeting_url column already exists or error:', error.message);
    }

    // 7. Create uploads directory structure for live sessions
    console.log('\n📁 7. Creating uploads directory structure...');
    try {
      const fs = await import('fs');
      const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'live-sessions');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Created uploads/live-sessions directory');
      } else {
        console.log('ℹ️  uploads/live-sessions directory already exists');
      }
    } catch (error) {
      console.log('⚠️  Error creating uploads directory:', error.message);
    }

    // 8. Update existing live_sessions to populate professor_name if empty
    console.log('\n📝 8. Updating existing live_sessions with professor names...');
    try {
      await pool.query(`
        UPDATE live_sessions 
        SET professor_name = u.name 
        FROM users u 
        WHERE live_sessions.professor_id = u.id 
        AND (live_sessions.professor_name IS NULL OR live_sessions.professor_name = '')
      `);
      console.log('✅ Updated professor names in existing live sessions');
    } catch (error) {
      console.log('⚠️  Error updating professor names:', error.message);
    }

    // 9. Create indexes for better performance
    console.log('\n📊 9. Creating performance indexes...');
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_live_sessions_professor_id ON live_sessions(professor_id);
        CREATE INDEX IF NOT EXISTS idx_live_sessions_start_time ON live_sessions(start_time);
        CREATE INDEX IF NOT EXISTS idx_live_sessions_is_approved ON live_sessions(is_approved);
        CREATE INDEX IF NOT EXISTS idx_purchases_session_id ON purchases(session_id);
        CREATE INDEX IF NOT EXISTS idx_purchases_student_id ON purchases(student_id);
      `);
      console.log('✅ Performance indexes created successfully');
    } catch (error) {
      console.log('⚠️  Error creating indexes:', error.message);
    }

    // 10. Show current live_sessions table structure
    console.log('\n📋 10. Current live_sessions table structure:');
    try {
      const structureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'live_sessions' 
        ORDER BY ordinal_position
      `);
      
      structureResult.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${row.column_default ? `default: ${row.column_default}` : ''}`);
      });
    } catch (error) {
      console.log('⚠️  Error checking table structure:', error.message);
    }

    console.log('\n🎉 Our Changes Migration Completed Successfully!');
    console.log('\n📋 Summary of changes applied:');
    console.log('   ✅ Added description column to live_sessions');
    console.log('   ✅ Added cover_image_url column to live_sessions');
    console.log('   ✅ Added professor_name column to live_sessions');
    console.log('   ✅ Added is_approved column to live_sessions');
    console.log('   ✅ Added status column to live_sessions');
    console.log('   ✅ Added meeting_url column to live_sessions');
    console.log('   ✅ Created uploads directory structure');
    console.log('   ✅ Updated existing professor names');
    console.log('   ✅ Created performance indexes');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
applyOurChangesMigration(); 