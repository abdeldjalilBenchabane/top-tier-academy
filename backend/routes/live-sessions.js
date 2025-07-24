import express from 'express';
import pool from '../db.js';
import { verifyToken, requireProfessor, requireStudent, requireRole } from '../middleware/auth.js';
import AgoraToken from 'agora-access-token';
import jwt from 'jsonwebtoken';
import { getRow } from '../db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for live session file uploads (similar to courses)
const liveSessionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'live-sessions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const liveSessionUpload = multer({
  storage: liveSessionStorage,
  fileFilter: (req, file, cb) => {
    console.log('Live session file upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Allow images for covers
    if (file.fieldname === 'cover_image') {
      const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedImageTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        return cb(null, true);
      } else {
        return cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed for covers!'));
      }
    }
    
    return cb(new Error('Invalid file field!'));
  }
});

const { RtcTokenBuilder, RtcRole } = AgoraToken;
const router = express.Router();

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('❌ Multer error:', err);
        return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
        console.error('❌ File upload error:', err);
        return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    next();
};

// Add error handling to the route
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('❌ Multer error in route:', err);
        return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    next(err);
});

// Test route to verify server is working
router.get('/test-live-sessions', (req, res) => {
    res.json({ message: 'Live sessions route is working!' });
});

// Test POST route with multer
router.post('/test-live-sessions', (req, res, next) => {
  liveSessionUpload.single('cover_image')(req, res, (err) => {
    if (err) {
      console.error('❌ Test upload error:', err);
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    next();
  });
}, (req, res) => {
    console.log('Test POST received:', req.body);
    console.log('Test file received:', req.file ? req.file.originalname : 'No file');
    res.json({ 
        message: 'Test POST working!', 
        received: req.body,
        file: req.file ? req.file.originalname : 'No file'
    });
});

// Test POST route without multer (for debugging)
router.post('/test-live-sessions-no-multer', (req, res) => {
    console.log('Test POST without multer received:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    res.json({ 
        message: 'Test POST without multer working!', 
        received: req.body,
        contentType: req.headers['content-type']
    });
});

