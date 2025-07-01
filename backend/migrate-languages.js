import { query, getRow } from './db.js';

const migrateLanguages = async () => {
  try {
    console.log('Starting language tables migration...');

    // Check if languages table exists
    const languagesTableExists = await getRow(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'languages'
      );
    `);

    if (!languagesTableExists.exists) {
      console.log('Creating languages table...');
      await query(`
        CREATE TABLE languages (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          code VARCHAR(10) NOT NULL UNIQUE,
          flag VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Languages table created successfully.');
    } else {
      console.log('Languages table already exists.');
    }

    // Check if language_levels table exists
    const languageLevelsTableExists = await getRow(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'language_levels'
      );
    `);

    if (!languageLevelsTableExists.exists) {
      console.log('Creating language_levels table...');
      await query(`
        CREATE TABLE language_levels (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
          "order" INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Language levels table created successfully.');
    } else {
      console.log('Language levels table already exists.');
    }

    // Create indexes
    console.log('Creating language indexes...');
    
    // Check and create languages indexes
    const languagesActiveIndexExists = await getRow(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'idx_languages_active'
      );
    `);
    
    if (!languagesActiveIndexExists.exists) {
      await query('CREATE INDEX idx_languages_active ON languages(is_active);');
      console.log('Languages active index created.');
    }

    const languagesCodeIndexExists = await getRow(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'idx_languages_code'
      );
    `);
    
    if (!languagesCodeIndexExists.exists) {
      await query('CREATE INDEX idx_languages_code ON languages(code);');
      console.log('Languages code index created.');
    }

    // Check and create language_levels indexes
    const languageLevelsLanguageIdIndexExists = await getRow(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'idx_language_levels_language_id'
      );
    `);
    
    if (!languageLevelsLanguageIdIndexExists.exists) {
      await query('CREATE INDEX idx_language_levels_language_id ON language_levels(language_id);');
      console.log('Language levels language_id index created.');
    }

    const languageLevelsOrderIndexExists = await getRow(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'idx_language_levels_order'
      );
    `);
    
    if (!languageLevelsOrderIndexExists.exists) {
      await query('CREATE INDEX idx_language_levels_order ON language_levels("order");');
      console.log('Language levels order index created.');
    }

    const languageLevelsActiveIndexExists = await getRow(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'idx_language_levels_active'
      );
    `);
    
    if (!languageLevelsActiveIndexExists.exists) {
      await query('CREATE INDEX idx_language_levels_active ON language_levels(is_active);');
      console.log('Language levels active index created.');
    }

    // Insert sample data if tables are empty
    const languagesCount = await getRow('SELECT COUNT(*) as count FROM languages;');
    if (languagesCount.count === 0) {
      console.log('Inserting sample languages...');
      await query(`
        INSERT INTO languages (name, code, flag, is_active) VALUES 
        ('English', 'en', 'https://flagcdn.com/w40/gb.png', true),
        ('Arabic', 'ar', 'https://flagcdn.com/w40/sa.png', true),
        ('French', 'fr', 'https://flagcdn.com/w40/fr.png', true),
        ('Spanish', 'es', 'https://flagcdn.com/w40/es.png', true),
        ('German', 'de', 'https://flagcdn.com/w40/de.png', true);
      `);
      console.log('Sample languages inserted successfully.');
    } else {
      console.log('Languages table already has data.');
    }

    const languageLevelsCount = await getRow('SELECT COUNT(*) as count FROM language_levels;');
    if (languageLevelsCount.count === 0) {
      console.log('Inserting sample language levels...');
      
      // Get language IDs
      const english = await getRow('SELECT id FROM languages WHERE code = $1', ['en']);
      const arabic = await getRow('SELECT id FROM languages WHERE code = $1', ['ar']);
      const french = await getRow('SELECT id FROM languages WHERE code = $1', ['fr']);

      if (english) {
        await query(`
          INSERT INTO language_levels (name, description, language_id, "order", is_active) VALUES 
          ('A1', 'Beginner - Can understand and use familiar everyday expressions', $1, 1, true),
          ('A2', 'Elementary - Can communicate in simple and routine tasks', $1, 2, true),
          ('B1', 'Intermediate - Can deal with most situations while traveling', $1, 3, true),
          ('B2', 'Upper Intermediate - Can interact with fluency and spontaneity', $1, 4, true),
          ('C1', 'Advanced - Can express ideas fluently and spontaneously', $1, 5, true),
          ('C2', 'Proficient - Can understand virtually everything heard or read', $1, 6, true);
        `, [english.id]);
      }

      if (arabic) {
        await query(`
          INSERT INTO language_levels (name, description, language_id, "order", is_active) VALUES 
          ('مبتدئ', 'مستوى المبتدئين - يمكن فهم واستخدام التعبيرات اليومية المألوفة', $1, 1, true),
          ('متوسط', 'مستوى متوسط - يمكن التعامل مع معظم المواقف أثناء السفر', $1, 2, true),
          ('متقدم', 'مستوى متقدم - يمكن التعبير عن الأفكار بطلاقة وتلقائية', $1, 3, true);
        `, [arabic.id]);
      }

      if (french) {
        await query(`
          INSERT INTO language_levels (name, description, language_id, "order", is_active) VALUES 
          ('A1', 'Débutant - Peut comprendre et utiliser des expressions familières', $1, 1, true),
          ('A2', 'Élémentaire - Peut communiquer dans des tâches simples', $1, 2, true),
          ('B1', 'Intermédiaire - Peut faire face à la plupart des situations', $1, 3, true),
          ('B2', 'Intermédiaire Supérieur - Peut s''exprimer avec aisance', $1, 4, true),
          ('C1', 'Avancé - Peut s''exprimer spontanément et couramment', $1, 5, true),
          ('C2', 'Maîtrise - Peut comprendre pratiquement tout', $1, 6, true);
        `, [french.id]);
      }

      console.log('Sample language levels inserted successfully.');
    } else {
      console.log('Language levels table already has data.');
    }

    console.log('Language tables migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during language tables migration:', error);
    process.exit(1);
  }
};

migrateLanguages(); 