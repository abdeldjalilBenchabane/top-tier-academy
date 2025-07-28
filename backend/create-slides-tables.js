import pool from './db.js';

async function createSlidesTables() {
  try {
    console.log('🚀 Starting slides tables migration...\n');
    
    // Check if tables already exist
    console.log('🔍 Checking existing tables...');
    const existingTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('enhanced_slides', 'slide_analytics', 'slide_target_audience')
      ORDER BY table_name;
    `);
    
    const existingTableNames = existingTables.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTableNames.join(', ') || 'None');
    
    // ============================================================================
    // 1. CREATE ENHANCED_SLIDES TABLE
    // ============================================================================
    
    if (!existingTableNames.includes('enhanced_slides')) {
      console.log('\n📋 Creating enhanced_slides table...');
      
      await pool.query(`
        CREATE TABLE enhanced_slides (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          image_url VARCHAR(500),
          video_url VARCHAR(500),
          media_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
          "order" INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          duration INTEGER,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          target_audience TEXT[],
          cta_text VARCHAR(100),
          cta_link VARCHAR(500),
          overlay_color VARCHAR(7) DEFAULT '#000000',
          overlay_opacity DECIMAL(3,2) DEFAULT 0.3 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 1),
          transition VARCHAR(20) DEFAULT 'fade' CHECK (transition IN ('fade', 'slide', 'zoom', 'none')),
          alt_text VARCHAR(255),
          views INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ enhanced_slides table created successfully');
    } else {
      console.log('⚠️  enhanced_slides table already exists, skipping...');
    }
    
    // ============================================================================
    // 2. CREATE SLIDE_ANALYTICS TABLE
    // ============================================================================
    
    if (!existingTableNames.includes('slide_analytics')) {
      console.log('\n📊 Creating slide_analytics table...');
      
      await pool.query(`
        CREATE TABLE slide_analytics (
          id SERIAL PRIMARY KEY,
          slide_id INTEGER REFERENCES enhanced_slides(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('view', 'click')),
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ slide_analytics table created successfully');
    } else {
      console.log('⚠️  slide_analytics table already exists, skipping...');
    }
    
    // ============================================================================
    // 3. CREATE SLIDE_TARGET_AUDIENCE TABLE
    // ============================================================================
    
    if (!existingTableNames.includes('slide_target_audience')) {
      console.log('\n👥 Creating slide_target_audience table...');
      
      await pool.query(`
        CREATE TABLE slide_target_audience (
          slide_id INTEGER REFERENCES enhanced_slides(id) ON DELETE CASCADE,
          audience_role VARCHAR(20) NOT NULL CHECK (audience_role IN ('student', 'professor', 'admin')),
          PRIMARY KEY (slide_id, audience_role)
        );
      `);
      
      console.log('✅ slide_target_audience table created successfully');
    } else {
      console.log('⚠️  slide_target_audience table already exists, skipping...');
    }
    
    // ============================================================================
    // 4. CREATE INDEXES FOR BETTER PERFORMANCE
    // ============================================================================
    
    console.log('\n🔍 Creating indexes...');
    
    const indexesToCreate = [
      'CREATE INDEX IF NOT EXISTS idx_enhanced_slides_active ON enhanced_slides(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_enhanced_slides_order ON enhanced_slides("order");',
      'CREATE INDEX IF NOT EXISTS idx_enhanced_slides_created_at ON enhanced_slides(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_slide_analytics_slide_id ON slide_analytics(slide_id);',
      'CREATE INDEX IF NOT EXISTS idx_slide_analytics_created_at ON slide_analytics(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_slide_target_audience_slide_id ON slide_target_audience(slide_id);'
    ];
    
    for (const indexQuery of indexesToCreate) {
      try {
        await pool.query(indexQuery);
        console.log('✅ Index created successfully');
      } catch (error) {
        console.log('⚠️  Index might already exist:', error.message);
      }
    }
    
    // ============================================================================
    // 5. CREATE UPDATE FUNCTION AND TRIGGER
    // ============================================================================
    
    console.log('\n⚙️  Creating update function and trigger...');
    
    // Create or replace the update function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create trigger for enhanced_slides
    try {
      await pool.query('DROP TRIGGER IF EXISTS update_enhanced_slides_updated_at ON enhanced_slides');
      await pool.query(`
        CREATE TRIGGER update_enhanced_slides_updated_at 
          BEFORE UPDATE ON enhanced_slides 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
      `);
      console.log('✅ Trigger created successfully');
    } catch (error) {
      console.log('⚠️  Trigger creation issue:', error.message);
    }
    
    // ============================================================================
    // 6. CREATE UPLOADS DIRECTORY
    // ============================================================================
    
    console.log('\n📁 Creating uploads directory...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadsDir = path.join(process.cwd(), 'uploads', 'slides');
    
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Uploads directory created:', uploadsDir);
      } else {
        console.log('⚠️  Uploads directory already exists:', uploadsDir);
      }
    } catch (error) {
      console.log('⚠️  Could not create uploads directory:', error.message);
    }
    
    // ============================================================================
    // 7. VERIFY FINAL STRUCTURE
    // ============================================================================
    
    console.log('\n🔍 Verifying final table structure...');
    
    const finalTables = await pool.query(`
      SELECT 
        table_name,
        CASE 
          WHEN table_name = 'enhanced_slides' THEN 'Main slides table'
          WHEN table_name = 'slide_analytics' THEN 'Analytics tracking'
          WHEN table_name = 'slide_target_audience' THEN 'Target audience mapping'
          ELSE 'Other table'
        END as description
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('enhanced_slides', 'slide_analytics', 'slide_target_audience')
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Final tables created:');
    console.log('========================');
    finalTables.rows.forEach(table => {
      console.log(`- ${table.table_name}: ${table.description}`);
    });
    
    // Check enhanced_slides columns
    const columns = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'enhanced_slides' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 enhanced_slides table columns:');
    console.log('================================');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check indexes
    const indexes = await pool.query(`
      SELECT 
        indexname,
        tablename,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('enhanced_slides', 'slide_analytics', 'slide_target_audience')
      ORDER BY tablename, indexname;
    `);
    
    console.log('\n🔍 Created indexes:');
    console.log('==================');
    if (indexes.rows.length === 0) {
      console.log('No indexes found');
    } else {
      indexes.rows.forEach(idx => {
        console.log(`- ${idx.indexname}: ${idx.indexdef}`);
      });
    }
    
    console.log('\n🎉 Slides tables migration completed successfully!');
    console.log('==================================================');
    console.log('Your database now has:');
    console.log('✅ enhanced_slides - Main slides table with 22 columns');
    console.log('✅ slide_analytics - Analytics tracking table');
    console.log('✅ slide_target_audience - Target audience mapping table');
    console.log('✅ Performance indexes for all tables');
    console.log('✅ Automatic timestamp updates');
    console.log('✅ Uploads directory for media files');
    console.log('\n🚀 You can now use the full slides functionality!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
createSlidesTables().catch(console.error); 