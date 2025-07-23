import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function populateHierarchyData() {
  const client = await pool.connect();
  try {
    console.log('🚀 Populating hierarchy data for existing records...');
    
    // Get all records without hierarchy data
    const records = await client.query(`
      SELECT id, subject, grade 
      FROM private_class_requests 
      WHERE level_id IS NULL AND year_id IS NULL AND speciality_id IS NULL AND material_id IS NULL
    `);
    
    console.log(`📊 Found ${records.rows.length} records to update`);
    
    // Arabic to English mapping
    const arabicToEnglish = {
      'اللغة العربية': 'Arabic',
      'الرياضيات': 'Mathematics',
      'العلوم الطبيعية': 'Sciences',
      'الفيزياء': 'Physics',
      'الكيمياء': 'Chemistry',
      'التاريخ والجغرافيا': 'History and Geography',
      'اللغة الفرنسية': 'French',
      'اللغة الإنجليزية': 'English',
      'التربية الإسلامية': 'Islamic Education',
      'التربية العلمية': 'Scientific Education',
      'التربية المدنية': 'Civic Education',
      'الفلسفة': 'Philosophy',
      'العلوم الإسلامية': 'Islamic Sciences'
    };
    
    // Arabic grade to English mapping
    const arabicGradeToEnglish = {
      'الأولى': 'first Year',
      'الثانية': 'Secend Year',
      'الثالثة': 'therde Year',
      'الرابعة': 'Fourth Year',
      'الخامسة': 'Fifth Year',
      'ابتدائي': 'Primery School',
      'متوسط': 'midele School',
      'ثانوي': 'hight school'
    };
    
    for (const record of records.rows) {
      console.log(`🔄 Processing record ${record.id}: ${record.subject} - ${record.grade}`);
      
      let levelId = null;
      let yearId = null;
      let specialityId = null;
      let materialId = null;
      
      // Try to find material by name (with Arabic to English mapping)
      if (record.subject) {
        const englishSubject = arabicToEnglish[record.subject] || record.subject;
        console.log(`  Translating subject: ${record.subject} -> ${englishSubject}`);
        
        const materialResult = await client.query(
          'SELECT id, speciality_id FROM materials WHERE name ILIKE $1',
          [`%${englishSubject}%`]
        );
        
        if (materialResult.rows.length > 0) {
          materialId = materialResult.rows[0].id;
          specialityId = materialResult.rows[0].speciality_id;
          console.log(`  Found material: ${materialId}`);
          
          // Get speciality info
          if (specialityId) {
            const specialityResult = await client.query(
              'SELECT id, year_id FROM specialities WHERE id = $1',
              [specialityId]
            );
            
            if (specialityResult.rows.length > 0) {
              yearId = specialityResult.rows[0].year_id;
              console.log(`  Found year: ${yearId}`);
              
              // Get year info
              if (yearId) {
                const yearResult = await client.query(
                  'SELECT id, level_id FROM years WHERE id = $1',
                  [yearId]
                );
                
                if (yearResult.rows.length > 0) {
                  levelId = yearResult.rows[0].level_id;
                  console.log(`  Found level: ${levelId}`);
                }
              }
            }
          }
        } else {
          console.log(`  No material found for: ${englishSubject}`);
        }
      }
      
      // If we couldn't find by subject, try by grade
      if (!levelId && record.grade) {
        console.log(`  Trying to match by grade: ${record.grade}`);
        
        // Extract year and level from grade
        const gradeParts = record.grade.split(' ');
        if (gradeParts.length >= 2) {
          const arabicYear = gradeParts[0];
          const arabicLevel = gradeParts[1];
          
          const englishYear = arabicGradeToEnglish[arabicYear];
          const englishLevel = arabicGradeToEnglish[arabicLevel];
          
          console.log(`  Translated grade: ${arabicYear} ${arabicLevel} -> ${englishYear} ${englishLevel}`);
          
          // Try to find level
          if (englishLevel) {
            const levelResult = await client.query(
              'SELECT id FROM levels WHERE name ILIKE $1',
              [`%${englishLevel}%`]
            );
            
            if (levelResult.rows.length > 0) {
              levelId = levelResult.rows[0].id;
              console.log(`  Found level by grade: ${levelId}`);
            }
          }
          
          // Try to find year
          if (englishYear && levelId) {
            const yearResult = await client.query(
              'SELECT id FROM years WHERE name ILIKE $1 AND level_id = $2',
              [`%${englishYear}%`, levelId]
            );
            
            if (yearResult.rows.length > 0) {
              yearId = yearResult.rows[0].id;
              console.log(`  Found year by grade: ${yearId}`);
            }
          }
        }
      }
      
      // Update the record with hierarchy data
      await client.query(`
        UPDATE private_class_requests 
        SET level_id = $1, year_id = $2, speciality_id = $3, material_id = $4
        WHERE id = $5
      `, [levelId, yearId, specialityId, materialId, record.id]);
      
      console.log(`✅ Updated record ${record.id} with hierarchy: Level=${levelId}, Year=${yearId}, Speciality=${specialityId}, Material=${materialId}`);
    }
    
    console.log('🎉 Hierarchy data population completed!');
    
    // Show final stats
    const finalStats = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN level_id IS NOT NULL THEN 1 END) as with_level,
        COUNT(CASE WHEN year_id IS NOT NULL THEN 1 END) as with_year,
        COUNT(CASE WHEN speciality_id IS NOT NULL THEN 1 END) as with_speciality,
        COUNT(CASE WHEN material_id IS NOT NULL THEN 1 END) as with_material
      FROM private_class_requests
    `);
    
    const stats = finalStats.rows[0];
    console.log('📊 Final Statistics:');
    console.log(`  - Total records: ${stats.total_records}`);
    console.log(`  - With level: ${stats.with_level}`);
    console.log(`  - With year: ${stats.with_year}`);
    console.log(`  - With speciality: ${stats.with_speciality}`);
    console.log(`  - With material: ${stats.with_material}`);
    
  } catch (err) {
    console.error('❌ Error populating hierarchy data:', err);
  } finally {
    client.release();
    process.exit();
  }
}

populateHierarchyData(); 