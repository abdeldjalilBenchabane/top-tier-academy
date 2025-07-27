import express from 'express';
import pool from '../db.js';
import { verifyToken as auth } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Get user points balance
router.get('/balance', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT balance FROM user_points WHERE user_id = $1',
      [userId]
    );
    
    const balance = result.rows[0]?.balance || 0;
    
    res.json({ balance });
  } catch (error) {
    console.error('Error fetching points balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to check any user's balance (admin only)
router.get('/balance/:userId', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get current balance
    const balanceResult = await pool.query(
      'SELECT balance FROM user_points WHERE user_id = $1',
      [userId]
    );
    
    const balance = balanceResult.rows[0]?.balance || 0;
    // Get recent transactions
    const transactionsResult = await pool.query(
      `SELECT id, transaction_type, points, amount, status, created_at, metadata 
       FROM point_transactions 
       WHERE user_id = $1  ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );
    
    res.json({ 
      userId: parseInt(userId),
      balance,
      recentTransactions: transactionsResult.rows
    });
  } catch (error) {
    console.error('Error fetching user balance for debugging:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user points balance (for testing or manual updates)
router.put('/balance', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { points } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ error: 'Invalid points amount' });
    }
    
    const result = await pool.query(
      `INSERT INTO user_points (user_id, balance) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id) 
       DO UPDATE SET balance = user_points.balance + $2
       RETURNING balance`,
      [userId, points]
    );
    
    res.json({ 
      success: true, 
      balance: result.rows[0].balance,
      message: `Added ${points} points successfully`
    });
  } catch (error) {
    console.error('Error updating points balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available point packages
router.get('/packages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, points, price, currency, is_active FROM point_packages WHERE is_active = true ORDER BY points ASC'
    );
    
    res.json({ packages: result.rows });
  } catch (error) {
    console.error('Error fetching point packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all point packages (admin only) - includes inactive packages
router.get('/packages/all', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, points, price, currency, is_active FROM point_packages ORDER BY points ASC'
    );
    
    res.json({ packages: result.rows });
  } catch (error) {
    console.error('Error fetching all point packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a point package (admin only)
router.put('/packages/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, points, price, currency, is_active } = req.body;
    const result = await pool.query(
      `UPDATE point_packages SET name = $1, points = $2, price = $3, currency = $4, is_active = $5 WHERE id = $6 RETURNING *`,
      [name, points, price, currency, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json({ success: true, package: result.rows[0] });
  } catch (error) {
    console.error('Error updating point package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new point package (admin only)
router.post('/packages', auth, requireAdmin, async (req, res) => {
  try {
    const { name, points, price, currency, is_active } = req.body;
    const result = await pool.query(
      `INSERT INTO point_packages (name, points, price, currency, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, points, price, currency, is_active ?? true]
    );
    res.json({ success: true, package: result.rows[0] });
  } catch (error) {
    console.error('Error adding point package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a point package (admin only)
router.delete('/packages/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM point_packages WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting point package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT 
        pt.id,
        pt.transaction_type,
        pt.points,
        pt.amount,
        pt.currency,
        pt.status,
        pt.payment_reference,
        pt.metadata,
        pt.created_at,
        pp.name as package_name
      FROM point_transactions pt
      LEFT JOIN point_packages pp ON pt.package_id = pp.id
      WHERE pt.user_id = $1
      ORDER BY pt.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM point_transactions WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      transactions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create purchase transaction
router.post('/purchase', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId, amount, currency, successUrl, metadata } = req.body;
    
    // Validate package exists and is active
    const packageResult = await pool.query(
      'SELECT * FROM point_packages WHERE id = $1 AND is_active = true',
      [packageId]
    );
    
    if (packageResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid package' });
    }
    
    const packageData = packageResult.rows[0];
    
    // Validate amount matches package price
    if (parseFloat(amount) !== parseFloat(packageData.price)) {
      return res.status(400).json({ error: 'Amount does not match package price' });
    }
    
    // Create transaction record (status: 'pending')
    const transactionResult = await pool.query(
      `INSERT INTO point_transactions 
       (user_id, package_id, transaction_type, points, amount, currency, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        packageId,
        'purchase',
        packageData.points,
        amount,
        currency || 'DZD',
        'pending', // Mark as pending until payment is confirmed
        JSON.stringify(metadata)
      ]
    );
    
    const transactionId = transactionResult.rows[0].id;
    
    // DO NOT add points to user account here!
    
    // Prepare payment data for external API
    const paymentData = {
      amount: parseFloat(amount),
      currency: currency || 'DZD',
      successUrl: successUrl,
      metadata: {
        ...metadata,
        transactionId: transactionId.toString(),
        pointId: packageId.toString()
      }
    };
    
    res.json({
      success: true,
      transactionId,
      paymentData,
      message: 'Purchase transaction created successfully'
    });
    
  } catch (error) {
    console.error('Error creating purchase transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update transaction status (for payment webhook)
router.put('/transaction/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentReference } = req.body;
    
    const result = await pool.query(
      `UPDATE point_transactions 
       SET status = $1, payment_reference = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, paymentReference, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ 
      success: true, 
      transaction: result.rows[0],
      message: 'Transaction status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction by ID
router.get('/transaction/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        pt.*,
        pp.name as package_name
      FROM point_transactions pt
      LEFT JOIN point_packages pp ON pt.package_id = pp.id
      WHERE pt.id = $1 AND pt.user_id = $2`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ transaction: result.rows[0] });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Buy a course with points
router.post('/buy-course', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if course exists and get price, material_id, language_level_id
    const courseRes = await pool.query('SELECT id, price, material_id, language_level_id FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const course = courseRes.rows[0];
    let price = parseInt(course.price);

    // If price is missing or 0, try to get from materials or language_course_prices
    if (!price || price <= 0) {
      if (course.material_id) {
        // Education course: get price from materials
        const matRes = await pool.query('SELECT price FROM materials WHERE id = $1', [course.material_id]);
        price = matRes.rows[0] ? parseInt(matRes.rows[0].price) : 0;
      } else if (course.language_level_id) {
        // Language course: get price from language_course_prices
        const langRes = await pool.query('SELECT price FROM language_course_prices WHERE course_id = $1 AND language_level_id = $2', [courseId, course.language_level_id]);
        price = langRes.rows[0] ? parseInt(langRes.rows[0].price) : 0;
      }
    }

    if (!price || price <= 0) {
      console.log(`[BUY-COURSE] Invalid price for courseId=${courseId}, resolved price=`, price, 'course:', course);
      return res.status(400).json({ error: 'Invalid course price' });
    }

    // Check if already purchased
    const purchasedRes = await pool.query('SELECT id FROM student_courses WHERE student_id = $1 AND course_id = $2', [userId, courseId]);
    if (purchasedRes.rows.length > 0) {
      console.log(`[BUY-COURSE] User ${userId} already purchased course ${courseId}`);
      return res.status(409).json({ error: 'You have already purchased this course.' });
    }

    // Get user points
    const pointsRes = await pool.query('SELECT balance FROM user_points WHERE user_id = $1', [userId]);
    const balance = pointsRes.rows[0]?.balance || 0;
    console.log(`[BUY-COURSE] User ${userId} balance before purchase:`, balance, 'Course price:', price);
    if (balance < price) {
      console.log(`[BUY-COURSE] Not enough points: balance=${balance}, price=${price}`);
      return res.status(400).json({ error: 'Not enough points' });
    }

    // Deduct points and record purchase in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Deduct points
      await client.query(
        'UPDATE user_points SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [price, userId]
      );
      // Record purchase
      await client.query(
        'INSERT INTO student_courses (student_id, course_id, completed, progress, hours_spent, last_accessed) VALUES ($1, $2, FALSE, 0, 0, NOW())',
        [userId, courseId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    // Get new balance
    const newPointsRes = await pool.query('SELECT balance FROM user_points WHERE user_id = $1', [userId]);
    const newBalance = newPointsRes.rows[0]?.balance || 0;
    console.log(`[BUY-COURSE] User ${userId} balance after purchase:`, newBalance);
    res.json({ success: true, newBalance, message: 'Course purchased successfully' });
  } catch (error) {
    console.error('Error buying course with points:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Buy a live session with points
router.post('/buy-live-session', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Check if live section exists and get price
    const sectionRes = await pool.query('SELECT id, price FROM live_sections WHERE id = $1', [sessionId]);
    if (sectionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Live section not found' });
    }
    const section = sectionRes.rows[0];
    const price = parseInt(section.price);

    if (!price || price <= 0) {
      return res.status(400).json({ error: 'Invalid live section price' });
    }

                        // Check if already purchased (using live_section_purchases table)
                    const purchasedRes = await pool.query('SELECT id FROM live_section_purchases WHERE student_id = $1 AND live_section_id = $2', [userId, sessionId]);
                    if (purchasedRes.rows.length > 0) {
                      return res.status(409).json({ error: 'You have already purchased this live session.' });
                    }

    // Get user points
    const pointsRes = await pool.query('SELECT balance FROM user_points WHERE user_id = $1', [userId]);
    const balance = pointsRes.rows[0]?.balance || 0;
    
    if (balance < price) {
      return res.status(400).json({ error: 'Not enough points' });
    }

    // Deduct points and record purchase in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Deduct points
      await client.query(
        'UPDATE user_points SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [price, userId]
      );
      
                            // Record purchase (using live_section_purchases table)
                      await client.query(
                        'INSERT INTO live_section_purchases (student_id, live_section_id, points_spent) VALUES ($1, $2, $3)',
                        [userId, sessionId, price]
                      );
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    // Get new balance
    const newPointsRes = await pool.query('SELECT balance FROM user_points WHERE user_id = $1', [userId]);
    const newBalance = newPointsRes.rows[0]?.balance || 0;
    
    res.json({ success: true, newBalance, message: 'Live session purchased successfully' });
  } catch (error) {
    console.error('Error buying live session with points:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all point transactions for a user (admin only)
router.post('/transactions/log', auth, async (req, res) => {
  try {
    // Only allow admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const result = await pool.query(
      'SELECT * FROM point_transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Error fetching user point transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all point transactions (admin only) - with user and package details
router.get('/transactions/admin', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        pt.*,
        u.name as user_name,
        u.email as user_email,
        pp.name as package_name
      FROM point_transactions pt
      LEFT JOIN users u ON pt.user_id = u.id
      LEFT JOIN point_packages pp ON pt.package_id = pp.id
      ORDER BY pt.created_at DESC`
    );
    
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Error fetching all point transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a point transaction (admin only)
router.put('/transactions/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { transaction_type, points, amount, currency, status, payment_reference, metadata } = req.body;
    
    const result = await pool.query(
      `UPDATE point_transactions 
       SET transaction_type = $1, points = $2, amount = $3, currency = $4, status = $5, payment_reference = $6, metadata = $7
       WHERE id = $8 
       RETURNING *`,
      [transaction_type, points, amount, currency, status, payment_reference, JSON.stringify(metadata), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ success: true, transaction: result.rows[0] });
  } catch (error) {
    console.error('Error updating point transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a point transaction (admin only)
router.delete('/transactions/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM point_transactions WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting point transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my own point transaction history (student)
router.get('/transactions/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM point_transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Error fetching my point transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all purchased course IDs for the logged-in user
router.get('/my-courses', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT course_id FROM student_courses WHERE student_id = $1',
      [userId]
    );
    const courseIds = result.rows.map(row => row.course_id);
    res.json({ courseIds });
  } catch (error) {
    console.error('Error fetching my courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get purchased live sessions for a student
router.get('/my-live-sessions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get purchased live sections with their details
    const purchasedSections = await pool.query(`
      SELECT 
        ls.id,
        ls.title,
        ls.description,
        ls.price,
        ls.cover_image_url,
        ls.scheduled_date,
        ls.scheduled_time,
        ls.duration_minutes,
        ls.telegram_channel,
        ls.status,
        ls.created_at,
        lsp.purchase_date,
        lsp.points_spent,
        u.name as professor_name,
        m.name as material_name,
        l.name as language_name,
        ll.name as language_level_name
      FROM live_section_purchases lsp
      JOIN live_sections ls ON lsp.live_section_id = ls.id
      LEFT JOIN users u ON ls.professor_id = u.id
      LEFT JOIN materials m ON ls.material_id = m.id
      LEFT JOIN languages l ON ls.language_id = l.id
      LEFT JOIN language_levels ll ON ls.language_level_id = ll.id
      WHERE lsp.student_id = $1
      ORDER BY lsp.purchase_date DESC
    `, [userId]);
    
    res.json({
      success: true,
      liveSessions: purchasedSections.rows
    });
  } catch (error) {
    console.error('Error fetching purchased live sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get purchased individual live sessions for a student
router.get('/my-individual-live-sessions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get purchased individual live sessions with their details
    const purchasedSessions = await pool.query(`
      SELECT 
        ls.id,
        ls.title,
        ls.description,
        ls.price,
        ls.cover_image_url,
        ls.start_time,
        ls.duration,
        ls.status,
        ls.created_at,
        p.purchased_at,
        p.amount_paid,
        u.name as professor_name,
        m.name as material_name,
        s.name as speciality_name,
        y.name as year_name,
        l.name as level_name
      FROM purchases p
      JOIN live_sessions ls ON p.session_id = ls.id
      LEFT JOIN users u ON ls.professor_id = u.id
      LEFT JOIN materials m ON ls.material_id = m.id
      LEFT JOIN specialities s ON m.speciality_id = s.id
      LEFT JOIN years y ON s.year_id = y.id
      LEFT JOIN levels l ON y.level_id = l.id
      WHERE p.student_id = $1
      ORDER BY p.purchased_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      liveSessions: purchasedSessions.rows
    });
  } catch (error) {
    console.error('Error fetching purchased individual live sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin buy points for student (admin only)
router.post('/admin/buy-for-student', auth, requireAdmin, async (req, res) => {
  try {
    const { userId, points, amount, currency, packageName, paymentReference, requestId } = req.body;
    
    console.log(`=== ADMIN BUY POINTS REQUEST ===`);
    console.log(`Request ID: ${requestId}`);
    console.log(`Admin: ${req.user.name} (${req.user.id})`);
    console.log(`User: ${userId}`);
    console.log(`Points to add: ${points}`);
    console.log(`Amount: ${amount}`);
    console.log(`Package: ${packageName}`);
    
    if (!userId || !points || !amount) {
      return res.status(400).json({ error: 'userId, points, and amount are required' });
    }

    // Verify user exists
    const userResult = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check recent transactions for this user (last 10)
    const recentTransactionsResult = await pool.query(
      `SELECT id, transaction_type, points, amount, status, created_at, metadata 
       FROM point_transactions 
       WHERE user_id = $1  ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );
    console.log(`Recent transactions for user ${userId}:`, recentTransactionsResult.rows);

    // Check for recent duplicate transactions (within last 5 seconds)
    const recentTransaction = await pool.query(
      `SELECT id FROM point_transactions 
       WHERE user_id = $1 
       AND transaction_type = 'purchase' 
       AND status = 'completed'
       AND created_at > NOW() - INTERVAL '5 seconds'
       AND metadata->>'admin_id' = $2
       ORDER BY created_at DESC LIMIT 1`,
      [userId, req.user.id.toString()]
    );

    if (recentTransaction.rows.length > 0) {
      console.log(`Preventing duplicate transaction for user ${userId} by admin ${req.user.id}`);
      return res.status(409).json({ error: 'Duplicate transaction detected. Please wait a moment and try again.' });
    }

    // Find the package if packageName is provided
    let packageId = null;
    if (packageName) {
      const packageResult = await pool.query('SELECT id FROM point_packages WHERE name = $1', [packageName]);
      if (packageResult.rows.length > 0) {
        packageId = packageResult.rows[0].id;
        console.log(`Found package ID: ${packageId} for package: ${packageName}`);
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log(`Transaction started for request ID: ${requestId}`);
      
      // Get current balance INSIDE the transaction to prevent race conditions
      const currentBalanceResult = await client.query('SELECT balance FROM user_points WHERE user_id = $1', [userId]);
      const currentBalance = currentBalanceResult.rows[0]?.balance || 0;
      console.log(`Current balance inside transaction: ${currentBalance}`);
      
      // Create transaction record with completed status
      const transactionResult = await client.query(
        `INSERT INTO point_transactions 
         (user_id, package_id, transaction_type, points, amount, currency, status, payment_reference, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          userId,
          packageId,
          'purchase',
          points,
          amount,
          currency || 'DZD',
          'completed', // Mark as completed immediately
          paymentReference || `Admin-${Date.now()}`,
          JSON.stringify({ 
            packageName, 
            source: 'admin_manual',
            admin_id: req.user.id,
            admin_name: req.user.name,
            requestId: requestId
          })
        ]
      );
      
      console.log(`Transaction record created with ID: ${transactionResult.rows[0].id} for request ID: ${requestId}`);
      
      // The database trigger will automatically add points when the transaction is created
      // No need to manually add points here
      console.log(`Database trigger will automatically add ${points} points to user ${userId}`);
      
      // Get the new balance after the trigger has run
      const newBalanceResult = await client.query('SELECT balance FROM user_points WHERE user_id = $1', [userId]);
      const newBalance = newBalanceResult.rows[0]?.balance || 0;
      console.log(`Points added for request ID ${requestId}. New balance: ${newBalance} (was: ${currentBalance}, added: ${points})`);
      console.log(`Balance change verification: ${newBalance} - ${currentBalance} = ${newBalance - currentBalance}`);
      console.log(`Expected balance: ${currentBalance + points}, Actual balance: ${newBalance}`);
      
      await client.query('COMMIT');
      console.log(`Transaction committed successfully for request ID: ${requestId}`);
      
      console.log(`Admin ${req.user.name} added ${points} points to user ${userId} (package: ${packageName}) - Request ID: ${requestId}`);
      console.log(`=== ADMIN BUY POINTS COMPLETED for request ID: ${requestId} ===`);
      
      res.json({ 
        success: true, 
        transactionId: transactionResult.rows[0].id,
        message: `Successfully added ${points} points to user ${userResult.rows[0].name}`,
        oldBalance: currentBalance,
        newBalance: newBalance,
        pointsAdded: points,
        requestId: requestId
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Transaction failed and rolled back for request ID ${requestId}:`, error);
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error admin buying points for student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all students for admin (admin only)
router.get('/admin/students', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, avatar_url FROM users WHERE role = $1 ORDER BY name ASC',
      ['student']
    );
    
    res.json({ students: result.rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 