import express from 'express';
import { query, getRows, getRow } from '../db.js';
import pool from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to get complete hierarchy path
const getHierarchyPath = async (levelId, yearId, specialityId, materialId) => {
  try {
    let path = [];
    
    if (levelId) {
      const level = await getRow('SELECT name FROM levels WHERE id = $1', [levelId]);
      if (level) path.push(level.name);
    }
    
    if (yearId) {
      const year = await getRow('SELECT name FROM years WHERE id = $1', [yearId]);
      if (year) path.push(year.name);
    }
    
    if (specialityId) {
      const speciality = await getRow('SELECT name FROM specialities WHERE id = $1', [specialityId]);
      if (speciality) path.push(speciality.name);
    }
    
    if (materialId) {
      const material = await getRow('SELECT name FROM materials WHERE id = $1', [materialId]);
      if (material) path.push(material.name);
    }
    
    const fullPath = path.join(' - ');
    console.log('Generated hierarchy path:', { levelId, yearId, specialityId, materialId, path, fullPath });
    return fullPath;
  } catch (error) {
    console.error('Error getting hierarchy path:', error);
    return '';
  }
};

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
    
    // Add hierarchy path to each request
    const requestsWithPath = await Promise.all(
      requests.map(async (request) => {
        const hierarchyPath = await getHierarchyPath(
          request.level_id,
          request.year_id,
          request.speciality_id,
          request.material_id
        );
        return {
          ...request,
          hierarchy_path: hierarchyPath || `${request.subject} - ${request.grade}`
        };
      })
    );
    
    res.json({ requests: requestsWithPath });
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
    
    // Add hierarchy path to each request
    const requestsWithPath = await Promise.all(
      requests.map(async (request) => {
        const hierarchyPath = await getHierarchyPath(
          request.level_id,
          request.year_id,
          request.speciality_id,
          request.material_id
        );
        return {
          ...request,
          hierarchy_path: hierarchyPath || `${request.subject} - ${request.grade}`
        };
      })
    );
    
    res.json({ requests: requestsWithPath });
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
    
    // Add hierarchy path to each request
    const requestsWithPath = await Promise.all(
      requests.map(async (request) => {
        const hierarchyPath = await getHierarchyPath(
          request.level_id,
          request.year_id,
          request.speciality_id,
          request.material_id
        );
        return {
          ...request,
          hierarchy_path: hierarchyPath || `${request.subject} - ${request.grade}`
        };
      })
    );
    
    res.json({ requests: requestsWithPath });
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
      description,
      level_id,
      year_id,
      speciality_id,
      material_id
    } = req.body;
    
    const student_id = req.user.id;
    
    // Get current pricing and duration settings
    const settings = await getRow('SELECT price_per_session, session_duration FROM private_class_settings ORDER BY id DESC LIMIT 1');
    const price_per_session = settings ? settings.price_per_session : 0;
    const session_duration = settings ? settings.session_duration : 60;
    
    const result = await query(`
      INSERT INTO private_class_requests 
      (student_id, teacher_name, subject, grade, date, time, sessions_count, title, description, level_id, year_id, speciality_id, material_id, price_per_session, session_duration)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [student_id, teacher_name, subject, grade, date, time, sessions_count, title, description, level_id, year_id, speciality_id, material_id, price_per_session, session_duration]);
    
    // Get hierarchy path for the response
    const hierarchyPath = await getHierarchyPath(level_id, year_id, speciality_id, material_id);
    
    res.status(201).json({ 
      message: 'Private class request created successfully',
      request: {
        ...result.rows[0],
        hierarchy_path: hierarchyPath || `${subject} - ${grade}`
      }
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
    const { status, time, rejection_reason } = req.body;
    // Check if user is professor or admin
    if (req.user.role !== 'professor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    // Fetch current request
    const current = await getRow('SELECT * FROM private_class_requests WHERE id = $1', [requestId]);
    if (!current) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Build update query dynamically based on what's being updated
    let updateQuery = 'UPDATE private_class_requests SET updated_at = CURRENT_TIMESTAMP';
    let params = [];
    let paramIdx = 1;
    
    // Only update status if it's provided
    if (status !== undefined) {
      updateQuery += `, status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }
    
    // If rejecting, handle rejection reason
    if (status === 'مرفوض') {
      if (rejection_reason) {
        updateQuery += `, rejection_reason = $${paramIdx}`;
        params.push(rejection_reason);
        paramIdx++;
      } else {
        // Set default rejection reason if none provided
        updateQuery += `, rejection_reason = $${paramIdx}`;
        params.push('تم رفض الطلب من قبل المدرس');
        paramIdx++;
      }
    } else if (status === 'مؤكد') {
      // Clear rejection reason when accepting
      updateQuery += `, rejection_reason = NULL`;
    }
    
    // If time is being set/updated, also set scheduled_at and agora_channel if not already set
    if (time) {
      updateQuery += `, time = $${paramIdx}`;
      params.push(time);
      paramIdx++;
      
      // Combine date and time into a timestamp (assume date is stored as YYYY-MM-DD and time as HH:mm - HH:mm)
      const dateStr = current.date;
      const startTime = time.split(' - ')[0];
      if (dateStr && startTime) {
        const scheduledAt = new Date(`${dateStr}T${startTime}:00`);
        updateQuery += `, scheduled_at = $${paramIdx}`;
        params.push(scheduledAt);
        paramIdx++;
      }
      
      // Always set agora_channel
      const agoraChannel = `private_class_${requestId}`;
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

// Purchase private class (for students)
router.post('/:requestId/purchase', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can purchase private classes' });
    }
    
    // Fetch the request
    const request = await getRow('SELECT * FROM private_class_requests WHERE id = $1', [requestId]);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Check if the request belongs to this student
    if (request.student_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only purchase your own requests' });
    }
    
    // Check if request is confirmed
    if (request.status !== 'مؤكد') {
      return res.status(400).json({ error: 'Request must be confirmed before purchase' });
    }
    
    // Check if already paid
    if (request.payment_status === 'paid') {
      return res.status(400).json({ error: 'Request is already paid' });
    }
    
    // Double-check payment status right before transaction to prevent race conditions
    const currentRequest = await getRow('SELECT payment_status FROM private_class_requests WHERE id = $1', [requestId]);
    if (currentRequest.payment_status === 'paid') {
      return res.status(400).json({ error: 'Request is already paid' });
    }
    
    // Get student's points balance
    const studentPoints = await getRow('SELECT balance FROM user_points WHERE user_id = $1', [req.user.id]);
    if (!studentPoints) {
      return res.status(400).json({ error: 'No points balance found. Please purchase points first.' });
    }
    
    // Calculate points needed (1 DZD = 1 point)
    const pointsNeeded = Math.round(request.price_per_session || 1000);
    
    // Check if student has enough points
    if (studentPoints.balance < pointsNeeded) {
      return res.status(400).json({ 
        error: `Insufficient points. You need ${pointsNeeded} points but have ${studentPoints.balance} points.`,
        pointsNeeded,
        currentBalance: studentPoints.balance
      });
    }
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Record the transaction (the database trigger will automatically deduct points)
      await client.query(`
        INSERT INTO point_transactions (user_id, transaction_type, points, amount, status, metadata)
        VALUES ($1, 'spend', $2, $3, 'completed', $4)
      `, [req.user.id, pointsNeeded, request.price_per_session, JSON.stringify({
        type: 'private_class_purchase',
        request_id: requestId,
        teacher_name: request.teacher_name,
        subject: request.subject
      })]);
      
      // Update request payment status
      await client.query(`
        UPDATE private_class_requests 
        SET payment_status = 'paid', payment_date = CURRENT_TIMESTAMP, points_used = $1
        WHERE id = $2
      `, [pointsNeeded, requestId]);
      
      await client.query('COMMIT');
      
      // Get updated request
      const updatedRequest = await getRow('SELECT * FROM private_class_requests WHERE id = $1', [requestId]);
      
      res.json({ 
        message: 'Private class purchased successfully',
        request: updatedRequest,
        pointsDeducted: pointsNeeded,
        newBalance: studentPoints.balance - pointsNeeded
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error purchasing private class:', error);
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

export default router; 