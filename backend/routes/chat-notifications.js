import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import pool from '../db.js';

const router = express.Router();

// Get user's notification count for a session
router.get('/:sessionId', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const query = `
            SELECT unseen_count, last_seen_message_id 
            FROM chat_notifications 
            WHERE user_id = $1 AND session_id = $2
        `;
        
        const result = await pool.query(query, [userId, sessionId]);
        
        if (result.rows.length > 0) {
            res.json({
                unseenCount: result.rows[0].unseen_count,
                lastSeenMessageId: result.rows[0].last_seen_message_id
            });
        } else {
            res.json({
                unseenCount: 0,
                lastSeenMessageId: 0
            });
        }
    } catch (error) {
        console.error('Error getting chat notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark messages as seen
router.post('/:sessionId/mark-seen', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { lastSeenMessageId } = req.body;
        const userId = req.user.id;

        const query = `
            INSERT INTO chat_notifications (user_id, session_id, last_seen_message_id, unseen_count)
            VALUES ($1, $2, $3, 0)
            ON CONFLICT (user_id, session_id)
            DO UPDATE SET 
                last_seen_message_id = $3,
                unseen_count = 0,
                updated_at = CURRENT_TIMESTAMP
        `;
        
        await pool.query(query, [userId, sessionId, lastSeenMessageId]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as seen:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Increment unseen count (called when new message arrives)
router.post('/:sessionId/increment', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const query = `
            INSERT INTO chat_notifications (user_id, session_id, unseen_count)
            VALUES ($1, $2, 1)
            ON CONFLICT (user_id, session_id)
            DO UPDATE SET 
                unseen_count = chat_notifications.unseen_count + 1,
                updated_at = CURRENT_TIMESTAMP
        `;
        
        await pool.query(query, [userId, sessionId]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error incrementing unseen count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 