const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware
app.use(cors());
app.use(express.json());

// Point codes routes
app.get('/api/points/codes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pc.*, pp.points 
      FROM point_codes pc 
      JOIN point_packages pp ON pc.package_id = pp.id 
      ORDER BY pc.created_at DESC
    `);
    res.json({ success: true, codes: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/points/codes/generate', async (req, res) => {
  const { package_id, quantity } = req.body;
  
  try {
    const codes = [];
    for (let i = 0; i < quantity; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const result = await pool.query(
        'INSERT INTO point_codes (code, package_id) VALUES ($1, $2) RETURNING *',
        [code, package_id]
      );
      codes.push(result.rows[0]);
    }
    res.json({ success: true, codes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/points/codes/redeem', async (req, res) => {
  const { code, user_id } = req.body;
  
  try {
    const result = await pool.query(
      `SELECT pc.*, pp.points 
       FROM point_codes pc 
       JOIN point_packages pp ON pc.package_id = pp.id 
       WHERE pc.code = $1 AND pc.is_used = false`,
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or used code' });
    }
    
    const pointCode = result.rows[0];
    
    await pool.query(
      'UPDATE point_codes SET is_used = true, used_by = $1, used_at = CURRENT_TIMESTAMP WHERE code = $2',
      [user_id, code]
    );
    
    await pool.query(
      'INSERT INTO point_transactions (user_id, package_id, transaction_type, points, status) VALUES ($1, $2, $3, $4, $5)',
      [user_id, pointCode.package_id, 'bonus', pointCode.points, 'completed']
    );
    
    res.json({ success: true, points: pointCode.points });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});