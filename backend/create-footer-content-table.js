import pool from './db.js';

const createFooterContentTable = async () => {
  try {
    // Create footer_content table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS footer_content (
        id SERIAL PRIMARY KEY,
        section_name VARCHAR(100) NOT NULL,
        content_key VARCHAR(100) NOT NULL,
        content_value TEXT NOT NULL,
        content_type VARCHAR(50) DEFAULT 'text',
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(section_name, content_key)
      )
    `);

    // Insert default footer content
    const defaultContent = [
      // Platform Info
      { section_name: 'platform', content_key: 'name', content_value: 'اسم المنصة', content_type: 'text', display_order: 1 },
      { section_name: 'platform', content_key: 'description', content_value: 'تحتاج دعم أكثر؟ اطلب حصة خاصة مع أستاذك المفضل', content_type: 'text', display_order: 2 },
      
      // Social Media
      { section_name: 'social', content_key: 'facebook', content_value: '#', content_type: 'url', display_order: 1 },
      { section_name: 'social', content_key: 'twitter', content_value: '#', content_type: 'url', display_order: 2 },
      { section_name: 'social', content_key: 'instagram', content_value: '#', content_type: 'url', display_order: 3 },
      { section_name: 'social', content_key: 'youtube', content_value: '#', content_type: 'url', display_order: 4 },
      
      // Quick Links
      { section_name: 'quick_links', content_key: 'home', content_value: 'الصفحة الرئيسية', content_type: 'link', display_order: 1 },
      { section_name: 'quick_links', content_key: 'private_classes', content_value: 'حصص خاصة', content_type: 'link', display_order: 2 },
      { section_name: 'quick_links', content_key: 'courses', content_value: 'الدورات المتاحة', content_type: 'link', display_order: 3 },
      { section_name: 'quick_links', content_key: 'teachers', content_value: 'الأساتذة', content_type: 'link', display_order: 4 },
      { section_name: 'quick_links', content_key: 'certificates', content_value: 'الشهادات', content_type: 'link', display_order: 5 },
      
      // Contact Info
      { section_name: 'contact', content_key: 'phone', content_value: '+213 123 456 789', content_type: 'text', display_order: 1 },
      { section_name: 'contact', content_key: 'email', content_value: 'contact@example.com', content_type: 'email', display_order: 2 },
      { section_name: 'contact', content_key: 'address', content_value: 'الجزائر العاصمة، الجزائر', content_type: 'text', display_order: 3 },
      
      // Newsletter
      { section_name: 'newsletter', content_key: 'description', content_value: 'اشترك ليصلك كل جديد عن الدورات والعروض.', content_type: 'text', display_order: 1 },
      { section_name: 'newsletter', content_key: 'placeholder', content_value: 'بريدك الإلكتروني', content_type: 'text', display_order: 2 },
      { section_name: 'newsletter', content_key: 'button_text', content_value: 'اشتراك', content_type: 'text', display_order: 3 },
      
      // Copyright
      { section_name: 'copyright', content_key: 'company_name', content_value: 'اسم المنصة', content_type: 'text', display_order: 1 },
      { section_name: 'copyright', content_key: 'rights_text', content_value: 'جميع الحقوق محفوظة.', content_type: 'text', display_order: 2 }
    ];

    for (const content of defaultContent) {
      await pool.query(`
        INSERT INTO footer_content (section_name, content_key, content_value, content_type, display_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (section_name, content_key) DO UPDATE SET
          content_value = EXCLUDED.content_value,
          content_type = EXCLUDED.content_type,
          display_order = EXCLUDED.display_order,
          updated_at = CURRENT_TIMESTAMP
      `, [content.section_name, content.content_key, content.content_value, content.content_type, content.display_order]);
    }

    console.log('✅ Footer content table created and populated successfully!');
    console.log(`📊 Inserted ${defaultContent.length} footer content items`);
    
  } catch (error) {
    console.error('❌ Error creating footer content table:', error);
  } finally {
    await pool.end();
  }
};

createFooterContentTable(); 