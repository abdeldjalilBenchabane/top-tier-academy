import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getRow, getRows, query } from '../db.js';

const router = express.Router();

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Helper function to safely get count with fallback
const safeGetCount = async (query, fallback = 0) => {
  try {
    const result = await getRow(query);
    return parseInt(result?.count || fallback);
  } catch (error) {
    console.error('Error in safeGetCount:', error);
    return fallback;
  }
};

// Helper function to safely get sum with fallback
const safeGetSum = async (query, fallback = 0) => {
  try {
    const result = await getRow(query);
    return parseFloat(result?.total || result?.sum || fallback);
  } catch (error) {
    console.error('Error in safeGetSum:', error);
    return fallback;
  }
};

// GET /api/admin/test-tables - Test endpoint to check what tables exist
router.get('/test-tables', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('Testing database tables...');
    
    // Get all tables in the database
    const tables = await getRows(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tableNames = tables.map(t => t.table_name);
    
    // Test specific tables that we need
    const requiredTables = [
      'users', 'courses', 'pending_courses', 'live_sessions', 
      'point_transactions', 'enhanced_slides', 'quizzes', 
      'private_class_requests'
    ];
    
    const existingTables = requiredTables.filter(table => tableNames.includes(table));
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    res.json({
      allTables: tableNames,
      requiredTables: requiredTables,
      existingTables: existingTables,
      missingTables: missingTables,
      totalTables: tableNames.length
    });
  } catch (error) {
    console.error('Error testing tables:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// GET /api/admin/dashboard/stats - Get admin dashboard statistics
router.get('/dashboard/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching admin dashboard stats...');
    
    // Get total users count (without is_active filter)
    const totalUsers = await safeGetCount('SELECT COUNT(*) as count FROM users');
    
    // Get users by role (without is_active filter)
    let usersByRole = [];
    try {
      usersByRole = await getRows(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role
      `);
    } catch (error) {
      console.error('Error getting users by role:', error);
      usersByRole = [];
    }
    
    // Get total courses count (without is_active filter)
    const totalCourses = await safeGetCount('SELECT COUNT(*) as count FROM courses');
    
    // Get total pending approvals (courses + live sections only, no private requests)
    const pendingCourses = await safeGetCount('SELECT COUNT(*) as count FROM courses WHERE status = \'pending\'');
    const pendingLiveSections = await safeGetCount('SELECT COUNT(*) as count FROM live_sections WHERE status = \'pending\'');
    const totalPendingApprovals = pendingCourses + pendingLiveSections;
    
    // Get total live sessions count
    const totalLiveSessions = await safeGetCount('SELECT COUNT(*) as count FROM live_sessions');
    
    // Get total revenue from point transactions
    const totalRevenue = await safeGetSum(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM point_transactions 
      WHERE status = 'completed' AND transaction_type = 'purchase'
    `);
    
    // Get this month's revenue
    const thisMonthRevenue = await safeGetSum(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM point_transactions 
      WHERE status = 'completed' 
        AND transaction_type = 'purchase' 
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    // Get last month's revenue for comparison
    const lastMonthRevenue = await safeGetSum(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM point_transactions 
      WHERE status = 'completed' 
        AND transaction_type = 'purchase' 
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    // Get total slides count
    const totalSlides = await safeGetCount('SELECT COUNT(*) as count FROM enhanced_slides');
    
    // Get active slides count
    const activeSlides = await safeGetCount('SELECT COUNT(*) as count FROM enhanced_slides WHERE is_active = true');
    
    // Get total quizzes count
    const totalQuizzes = await safeGetCount('SELECT COUNT(*) as count FROM quizzes');
    
    // Get pending quizzes count (with fallback since is_approved column might not exist)
    let pendingQuizzes = 0;
    try {
      pendingQuizzes = await safeGetCount('SELECT COUNT(*) as count FROM quizzes WHERE is_approved = false');
    } catch (error) {
      console.log('is_approved column not found in quizzes table, using 0 as pending');
      pendingQuizzes = 0;
    }
    
    // Get total private class requests
    const totalPrivateRequests = await safeGetCount('SELECT COUNT(*) as count FROM private_class_requests');
    
    // Calculate revenue growth percentage
    const currentRevenue = parseFloat(thisMonthRevenue || 0);
    const previousRevenue = parseFloat(lastMonthRevenue || 0);
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    // Get user growth (new users this month vs last month)
    const thisMonthUsers = await safeGetCount(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    const lastMonthUsers = await safeGetCount(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    const currentUsers = parseInt(thisMonthUsers || 0);
    const previousUsers = parseInt(lastMonthUsers || 0);
    const userGrowth = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;
    
    // Get course growth
    const thisMonthCourses = await safeGetCount(`
      SELECT COUNT(*) as count 
      FROM courses 
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    const lastMonthCourses = await safeGetCount(`
      SELECT COUNT(*) as count 
      FROM courses 
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    const currentCourses = parseInt(thisMonthCourses || 0);
    const previousCourses = parseInt(lastMonthCourses || 0);
    const courseGrowth = previousCourses > 0 ? ((currentCourses - previousCourses) / previousCourses) * 100 : 0;
    
    // Get pending approvals growth
    const thisMonthPending = await safeGetCount(`
      SELECT COUNT(*) as count 
      FROM pending_courses 
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    const lastMonthPending = await safeGetCount(`
      SELECT COUNT(*) as count 
      FROM pending_courses 
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    const currentPending = parseInt(thisMonthPending || 0);
    const previousPending = parseInt(lastMonthPending || 0);
    const pendingGrowth = previousPending > 0 ? ((currentPending - previousPending) / previousPending) * 100 : 0;
    
    console.log('Admin dashboard stats calculated successfully');
    
    res.json({
      stats: {
        totalUsers: totalUsers,
        totalCourses: totalCourses,
        pendingApprovals: totalPendingApprovals,
        totalRevenue: totalRevenue,
        thisMonthRevenue: thisMonthRevenue,
        totalLiveSessions: totalLiveSessions,
        pendingLiveSessions: pendingLiveSections,
        totalSlides: totalSlides,
        activeSlides: activeSlides,
        totalQuizzes: totalQuizzes,
        pendingQuizzes: pendingQuizzes,
        totalPrivateRequests: totalPrivateRequests
      },
      trends: {
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        userGrowth: Math.round(userGrowth * 100) / 100,
        courseGrowth: Math.round(courseGrowth * 100) / 100,
        pendingGrowth: Math.round(pendingGrowth * 100) / 100
      },
      breakdown: {
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = parseInt(item.count);
          return acc;
        }, {}),
        pendingBreakdown: {
          courses: pendingCourses,
          liveSections: pendingLiveSections
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// GET /api/admin/dashboard/analytics - Get analytics data for charts
router.get('/dashboard/analytics', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching analytics data for charts...');
    
    // Get user growth data for the last 6 months
    const userGrowthData = await getRows(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_users
      FROM users 
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);
    
    // Get course performance data with enrollment counts (fixed column names)
    const coursePerformanceData = await getRows(`
      SELECT 
        c.title,
        u.name as professor_name,
        COUNT(sc.student_id) as enrolled_students,
        c.created_at,
        c.price
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      GROUP BY c.id, c.title, u.name, c.created_at, c.price
      ORDER BY enrolled_students DESC
      LIMIT 10
    `);
    
    // Get professor sales analytics
    const professorSalesData = await getRows(`
      SELECT 
        u.name as professor_name,
        u.email as professor_email,
        COUNT(DISTINCT c.id) as courses_created,
        COUNT(DISTINCT ls.id) as live_sessions_created,
        COUNT(sc.student_id) as total_enrollments,
        COALESCE(SUM(c.price), 0) as total_course_revenue
      FROM users u
      LEFT JOIN courses c ON u.id = c.created_by
      LEFT JOIN live_sessions ls ON u.id = ls.professor_id
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      WHERE u.role = 'professor'
      GROUP BY u.id, u.name, u.email
      ORDER BY total_enrollments DESC
    `);
    
    // Get student spending analytics
    let studentSpendingData = [];
    try {
      studentSpendingData = await getRows(`
        SELECT 
          u.name,
          u.email,
          COUNT(pt.id) as purchase_count,
          SUM(pt.amount) as total_spent,
          SUM(pt.points) as total_points,
          COUNT(DISTINCT sc.course_id) as courses_enrolled,
          COUNT(DISTINCT lsp.live_session_id) as live_sessions_attended
        FROM users u
        LEFT JOIN point_transactions pt ON u.id = pt.user_id AND pt.status = 'completed' AND pt.transaction_type = 'purchase'
        LEFT JOIN student_courses sc ON u.id = sc.student_id
        LEFT JOIN live_session_participants lsp ON u.id = lsp.participant_id
        WHERE u.role = 'student'
        GROUP BY u.id, u.name, u.email
        ORDER BY total_spent DESC
        LIMIT 10
      `);
    } catch (error) {
      console.log('Student spending query failed, using basic data');
      studentSpendingData = await getRows(`
        SELECT 
          u.name,
          u.email,
          COUNT(pt.id) as purchase_count,
          SUM(pt.amount) as total_spent,
          SUM(pt.points) as total_points,
          COUNT(DISTINCT sc.course_id) as courses_enrolled,
          0 as live_sessions_attended
        FROM users u
        LEFT JOIN point_transactions pt ON u.id = pt.user_id AND pt.status = 'completed' AND pt.transaction_type = 'purchase'
        LEFT JOIN student_courses sc ON u.id = sc.student_id
        WHERE u.role = 'student'
        GROUP BY u.id, u.name, u.email
        ORDER BY total_spent DESC
        LIMIT 10
      `);
    }
    
    // Get revenue data for the last 6 months
    const revenueData = await getRows(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(*) as transactions
      FROM point_transactions 
      WHERE status = 'completed' 
        AND transaction_type = 'purchase'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);
    
    // Get live session data with participant counts (fixed column names)
    let liveSessionData = [];
    try {
      liveSessionData = await getRows(`
        SELECT 
          DATE_TRUNC('month', ls.created_at) as month,
          COUNT(ls.id) as total_sessions,
          COUNT(CASE WHEN ls.is_approved = true THEN 1 END) as approved_sessions,
          COUNT(lsp.participant_id) as total_participants
        FROM live_sessions ls
        LEFT JOIN live_session_participants lsp ON ls.id = lsp.live_session_id
        WHERE ls.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        GROUP BY DATE_TRUNC('month', ls.created_at)
        ORDER BY month
      `);
    } catch (error) {
      console.log('Live session participants query failed, using basic data');
      liveSessionData = await getRows(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_sessions,
          0 as total_participants
        FROM live_sessions 
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `);
    }
    
    // Get user activity data
    const userActivityData = await getRows(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users 
      GROUP BY role
    `);
    
    // Get course category data
    const courseCategoryData = await getRows(`
      SELECT 
        m.name as material,
        COUNT(c.id) as course_count,
        AVG(c.price) as avg_price
      FROM courses c
      LEFT JOIN materials m ON c.material_id = m.id
      GROUP BY m.id, m.name
      ORDER BY course_count DESC
    `);
    
    // Get point package sales data
    const pointPackageData = await getRows(`
      SELECT 
        pp.name as package_name,
        pp.points,
        pp.price,
        COUNT(pt.id) as sales_count,
        SUM(pt.amount) as total_revenue
      FROM point_packages pp
      LEFT JOIN point_transactions pt ON pp.id = pt.package_id 
        AND pt.status = 'completed' 
        AND pt.transaction_type = 'purchase'
      GROUP BY pp.id, pp.name, pp.points, pp.price
      ORDER BY sales_count DESC
    `);
    
    // Get top point buyers
    const topPointBuyers = await getRows(`
      SELECT 
        u.name,
        u.email,
        COUNT(pt.id) as purchase_count,
        SUM(pt.amount) as total_spent,
        SUM(pt.points) as total_points
      FROM users u
      JOIN point_transactions pt ON u.id = pt.user_id
      WHERE pt.status = 'completed' 
        AND pt.transaction_type = 'purchase'
      GROUP BY u.id, u.name, u.email
      ORDER BY total_spent DESC
      LIMIT 10
    `);
    
    // Get live session popularity (fixed column names)
    let liveSessionPopularity = [];
    try {
      liveSessionPopularity = await getRows(`
        SELECT 
          ls.title,
          ls.created_at,
          COUNT(lsp.participant_id) as participant_count,
          ls.is_approved
        FROM live_sessions ls
        LEFT JOIN live_session_participants lsp ON ls.id = lsp.live_session_id
        GROUP BY ls.id, ls.title, ls.created_at, ls.is_approved
        ORDER BY participant_count DESC
        LIMIT 10
      `);
    } catch (error) {
      console.log('Live session popularity query failed, using basic data');
      liveSessionPopularity = await getRows(`
        SELECT 
          title,
          created_at,
          0 as participant_count,
          is_approved
        FROM live_sessions 
        ORDER BY created_at DESC
        LIMIT 10
      `);
    }
    
    // Get course enrollment trends (check if created_at exists)
    let courseEnrollmentTrends = [];
    try {
      courseEnrollmentTrends = await getRows(`
        SELECT 
          DATE_TRUNC('month', sc.created_at) as month,
          COUNT(sc.student_id) as enrollments
        FROM student_courses sc
        WHERE sc.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        GROUP BY DATE_TRUNC('month', sc.created_at)
        ORDER BY month
      `);
    } catch (error) {
      console.log('Course enrollment trends query failed, using mock data');
      courseEnrollmentTrends = [
        { month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), enrollments: 5 },
        { month: new Date(), enrollments: 8 }
      ];
    }
    
    console.log('Analytics data fetched successfully');
    
    res.json({
      userGrowth: userGrowthData.map(item => ({
        month: item.month,
        newUsers: parseInt(item.new_users)
      })),
      coursePerformance: coursePerformanceData.map(item => ({
        title: item.title,
        enrolledStudents: parseInt(item.enrolled_students || 0),
        createdAt: item.created_at,
        price: parseFloat(item.price || 0)
      })),
      professorSales: professorSalesData.map(item => ({
        professorName: item.professor_name,
        professorEmail: item.professor_email,
        coursesCreated: parseInt(item.courses_created || 0),
        liveSessionsCreated: parseInt(item.live_sessions_created || 0),
        totalEnrollments: parseInt(item.total_enrollments || 0),
        totalCourseRevenue: parseFloat(item.total_course_revenue || 0)
      })),
      studentSpending: studentSpendingData.map(item => ({
        name: item.name,
        email: item.email,
        purchaseCount: parseInt(item.purchase_count || 0),
        totalSpent: parseFloat(item.total_spent || 0),
        totalPoints: parseInt(item.total_points || 0),
        coursesEnrolled: parseInt(item.courses_enrolled || 0),
        liveSessionsAttended: parseInt(item.live_sessions_attended || 0)
      })),
      revenue: revenueData.map(item => ({
        month: item.month,
        revenue: parseFloat(item.revenue || 0),
        transactions: parseInt(item.transactions || 0)
      })),
      liveSessions: liveSessionData.map(item => ({
        month: item.month,
        totalSessions: parseInt(item.total_sessions),
        approvedSessions: parseInt(item.approved_sessions || 0),
        totalParticipants: parseInt(item.total_participants || 0)
      })),
      userActivity: userActivityData.map(item => ({
        role: item.role,
        count: parseInt(item.count)
      })),
      courseCategories: courseCategoryData.map(item => ({
        material: item.material || 'Uncategorized',
        courseCount: parseInt(item.course_count),
        avgPrice: parseFloat(item.avg_price || 0)
      })),
      pointPackages: pointPackageData.map(item => ({
        packageName: item.package_name,
        points: parseInt(item.points),
        price: parseFloat(item.price),
        salesCount: parseInt(item.sales_count || 0),
        totalRevenue: parseFloat(item.total_revenue || 0)
      })),
      topPointBuyers: topPointBuyers.map(item => ({
        name: item.name,
        email: item.email,
        purchaseCount: parseInt(item.purchase_count),
        totalSpent: parseFloat(item.total_spent || 0),
        totalPoints: parseInt(item.total_points || 0)
      })),
      liveSessionPopularity: liveSessionPopularity.map(item => ({
        title: item.title,
        createdAt: item.created_at,
        participantCount: parseInt(item.participant_count || 0),
        isApproved: item.is_approved
      })),
      courseEnrollmentTrends: courseEnrollmentTrends.map(item => ({
        month: item.month,
        enrollments: parseInt(item.enrollments || 0)
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// GET /api/admin/dashboard/recent-activity - Get recent activity for admin dashboard
router.get('/dashboard/recent-activity', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching recent activity...');
    const { limit = 10 } = req.query;
    
    const activities = [];
    
    // Get recent user registrations (with fallback)
    try {
      const recentUsers = await getRows(`
        SELECT id, name, email, role, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit) / 2}
      `);
      
      activities.push(...recentUsers.map(user => ({
        type: 'user_registration',
        title: `New ${user.role} registered`,
        description: `${user.name} (${user.email})`,
        time: user.created_at,
        id: user.id
      })));
    } catch (error) {
      console.error('Error getting recent users:', error);
    }
    
    // Get recent course submissions (with fallback)
    try {
      const recentCourses = await getRows(`
        SELECT id, title, professor_id, created_at 
        FROM pending_courses 
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit) / 2}
      `);
      
      activities.push(...recentCourses.map(course => ({
        type: 'course_submission',
        title: 'New course submitted',
        description: course.title,
        time: course.created_at,
        id: course.id
      })));
    } catch (error) {
      console.error('Error getting recent courses:', error);
    }
    
    // Get recent live session submissions (with fallback)
    try {
      const recentLiveSessions = await getRows(`
        SELECT id, title, professor_name, created_at 
        FROM live_sessions 
        WHERE is_approved = false
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      activities.push(...recentLiveSessions.map(session => ({
        type: 'live_session_submission',
        title: 'New live session submitted',
        description: session.title,
        time: session.created_at,
        id: session.id
      })));
    } catch (error) {
      console.error('Error getting recent live sessions:', error);
    }
    
    // Get recent point transactions (with fallback)
    try {
      const recentTransactions = await getRows(`
        SELECT id, user_id, transaction_type, points, amount, created_at 
        FROM point_transactions 
        WHERE status = 'completed' 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      activities.push(...recentTransactions.map(transaction => ({
        type: 'point_transaction',
        title: `Point ${transaction.transaction_type}`,
        description: `${transaction.points} points - ${transaction.amount || 0} DZD`,
        time: transaction.created_at,
        id: transaction.id
      })));
    } catch (error) {
      console.error('Error getting recent transactions:', error);
    }
    
    // Sort activities by time and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, parseInt(limit));
    
    console.log(`Returning ${sortedActivities.length} recent activities`);
    
    res.json({ activities: sortedActivities });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// GET /api/admin/dashboard/system-health - Get system health metrics
router.get('/dashboard/system-health', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching system health...');
    
    // Get database connection status
    let dbStatus = 'disconnected';
    let uploadsSize = 0;
    
    try {
      const dbResult = await getRow('SELECT 1 as status');
      dbStatus = dbResult ? 'connected' : 'disconnected';
      
      // Get total file size for uploads (with fallback)
      try {
        const sizeResult = await getRow(`
          SELECT COALESCE(SUM(pg_column_size(image_url) + pg_column_size(video_url)), 0) as size 
          FROM enhanced_slides 
          WHERE image_url IS NOT NULL OR video_url IS NOT NULL
        `);
        uploadsSize = parseInt(sizeResult?.size || 0);
      } catch (error) {
        console.error('Error getting uploads size:', error);
        uploadsSize = 0;
      }
    } catch (error) {
      console.error('Error checking database status:', error);
      dbStatus = 'disconnected';
    }
    
    // Get average response time (mock for now)
    const avgResponseTime = 1.2; // seconds
    
    // Get uptime (mock for now)
    const uptime = 98.5; // percentage
    
    // Get success rate (mock for now)
    const successRate = 99.1; // percentage
    
    console.log('System health data calculated successfully');
    
    res.json({
      database: {
        status: dbStatus,
        size: uploadsSize
      },
      performance: {
        avgResponseTime,
        uptime,
        successRate
      }
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get live sessions count for sidebar
router.get('/live-sessions-count', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Count pending live sessions (not approved AND status is scheduled)
    const pendingCount = await safeGetCount(`
      SELECT COUNT(*) as count 
      FROM live_sessions 
      WHERE is_approved = FALSE AND status = 'scheduled'
    `);

    // Count not ended live sessions (all statuses except 'ended')
    const notEndedCount = await safeGetCount(`
      SELECT COUNT(*) as count 
      FROM live_sessions 
      WHERE status != 'ended' AND is_approved = TRUE
    `);

    res.json({
      pending: pendingCount,
      notEnded: notEndedCount,
      total: pendingCount 
    });
  } catch (error) {
    console.error('Error fetching live sessions count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending quizzes count for sidebar
router.get('/pending-quizzes-count', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Count pending quizzes (status = 'pending')
    const pendingCount = await safeGetCount(`
      SELECT COUNT(*) as count 
      FROM quizzes 
      WHERE status = 'pending'
    `);

    res.json({
      pending: pendingCount,
      total: pendingCount
    });
  } catch (error) {
    console.error('Error fetching pending quizzes count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 