// POST /api/professors/:professorId/live-sessions → crée une session (titre, date, durée, prix)
// Note: The professorId will be taken from the authenticated user token, not from the URL directly for security.
router.post('/professors/:professorId/live-sessions', verifyToken, requireProfessor, (req, res, next) => {
  liveSessionUpload.single('cover_image')(req, res, (err) => {
    if (err) {
      console.error('❌ Live session upload error:', err);
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
    console.log('[DEBUG] POST /professors/:professorId/live-sessions', {
        paramId: req.params.professorId,
        userId: req.user.id,
        userRole: req.user.role,
        body: req.body,
        contentType: req.headers['content-type'],
        hasFile: !!req.file,
        fileDetails: req.file ? {
            originalname: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : 'No file'
    });
    
    const professor_id = req.user.id;
    const professor_name = req.user.name || req.user.email || `ID ${professor_id}`;

    if (parseInt(req.params.professorId, 10) !== professor_id) {
        return res.status(403).json({ error: "Forbidden: You can only create sessions for yourself." });
    }

    // Handle form data (multer automatically parses multipart/form-data)
    let title, description, start_time, duration, price, material_id, cover_image_url = null;
    
    // Extract form data with error handling
    if (!req.body) {
        console.error('❌ No req.body received');
        console.error('❌ Headers:', req.headers);
        return res.status(400).json({ error: 'No form data received' });
    }
    
    console.log('📝 Received form data:', req.body);
    console.log('📝 Content-Type:', req.headers['content-type']);
    console.log('📁 File received:', req.file ? req.file.originalname : 'No file');
    console.log('📁 File details:', req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
    } : 'No file');
    
    // Extract form fields
    title = req.body.title;
    description = req.body.description;
    start_time = req.body.start_time;
    duration = req.body.duration;
    price = req.body.price;
    material_id = req.body.material_id;
    
    // Handle file upload if present
    if (req.file) {
        cover_image_url = `/uploads/live-sessions/${req.file.filename}`;
        console.log('✅ File uploaded successfully:', cover_image_url);
        console.log('📁 File details:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });
    } else {
        console.log('ℹ️  No file uploaded, using default image');
    }

    // Validate required fields
    if (!title) {
        return res.status(400).json({ error: 'Missing required field: title' });
    }
    if (!start_time) {
        return res.status(400).json({ error: 'Missing required field: start_time' });
    }
    if (!duration) {
        return res.status(400).json({ error: 'Missing required field: duration' });
    }
    if (!price) {
        return res.status(400).json({ error: 'Missing required field: price' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO live_sessions (professor_id, title, description, start_time, duration, price, material_id, cover_image, is_approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [professor_id, title, description || '', start_time, duration, price, material_id || null, cover_image_url || '/images/module_icon.png', true]
        );
        const session = result.rows[0];
        
        console.log('✅ Live session created successfully:', {
            id: session.id,
            title: session.title,
            cover_image: session.cover_image
        });

        // Notify all admins
        const adminsRes = await pool.query('SELECT id FROM users WHERE role = $1', ['admin']);
        const notificationMessage = `Prof. ${professor_name} created a new live session (auto-approved): \"${title}\"`;
        for (const admin of adminsRes.rows) {
            await pool.query(
                'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
                [admin.id, notificationMessage]
            );
        }

        res.status(201).json(session);
    } catch (error) {
        console.error('Error creating live session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/live-sessions/pending → liste toutes les sessions en attente d'approbation (admin)
router.get('/live-sessions/pending', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM live_sessions WHERE is_approved = FALSE AND is_rejected = FALSE ORDER BY start_time ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching pending live sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/live-sessions → liste toutes les sessions publiques
router.get('/live-sessions', async (req, res) => {
    try {
        let result;
        if (req.query.all === 'true') {
            result = await pool.query(`
                SELECT ls.*, u.name as professor_name 
                FROM live_sessions ls 
                LEFT JOIN users u ON ls.professor_id = u.id 
                ORDER BY ls.start_time DESC
            `);
        } else {
            result = await pool.query(`
                SELECT ls.*, u.name as professor_name 
                FROM live_sessions ls 
                LEFT JOIN users u ON ls.professor_id = u.id 
                WHERE ls.is_approved = TRUE 
                ORDER BY ls.start_time DESC
            `);
        }

        // If user is authenticated, check their purchase status for each session
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.replace('Bearer ', '');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;

                // Get all purchases for this user
                const purchaseResult = await pool.query(
                    'SELECT session_id FROM purchases WHERE student_id = $1',
                    [userId]
                );
                const purchasedSessionIds = purchaseResult.rows.map(row => row.session_id);

                // Add is_paid field to each session
                const sessionsWithPurchaseInfo = result.rows.map(session => ({
                    ...session,
                    is_paid: purchasedSessionIds.includes(session.id)
                }));

                res.json(sessionsWithPurchaseInfo);
            } catch (jwtError) {
                // If JWT verification fails, return sessions without purchase info
                res.json(result.rows);
            }
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        console.error('Error fetching live sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/live-sessions/:id → récupère les détails d'une session
router.get('/live-sessions/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        if (id.startsWith('private_class_')) {
            // Extract the private class request ID
            const requestId = id.replace('private_class_', '');
            // Fetch from private_class_requests using getRow helper
            const request = await getRow('SELECT * FROM private_class_requests WHERE id = $1', [requestId]);
            if (!request) return res.status(404).json({ error: 'Private class not found' });
            // Return a session-like object
            return res.json({
                id,
                title: request.title || 'حصة خاصة',
                description: request.description || '',
                presenter: request.teacher_name,
                scheduled_at: request.scheduled_at,
                // Add any other fields your frontend expects
            });
        }
        const result = await pool.query('SELECT * FROM live_sessions WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching live session details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/live-sessions/:sessionId/purchase → enregistre un achat pour un étudiant
router.post('/live-sessions/:sessionId/purchase', verifyToken, requireStudent, async (req, res) => {
    const { sessionId } = req.params;
    const student_id = req.user.id;
    const { amount_paid } = req.body; // This should be verified against the session price

    if (!amount_paid) {
        return res.status(400).json({ error: 'Missing required field: amount_paid' });
    }

    try {
        // First, get the session price to validate the amount paid
        const sessionRes = await pool.query('SELECT price FROM live_sessions WHERE id = $1', [sessionId]);
        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        const sessionPrice = parseFloat(sessionRes.rows[0].price);

        if (parseFloat(amount_paid) !== sessionPrice) {
            return res.status(400).json({ error: 'Incorrect payment amount.' });
        }

        const result = await pool.query(
            'INSERT INTO purchases (session_id, student_id, amount_paid) VALUES ($1, $2, $3) RETURNING *',
            [sessionId, student_id, amount_paid]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'You have already purchased this session.' });
        }
        console.error('Error recording purchase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/live-sessions/:sessionId/access?student_id=… → vérifie si l'étudiant peut accéder
router.get('/live-sessions/:sessionId/access', verifyToken, async (req, res) => {
    const { sessionId } = req.params;
    const { student_id } = req.query;

    // Debug log
    console.log('[DEBUG] Authenticated user:', req.user, 'student_id param:', student_id);

    if (!student_id) {
        return res.status(400).json({ error: 'Missing required query parameter: student_id' });
    }

    try {
        // Only check that the session exists, do not check purchases or user
        const sessionRes = await pool.query('SELECT start_time FROM live_sessions WHERE id = $1', [sessionId]);

        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Live session not found' });
        }

        const isLive = new Date() >= new Date(sessionRes.rows[0].start_time);

        res.json({
            can_access: true, // Always allow access
            has_purchased: true, // Always true for compatibility
            is_live: isLive
        });
    } catch (error) {
        console.error('Error checking access:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /rtcToken?channel=:channelName&uid=:uid → génère un token Agora
router.get('/rtcToken', verifyToken, (req, res) => {
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const channel = req.query.channel;
    const uid = req.query.uid;

    // Determine role based on user type
    // Always allow publishing for both professors and students
    const role = RtcRole.PUBLISHER;

    const expireTime = 3600; // 1 hour
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTime + expireTime;

    console.log('[DEBUG] RTC Token generation:', {
        appID: appID ? 'SET' : 'MISSING',
        appCertificate: appCertificate ? 'SET' : 'MISSING',
        channel,
        uid,
        role: role === RtcRole.PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER',
        userRole: req.user.role
    });

    if (!appID || !appCertificate) {
        console.error('Agora App ID or Certificate is not set in .env file');
        return res.status(500).json({ error: 'Agora credentials not configured.' });
    }

    if (!channel) {
        return res.status(400).json({ error: 'Channel name is required' });
    }

    // Use the UID from request parameters, or use 0 (Agora will assign automatically)
    let numericUid;
    if (uid && uid !== 'null' && !isNaN(Number(uid))) {
        numericUid = Number(uid);
        console.log('[DEBUG] Using provided UID:', numericUid);
    } else {
        // Use 0 to let Agora assign UID automatically (prevents conflicts)
        numericUid = 0;
        console.log('[DEBUG] Using UID 0 (Agora will assign automatically)');
    }

    try {
        // Use buildTokenWithUid with numeric UID as Agora expects
        const token = RtcTokenBuilder.buildTokenWithUid(
            appID,
            appCertificate,
            channel,
            numericUid, // Use numeric UID
            role,
            privilegeExpiredTs
        );

        console.log('[DEBUG] Token generated successfully for UID:', numericUid);
        console.log('[DEBUG] Token length:', token.length);

        res.json({ token, uid: numericUid });
    } catch (error) {
        console.error('[DEBUG] Token generation error:', error);
        console.error('[DEBUG] Error details:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'Failed to generate token: ' + error.message });
    }
});

// PATCH /api/live-sessions/:id/approve
router.patch('/live-sessions/:id/approve', verifyToken, requireRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE live_sessions SET is_approved = TRUE, is_rejected = FALSE WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        const session = result.rows[0];
        // Notify professor
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [session.professor_id, `Your live session "${session.title}" has been approved by the admin.`]
        );
        res.json({ message: 'Session approved', session });
    } catch (error) {
        console.error('Error approving session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/live-sessions/:id/reject
router.patch('/live-sessions/:id/reject', verifyToken, requireRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE live_sessions SET is_approved = FALSE, is_rejected = TRUE WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        const session = result.rows[0];
        // Notify professor
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [session.professor_id, `Your live session "${session.title}" has been rejected by the admin.`]
        );
        res.json({ message: 'Session rejected', session });
    } catch (error) {
        console.error('Error rejecting session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/professors/:professorId/live-sessions → liste les sessions d'un prof
router.get('/professors/:professorId/live-sessions', verifyToken, requireProfessor, async (req, res) => {
    console.log('[DEBUG] GET /professors/:professorId/live-sessions', {
        paramId: req.params.professorId,
        userId: req.user.id,
        userRole: req.user.role
    });
    const professor_id = parseInt(req.params.professorId, 10);
    if (professor_id !== req.user.id) {
        return res.status(403).json({ error: "Forbidden: You can only view your own sessions." });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM live_sessions WHERE professor_id = $1 ORDER BY start_time DESC',
            [professor_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching professor live sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/live-sessions/:sessionId → met à jour le statut (ou autres champs) d'une session
router.patch('/live-sessions/:sessionId', verifyToken, requireProfessor, async (req, res) => {
    const { sessionId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Missing required field: status' });
    }

    try {
        const result = await pool.query(
            'UPDATE live_sessions SET status = $1 WHERE id = $2 RETURNING *',
            [status, sessionId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating live session status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/live-sessions/:sessionId/end → End a live session (called when teacher ends stream)
router.patch('/live-sessions/:sessionId/end', verifyToken, requireProfessor, async (req, res) => {
    const { sessionId } = req.params;
    const professor_id = req.user.id;

    try {
        // Verify the session belongs to the professor
        const sessionCheck = await pool.query(
            'SELECT * FROM live_sessions WHERE id = $1 AND professor_id = $2',
            [sessionId, professor_id]
        );
        
        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Live session not found or you do not have permission to end it' });
        }

        const session = sessionCheck.rows[0];
        
        // Update session status to ended
        const result = await pool.query(
            'UPDATE live_sessions SET status = $1, is_ended = TRUE, ended_at = NOW() WHERE id = $2 RETURNING *',
            ['ended', sessionId]
        );

        console.log(`✅ Live session ${sessionId} ended by professor ${professor_id}`);

        res.json({ 
            message: 'Live session ended successfully',
            session: result.rows[0]
        });
    } catch (error) {
        console.error('Error ending live session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;