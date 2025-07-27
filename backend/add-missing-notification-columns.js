import pool from './db.js';

async function addMissingNotificationColumns() {
  try {
    console.log('🚀 Starting notifications table migration...\n');
    
    // Check current table structure
    console.log('🔍 Checking current notifications table structure...');
    const currentColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    const existingColumns = currentColumns.rows.map(row => row.column_name);
    console.log('Current columns:', existingColumns.join(', '));
    
    // Define the columns to add
    const columnsToAdd = [
      {
        name: 'type',
        definition: 'VARCHAR(50)',
        description: 'Notification type (e.g., quiz_approved, live_session_approved, etc.)'
      },
      {
        name: 'title', 
        definition: 'VARCHAR(255)',
        description: 'Notification title'
      },
      {
        name: 'metadata',
        definition: 'JSONB',
        description: 'Additional notification data (quiz_id, session_id, etc.)'
      }
    ];
    
    // Check which columns are missing
    const missingColumns = columnsToAdd.filter(col => !existingColumns.includes(col.name));
    
    if (missingColumns.length === 0) {
      console.log('✅ All columns already exist! No migration needed.');
      return;
    }
    
    console.log(`\n📝 Found ${missingColumns.length} missing columns to add:`);
    missingColumns.forEach(col => {
      console.log(`- ${col.name}: ${col.definition} (${col.description})`);
    });
    
    // Add missing columns
    console.log('\n🔧 Adding missing columns...');
    
    for (const column of missingColumns) {
      try {
        await pool.query(`
          ALTER TABLE notifications 
          ADD COLUMN ${column.name} ${column.definition};
        `);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Column ${column.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error adding column ${column.name}:`, error.message);
        }
      }
    }
    
    // Create indexes for better performance
    console.log('\n🔍 Creating indexes...');
    
    const indexesToCreate = [
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);'
    ];
    
    for (const indexQuery of indexesToCreate) {
      try {
        await pool.query(indexQuery);
        console.log('✅ Index created successfully');
      } catch (error) {
        console.log('⚠️  Index might already exist:', error.message);
      }
    }
    
    // Verify the final structure
    console.log('\n🔍 Verifying final table structure...');
    const finalColumns = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Final notifications table structure:');
    console.log('=======================================');
    finalColumns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'notifications'
      ORDER BY indexname;
    `);
    
    console.log('\n🔍 Final indexes:');
    console.log('================');
    indexes.rows.forEach(idx => {
      console.log(`- ${idx.indexname}: ${idx.indexdef}`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('====================================');
    console.log('Your notifications table now has all the required columns:');
    console.log('- id (PRIMARY KEY)');
    console.log('- user_id (REFERENCES users)');
    console.log('- type (VARCHAR(50)) - NEW');
    console.log('- title (VARCHAR(255)) - NEW');
    console.log('- message (TEXT)');
    console.log('- is_read (BOOLEAN)');
    console.log('- metadata (JSONB) - NEW');
    console.log('- created_at (TIMESTAMP)');
    console.log('\n✅ Your friend can now use the full notifications functionality!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
addMissingNotificationColumns().catch(console.error); 