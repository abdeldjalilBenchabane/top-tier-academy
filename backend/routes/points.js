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
    
    // Create transaction record
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
        'pending',
        JSON.stringify(metadata)
      ]
    );
    
    const transactionId = transactionResult.rows[0].id;
    
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

export default router; 