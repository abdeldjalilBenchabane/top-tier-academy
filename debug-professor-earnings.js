import pool from './backend/db.js';

async function debugProfessorEarnings() {
  console.log('🔍 Debugging Professor Earnings Query...\n');
  
  const year = '2025';
  const monthNum = '07';
  
  try {
    // Test the complex query step by step
    
    console.log('1. Testing basic professor query...');
    const basicQuery = await pool.query(`
      SELECT u.id, u.name, u.email
      FROM users u
      WHERE u.role = 'professor'
      LIMIT 5
    `);
    console.log('✅ Found professors:', basicQuery.rows.length);
    
    console.log('\n2. Testing courses subquery...');
    const coursesQuery = await pool.query(`
      SELECT 
        c.professor_id,
        COUNT(DISTINCT c.id) as courses_count,
        COUNT(sc.student_id) as total_students
      FROM courses c
      LEFT JOIN student_courses sc ON c.id = sc.course_id 
        AND EXTRACT(YEAR FROM sc.created_at) = $1 
        AND EXTRACT(MONTH FROM sc.created_at) = $2
      WHERE c.material_id IS NOT NULL
        AND EXTRACT(YEAR FROM c.created_at) = $1 
        AND EXTRACT(MONTH FROM c.created_at) = $2
      GROUP BY c.professor_id
    `, [year, monthNum]);
    console.log('✅ Courses data:', coursesQuery.rows);
    
    console.log('\n3. Testing live sections subquery...');
    const liveSectionsQuery = await pool.query(`
      SELECT 
        ls.professor_id,
        COUNT(DISTINCT ls.id) as live_sections_count,
        COUNT(lsp.student_id) as total_students
      FROM live_sections ls
      LEFT JOIN live_section_purchases lsp ON ls.id = lsp.live_section_id 
        AND EXTRACT(YEAR FROM lsp.purchase_date) = $1 
        AND EXTRACT(MONTH FROM lsp.purchase_date) = $2
      WHERE ls.material_id IS NOT NULL
        AND EXTRACT(YEAR FROM ls.created_at) = $1 
        AND EXTRACT(MONTH FROM ls.created_at) = $2
      GROUP BY ls.professor_id
    `, [year, monthNum]);
    console.log('✅ Live sections data:', liveSectionsQuery.rows);
    
    console.log('\n4. Testing private classes subquery...');
    const privateClassesQuery = await pool.query(`
      SELECT 
        pcr.professor_id,
        COUNT(DISTINCT pcr.id) as private_classes_count
      FROM private_class_requests pcr
      WHERE pcr.status = 'completed'
        AND EXTRACT(YEAR FROM pcr.created_at) = $1 
        AND EXTRACT(MONTH FROM pcr.created_at) = $2
      GROUP BY pcr.professor_id
    `, [year, monthNum]);
    console.log('✅ Private classes data:', privateClassesQuery.rows);
    
    console.log('\n5. Testing the full complex query...');
    const fullQuery = await pool.query(`
      WITH professor_data AS (
        SELECT 
          u.id as professor_id,
          u.name as professor_name,
          u.email as professor_email,
          
          -- Education courses earnings
          COALESCE(SUM(
            CASE WHEN c.material_id IS NOT NULL THEN c.price * sc.student_count ELSE 0 END
          ), 0) as courses_earnings,
          
          -- Live sessions earnings (education path)
          COALESCE(SUM(
            CASE WHEN ls.material_id IS NOT NULL THEN ls.price * lsp.student_count ELSE 0 END
          ), 0) as live_sessions_earnings,
          
          -- Private classes earnings
          COALESCE(SUM(
            CASE WHEN pcr.status = 'completed' THEN pcr.price ELSE 0 END
          ), 0) as private_classes_earnings,
          
          -- Language courses earnings
          COALESCE(SUM(
            CASE WHEN c.language_level_id IS NOT NULL THEN c.price * sc.student_count ELSE 0 END
          ), 0) as language_courses_earnings,
          
          -- Counts
          COUNT(DISTINCT CASE WHEN c.material_id IS NOT NULL THEN c.id END) as courses_count,
          COUNT(DISTINCT CASE WHEN ls.material_id IS NOT NULL THEN ls.id END) as live_sessions_count,
          COUNT(DISTINCT CASE WHEN pcr.status = 'completed' THEN pcr.id END) as private_classes_count,
          COUNT(DISTINCT CASE WHEN c.language_level_id IS NOT NULL THEN c.id END) as language_courses_count,
          
          -- Student counts
          COALESCE(SUM(sc.student_count), 0) + 
          COALESCE(SUM(lsp.student_count), 0) + 
          COALESCE(COUNT(DISTINCT CASE WHEN pcr.status = 'completed' THEN pcr.student_id END), 0) as total_students
          
        FROM users u
        LEFT JOIN courses c ON u.id = c.professor_id 
          AND EXTRACT(YEAR FROM c.created_at) = $1 
          AND EXTRACT(MONTH FROM c.created_at) = $2
        LEFT JOIN (
          SELECT course_id, COUNT(*) as student_count
          FROM student_courses 
          WHERE EXTRACT(YEAR FROM created_at) = $1 
          AND EXTRACT(MONTH FROM created_at) = $2
          GROUP BY course_id
        ) sc ON c.id = sc.course_id
        
        LEFT JOIN live_sections ls ON u.id = ls.professor_id 
          AND EXTRACT(YEAR FROM ls.created_at) = $1 
          AND EXTRACT(MONTH FROM ls.created_at) = $2
        LEFT JOIN (
          SELECT live_section_id, COUNT(*) as student_count
          FROM live_section_purchases 
          WHERE EXTRACT(YEAR FROM purchase_date) = $1 
          AND EXTRACT(MONTH FROM purchase_date) = $2
          GROUP BY live_section_id
        ) lsp ON ls.id = lsp.live_section_id
        
        LEFT JOIN private_class_requests pcr ON u.id = pcr.professor_id 
          AND EXTRACT(YEAR FROM pcr.created_at) = $1 
          AND EXTRACT(MONTH FROM pcr.created_at) = $2
        
        WHERE u.role = 'professor'
        GROUP BY u.id, u.name, u.email
      )
      SELECT 
        professor_id,
        professor_name,
        professor_email,
        courses_earnings + live_sessions_earnings + private_classes_earnings + language_courses_earnings as total_earnings,
        courses_earnings,
        live_sessions_earnings,
        private_classes_earnings,
        language_courses_earnings,
        total_students,
        courses_count,
        live_sessions_count,
        private_classes_count,
        language_courses_count
      FROM professor_data
      WHERE courses_earnings + live_sessions_earnings + private_classes_earnings + language_courses_earnings > 0
      ORDER BY total_earnings DESC
    `, [year, monthNum]);
    
    console.log('✅ Full query result:', fullQuery.rows);
    
  } catch (error) {
    console.error('❌ Error in query:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

debugProfessorEarnings(); 