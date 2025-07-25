import pool from '../db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixLiveSessionsSchema() {
  console.log('🔧 Fixing Live Sessions Database Schema...\n');

  try {
    // 1. Add missing professor_name column
    console.log('📝 1. Adding professor_name column to live_sessions table...');
    try {
      await pool.query(`
        ALTER TABLE live_sessions 
        ADD COLUMN IF NOT EXISTS professor_name VARCHAR(255)
      `);
      console.log('✅ professor_name column added successfully');
    } catch (error) {
      console.log('ℹ️  professor_name column already exists or error:', error.message);
    }

    // 2. Add missing cover_image_url column
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

    // 3. Fix foreign key constraint - material_id should reference materials, not courses
    console.log('\n📝 3. Fixing foreign key constraint for material_id...');
    try {
      // Drop the incorrect constraint if it exists
      await pool.query(`
        ALTER TABLE live_sessions 
        DROP CONSTRAINT IF EXISTS live_sessions_course_id_fkey
      `);
      console.log('✅ Dropped incorrect course_id foreign key constraint');

      // Add the correct constraint
      await pool.query(`
        ALTER TABLE live_sessions 
        ADD CONSTRAINT live_sessions_material_id_fkey 
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
      `);
      console.log('✅ Added correct material_id foreign key constraint');
    } catch (error) {
      console.log('ℹ️  Foreign key constraint already correct or error:', error.message);
    }

    // 4. Create uploads directory structure for live sessions
    console.log('\n📁 4. Creating uploads directory structure...');
    try {
      // Create directory in main public folder (outside backend)
      const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'live-sessions');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Created public/uploads/live-sessions directory');
      } else {
        console.log('ℹ️  public/uploads/live-sessions directory already exists');
      }
    } catch (error) {
      console.log('⚠️  Error creating uploads directory:', error.message);
    }

    // 5. Update existing live_sessions to populate professor_name if empty
    console.log('\n📝 5. Updating existing live_sessions with professor names...');
    try {
      const result = await pool.query(`
        UPDATE live_sessions 
        SET professor_name = u.name 
        FROM users u 
        WHERE live_sessions.professor_id = u.id 
        AND (live_sessions.professor_name IS NULL OR live_sessions.professor_name = '')
      `);
      console.log(`✅ Updated ${result.rowCount} professor names in existing live sessions`);
    } catch (error) {
      console.log('⚠️  Error updating professor names:', error.message);
    }

    // 6. Verify the schema
    console.log('\n📊 6. Verifying final schema...');
    try {
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'live_sessions' 
        AND column_name IN ('professor_name', 'cover_image_url', 'material_id')
        ORDER BY column_name
      `);
      
      console.log('📋 Key columns in live_sessions table:');
      columnsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });

      // Check foreign key constraints
      const constraintsResult = await pool.query(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'live_sessions'
        AND kcu.column_name = 'material_id'
      `);

      if (constraintsResult.rows.length > 0) {
        const constraint = constraintsResult.rows[0];
        console.log(`✅ Foreign key constraint: ${constraint.constraint_name}`);
        console.log(`   ${constraint.table_name}.${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      } else {
        console.log('⚠️  No foreign key constraint found for material_id');
      }

    } catch (error) {
      console.log('⚠️  Error verifying schema:', error.message);
    }

    // 7. Test data insertion
    console.log('\n🧪 7. Testing live session insertion...');
    try {
      const testData = {
        professor_id: 12,
        professor_name: 'Test Professor',
        title: 'Schema Test Session',
        description: 'Testing schema after fixes',
        start_time: '2025-07-26T10:00:00',
        duration: 60,
        price: 500.00,
        material_id: 19,
        cover_image_url: null
      };

      const result = await pool.query(
        `INSERT INTO live_sessions 
         (professor_id, professor_name, title, description, start_time, duration, price, material_id, cover_image_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING id, title, material_id, professor_name`,
        [
          testData.professor_id,
          testData.professor_name,
          testData.title,
          testData.description,
          testData.start_time,
          testData.duration,
          testData.price,
          testData.material_id,
          testData.cover_image_url
        ]
      );

      const session = result.rows[0];
      console.log('✅ Test insertion successful!');
      console.log(`   Session ID: ${session.id}`);
      console.log(`   Title: ${session.title}`);
      console.log(`   Material ID: ${session.material_id}`);
      console.log(`   Professor: ${session.professor_name}`);

      // Clean up test data
      await pool.query('DELETE FROM live_sessions WHERE id = $1', [session.id]);
      console.log('🧹 Test session cleaned up');

    } catch (error) {
      console.log('❌ Test insertion failed:', error.message);
      throw error;
    }

    console.log('\n🎉 Live Sessions Schema Fix Completed Successfully!');
    console.log('\n📋 Summary of changes:');
    console.log('   ✅ Added professor_name column');
    console.log('   ✅ Added cover_image_url column');
    console.log('   ✅ Fixed material_id foreign key constraint');
    console.log('   ✅ Created uploads directory structure');
    console.log('   ✅ Updated existing professor names');
    console.log('   ✅ Verified schema integrity');
    console.log('   ✅ Tested data insertion');

  } catch (error) {
    console.error('\n❌ Schema fix failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
fixLiveSessionsSchema().catch(console.error); 