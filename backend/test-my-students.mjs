import pool from './db.js';

const testMyStudents = async () => {
  try {
    console.log('🔍 Testing My Students Data...\n');

    // Test with a specific professor ID (let's use ID 12 as an example)
    const professorId = 12;
    
    console.log(`📊 Testing for Professor ID: ${professorId}\n`);

    // 1. Check courses and their students
    console.log('📚 1. COURSES AND STUDENTS:');
    const courseStudents = await pool.query(`
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.created_by as professor_id,
        COUNT(sc.student_id) as student_count,
        ARRAY_AGG(u.name) as student_names
      FROM courses c
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      LEFT JOIN users u ON sc.student_id = u.id
      WHERE c.created_by = $1
      GROUP BY c.id, c.title, c.created_by
      ORDER BY c.id
    `, [professorId]);
    
    console.log('Courses found:', courseStudents.rows.length);
    courseStudents.rows.forEach(row => {
      console.log(`  Course: ${row.course_title} (ID: ${row.course_id})`);
      console.log(`  Students: ${row.student_count} - ${row.student_names.filter(n => n).join(', ') || 'None'}`);
    });

    // 2. Check live sessions and their students
    console.log('\n🎥 2. LIVE SESSIONS AND STUDENTS:');
    const liveSessionStudents = await pool.query(`
      SELECT 
        ls.id as session_id,
        ls.title as session_title,
        ls.professor_id,
        COUNT(lsp.user_id) as student_count,
        ARRAY_AGG(u.name) as student_names
      FROM live_sessions ls
      LEFT JOIN live_session_participants lsp ON ls.id = lsp.session_id
      LEFT JOIN users u ON lsp.user_id = u.id
      WHERE ls.professor_id = $1
      GROUP BY ls.id, ls.title, ls.professor_id
      ORDER BY ls.id
    `, [professorId]);
    
    console.log('Live Sessions found:', liveSessionStudents.rows.length);
    liveSessionStudents.rows.forEach(row => {
      console.log(`  Session: ${row.session_title} (ID: ${row.session_id})`);
      console.log(`  Students: ${row.student_count} - ${row.student_names.filter(n => n).join(', ') || 'None'}`);
    });

    // 3. Check live sections and their students
    console.log('\n📖 3. LIVE SECTIONS AND STUDENTS:');
    const liveSectionStudents = await pool.query(`
      SELECT 
        ls.id as section_id,
        ls.title as section_title,
        ls.professor_id,
        COUNT(lsp.student_id) as student_count,
        ARRAY_AGG(u.name) as student_names
      FROM live_sections ls
      LEFT JOIN live_section_purchases lsp ON ls.id = lsp.live_section_id
      LEFT JOIN users u ON lsp.student_id = u.id
      WHERE ls.professor_id = $1
      GROUP BY ls.id, ls.title, ls.professor_id
      ORDER BY ls.id
    `, [professorId]);
    
    console.log('Live Sections found:', liveSectionStudents.rows.length);
    liveSectionStudents.rows.forEach(row => {
      console.log(`  Section: ${row.section_title} (ID: ${row.section_id})`);
      console.log(`  Students: ${row.student_count} - ${row.student_names.filter(n => n).join(', ') || 'None'}`);
    });

    // 4. Check private classes and their students
    console.log('\n👥 4. PRIVATE CLASSES AND STUDENTS:');
    const professorName = await pool.query('SELECT name FROM users WHERE id = $1', [professorId]);
    const professorNameValue = professorName.rows[0]?.name;
    
    if (professorNameValue) {
      const privateClassStudents = await pool.query(`
        SELECT 
          pcr.id as request_id,
          pcr.title as request_title,
          pcr.teacher_name,
          pcr.status,
          u.name as student_name,
          u.id as student_id
        FROM private_class_requests pcr
        JOIN users u ON pcr.student_id = u.id
        WHERE pcr.teacher_name = $1
        ORDER BY pcr.id
      `, [professorNameValue]);
      
      console.log('Private Class Requests found:', privateClassStudents.rows.length);
      privateClassStudents.rows.forEach(row => {
        console.log(`  Request: ${row.request_title} (ID: ${row.request_id}) - Status: ${row.status}`);
        console.log(`  Student: ${row.student_name} (ID: ${row.student_id})`);
      });
    } else {
      console.log('No professor found with ID:', professorId);
    }

    // 5. Check all professors to see which ones have data
    console.log('\n👨‍🏫 5. ALL PROFESSORS WITH DATA:');
    const allProfessors = await pool.query(`
      SELECT DISTINCT 
        u.id,
        u.name,
        u.email,
        u.role
      FROM users u
      WHERE u.role = 'professor'
      ORDER BY u.id
    `);
    
    console.log('All professors:', allProfessors.rows.length);
    allProfessors.rows.forEach(prof => {
      console.log(`  Professor: ${prof.name} (ID: ${prof.id}) - ${prof.email}`);
    });

    // 6. Check if there are any students at all
    console.log('\n👨‍🎓 6. ALL STUDENTS:');
    const allStudents = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.id
      LIMIT 10
      `);
    
    console.log('Students found:', allStudents.rows.length);
    allStudents.rows.forEach(student => {
      console.log(`  Student: ${student.name} (ID: ${student.id}) - ${student.email}`);
    });

    // 7. Check sample data in each table
    console.log('\n📋 7. SAMPLE DATA IN TABLES:');
    
    const courseCount = await pool.query('SELECT COUNT(*) FROM courses');
    console.log(`Total courses: ${courseCount.rows[0].count}`);
    
    const liveSessionCount = await pool.query('SELECT COUNT(*) FROM live_sessions');
    console.log(`Total live sessions: ${liveSessionCount.rows[0].count}`);
    
    const liveSectionCount = await pool.query('SELECT COUNT(*) FROM live_sections');
    console.log(`Total live sections: ${liveSectionCount.rows[0].count}`);
    
    const privateClassCount = await pool.query('SELECT COUNT(*) FROM private_class_requests');
    console.log(`Total private class requests: ${privateClassCount.rows[0].count}`);
    
    const studentCourseCount = await pool.query('SELECT COUNT(*) FROM student_courses');
    console.log(`Total student-course enrollments: ${studentCourseCount.rows[0].count}`);
    
    const liveSessionParticipantCount = await pool.query('SELECT COUNT(*) FROM live_session_participants');
    console.log(`Total live session participants: ${liveSessionParticipantCount.rows[0].count}`);
    
    const liveSectionPurchaseCount = await pool.query('SELECT COUNT(*) FROM live_section_purchases');
    console.log(`Total live section purchases: ${liveSectionPurchaseCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error testing my students:', error);
  } finally {
    await pool.end();
  }
};

testMyStudents(); 