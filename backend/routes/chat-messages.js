import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
});

// Save a new chat message
router.post('/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message_text } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || 'مستخدم';
    const userRole = req.user.role || 'student';

    if (!message_text || !message_text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const query = `
      INSERT INTO chat_messages (session_id, user_id, user_name, user_role, message_text)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [sessionId, userId, userName, userRole, message_text.trim()];
    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: result.rows[0]
    });

  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all chat messages for a session
router.get('/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const query = `
      SELECT id, user_id, user_name, user_role, message_text, timestamp
      FROM chat_messages 
      WHERE session_id = $1 
      ORDER BY timestamp ASC
    `;

    const result = await pool.query(query, [sessionId]);

    res.json({
      success: true,
      messages: result.rows
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 