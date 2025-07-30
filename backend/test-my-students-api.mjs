import pool from './db.js';

const testMyStudentsAPI = async () => {
  try {
    console.log('🔍 Testing My Students API Logic...\n');

    const professorId = 12;
    console.log(`📊 Testing for Professor ID: ${professorId}\n`);

    // Simulate the exact API logic from professor.js
    console.log('📚 1. COURSES STUDENTS (API Logic):');
    const courseStudents = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url as avatar,
        sc.buy_at as enrollment_date,
        sc.last_accessed as last_activity,
        c.title as content_title,
        c.id as content_id,
        'course' as content_type,
        'enrolled' as status
      FROM student_courses sc
      JOIN users u ON sc.student_id = u.id
      JOIN courses c ON sc.course_id = c.id
      WHERE c.created_by = $1
    `, [professorId]);
    
    console.log('Course students found:', courseStudents.rows.length);
    courseStudents.rows.forEach(row => {
      console.log(`  Student: ${row.name} - Course: ${row.content_title} - Date: ${row.enrollment_date}`);
    });

    console.log('\n🎥 2. LIVE SESSIONS STUDENTS (API Logic):');
    const liveSessionStudents = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url as avatar,
        lsp.joined_at as enrollment_date,
        lsp.joined_at as last_activity,
        ls.title as content_title,
        ls.id as content_id,
        'live_session' as content_type,
        'enrolled' as status
      FROM live_session_participants lsp
      JOIN users u ON lsp.user_id = u.id
      JOIN live_sessions ls ON lsp.session_id = ls.id
      WHERE ls.professor_id = $1
    `, [professorId]);
    
    console.log('Live session students found:', liveSessionStudents.rows.length);
    liveSessionStudents.rows.forEach(row => {
      console.log(`  Student: ${row.name} - Session: ${row.content_title} - Date: ${row.enrollment_date}`);
    });

    console.log('\n📖 3. LIVE SECTIONS STUDENTS (API Logic):');
    const liveSectionStudents = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url as avatar,
        lsp.purchase_date as enrollment_date,
        lsp.purchase_date as last_activity,
        ls.title as content_title,
        ls.id as content_id,
        'live_section' as content_type,
        'enrolled' as status
      FROM live_section_purchases lsp
      JOIN users u ON lsp.student_id = u.id
      JOIN live_sections ls ON lsp.live_section_id = ls.id
      WHERE ls.professor_id = $1
    `, [professorId]);
    
    console.log('Live section students found:', liveSectionStudents.rows.length);
    liveSectionStudents.rows.forEach(row => {
      console.log(`  Student: ${row.name} - Section: ${row.content_title} - Date: ${row.purchase_date}`);
    });

    console.log('\n👥 4. PRIVATE CLASSES STUDENTS (API Logic):');
    const professorName = await pool.query('SELECT name FROM users WHERE id = $1', [professorId]);
    const professorNameValue = professorName.rows[0]?.name;
    
    if (professorNameValue) {
      const privateClassStudents = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar_url as avatar,
          pcr.created_at as enrollment_date,
          pcr.updated_at as last_activity,
          pcr.title as content_title,
          pcr.id as content_id,
          'private_class' as content_type,
          pcr.status
        FROM private_class_requests pcr
        JOIN users u ON pcr.student_id = u.id
        WHERE pcr.teacher_name = $1
      `, [professorNameValue]);
      
      console.log('Private class students found:', privateClassStudents.rows.length);
      privateClassStudents.rows.forEach(row => {
        console.log(`  Student: ${row.name} - Request: ${row.content_title} - Status: ${row.status} - Date: ${row.enrollment_date}`);
      });
    }

    // Combine all students (like the API does)
    console.log('\n🔄 5. COMBINED RESULTS (All Students):');
    let allStudents = [
      ...courseStudents.rows,
      ...liveSessionStudents.rows,
      ...liveSectionStudents.rows
    ];
    
    if (professorNameValue) {
      const privateClassStudents = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar_url as avatar,
          pcr.created_at as enrollment_date,
          pcr.updated_at as last_activity,
          pcr.title as content_title,
          pcr.id as content_id,
          'private_class' as content_type,
          pcr.status
        FROM private_class_requests pcr
        JOIN users u ON pcr.student_id = u.id
        WHERE pcr.teacher_name = $1
      `, [professorNameValue]);
      
      allStudents = [...allStudents, ...privateClassStudents.rows];
    }
    
    console.log('Total combined students:', allStudents.length);
    
    // Group by student to see unique students
    const uniqueStudents = new Map();
    allStudents.forEach(student => {
      if (!uniqueStudents.has(student.id)) {
        uniqueStudents.set(student.id, {
          id: student.id,
          name: student.name,
          email: student.email,
          content_count: 0,
          courses: [],
          live_sessions: [],
          live_sections: [],
          private_classes: []
        });
      }
      
      const studentData = uniqueStudents.get(student.id);
      studentData.content_count++;
      
      switch (student.content_type) {
        case 'course':
          studentData.courses.push(student.content_title);
          break;
        case 'live_session':
          studentData.live_sessions.push(student.content_title);
          break;
        case 'live_section':
          studentData.live_sections.push(student.content_title);
          break;
        case 'private_class':
          studentData.private_classes.push({ title: student.content_title, status: student.status });
          break;
      }
    });
    
    console.log('\n📊 UNIQUE STUDENTS SUMMARY:');
    uniqueStudents.forEach((student, id) => {
      console.log(`\n👤 Student: ${student.name} (ID: ${id})`);
      console.log(`   Email: ${student.email}`);
      console.log(`   Total content: ${student.content_count}`);
      console.log(`   Courses: ${student.courses.length} - ${student.courses.join(', ')}`);
      console.log(`   Live Sessions: ${student.live_sessions.length} - ${student.live_sessions.join(', ')}`);
      console.log(`   Live Sections: ${student.live_sections.length} - ${student.live_sections.join(', ')}`);
      console.log(`   Private Classes: ${student.private_classes.length} - ${student.private_classes.map(pc => `${pc.title} (${pc.status})`).join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error testing my students API:', error);
  } finally {
    await pool.end();
  }
};

testMyStudentsAPI(); 