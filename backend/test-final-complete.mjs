import pool from './db.js';

const testFinalComplete = async () => {
  try {
    console.log('🔍 Final Complete Test - All Fixes...\n');

    const professorId = 12;
    console.log(`📊 Testing for Professor ID: ${professorId}\n`);

    // Simulate the complete API logic with all fixes
    console.log('📚 1. COURSES:');
    const courseStudents = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        c.title as content_title
      FROM student_courses sc
      JOIN users u ON sc.student_id = u.id
      JOIN courses c ON sc.course_id = c.id
      WHERE c.created_by = $1
    `, [professorId]);
    
    console.log(`Course students: ${courseStudents.rows.length}`);

    console.log('\n🎥 2. LIVE SESSIONS (FIXED - purchases table):');
    const liveSessionStudents = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ls.title as content_title
      FROM purchases p
      JOIN users u ON p.student_id = u.id
      JOIN live_sessions ls ON p.session_id = ls.id
      WHERE ls.professor_id = $1
    `, [professorId]);
    
    console.log(`Live session students: ${liveSessionStudents.rows.length}`);

    console.log('\n📖 3. LIVE SECTIONS:');
    const liveSectionStudents = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ls.title as content_title
      FROM live_section_purchases lsp
      JOIN users u ON lsp.student_id = u.id
      JOIN live_sections ls ON lsp.live_section_id = ls.id
      WHERE ls.professor_id = $1
    `, [professorId]);
    
    console.log(`Live section students: ${liveSectionStudents.rows.length}`);

    console.log('\n👥 4. PRIVATE CLASSES (FIXED - only accepted and paid):');
    const professorName = await pool.query('SELECT name FROM users WHERE id = $1', [professorId]);
    const professorNameValue = professorName.rows[0]?.name;
    
    if (professorNameValue) {
      const privateClassStudents = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          pcr.title as content_title,
          pcr.status,
          pcr.payment_status
        FROM private_class_requests pcr
        JOIN users u ON pcr.student_id = u.id
        WHERE pcr.teacher_name = $1
          AND pcr.status = 'مؤكد'
          AND pcr.payment_status = 'paid'
      `, [professorNameValue]);
      
      console.log(`Private class students: ${privateClassStudents.rows.length}`);
      privateClassStudents.rows.forEach(row => {
        console.log(`  ${row.name}: ${row.content_title} (${row.status}, ${row.payment_status})`);
      });
    }

    // Summary
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`Courses: ${courseStudents.rows.length}`);
    console.log(`Live Sessions: ${liveSessionStudents.rows.length}`);
    console.log(`Live Sections: ${liveSectionStudents.rows.length}`);
    console.log(`Private Classes: ${professorNameValue ? privateClassStudents.rows.length : 0}`);
    console.log(`Total: ${courseStudents.rows.length + liveSessionStudents.rows.length + liveSectionStudents.rows.length + (professorNameValue ? privateClassStudents.rows.length : 0)}`);

    // Group by student
    const allStudents = [
      ...courseStudents.rows,
      ...liveSessionStudents.rows,
      ...liveSectionStudents.rows,
      ...(professorNameValue ? privateClassStudents.rows : [])
    ];
    
    const uniqueStudents = new Map();
    allStudents.forEach(student => {
      if (!uniqueStudents.has(student.id)) {
        uniqueStudents.set(student.id, {
          id: student.id,
          name: student.name,
          email: student.email,
          course_count: 0,
          live_session_count: 0,
          live_section_count: 0,
          private_class_count: 0,
          total_count: 0
        });
      }
      
      const studentData = uniqueStudents.get(student.id);
      studentData.total_count++;
      
      // Determine content type based on the query source
      if (courseStudents.rows.some(cs => cs.id === student.id && cs.content_title === student.content_title)) {
        studentData.course_count++;
      } else if (liveSessionStudents.rows.some(ls => ls.id === student.id && ls.content_title === student.content_title)) {
        studentData.live_session_count++;
      } else if (liveSectionStudents.rows.some(lsp => lsp.id === student.id && lsp.content_title === student.content_title)) {
        studentData.live_section_count++;
      } else if (professorNameValue && privateClassStudents.rows.some(pc => pc.id === student.id && pc.content_title === student.content_title)) {
        studentData.private_class_count++;
      }
    });
    
    console.log(`\n👥 UNIQUE STUDENTS: ${uniqueStudents.size}`);
    uniqueStudents.forEach((student, id) => {
      console.log(`\n👤 ${student.name} (ID: ${id})`);
      console.log(`   Email: ${student.email}`);
      console.log(`   Courses: ${student.course_count}`);
      console.log(`   Live Sessions: ${student.live_session_count}`);
      console.log(`   Live Sections: ${student.live_section_count}`);
      console.log(`   Private Classes: ${student.private_class_count}`);
      console.log(`   Total: ${student.total_count}`);
    });

  } catch (error) {
    console.error('❌ Error in final complete test:', error);
  } finally {
    await pool.end();
  }
};

testFinalComplete(); 