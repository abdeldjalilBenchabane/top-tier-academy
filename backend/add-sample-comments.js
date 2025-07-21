import pool from './db.js';

const addSampleComments = async () => {
  try {
    // First, let's get a student user and some courses
    const studentResult = await pool.query('SELECT id, name FROM users WHERE role = $1 LIMIT 1', ['student']);
    const courseResult = await pool.query('SELECT id, title FROM courses LIMIT 3');
    
    if (studentResult.rows.length === 0) {
      console.log('No student found in database');
      return;
    }
    
    if (courseResult.rows.length === 0) {
      console.log('No courses found in database');
      return;
    }
    
    const student = studentResult.rows[0];
    const courses = courseResult.rows;
    
    console.log(`Adding sample comments for student: ${student.name} (ID: ${student.id})`);
    
    // Sample comments data
    const sampleComments = [
      {
        course_id: courses[0].id,
        comment: 'هذا الكورس ممتاز جداً! تعلمت الكثير من المحتوى المفيد.',
        tab: 'content',
        rating: 5
      },
      {
        course_id: courses[0].id,
        comment: 'المحتوى واضح وسهل الفهم، شكراً للمعلم!',
        tab: 'content',
        rating: 4
      },
      {
        course_id: courses[1]?.id || courses[0].id,
        comment: 'أحتاج إلى مزيد من التوضيح في هذا الجزء.',
        tab: 'content',
        rating: 3
      },
      {
        course_id: courses[2]?.id || courses[0].id,
        comment: 'التمارين مفيدة جداً وتساعد في الفهم.',
        tab: 'exercises',
        rating: 5
      }
    ];
    
    // Insert sample comments
    for (const commentData of sampleComments) {
      const result = await pool.query(
        `INSERT INTO course_comments (user_id, course_id, name, comment, tab, rating, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
         RETURNING id`,
        [student.id, commentData.course_id, student.name, commentData.comment, commentData.tab, commentData.rating]
      );
      
      const commentId = result.rows[0].id;
      console.log(`Added comment ID: ${commentId}`);
      
      // Add some sample replies to the first comment
      if (commentData.comment.includes('ممتاز')) {
        const professorResult = await pool.query('SELECT id, name FROM users WHERE role = $1 LIMIT 1', ['professor']);
        if (professorResult.rows.length > 0) {
          const professor = professorResult.rows[0];
          
          // Add professor reply
          await pool.query(
            `INSERT INTO comment_replies (comment_id, user_id, user_name, reply_text, user_role, created_at) 
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [commentId, professor.id, professor.name, 'شكراً لك! سعيد أن الكورس أفادك.', 'professor']
          );
          
          // Add another student reply
          await pool.query(
            `INSERT INTO comment_replies (comment_id, user_id, user_name, reply_text, user_role, created_at) 
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [commentId, student.id, student.name, 'أوافقك الرأي تماماً!', 'student']
          );
          
          console.log(`Added replies to comment ID: ${commentId}`);
        }
      }
    }
    
    console.log('Sample comments added successfully!');
    
  } catch (error) {
    console.error('Error adding sample comments:', error);
  } finally {
    await pool.end();
  }
};

addSampleComments(); 