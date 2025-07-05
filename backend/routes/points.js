import express from 'express';
import pool from '../db.js';
import { verifyToken as auth } from '../middleware/auth.js';

const router = express.Router();

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

export default router; 