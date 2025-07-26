import express from 'express';
import pool from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get approved courses for the logged-in professor
router.get('/professor/courses', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const professorId = parseInt(req.user.id);
    const result = await pool.query(
      `SELECT c.id, c.title,
              m.name as material_name,
              s.name as speciality_name,
              y.name as year_name,
              l.name as level_name,
              c.language_level_id,
              lang.name as language_name,
              ll.name as language_level_name
       FROM courses c
       LEFT JOIN materials m ON c.material_id = m.id
       LEFT JOIN specialities s ON m.speciality_id = s.id
       LEFT JOIN years y ON COALESCE(s.year_id, m.year_id) = y.id
       LEFT JOIN levels l ON y.level_id = l.id
       LEFT JOIN language_levels ll ON c.language_level_id = ll.id
       LEFT JOIN languages lang ON ll.language_id = lang.id
       WHERE c.created_by = $1 AND c.status = 'approved'
       ORDER BY c.title ASC`,
      [professorId]
    );
    
    // Format the course path - handle different path types
    const coursesWithPath = result.rows.map(course => {
      let path = '';
      
      // Check if it's a language course (has language_level_id but no material_id)
      if (course.language_level_id && !course.material_name) {
        // 2-path: Language - Level
        path = [course.language_name, course.language_level_name].filter(Boolean).join(' - ');
      } else if (course.material_name && !course.speciality_name) {
        // 3-path: Level - Year - Material (no speciality)
        path = [course.level_name, course.year_name, course.material_name].filter(Boolean).join(' - ');
      } else if (course.material_name && course.speciality_name) {
        // 4-path: Level - Year - Speciality - Material
        path = [course.level_name, course.year_name, course.speciality_name, course.material_name].filter(Boolean).join(' - ');
      } else {
        // Fallback: just show what we have
        path = [course.level_name, course.year_name, course.speciality_name, course.material_name].filter(Boolean).join(' - ');
      }
      
      return {
        id: course.id,
        title: course.title,
        path: path
      };
    });
    
    res.json(coursesWithPath);
  } catch (err) {
    console.error('Error fetching professor courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Create a new quiz (professor)
router.post('/', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const { title, description, course_id, questions, time_limit, passing_score, max_attempts } = req.body;
    if (!title || !course_id || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const professorId = parseInt(req.user.id);
    const quizResult = await pool.query(
      `INSERT INTO quizzes (title, description, course_id, created_by, status, time_limit, passing_score, max_attempts)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7) RETURNING id`,
      [title, description, course_id, professorId, time_limit, passing_score, max_attempts]
    );
    const quizId = quizResult.rows[0].id;
    // Insert questions and answers
    for (const [qIndex, q] of questions.entries()) {
      const questionRes = await pool.query(
        `INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, explanation, "order")
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [quizId, q.question, q.type, q.points || 1, q.explanation || '', qIndex]
      );
      const questionId = questionRes.rows[0].id;
      if (q.type === 'multiple-choice' && Array.isArray(q.options)) {
        for (const [optIndex, opt] of q.options.entries()) {
          await pool.query(
            `INSERT INTO quiz_answers (question_id, answer_text, is_correct, "order") VALUES ($1, $2, $3, $4)`,
            [questionId, opt, q.correctAnswer === optIndex, optIndex]
          );
        }
      } else if (q.type === 'true-false') {
        await pool.query(
          `INSERT INTO quiz_answers (question_id, answer_text, is_correct, "order") VALUES ($1, $2, $3, 0), ($1, $4, $5, 1)`,
          [questionId, 'True', q.correctAnswer === true, 'False', q.correctAnswer === false]
        );
      } // short-answer: no answers table entry needed
    }
    res.status(201).json({ id: quizId });
  } catch (err) {
    console.error('Quiz creation error:', err);
    res.status(500).json({ error: 'Failed to create quiz', details: err.message });
  }
});

// Admin: get all pending quizzes
router.get('/admin/quizzes', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.*, c.title as course_title, u.name as professor_name,
              m.name as material_name, m.speciality_id, m.year_id,
              s.name as speciality_name,
              y.name as year_name,
              l.name as level_name
       FROM quizzes q
       JOIN courses c ON q.course_id = c.id
       JOIN users u ON q.created_by = u.id
       LEFT JOIN materials m ON c.material_id = m.id
       LEFT JOIN specialities s ON m.speciality_id = s.id
       LEFT JOIN years y ON COALESCE(s.year_id, m.year_id) = y.id
       LEFT JOIN levels l ON y.level_id = l.id
       ORDER BY q.created_at DESC`
    );
    
    // Fetch questions and answers for each quiz
    const quizzesWithQuestions = await Promise.all(
      result.rows.map(async (quiz) => {
        const questionsResult = await pool.query(
          `SELECT qq.*, 
                  array_agg(qa.answer_text ORDER BY qa."order") as options,
                  array_agg(qa.is_correct ORDER BY qa."order") as correct_flags
           FROM quiz_questions qq
           LEFT JOIN quiz_answers qa ON qq.id = qa.question_id
           WHERE qq.quiz_id = $1
           GROUP BY qq.id, qq.question_text, qq.question_type, qq.points, qq.explanation, qq."order"
           ORDER BY qq."order"`,
          [quiz.id]
        );
        
        const questions = questionsResult.rows.map(q => {
          const question = {
            id: q.id,
            question: q.question_text,
            type: q.question_type,
            points: q.points,
            explanation: q.explanation,
            options: q.options && q.options.length > 0 ? q.options : undefined,
            correctAnswer: q.question_type === 'multiple-choice' || q.question_type === 'true-false' 
              ? q.correct_flags.findIndex((flag, index) => flag) 
              : null
          };
          return question;
        });
        
        return {
          ...quiz,
          questions,
          courseTitle: quiz.course_title,
          professorName: quiz.professor_name
        };
      })
    );
    
    res.json(quizzesWithQuestions);
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Admin: approve quiz
router.patch('/admin/quizzes/:id/approve', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const quizId = req.params.id;
    await pool.query(
      `UPDATE quizzes SET status = 'approved', approved_at = NOW(), approved_by = $1 WHERE id = $2`,
      [parseInt(req.user.id), quizId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve quiz' });
  }
});

// Admin: reject quiz
router.patch('/admin/quizzes/:id/reject', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const quizId = req.params.id;
    const { reason } = req.body;
    await pool.query(
      `UPDATE quizzes SET status = 'rejected', rejection_reason = $1, rejected_at = NOW() WHERE id = $2`,
      [reason || '', quizId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject quiz' });
  }
});

// Student: get approved quizzes for a course
router.get('/courses/:id/quizzes', verifyToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Fetching quizzes for course ID:', courseId);
    
    const result = await pool.query(
      `SELECT * FROM quizzes WHERE course_id = $1 AND status = 'approved'`,
      [courseId]
    );
    
    console.log(`Found ${result.rows.length} approved quizzes for course ${courseId}:`, result.rows.map(q => ({ id: q.id, title: q.title, status: q.status })));
    
    // Fetch questions for each quiz (without answers for students)
    const quizzesWithQuestions = await Promise.all(
      result.rows.map(async (quiz) => {
        const questionsResult = await pool.query(
          `SELECT id, question_text, question_type, points, explanation, "order"
           FROM quiz_questions 
           WHERE quiz_id = $1
           ORDER BY "order"`,
          [quiz.id]
        );
        
        const questions = await Promise.all(questionsResult.rows.map(async (q) => {
          // Get options for multiple choice questions
          let options = undefined;
          if (q.question_type === 'multiple-choice' || q.question_type === 'true-false') {
            const optionsResult = await pool.query(
              `SELECT answer_text FROM quiz_answers WHERE question_id = $1 ORDER BY "order"`,
              [q.id]
            );
            options = optionsResult.rows.map(row => row.answer_text);
          }
          
          return {
            id: q.id,
            question: q.question_text,
            type: q.question_type,
            points: q.points,
            explanation: q.explanation,
            options: options
          };
        }));
        
        return {
          ...quiz,
          questions
        };
      })
    );
    
    res.json(quizzesWithQuestions);
  } catch (err) {
    console.error('Error fetching course quizzes:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Student: start a quiz attempt
router.post('/attempts/start', verifyToken, requireRole(['student']), async (req, res) => {
  try {
    console.log('Starting quiz attempt with body:', req.body);
    const { quizId } = req.body;
    const studentId = parseInt(req.user.id);
    
    console.log('Quiz ID:', quizId, 'Student ID:', studentId);
    
    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID is required' });
    }
    
    // Check if quiz exists and is approved
    const quizExists = await pool.query(
      `SELECT id, status FROM quizzes WHERE id = $1`,
      [quizId]
    );
    
    if (quizExists.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    if (quizExists.rows[0].status !== 'approved') {
      return res.status(400).json({ error: 'Quiz is not approved yet' });
    }
    
    // Check if student already attempted this quiz
    const existingAttempt = await pool.query(
      `SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2`,
      [quizId, studentId]
    );
    
    let attemptId;
    
    if (existingAttempt.rows.length > 0) {
      // Update existing attempt - reset it for retake
      const existingId = existingAttempt.rows[0].id;
      await pool.query(
        `UPDATE quiz_attempts SET 
         score = 0, 
         total_points = 0, 
         passed = false, 
         started_at = NOW(), 
         completed_at = NULL,
         time_spent = 0
         WHERE id = $1`,
        [existingId]
      );
      
      // Delete previous answers
      await pool.query(
        `DELETE FROM quiz_attempt_answers WHERE attempt_id = $1`,
        [existingId]
      );
      
      attemptId = existingId;
      console.log('Updated existing quiz attempt with ID:', attemptId);
    } else {
      // Create new attempt
      const attemptResult = await pool.query(
        `INSERT INTO quiz_attempts (quiz_id, user_id, started_at) VALUES ($1, $2, NOW()) RETURNING id`,
        [quizId, studentId]
      );
      attemptId = attemptResult.rows[0].id;
      console.log('Created new quiz attempt with ID:', attemptId);
    }
    
    res.json({ attemptId: attemptId });
  } catch (err) {
    console.error('Error starting quiz attempt:', err);
    res.status(500).json({ error: 'Failed to start quiz attempt' });
  }
});

// Student: submit quiz answers
router.post('/attempts/:attemptId/submit', verifyToken, requireRole(['student']), async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const studentId = parseInt(req.user.id);
    
    // Verify attempt belongs to student
    const attemptResult = await pool.query(
      `SELECT qa.*, q.passing_score, q.time_limit FROM quiz_attempts qa 
       JOIN quizzes q ON qa.quiz_id = q.id 
       WHERE qa.id = $1 AND qa.user_id = $2`,
      [attemptId, studentId]
    );
    
    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    
    const attempt = attemptResult.rows[0];
    
    // Calculate score
    let totalScore = 0;
    let totalPoints = 0;
    
    for (const answer of answers) {
      const questionResult = await pool.query(
        `SELECT * FROM quiz_questions WHERE id = $1`,
        [answer.questionId]
      );
      
      if (questionResult.rows.length === 0) continue;
      
      const question = questionResult.rows[0];
      totalPoints += question.points;
      
      // Check if answer is correct
      let isCorrect = false;
      if (question.question_type === 'multiple-choice' || question.question_type === 'true-false') {
        const correctAnswerResult = await pool.query(
          `SELECT answer_text FROM quiz_answers WHERE question_id = $1 AND is_correct = true`,
          [answer.questionId]
        );
        
        if (correctAnswerResult.rows.length > 0) {
          const correctAnswer = correctAnswerResult.rows[0].answer_text;
          console.log(`Question ${answer.questionId}: Student answered "${answer.answer}", Correct answer is "${correctAnswer}", Match: ${answer.answer === correctAnswer}`);
          
          // Handle type conversion for true/false questions
          if (question.question_type === 'true-false') {
            const studentAnswerBool = answer.answer === 'true';
            const correctAnswerBool = correctAnswer === 'True';
            isCorrect = studentAnswerBool === correctAnswerBool;
            console.log(`True/False conversion: Student=${studentAnswerBool}, Correct=${correctAnswerBool}, Match=${isCorrect}`);
          } else {
            isCorrect = answer.answer === correctAnswer;
          }
        } else {
          console.log(`Question ${answer.questionId}: No correct answer found in database`);
        }
      } else {
        // For short-answer, we'll need manual grading
        isCorrect = false; // Default to false for manual review
      }
      
      const pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;
      
      // Save student answer
      await pool.query(
        `INSERT INTO quiz_attempt_answers (attempt_id, question_id, student_answer, is_correct, points_earned) 
         VALUES ($1, $2, $3, $4, $5)`,
        [attemptId, answer.questionId, answer.answer, isCorrect, pointsEarned]
      );
    }
    
    // Calculate percentage and check if passed
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    const passed = percentage >= attempt.passing_score;
    
    // Update attempt with results
    await pool.query(
      `UPDATE quiz_attempts SET score = $1, total_points = $2, passed = $3, completed_at = NOW() 
       WHERE id = $4`,
      [percentage, totalPoints, passed, attemptId]
    );
    
    res.json({
      score: percentage,
      totalPoints,
      passed,
      correctAnswers: totalScore,
      totalQuestions: answers.length
    });
  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Student: get quiz attempt results
router.get('/attempts/:attemptId/results', verifyToken, requireRole(['student']), async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = parseInt(req.user.id);
    
    // Get attempt details
    const attemptResult = await pool.query(
      `SELECT qa.*, q.title as quiz_title, q.description as quiz_description 
       FROM quiz_attempts qa 
       JOIN quizzes q ON qa.quiz_id = q.id 
       WHERE qa.id = $1 AND qa.user_id = $2`,
      [attemptId, studentId]
    );
    
    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    
    const attempt = attemptResult.rows[0];
    
    // Get student answers with correct answers
    const answersResult = await pool.query(
      `SELECT qaa.*, qq.question_text, qq.question_type, qq.points, qq.explanation,
              qa.answer_text as correct_answer
       FROM quiz_attempt_answers qaa
       JOIN quiz_questions qq ON qaa.question_id = qq.id
       LEFT JOIN quiz_answers qa ON qq.id = qa.question_id AND qa.is_correct = true
       WHERE qaa.attempt_id = $1
       ORDER BY qq."order"`,
      [attemptId]
    );
    
    res.json({
      attempt: {
        id: attempt.id,
        quizTitle: attempt.quiz_title,
        quizDescription: attempt.quiz_description,
        score: attempt.score,
        totalPoints: attempt.total_points,
        passed: attempt.passed,
        startedAt: attempt.started_at,
        completedAt: attempt.completed_at
      },
      answers: answersResult.rows.map(row => ({
        questionId: row.question_id,
        question: row.question_text,
        type: row.question_type,
        studentAnswer: row.student_answer,
        correctAnswer: row.correct_answer,
        isCorrect: row.is_correct,
        points: row.points,
        pointsEarned: row.points_earned,
        explanation: row.explanation
      }))
    });
  } catch (err) {
    console.error('Error fetching quiz results:', err);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
});

// Professor: get quiz results for their quizzes
router.get('/professor/results', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const professorId = parseInt(req.user.id);
    
    // Get all quizzes created by professor
    const quizzesResult = await pool.query(
      `SELECT q.*, c.title as course_title,
              COUNT(DISTINCT qa.id) as total_attempts,
              COALESCE(AVG(qa.score), 0) as average_score,
              COUNT(CASE WHEN qa.passed = true THEN 1 END) as passed_attempts
       FROM quizzes q
       JOIN courses c ON q.course_id = c.id
       LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
       WHERE q.created_by = $1
       GROUP BY q.id, c.title
       ORDER BY q.created_at DESC`,
      [professorId]
    );
    
    // Get detailed results for each quiz
    const quizzesWithResults = await Promise.all(
      quizzesResult.rows.map(async (quiz) => {
        const attemptsResult = await pool.query(
          `SELECT qa.*, u.name as student_name, u.email as student_email,
                  COALESCE(qa.score, 0) as score,
                  COALESCE(qa.total_points, 0) as total_points,
                  COALESCE(qa.passed, false) as passed
           FROM quiz_attempts qa
           JOIN users u ON qa.user_id = u.id
           WHERE qa.quiz_id = $1
           ORDER BY qa.completed_at DESC`,
          [quiz.id]
        );
        
        return {
          ...quiz,
          attempts: attemptsResult.rows.map(attempt => ({
            id: attempt.id,
            studentName: attempt.student_name,
            studentEmail: attempt.student_email,
            score: attempt.score,
            totalPoints: attempt.total_points,
            passed: attempt.passed,
            startedAt: attempt.started_at,
            completedAt: attempt.completed_at
          }))
        };
      })
    );
    
    console.log('Professor results being sent:', quizzesWithResults.map(q => ({
      id: q.id,
      title: q.title,
      totalAttempts: q.total_attempts,
      averageScore: q.average_score,
      passedAttempts: q.passed_attempts,
      attempts: q.attempts?.map(a => ({
        id: a.id,
        score: a.score,
        passed: a.passed
      }))
    })));
    res.json(quizzesWithResults);
  } catch (err) {
    console.error('Error fetching professor results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Get my quizzes (for professors)
router.get('/my-quizzes', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const professorId = req.user.id;
    
    const quizzesResult = await pool.query(
      `SELECT q.*, c.title as course_title,
              CASE 
                WHEN q.status = 'approved' THEN true 
                ELSE false 
              END as is_approved
       FROM quizzes q
       JOIN courses c ON q.course_id = c.id
       WHERE q.created_by = $1
       ORDER BY q.created_at DESC`,
      [professorId]
    );

    const quizzesWithQuestions = await Promise.all(
      quizzesResult.rows.map(async (quiz) => {
        const questionsResult = await pool.query(
          `SELECT qq.* FROM quiz_questions qq WHERE qq.quiz_id = $1 ORDER BY qq."order"`,
          [quiz.id]
        );
        console.log(`Quiz ${quiz.id} - Found ${questionsResult.rows.length} questions:`, questionsResult.rows.map(q => ({ id: q.id, question: q.question_text, type: q.question_type })));

        const questions = await Promise.all(questionsResult.rows.map(async (q) => {
          let options = undefined;
          let correctAnswer = undefined;
          
          if (q.question_type === 'multiple-choice' || q.question_type === 'true-false') {
            const optionsResult = await pool.query(
              `SELECT answer_text FROM quiz_answers WHERE question_id = $1 ORDER BY "order"`,
              [q.id]
            );
            options = optionsResult.rows.map(row => row.answer_text);
            
            // Get correct answer
            const correctAnswerResult = await pool.query(
              `SELECT answer_text FROM quiz_answers WHERE question_id = $1 AND is_correct = true`,
              [q.id]
            );
            if (correctAnswerResult.rows.length > 0) {
              if (q.question_type === 'true-false') {
                // Convert string to boolean for true/false questions
                correctAnswer = correctAnswerResult.rows[0].answer_text === 'True';
              } else if (q.question_type === 'multiple-choice') {
                // For multiple choice, find the index of the correct answer
                const correctIndex = options.findIndex(option => option === correctAnswerResult.rows[0].answer_text);
                correctAnswer = correctIndex >= 0 ? correctIndex : 0;
              } else {
                correctAnswer = correctAnswerResult.rows[0].answer_text;
              }
            }
          } else {
            // For short answer, get the correct answer
            const correctAnswerResult = await pool.query(
              `SELECT answer_text FROM quiz_answers WHERE question_id = $1 AND is_correct = true`,
              [q.id]
            );
            if (correctAnswerResult.rows.length > 0) {
              correctAnswer = correctAnswerResult.rows[0].answer_text;
            }
          }
          
          return {
            id: q.id,
            question: q.question_text,
            type: q.question_type,
            points: q.points,
            explanation: q.explanation,
            options: options,
            correctAnswer: correctAnswer
          };
        }));

        return {
          ...quiz,
          questions: questions
        };
      })
    );

    res.json(quizzesWithQuestions);
  } catch (err) {
    console.error('Error fetching my quizzes:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Update quiz
router.put('/:id', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const { id } = req.params;
    const professorId = req.user.id;
    const { title, description, course_id, questions, timeLimit, passingScore, maxAttempts } = req.body;
    
    // Check if quiz exists and belongs to professor
    const quizResult = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1 AND created_by = $2',
      [id, professorId]
    );
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found or access denied' });
    }
    
    // Update quiz basic info
    console.log('Update quiz parameters:', { title, description, course_id, timeLimit, passingScore, maxAttempts, id });
    
    // Handle null/undefined values
    const updateParams = [
      title || '',
      description || '',
      course_id || null,
      timeLimit || null,
      passingScore || 70,
      maxAttempts || null,
      id
    ];
    
    console.log('Processed parameters:', updateParams);
    
    // Use a fresh query to avoid parameter count issues
    const updateQuery = `
      UPDATE quizzes SET 
        title = $1, 
        description = $2, 
        course_id = $3, 
        time_limit = $4, 
        passing_score = $5, 
        max_attempts = $6
      WHERE id = $7
    `;
    
    console.log('Update query:', updateQuery);
    console.log('Parameters count:', updateParams.length);
    
    try {
      await pool.query(updateQuery, updateParams);
      console.log('✅ Quiz basic info updated successfully');
    } catch (error) {
      console.error('❌ Error updating quiz basic info:', error);
      throw error;
    }
    
    // Delete existing questions and answers
    try {
      await pool.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [id]);
      console.log('✅ Existing questions deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting existing questions:', error);
      throw error;
    }
    
    // Insert new questions and answers
    console.log('Inserting questions:', questions.length);
    for (const question of questions) {
      console.log('Inserting question:', question);
      try {
        const questionResult = await pool.query(
          `INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, explanation, "order") 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [id, question.question, question.type, question.points, question.explanation || '', 1]
        );
        console.log('✅ Question inserted successfully, ID:', questionResult.rows[0].id);
        
        const questionId = questionResult.rows[0].id;
        
        if (question.type === 'multiple-choice' && question.options) {
          console.log('Inserting multiple-choice answers for question:', questionId);
          for (let i = 0; i < question.options.length; i++) {
            const isCorrect = question.correctAnswer === i;
            try {
              await pool.query(
                `INSERT INTO quiz_answers (question_id, answer_text, is_correct, "order") 
                 VALUES ($1, $2, $3, $4)`,
                [questionId, question.options[i], isCorrect, i + 1]
              );
              console.log(`✅ Answer ${i + 1} inserted:`, question.options[i], 'Correct:', isCorrect);
            } catch (error) {
              console.error(`❌ Error inserting answer ${i + 1}:`, error);
              throw error;
            }
          }
        } else if (question.type === 'true-false') {
          console.log('Inserting true-false answers for question:', questionId);
          try {
            // Insert True answer
            await pool.query(
              `INSERT INTO quiz_answers (question_id, answer_text, is_correct, "order") 
               VALUES ($1, $2, $3, $4)`,
              [questionId, 'True', question.correctAnswer === true, 1]
            );
            
            // Insert False answer
            await pool.query(
              `INSERT INTO quiz_answers (question_id, answer_text, is_correct, "order") 
               VALUES ($1, $2, $3, $4)`,
              [questionId, 'False', question.correctAnswer === false, 2]
            );
            
            console.log('✅ True-false answers inserted successfully');
          } catch (error) {
            console.error('❌ Error inserting true-false answers:', error);
            throw error;
          }
        } else if (question.type === 'short-answer') {
          console.log('Inserting short-answer for question:', questionId);
          try {
            await pool.query(
              `INSERT INTO quiz_answers (question_id, answer_text, is_correct, "order") 
               VALUES ($1, $2, $3, $4)`,
              [questionId, question.correctAnswer, true, 1]
            );
            console.log('✅ Short-answer inserted successfully');
          } catch (error) {
            console.error('❌ Error inserting short-answer:', error);
            throw error;
          }
        }
      } catch (error) {
        console.error('❌ Error inserting question:', error);
        throw error;
      }
    }
    
    res.json({ message: 'Quiz updated successfully' });
  } catch (err) {
    console.error('Error updating quiz:', err);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete quiz
router.delete('/:id', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const quizId = req.params.id;
    const professorId = req.user.id;

    // Check if quiz belongs to the professor
    const quizCheck = await pool.query(
      `SELECT id FROM quizzes WHERE id = $1 AND created_by = $2`,
      [quizId, professorId]
    );

    if (quizCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found or access denied' });
    }

    // Delete quiz (cascade will handle related records)
    await pool.query(`DELETE FROM quizzes WHERE id = $1`, [quizId]);

    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error('Error deleting quiz:', err);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

export default router; 