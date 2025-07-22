import express from 'express';
import { query, getRows, getRow } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all private class requests (for admin/professors)
router.get('/', verifyToken, async (req, res) => {
  try {
    const requests = await getRows(`
      SELECT 
        pcr.*,
        u.name as student_name,
        u.email as student_email
      FROM private_class_requests pcr
      LEFT JOIN users u ON pcr.student_id = u.id
      ORDER BY pcr.created_at DESC
    `);
    
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching private class requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get private class requests for a specific student
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const requests = await getRows(`
      SELECT * FROM private_class_requests 
      WHERE student_id = $1 
      ORDER BY created_at DESC
    `, [studentId]);
    
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching student private class requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get private class requests for a specific teacher
router.get('/teacher/:teacherName', verifyToken, async (req, res) => {
  try {
    const { teacherName } = req.params;
    const requests = await getRows(`
      SELECT pcr.*, u.name as student_name
      FROM private_class_requests pcr
      LEFT JOIN users u ON pcr.student_id = u.id
      WHERE pcr.teacher_name = $1
      ORDER BY pcr.created_at DESC
    `, [teacherName]);
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching teacher private class requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new private class request
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      teacher_name,
      subject,
      grade,
      date,
      time,
      sessions_count,
      title,
      description
    } = req.body;
    
    const student_id = req.user.id;
    
    const result = await query(`
      INSERT INTO private_class_requests 
      (student_id, teacher_name, subject, grade, date, time, sessions_count, title, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [student_id, teacher_name, subject, grade, date, time, sessions_count, title, description]);
    
    res.status(201).json({ 
      message: 'Private class request created successfully',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating private class request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update request status (for professors/admins)
router.patch('/:requestId/status', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, time } = req.body;
    // Check if user is professor or admin
    if (req.user.role !== 'professor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    // Fetch current request
    const current = await getRow('SELECT * FROM private_class_requests WHERE id = $1', [requestId]);
    if (!current) {
      return res.status(404).json({ error: 'Request not found' });
    }
    let updateQuery = 'UPDATE private_class_requests SET status = $1, updated_at = CURRENT_TIMESTAMP';
    let params = [status];
    let paramIdx = 2;
    // If time is being set/updated, also set scheduled_at and agora_channel if not already set
    let scheduledAt = current.scheduled_at;
    let agoraChannel = current.agora_channel;
    if (time) {
      updateQuery += `, time = $${paramIdx}`;
      params.push(time);
      paramIdx++;
      // Combine date and time into a timestamp (assume date is stored as YYYY-MM-DD and time as HH:mm - HH:mm)
      const dateStr = current.date;
      const startTime = time.split(' - ')[0];
      if (dateStr && startTime) {
        scheduledAt = new Date(`${dateStr}T${startTime}:00`);
        updateQuery += `, scheduled_at = $${paramIdx}`;
        params.push(scheduledAt);
        paramIdx++;
      }
      // Always set agora_channel
      agoraChannel = `private_class_${requestId}`;
      updateQuery += `, agora_channel = $${paramIdx}`;
      params.push(agoraChannel);
      paramIdx++;
    }
    updateQuery += ' WHERE id = $' + paramIdx + ' RETURNING *';
    params.push(requestId);
    const result = await query(updateQuery, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ 
      message: 'Request status updated successfully',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a private class request (only by the student who created it)
router.delete('/:requestId', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const result = await query(`
      DELETE FROM private_class_requests 
      WHERE id = $1 AND student_id = $2
      RETURNING *
    `, [requestId, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or unauthorized' });
    }
    
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting private class request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Agora info for a private class request
router.get('/:requestId/agora-info', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await getRow('SELECT * FROM private_class_requests WHERE id = $1', [requestId]);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    // Only allow student or teacher to access
    if (
      req.user.role !== 'admin' &&
      req.user.id !== request.student_id &&
      req.user.name !== request.teacher_name
    ) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    // Placeholder for agora_token (replace with real token logic)
    const agora_token = 'PLACEHOLDER_TOKEN';
    res.json({
      agora_channel: request.agora_channel,
      scheduled_at: request.scheduled_at,
      agora_token
    });
  } catch (error) {
    console.error('Error fetching Agora info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 