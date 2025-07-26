import express from 'express';
import pool from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications → get all notifications for the authenticated user
router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await pool.query(`
            SELECT 
                id,
                user_id,
                type,
                title,
                message,
                is_read,
                metadata,
                created_at
            FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `, [userId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/notifications/all → get all notifications (admin only)
router.get('/notifications/all', verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }
        
        const result = await pool.query(`
            SELECT 
                n.id,
                n.user_id,
                n.type,
                n.title,
                n.message,
                n.is_read,
                n.metadata,
                n.created_at,
                u.name as user_name,
                u.email as user_email
            FROM notifications n
            LEFT JOIN users u ON n.user_id = u.id
            ORDER BY n.created_at DESC
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/notifications/:id/read → mark notification as read
router.patch('/notifications/:id/read', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const result = await pool.query(`
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = $1 AND user_id = $2 
            RETURNING *
        `, [id, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/notifications/:id → delete notification
router.delete('/notifications/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const result = await pool.query(`
            DELETE FROM notifications 
            WHERE id = $1 AND user_id = $2 
            RETURNING *
        `, [id, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/notifications → create notification (admin only)
router.post('/notifications', verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }
        
        const { user_id, type, title, message, metadata } = req.body;
        
        if (!user_id || !type || !message) {
            return res.status(400).json({ error: 'Missing required fields: user_id, type, message' });
        }
        
        const result = await pool.query(`
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [user_id, type, title || null, message, metadata || null]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 