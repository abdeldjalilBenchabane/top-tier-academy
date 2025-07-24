import express from 'express';
import pool from '../db.js';
import { verifyToken as auth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Middleware to check admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Generate a unique code
function generateUniqueCode() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

// Get all point codes (admin only)
router.get('/codes', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pc.*, u.email as used_by_email, u.name as used_by_name, pp.name as package_name
       FROM point_codes pc 
       LEFT JOIN users u ON pc.used_by = u.id 
       LEFT JOIN point_packages pp ON pc.package_id = pp.id
       ORDER BY pc.created_at DESC`
    );
    res.json({ codes: result.rows });
  } catch (error) {
    console.error('Error fetching point codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate new point codes (admin only)
router.post('/codes/generate', auth, requireAdmin, async (req, res) => {
  const { package_id, quantity } = req.body;
  
  if (!package_id || !quantity || quantity < 1 || quantity > 100) {
    return res.status(400).json({ error: 'Invalid package or quantity' });
  }

  const client = await pool.connect();
  try {
    // Lookup package
    const pkgResult = await client.query('SELECT points FROM point_packages WHERE id = $1', [package_id]);
    if (pkgResult.rows.length === 0) {
      return res.status(400).json({ error: 'Package not found' });
    }
    const points = pkgResult.rows[0].points;

    await client.query('BEGIN');
    
    const codes = [];
    for (let i = 0; i < quantity; i++) {
      const code = generateUniqueCode();
      const result = await client.query(
        `INSERT INTO point_codes (code, points, package_id) VALUES ($1, $2, $3) RETURNING *`,
        [code, points, package_id]
      );
      codes.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    res.json({ success: true, codes });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating point codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Redeem a point code
router.post('/codes/redeem', auth, async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if code exists and is unused
    const codeResult = await client.query(
      'SELECT * FROM point_codes WHERE code = $1 AND NOT is_used FOR UPDATE',
      [code]
    );
    
    if (codeResult.rows.length === 0) {
      throw new Error('Invalid or already used code');
    }
    
    const pointCode = codeResult.rows[0];
    
    // Mark code as used
    await client.query(
      `UPDATE point_codes 
       SET is_used = true, used_by = $1, used_at = NOW() 
       WHERE id = $2`,
      [userId, pointCode.id]
    );
    
    // Add points to user's balance
    await client.query(
      `INSERT INTO user_points (user_id, balance) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id) 
       DO UPDATE SET balance = user_points.balance + $2`,
      [userId, pointCode.points]
    );
    
    await client.query('COMMIT');
    res.json({ 
      success: true, 
      points: pointCode.points,
      message: `Added ${pointCode.points} points to your balance` 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error redeeming point code:', error);
    res.status(400).json({ error: error.message || 'Failed to redeem code' });
  } finally {
    client.release();
  }
});

export default router;