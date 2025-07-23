import express from 'express';
import { query, getRow, getRows } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get current private class settings (public endpoint for students/professors)
router.get('/', async (req, res) => {
  try {
    const settings = await getRow('SELECT * FROM private_class_settings ORDER BY id DESC LIMIT 1');
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching private class settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get private class settings (admin only)
router.get('/admin', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const settings = await getRow('SELECT * FROM private_class_settings ORDER BY id DESC LIMIT 1');
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching private class settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update private class settings (admin only)
router.put('/admin', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { price_per_session, session_duration, available_start_time, available_end_time } = req.body;
    
    // Validate inputs
    if (!price_per_session || price_per_session < 0) {
      return res.status(400).json({ error: 'Invalid price per session' });
    }
    
    if (!session_duration || session_duration < 15 || session_duration > 480) {
      return res.status(400).json({ error: 'Session duration must be between 15 and 480 minutes' });
    }
    
    if (!available_start_time || !available_end_time) {
      return res.status(400).json({ error: 'Start and end times are required' });
    }
    
    // Check if settings exist
    const existingSettings = await getRow('SELECT * FROM private_class_settings ORDER BY id DESC LIMIT 1');
    
    if (existingSettings) {
      // Update existing settings
      const result = await query(
        `UPDATE private_class_settings 
         SET price_per_session = $1, session_duration = $2, available_start_time = $3, available_end_time = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 RETURNING *`,
        [price_per_session, session_duration, available_start_time, available_end_time, existingSettings.id]
      );
      res.json({ settings: result.rows[0], message: 'Settings updated successfully' });
    } else {
      // Create new settings
      const result = await query(
        `INSERT INTO private_class_settings (price_per_session, session_duration, available_start_time, available_end_time)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [price_per_session, session_duration, available_start_time, available_end_time]
      );
      res.json({ settings: result.rows[0], message: 'Settings created successfully' });
    }
  } catch (error) {
    console.error('Error updating private class settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get settings history (admin only)
router.get('/admin/history', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const settings = await getRows('SELECT * FROM private_class_settings ORDER BY created_at DESC');
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching settings history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 