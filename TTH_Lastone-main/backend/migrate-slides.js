import { query } from './db.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('Starting slides migration...');
    
    // Create enhanced_slides table
    console.log('Creating enhanced_slides table...');
    await query(`
      CREATE TABLE IF NOT EXISTS enhanced_slides (
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
      )
    `);
    
    // Create slide_analytics table
    console.log('Creating slide_analytics table...');
    await query(`
      CREATE TABLE IF NOT EXISTS slide_analytics (
        id SERIAL PRIMARY KEY,
        slide_id INTEGER REFERENCES enhanced_slides(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('view', 'click')),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create slide_target_audience table
    console.log('Creating slide_target_audience table...');
    await query(`
      CREATE TABLE IF NOT EXISTS slide_target_audience (
        slide_id INTEGER REFERENCES enhanced_slides(id) ON DELETE CASCADE,
        audience_role VARCHAR(20) NOT NULL CHECK (audience_role IN ('student', 'professor', 'admin')),
        PRIMARY KEY (slide_id, audience_role)
      )
    `);
    
    // Create indexes
    console.log('Creating indexes...');
    await query('CREATE INDEX IF NOT EXISTS idx_enhanced_slides_active ON enhanced_slides(is_active)');
    await query('CREATE INDEX IF NOT EXISTS idx_enhanced_slides_order ON enhanced_slides("order")');
    await query('CREATE INDEX IF NOT EXISTS idx_enhanced_slides_created_at ON enhanced_slides(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_slide_analytics_slide_id ON slide_analytics(slide_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_slide_analytics_created_at ON slide_analytics(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_slide_target_audience_slide_id ON slide_target_audience(slide_id)');
    
    // Create function
    console.log('Creating update function...');
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $func$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $func$ language 'plpgsql'
    `);
    
    // Create trigger
    console.log('Creating trigger...');
    await query('DROP TRIGGER IF EXISTS update_enhanced_slides_updated_at ON enhanced_slides');
    await query(`
      CREATE TRIGGER update_enhanced_slides_updated_at 
        BEFORE UPDATE ON enhanced_slides 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `);
    
    console.log('Slides migration completed successfully!');
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'slides');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads/slides directory');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 