import pool from './db.js';

async function createHomepageMaterialsTable() {
  try {
    console.log('🔄 Creating homepage_materials table...');

    // Create the homepage_materials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepage_materials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        section_type VARCHAR(50) NOT NULL CHECK (section_type IN ('education', 'languages')),
        level_type VARCHAR(50) NOT NULL CHECK (level_type IN ('primary', 'middle', 'high', 'beginner', 'intermediate', 'advanced')),
        level_name_ar VARCHAR(255) NOT NULL,
        level_name_en VARCHAR(255),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ homepage_materials table created successfully!');

    // Insert default materials data
    console.log('🔄 Inserting default homepage materials...');

    const defaultMaterials = [
      // Education Section - Primary Level (الإبتدائي)
      { name: 'اللغة العربية', section_type: 'education', level_type: 'primary', level_name_ar: 'المرحلة الإبتدائية', level_name_en: 'Primary Stage', display_order: 1 },
      { name: 'الرياضيات', section_type: 'education', level_type: 'primary', level_name_ar: 'المرحلة الإبتدائية', level_name_en: 'Primary Stage', display_order: 2 },
      { name: 'التربية الإسلامية', section_type: 'education', level_type: 'primary', level_name_ar: 'المرحلة الإبتدائية', level_name_en: 'Primary Stage', display_order: 3 },
      { name: 'التربية العلمية', section_type: 'education', level_type: 'primary', level_name_ar: 'المرحلة الإبتدائية', level_name_en: 'Primary Stage', display_order: 4 },
      { name: 'التربية المدنية', section_type: 'education', level_type: 'primary', level_name_ar: 'المرحلة الإبتدائية', level_name_en: 'Primary Stage', display_order: 5 },
      { name: 'اللغة الفرنسية', section_type: 'education', level_type: 'primary', level_name_ar: 'المرحلة الإبتدائية', level_name_en: 'Primary Stage', display_order: 6 },
      { name: 'اللغة الإنجليزية', section_type: 'education', level_type: 'primary', level_name_ar: 'المرحلة الإبتدائية', level_name_en: 'Primary Stage', display_order: 7 },

      // Education Section - Middle Level (المتوسط)
      { name: 'اللغة العربية', section_type: 'education', level_type: 'middle', level_name_ar: 'المرحلة المتوسطة', level_name_en: 'Middle Stage', display_order: 1 },
      { name: 'الرياضيات', section_type: 'education', level_type: 'middle', level_name_ar: 'المرحلة المتوسطة', level_name_en: 'Middle Stage', display_order: 2 },
      { name: 'العلوم الطبيعية', section_type: 'education', level_type: 'middle', level_name_ar: 'المرحلة المتوسطة', level_name_en: 'Middle Stage', display_order: 3 },
      { name: 'الفيزياء', section_type: 'education', level_type: 'middle', level_name_ar: 'المرحلة المتوسطة', level_name_en: 'Middle Stage', display_order: 4 },
      { name: 'التاريخ والجغرافيا', section_type: 'education', level_type: 'middle', level_name_ar: 'المرحلة المتوسطة', level_name_en: 'Middle Stage', display_order: 5 },
      { name: 'اللغة الفرنسية', section_type: 'education', level_type: 'middle', level_name_ar: 'المرحلة المتوسطة', level_name_en: 'Middle Stage', display_order: 6 },
      { name: 'اللغة الإنجليزية', section_type: 'education', level_type: 'middle', level_name_ar: 'المرحلة المتوسطة', level_name_en: 'Middle Stage', display_order: 7 },
      { name: 'التربية الإسلامية', section_type: 'education', level_type: 'middle', level_name_ar: 'المرحلة المتوسطة', level_name_en: 'Middle Stage', display_order: 8 },

      // Education Section - High Level (الثانوي)
      { name: 'اللغة العربية', section_type: 'education', level_type: 'high', level_name_ar: 'المرحلة الثانوية', level_name_en: 'High School Stage', display_order: 1 },
      { name: 'الرياضيات', section_type: 'education', level_type: 'high', level_name_ar: 'المرحلة الثانوية', level_name_en: 'High School Stage', display_order: 2 },
      { name: 'العلوم الطبيعية', section_type: 'education', level_type: 'high', level_name_ar: 'المرحلة الثانوية', level_name_en: 'High School Stage', display_order: 3 },
      { name: 'الفيزياء', section_type: 'education', level_type: 'high', level_name_ar: 'المرحلة الثانوية', level_name_en: 'High School Stage', display_order: 4 },
      { name: 'الكيمياء', section_type: 'education', level_type: 'high', level_name_ar: 'المرحلة الثانوية', level_name_en: 'High School Stage', display_order: 5 },
      { name: 'التاريخ والجغرافيا', section_type: 'education', level_type: 'high', level_name_ar: 'المرحلة الثانوية', level_name_en: 'High School Stage', display_order: 6 },
      { name: 'الفلسفة', section_type: 'education', level_type: 'high', level_name_ar: 'المرحلة الثانوية', level_name_en: 'High School Stage', display_order: 7 },
      { name: 'اللغة الفرنسية', section_type: 'education', level_type: 'high', level_name_ar: 'المرحلة الثانوية', level_name_en: 'High School Stage', display_order: 8 },
      { name: 'اللغة الإنجليزية', section_type: 'education', level_type: 'high', level_name_ar: 'المرحلة الثانوية', level_name_en: 'High School Stage', display_order: 9 },
      { name: 'العلوم الإسلامية', section_type: 'education', level_type: 'high', level_name_ar: 'المرحلة الثانوية', level_name_en: 'High School Stage', display_order: 10 },

      // Languages Section - Beginner Level
      { name: 'اللغة العربية', section_type: 'languages', level_type: 'beginner', level_name_ar: 'مبتدئ', level_name_en: 'Beginner', display_order: 1 },
      { name: 'اللغة الإنجليزية', section_type: 'languages', level_type: 'beginner', level_name_ar: 'مبتدئ', level_name_en: 'Beginner', display_order: 2 },
      { name: 'اللغة الفرنسية', section_type: 'languages', level_type: 'beginner', level_name_ar: 'مبتدئ', level_name_en: 'Beginner', display_order: 3 },
      { name: 'اللغة الإسبانية', section_type: 'languages', level_type: 'beginner', level_name_ar: 'مبتدئ', level_name_en: 'Beginner', display_order: 4 },
      { name: 'اللغة الألمانية', section_type: 'languages', level_type: 'beginner', level_name_ar: 'مبتدئ', level_name_en: 'Beginner', display_order: 5 },

      // Languages Section - Intermediate Level
      { name: 'اللغة العربية', section_type: 'languages', level_type: 'intermediate', level_name_ar: 'متوسط', level_name_en: 'Intermediate', display_order: 1 },
      { name: 'اللغة الإنجليزية', section_type: 'languages', level_type: 'intermediate', level_name_ar: 'متوسط', level_name_en: 'Intermediate', display_order: 2 },
      { name: 'اللغة الفرنسية', section_type: 'languages', level_type: 'intermediate', level_name_ar: 'متوسط', level_name_en: 'Intermediate', display_order: 3 },
      { name: 'اللغة الإسبانية', section_type: 'languages', level_type: 'intermediate', level_name_ar: 'متوسط', level_name_en: 'Intermediate', display_order: 4 },
      { name: 'اللغة الألمانية', section_type: 'languages', level_type: 'intermediate', level_name_ar: 'متوسط', level_name_en: 'Intermediate', display_order: 5 },

      // Languages Section - Advanced Level
      { name: 'اللغة العربية', section_type: 'languages', level_type: 'advanced', level_name_ar: 'متقدم', level_name_en: 'Advanced', display_order: 1 },
      { name: 'اللغة الإنجليزية', section_type: 'languages', level_type: 'advanced', level_name_ar: 'متقدم', level_name_en: 'Advanced', display_order: 2 },
      { name: 'اللغة الفرنسية', section_type: 'languages', level_type: 'advanced', level_name_ar: 'متقدم', level_name_en: 'Advanced', display_order: 3 },
      { name: 'اللغة الإسبانية', section_type: 'languages', level_type: 'advanced', level_name_ar: 'متقدم', level_name_en: 'Advanced', display_order: 4 },
      { name: 'اللغة الألمانية', section_type: 'languages', level_type: 'advanced', level_name_ar: 'متقدم', level_name_en: 'Advanced', display_order: 5 }
    ];

    for (const material of defaultMaterials) {
      await pool.query(`
        INSERT INTO homepage_materials (name, section_type, level_type, level_name_ar, level_name_en, display_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [material.name, material.section_type, material.level_type, material.level_name_ar, material.level_name_en, material.display_order]);
    }

    console.log('✅ Default homepage materials inserted successfully!');

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_homepage_materials_section_type 
      ON homepage_materials(section_type, level_type, display_order)
    `);

    console.log('✅ Indexes created successfully!');

    console.log('🎉 Homepage materials table setup completed successfully!');
    console.log('📊 Total materials inserted:', defaultMaterials.length);

  } catch (error) {
    console.error('❌ Error creating homepage materials table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
createHomepageMaterialsTable().catch(console.error); 