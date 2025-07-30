import express from 'express';
import { query, getRow, getRows } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get pending private classes count for professor
router.get('/pending-private-classes-count', verifyToken, async (req, res) => {
  try {
    const professorId = req.user.id;
    console.log('API called for professor ID:', professorId);
    
    const result = await getRows(`
      SELECT COUNT(*) as count
      FROM private_class_requests pcr
      WHERE pcr.teacher_name = (SELECT name FROM users WHERE id = $1)
      AND pcr.status = 'في الانتظار'
    `, [professorId]);

    console.log('Query result:', result);
    const count = parseInt(result[0]?.count || 0);
    console.log('Final count:', count);
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching pending private classes count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get professor dashboard statistics
router.get('/dashboard/stats', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const professorId = req.user.id;
    
    // Get basic course statistics
    const courseStats = await getRow(`
      SELECT 
        COUNT(*) as total_courses,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_courses,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_courses,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_courses,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_courses
      FROM courses 
      WHERE created_by = $1
    `, [professorId]);

    // Get total students enrolled in professor's courses
    const studentStats = await getRow(`
      SELECT 
        COUNT(DISTINCT sc.student_id) as total_students,
        COUNT(sc.id) as total_enrollments
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE c.created_by = $1
    `, [professorId]);

    // Get live sessions statistics
    const liveSessionStats = await getRow(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_sessions,
        COUNT(CASE WHEN status = 'live' THEN 1 END) as live_sessions,
        COUNT(CASE WHEN status = 'ended' THEN 1 END) as ended_sessions,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions
      FROM live_sessions 
      WHERE professor_id = $1
    `, [professorId]);

    // Get live sections statistics
    const liveSectionStats = await getRow(`
      SELECT 
        COUNT(*) as total_sections,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_sections,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_sections,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_sections
      FROM live_sections 
      WHERE professor_id = $1
    `, [professorId]);

    // Get private classes statistics
    const privateClassStats = await getRow(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'في الانتظار' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'مؤكد' THEN 1 END) as accepted_requests,
        COUNT(CASE WHEN status = 'مرفوض' THEN 1 END) as rejected_requests,
        COUNT(CASE WHEN status = 'مكتمل' THEN 1 END) as completed_requests
      FROM private_class_requests 
      WHERE teacher_name = (SELECT name FROM users WHERE id = $1)
    `, [professorId]);

    // Get comments statistics
    const commentStats = await getRow(`
      SELECT 
        COUNT(*) as total_comments,
        COUNT(CASE WHEN reply IS NOT NULL THEN 1 END) as replied_comments,
        COUNT(CASE WHEN reply IS NULL THEN 1 END) as pending_replies
      FROM course_comments cc
      JOIN courses c ON cc.course_id = c.id
      WHERE c.created_by = $1
    `, [professorId]);

    // Get quizzes statistics
    const quizStats = await getRow(`
      SELECT 
        COUNT(*) as total_quizzes,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_quizzes,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_quizzes,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_quizzes,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_quizzes
      FROM quizzes 
      WHERE created_by = $1
    `, [professorId]);

    // Get upcoming live sessions (next 7 days)
    const upcomingSessions = await getRows(`
      SELECT 
        id, title, description, start_time as scheduled_at, status, max_attendees as max_participants,
        (SELECT COUNT(*) FROM live_session_participants WHERE session_id = ls.id) as current_participants
      FROM live_sessions ls
      WHERE professor_id = $1 
        AND start_time >= NOW() 
        AND start_time <= NOW() + INTERVAL '7 days'
        AND status IN ('scheduled', 'live')
      ORDER BY start_time ASC
      LIMIT 5
    `, [professorId]);

    // Get recent activity (last 30 days) - expanded to include all types
    const recentActivity = await getRows(`
      SELECT 
        'course_created' as type,
        c.title as title,
        c.created_at as date,
        c.status as status,
        'Course created' as action_description
      FROM courses c
      WHERE c.created_by = $1 AND c.created_at >= NOW() - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'student_enrolled' as type,
        c.title as title,
        sc.buy_at as date,
        'enrolled' as status,
        'Student enrolled' as action_description
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE c.created_by = $1 AND sc.buy_at >= NOW() - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'live_session_created' as type,
        ls.title as title,
        ls.created_at as date,
        ls.status as status,
        'Live session created' as action_description
      FROM live_sessions ls
      WHERE ls.professor_id = $1 AND ls.created_at >= NOW() - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'live_section_created' as type,
        lsec.title as title,
        lsec.created_at as date,
        lsec.status as status,
        'Live section created' as action_description
      FROM live_sections lsec
      WHERE lsec.professor_id = $1 AND lsec.created_at >= NOW() - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'private_class_request' as type,
        pcr.title as title,
        pcr.created_at as date,
        pcr.status as status,
        'Private class request' as action_description
      FROM private_class_requests pcr
      WHERE pcr.teacher_name = (SELECT name FROM users WHERE id = $1) 
        AND pcr.created_at >= NOW() - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'quiz_created' as type,
        q.title as title,
        q.created_at as date,
        q.status as status,
        'Quiz created' as action_description
      FROM quizzes q
      WHERE q.created_by = $1 AND q.created_at >= NOW() - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'comment_received' as type,
        c.title as title,
        cc.created_at as date,
        'received' as status,
        'Comment received' as action_description
      FROM course_comments cc
      JOIN courses c ON cc.course_id = c.id
      WHERE c.created_by = $1 AND cc.created_at >= NOW() - INTERVAL '30 days'
      
      ORDER BY date DESC
      LIMIT 15
    `, [professorId]);

    // Get course performance (top courses by enrollment)
    const topCourses = await getRows(`
      SELECT 
        c.id,
        c.title,
        c.status,
        COUNT(sc.student_id) as enrollment_count,
        COALESCE(c.price, m.price, 0) as price
      FROM courses c
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      LEFT JOIN materials m ON c.material_id = m.id
      WHERE c.created_by = $1 AND c.status = 'approved'
      GROUP BY c.id, c.title, c.status, c.price, m.price
      ORDER BY enrollment_count DESC
      LIMIT 5
    `, [professorId]);

    // Get monthly trends (last 6 months)
    const monthlyTrends = await getRows(`
      SELECT 
        DATE_TRUNC('month', sc.buy_at) as month,
        COUNT(sc.id) as enrollments,
        COUNT(DISTINCT sc.student_id) as new_students
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE c.created_by = $1 
        AND sc.buy_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', sc.buy_at)
      ORDER BY month DESC
    `, [professorId]);

    res.json({
      courseStats,
      studentStats,
      liveSessionStats,
      liveSectionStats,
      privateClassStats,
      commentStats,
      quizStats,
      upcomingSessions,
      recentActivity,
      topCourses,
      monthlyTrends
    });
  } catch (error) {
    console.error('Error fetching professor dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all students for a professor across all content types
router.get('/students', verifyToken, async (req, res) => {
  try {
    const professorId = req.user.id;
    
    // Get students from courses
    const courseStudents = await getRows(`
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

    // Get students from live sessions (purchases table)
    const liveSessionStudents = await getRows(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url as avatar,
        p.purchased_at as enrollment_date,
        p.purchased_at as last_activity,
        ls.title as content_title,
        ls.id as content_id,
        'live_session' as content_type,
        'enrolled' as status
      FROM purchases p
      JOIN users u ON p.student_id = u.id
      JOIN live_sessions ls ON p.session_id = ls.id
      WHERE ls.professor_id = $1
    `, [professorId]);

    // Get students from live sections
    const liveSectionStudents = await getRows(`
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

    // Get students from private classes (only accepted and paid)
    const privateClassStudents = await getRows(`
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
      WHERE pcr.teacher_name = (SELECT name FROM users WHERE id = $1)
        AND pcr.status = 'مؤكد'
        AND pcr.payment_status = 'paid'
    `, [professorId]);

    // Combine all students
    const allStudents = [
      ...courseStudents,
      ...liveSessionStudents,
      ...liveSectionStudents,
      ...privateClassStudents
    ];

    res.json({ students: allStudents });
  } catch (error) {
    console.error('Error fetching professor students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending private classes count for professor
router.get('/pending-private-classes-count', verifyToken, async (req, res) => {
  try {
    const professorId = req.user.id;
    
    const result = await getRows(`
      SELECT COUNT(*) as count
      FROM private_class_requests pcr
      WHERE pcr.teacher_name = (SELECT name FROM users WHERE id = $1)
      AND pcr.status = 'في الانتظار'
    `, [professorId]);

    res.json({ count: parseInt(result[0]?.count || 0) });
  } catch (error) {
    console.error('Error fetching pending private classes count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 