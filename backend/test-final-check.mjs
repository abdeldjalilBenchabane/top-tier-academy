import pool from './db.js';

const testFinalCheck = async () => {
  try {
    console.log('🔍 Final Check - My Students Page Data...\n');

    const professorId = 12;
    console.log(`📊 Testing for Professor ID: ${professorId}\n`);

    // Get professor name
    const professorName = await pool.query('SELECT name FROM users WHERE id = $1', [professorId]);
    const professorNameValue = professorName.rows[0]?.name;
    console.log(`👨‍🏫 Professor: ${professorNameValue}\n`);

    // Test the exact API queries
    console.log('📚 1. COURSES:');
    const courseStudents = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        c.title as content_title,
        sc.buy_at as enrollment_date
      FROM student_courses sc
      JOIN users u ON sc.student_id = u.id
      JOIN courses c ON sc.course_id = c.id
      WHERE c.created_by = $1
      ORDER BY u.name, c.title
    `, [professorId]);
    
    console.log(`Found ${courseStudents.rows.length} course enrollments`);
    const courseStudentsByStudent = {};
    courseStudents.rows.forEach(row => {
      if (!courseStudentsByStudent[row.name]) {
        courseStudentsByStudent[row.name] = [];
      }
      courseStudentsByStudent[row.name].push(row.content_title);
    });
    
    Object.entries(courseStudentsByStudent).forEach(([studentName, courses]) => {
      console.log(`  ${studentName}: ${courses.length} courses - ${courses.join(', ')}`);
    });

    console.log('\n🎥 2. LIVE SESSIONS:');
    const liveSessionStudents = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ls.title as content_title,
        lsp.joined_at as enrollment_date
      FROM live_session_participants lsp
      JOIN users u ON lsp.user_id = u.id
      JOIN live_sessions ls ON lsp.session_id = ls.id
      WHERE ls.professor_id = $1
      ORDER BY u.name, ls.title
    `, [professorId]);
    
    console.log(`Found ${liveSessionStudents.rows.length} live session participants`);
    if (liveSessionStudents.rows.length > 0) {
      liveSessionStudents.rows.forEach(row => {
        console.log(`  ${row.name}: ${row.content_title}`);
      });
    } else {
      console.log('  No students have joined live sessions yet');
    }

    console.log('\n📖 3. LIVE SECTIONS:');
    const liveSectionStudents = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ls.title as content_title,
        lsp.purchase_date as enrollment_date
      FROM live_section_purchases lsp
      JOIN users u ON lsp.student_id = u.id
      JOIN live_sections ls ON lsp.live_section_id = ls.id
      WHERE ls.professor_id = $1
      ORDER BY u.name, ls.title
    `, [professorId]);
    
    console.log(`Found ${liveSectionStudents.rows.length} live section purchases`);
    if (liveSectionStudents.rows.length > 0) {
      liveSectionStudents.rows.forEach(row => {
        console.log(`  ${row.name}: ${row.content_title}`);
      });
    } else {
      console.log('  No students have purchased live sections');
    }

    console.log('\n👥 4. PRIVATE CLASSES:');
    if (professorNameValue) {
      const privateClassStudents = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          pcr.title as content_title,
          pcr.status,
          pcr.created_at as enrollment_date
        FROM private_class_requests pcr
        JOIN users u ON pcr.student_id = u.id
        WHERE pcr.teacher_name = $1
        ORDER BY u.name, pcr.title
      `, [professorNameValue]);
      
      console.log(`Found ${privateClassStudents.rows.length} private class requests`);
      if (privateClassStudents.rows.length > 0) {
        const privateClassesByStudent = {};
        privateClassStudents.rows.forEach(row => {
          if (!privateClassesByStudent[row.name]) {
            privateClassesByStudent[row.name] = [];
          }
          privateClassesByStudent[row.name].push(`${row.content_title} (${row.status})`);
        });
        
        Object.entries(privateClassesByStudent).forEach(([studentName, requests]) => {
          console.log(`  ${studentName}: ${requests.length} requests - ${requests.join(', ')}`);
        });
      } else {
        console.log('  No private class requests found');
      }
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total unique students: ${new Set([
      ...courseStudents.rows.map(r => r.name),
      ...liveSessionStudents.rows.map(r => r.name),
      ...liveSectionStudents.rows.map(r => r.name),
      ...(professorNameValue ? privateClassStudents.rows.map(r => r.name) : [])
    ]).size}`);
    console.log(`Total enrollments: ${courseStudents.rows.length + liveSessionStudents.rows.length + liveSectionStudents.rows.length + (professorNameValue ? privateClassStudents.rows.length : 0)}`);

  } catch (error) {
    console.error('❌ Error in final check:', error);
  } finally {
    await pool.end();
  }
};

testFinalCheck(); 