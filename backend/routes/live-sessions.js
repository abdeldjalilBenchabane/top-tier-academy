import express from 'express';
import pool from '../db.js';
import { verifyToken, requireProfessor, requireStudent, requireRole } from '../middleware/auth.js';
import AgoraToken from 'agora-access-token';
import jwt from 'jsonwebtoken';
import { getRow } from '../db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import NotificationService from '../services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { RtcTokenBuilder, RtcRole } = AgoraToken;
const router = express.Router();

// Configure multer for live session cover image uploads
const liveSessionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to main public folder (outside backend)
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'live-sessions');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = `live_session_${Date.now()}_${file.originalname}`;
    cb(null, fileName);
  }
});

const liveSessionUpload = multer({
  storage: liveSessionStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: 'File upload error: ' + error.message });
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};

// POST /api/professors/:professorId/live-sessions → crée une session (titre, date, durée, prix)
// Note: The professorId will be taken from the authenticated user token, not from the URL directly for security.
router.post('/professors/:professorId/live-sessions', 
  verifyToken, 
  requireProfessor, 
  liveSessionUpload.single('cover_image'),
  handleMulterError,
  async (req, res) => {
    console.log('[DEBUG] POST /professors/:professorId/live-sessions', {
        paramId: req.params.professorId,
        userId: req.user.id,
        userRole: req.user.role,
        body: req.body,
        contentType: req.headers['content-type']
    });
    
    // Extract data from request body (FormData)
    const { title, start_time, duration, price, material_id, description, section_id, telegram_channel } = req.body;
    
    console.log('[DEBUG] Extracted data:', {
        title,
        start_time,
        duration,
        price,
        material_id,
        description,
        section_id,
        telegram_channel
    });
    
    console.log('[DEBUG] start_time type and value:', {
        type: typeof start_time,
        value: start_time,
        isNull: start_time === null,
        isUndefined: start_time === undefined,
        isEmpty: start_time === ''
    });
    
    const professor_id = req.user.id;

    if (parseInt(req.params.professorId, 10) !== professor_id) {
        return res.status(403).json({ error: "Forbidden: You can only create sessions for yourself." });
    }

    if (!title || !start_time || !duration || !price) {
        return res.status(400).json({ error: 'Missing required fields: title, start_time, duration, price' });
    }

    try {
        // Fetch professor name from database
        const professorRes = await pool.query('SELECT name FROM users WHERE id = $1', [professor_id]);
        if (professorRes.rows.length === 0) {
            return res.status(404).json({ error: 'Professor not found' });
        }
        const professor_name = professorRes.rows[0].name;

        // Handle file upload if present
        let cover_image_url = null;
        if (req.file) {
            cover_image_url = `/uploads/live-sessions/${req.file.filename}`;
            console.log('[DEBUG] Cover image uploaded:', cover_image_url);
        }

        const result = await pool.query(
            'INSERT INTO live_sessions (professor_id, professor_name, title, description, start_time, duration, price, material_id, cover_image_url, section_id, telegram_channel) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [professor_id, professor_name, title, description, start_time, duration, price, material_id, cover_image_url, section_id || null, telegram_channel || null]
        );
        const session = result.rows[0];

        console.log('[DEBUG] Created live session:', {
            id: session.id,
            title: session.title,
            section_id: session.section_id,
            start_time: session.start_time,
            start_time_type: typeof session.start_time,
            description: session.description,
            duration: session.duration
        });
        
        console.log('[DEBUG] Insert values used:', {
            professor_id,
            professor_name,
            title,
            description,
            start_time,
            duration,
            price,
            material_id,
            cover_image_url,
            section_id: section_id || null,
            telegram_channel: telegram_channel || null
        });

        // Send notifications and emails for live session creation
        try {
            // Import notification and email services
            const NotificationService = (await import('../services/notificationService.js')).default;
            const { sendLiveSessionCreatedEmailToAdmin } = await import('../services/emailService.js');

            // Send notifications to all admins
            await NotificationService.notifyLiveSessionCreated(
                session.id,
                title,
                professor_name,
                professor_id
            );

            // Send emails to all admins
            const adminRes = await pool.query('SELECT name, email FROM users WHERE role = $1', ['admin']);
            for (const admin of adminRes.rows) {
                await sendLiveSessionCreatedEmailToAdmin(
                    admin.email,
                    admin.name,
                    professor_name,
                    title
                );
            }

            console.log(`✅ Live session creation notifications and emails sent for session ${session.id}`);
        } catch (error) {
            console.error('Error sending live session creation notifications/emails:', error);
            // Don't fail the session creation if notifications fail
        }

        res.status(201).json(session);
    } catch (error) {
        console.error('Error creating live session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/live-sessions/:id → update a live session
router.put('/live-sessions/:id', verifyToken, requireProfessor, (req, res, next) => {
  // Use multer.any() to accept all files
  liveSessionUpload.any()(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, start_time, duration, price, telegram_channel } = req.body;
        
        const professor_id = req.user.id;

        // Check if the session belongs to the professor
        const sessionCheck = await pool.query(
            'SELECT professor_id FROM live_sessions WHERE id = $1',
            [id]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Live session not found' });
        }

        if (sessionCheck.rows[0].professor_id != professor_id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (!title || !start_time || !duration || !price) {
            return res.status(400).json({ error: 'Missing required fields: title, start_time, duration, price' });
        }

        // Handle file upload if present
        let cover_image_url = null;
        if (req.files && req.files.length > 0) {
            const coverFile = req.files.find(f => f.fieldname === 'cover_image');
            if (coverFile) {
                cover_image_url = `/uploads/live-sessions/${coverFile.filename}`;
                console.log('[DEBUG] Cover image uploaded for update:', cover_image_url);
            }
        }

        const updateFields = ['title = $1', 'description = $2', 'start_time = $3', 'duration = $4', 'price = $5', 'telegram_channel = $6'];
        const updateValues = [title, description, start_time, duration, price, telegram_channel || null];
        let paramIndex = 7;

        if (cover_image_url) {
            updateFields.push(`cover_image_url = $${paramIndex}`);
            updateValues.push(cover_image_url);
            paramIndex++;
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');

        const query = `
            UPDATE live_sessions 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        updateValues.push(id);

        const result = await pool.query(query, updateValues);
        const session = result.rows[0];

        res.json(session);
    } catch (error) {
        console.error('Error updating live session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/live-sessions/pending → liste toutes les sessions en attente d'approbation (admin)
router.get('/live-sessions/pending', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ls.*,
                m.name as material_name,
                m.speciality_id,
                m.year_id,
                s.name as speciality_name,
                COALESCE(y1.name, y2.name) as year_name,
                COALESCE(l1.name, l2.name) as level_name
            FROM live_sessions ls
            LEFT JOIN materials m ON ls.material_id = m.id
            LEFT JOIN specialities s ON m.speciality_id = s.id
            LEFT JOIN years y1 ON s.year_id = y1.id
            LEFT JOIN levels l1 ON y1.level_id = l1.id
            LEFT JOIN years y2 ON m.year_id = y2.id
            LEFT JOIN levels l2 ON y2.level_id = l2.id
            WHERE ls.is_approved = FALSE AND ls.is_rejected = FALSE 
            ORDER BY ls.start_time ASC
        `);
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
                SELECT 
                    ls.*,
                    m.name as material_name,
                    m.speciality_id,
                    m.year_id,
                    s.name as speciality_name,
                    COALESCE(y1.name, y2.name) as year_name,
                    COALESCE(l1.name, l2.name) as level_name
                FROM live_sessions ls
                LEFT JOIN materials m ON ls.material_id = m.id
                LEFT JOIN specialities s ON m.speciality_id = s.id
                LEFT JOIN years y1 ON s.year_id = y1.id
                LEFT JOIN levels l1 ON y1.level_id = l1.id
                LEFT JOIN years y2 ON m.year_id = y2.id
                LEFT JOIN levels l2 ON y2.level_id = l2.id
                ORDER BY ls.start_time DESC
            `);
        } else {
            result = await pool.query(`
                SELECT 
                    ls.*,
                    m.name as material_name,
                    m.speciality_id,
                    m.year_id,
                    s.name as speciality_name,
                    COALESCE(y1.name, y2.name) as year_name,
                    COALESCE(l1.name, l2.name) as level_name
                FROM live_sessions ls
                LEFT JOIN materials m ON ls.material_id = m.id
                LEFT JOIN specialities s ON m.speciality_id = s.id
                LEFT JOIN years y1 ON s.year_id = y1.id
                LEFT JOIN levels l1 ON y1.level_id = l1.id
                LEFT JOIN years y2 ON m.year_id = y2.id
                LEFT JOIN levels l2 ON y2.level_id = l2.id
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
        const result = await pool.query(`
            SELECT 
                ls.*,
                m.name as material_name,
                m.speciality_id,
                m.year_id,
                s.name as speciality_name,
                COALESCE(y1.name, y2.name) as year_name,
                COALESCE(l1.name, l2.name) as level_name
            FROM live_sessions ls
            LEFT JOIN materials m ON ls.material_id = m.id
            LEFT JOIN specialities s ON m.speciality_id = s.id
            LEFT JOIN years y1 ON s.year_id = y1.id
            LEFT JOIN levels l1 ON y1.level_id = l1.id
            LEFT JOIN years y2 ON m.year_id = y2.id
            LEFT JOIN levels l2 ON y2.level_id = l2.id
            WHERE ls.id = $1
        `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching live session details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/live-sessions/:sessionId/purchase → Purchase live session with points
router.post('/live-sessions/:sessionId/purchase', verifyToken, requireStudent, async (req, res) => {
    const { sessionId } = req.params;
    const student_id = req.user.id;

    try {
        // Get the session details
        const sessionRes = await pool.query(`
            SELECT 
                ls.*,
                m.name as material_name,
                m.speciality_id,
                m.year_id,
                s.name as speciality_name,
                COALESCE(y1.name, y2.name) as year_name,
                COALESCE(l1.name, l2.name) as level_name
            FROM live_sessions ls
            LEFT JOIN materials m ON ls.material_id = m.id
            LEFT JOIN specialities s ON m.speciality_id = s.id
            LEFT JOIN years y1 ON s.year_id = y1.id
            LEFT JOIN levels l1 ON y1.level_id = l1.id
            LEFT JOIN years y2 ON m.year_id = y2.id
            LEFT JOIN levels l2 ON y2.level_id = l2.id
            WHERE ls.id = $1
        `, [sessionId]);
        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        
        const session = sessionRes.rows[0];
        const pointsNeeded = Math.round(session.price); // 1 DZD = 1 point

        // Check if already purchased
        const existingPurchase = await pool.query(
            'SELECT * FROM purchases WHERE session_id = $1 AND student_id = $2',
            [sessionId, student_id]
        );
        
        if (existingPurchase.rows.length > 0) {
            return res.status(409).json({ error: 'You have already purchased this session.' });
        }

        // Get student's points balance
        const studentPoints = await pool.query('SELECT balance FROM user_points WHERE user_id = $1', [student_id]);
        if (studentPoints.rows.length === 0) {
            return res.status(400).json({ error: 'No points balance found. Please purchase points first.' });
        }

        const currentBalance = studentPoints.rows[0].balance;
        
        // Only check balance if live session is not free
        if (pointsNeeded > 0 && currentBalance < pointsNeeded) {
            return res.status(400).json({ 
                error: `Insufficient points. You need ${pointsNeeded} points but have ${currentBalance} points.`,
                pointsNeeded,
                currentBalance
            });
        }

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Only deduct points if live session is not free
            if (pointsNeeded > 0) {
                // Deduct points from student (using the trigger system)
                await client.query(`
                    INSERT INTO point_transactions (user_id, transaction_type, points, amount, status, metadata)
                    VALUES ($1, 'spend', $2, $3, 'completed', $4)
                `, [student_id, pointsNeeded, session.price, JSON.stringify({
                    type: 'live_session_purchase',
                    session_id: sessionId,
                    session_title: session.title,
                    professor_name: session.professor_name
                })]);
            }

            // Record the purchase
            await client.query(
                'INSERT INTO purchases (session_id, student_id, amount_paid) VALUES ($1, $2, $3)',
                [sessionId, student_id, session.price]
            );

            await client.query('COMMIT');

            console.log(`[PURCHASE] Successfully purchased session ${sessionId} for student ${student_id}, amount: ${session.price}`);

            // Send notifications and emails
            try {
                // Import notification and email services
                const NotificationService = (await import('../services/notificationService.js')).default;
                const { sendLiveSessionPurchaseEmailToProfessor, sendLiveSessionPurchaseEmailToAdmin } = await import('../services/emailService.js');

                // Get student information
                const studentRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [student_id]);
                const student = studentRes.rows[0];

                // Get professor information
                let professor = null;
                if (session.professor_id) {
                    const professorRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [session.professor_id]);
                    professor = professorRes.rows[0];
                }

                // Send notifications
                await NotificationService.notifyLiveSessionPurchased(
                    sessionId,
                    session.title,
                    professor ? professor.name : 'Unknown Professor',
                    student.name,
                    student_id,
                    session.price
                );

                // Send emails
                if (professor) {
                    await sendLiveSessionPurchaseEmailToProfessor(
                        professor.email,
                        professor.name,
                        student.name,
                        session.title,
                        session.price
                    );
                }

                // Send emails to all admins
                const adminRes = await pool.query('SELECT name, email FROM users WHERE role = $1', ['admin']);
                for (const admin of adminRes.rows) {
                    await sendLiveSessionPurchaseEmailToAdmin(
                        admin.email,
                        admin.name,
                        student.name,
                        session.title,
                        session.price
                    );
                }

                console.log(`✅ Live session purchase notifications and emails sent for session ${sessionId}`);
            } catch (error) {
                console.error('Error sending live session purchase notifications/emails:', error);
                // Don't fail the purchase if notifications fail
            }

            // Get updated balance
            const newBalanceRes = await pool.query('SELECT balance FROM user_points WHERE user_id = $1', [student_id]);
            const newBalance = newBalanceRes.rows[0].balance;

            res.status(201).json({
                message: 'Live session purchased successfully',
                pointsDeducted: pointsNeeded,
                newBalance: newBalance,
                session: session
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error purchasing live session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/live-sessions/:sessionId/access → Check if user can access the session
router.get('/live-sessions/:sessionId/access', verifyToken, async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    try {
        // Get session details
        const sessionRes = await pool.query(`
            SELECT 
                ls.*,
                m.name as material_name,
                m.speciality_id,
                m.year_id,
                s.name as speciality_name,
                COALESCE(y1.name, y2.name) as year_name,
                COALESCE(l1.name, l2.name) as level_name
            FROM live_sessions ls
            LEFT JOIN materials m ON ls.material_id = m.id
            LEFT JOIN specialities s ON m.speciality_id = s.id
            LEFT JOIN years y1 ON s.year_id = y1.id
            LEFT JOIN levels l1 ON y1.level_id = l1.id
            LEFT JOIN years y2 ON m.year_id = y2.id
            LEFT JOIN levels l2 ON y2.level_id = l2.id
            WHERE ls.id = $1
        `, [sessionId]);
        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Live section not found' });
        }

        const session = sessionRes.rows[0];
        const isLive = true; // Live sections are always considered "live"

        // Check if user has purchased this session (using purchases table)
        const purchaseRes = await pool.query(
          'SELECT * FROM purchases WHERE session_id = $1 AND student_id = $2',
          [sessionId, userId]
        );

        const hasPurchased = purchaseRes.rows.length > 0;
        const canAccess = hasPurchased; // Allow access if purchased, regardless of live status

        console.log(`[ACCESS] Session ${sessionId}, User ${userId}, HasPurchased: ${hasPurchased}, CanAccess: ${canAccess}`);
        console.log(`[ACCESS] Purchase query result:`, purchaseRes.rows);
        console.log(`[ACCESS] Response object:`, {
            canAccess: canAccess,
            hasPurchased: hasPurchased,
            isLive: isLive,
            session: session
        });

        res.json({
            canAccess: canAccess,
            hasPurchased: hasPurchased,
            isLive: isLive,
            session: session
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
        
        // Send notifications and emails for live session approval
        try {
            // Import notification and email services
            const NotificationService = (await import('../services/notificationService.js')).default;
            const { sendLiveSessionApprovedEmailToProfessor } = await import('../services/emailService.js');

            // Get professor information
            const professorRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [session.professor_id]);
            const professor = professorRes.rows[0];

            // Get admin information
            const adminRes = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
            const admin = adminRes.rows[0];

            // Send notification to professor
            await NotificationService.notifyLiveSessionApproved(
                session.id,
                session.title,
                session.professor_id,
                professor.name,
                admin.name
            );

            // Send email to professor
            await sendLiveSessionApprovedEmailToProfessor(
                professor.email,
                professor.name,
                session.title,
                admin.name
            );

            console.log(`✅ Live session approval notifications and emails sent for session ${session.id}`);
        } catch (error) {
            console.error('Error sending live session approval notifications/emails:', error);
            // Don't fail the approval if notifications fail
        }
        
        res.json({ message: 'Session approved successfully' });
    } catch (error) {
        console.error('Error approving session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/live-sessions/:id/reject
router.patch('/live-sessions/:id/reject', verifyToken, requireRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body; // Optional rejection reason
    try {
        const result = await pool.query(
            'UPDATE live_sessions SET is_approved = FALSE, is_rejected = TRUE WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        const session = result.rows[0];
        
        // Send notifications and emails for live session rejection
        try {
            // Import notification and email services
            const NotificationService = (await import('../services/notificationService.js')).default;
            const { sendLiveSessionRejectedEmailToProfessor } = await import('../services/emailService.js');

            // Get professor information
            const professorRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [session.professor_id]);
            const professor = professorRes.rows[0];

            // Get admin information
            const adminRes = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
            const admin = adminRes.rows[0];

            // Send notification to professor
            await NotificationService.notifyLiveSessionRejected(
                session.id,
                session.title,
                session.professor_id,
                professor.name,
                admin.name,
                reason
            );

            // Send email to professor
            await sendLiveSessionRejectedEmailToProfessor(
                professor.email,
                professor.name,
                session.title,
                admin.name,
                reason
            );

            console.log(`✅ Live session rejection notifications and emails sent for session ${session.id}`);
        } catch (error) {
            console.error('Error sending live session rejection notifications/emails:', error);
            // Don't fail the rejection if notifications fail
        }
        
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
        const result = await pool.query(`
            SELECT 
                ls.*,
                m.name as material_name,
                m.speciality_id,
                m.year_id,
                s.name as speciality_name,
                COALESCE(y1.name, y2.name) as year_name,
                COALESCE(l1.name, l2.name) as level_name
            FROM live_sessions ls
            LEFT JOIN materials m ON ls.material_id = m.id
            LEFT JOIN specialities s ON m.speciality_id = s.id
            LEFT JOIN years y1 ON s.year_id = y1.id
            LEFT JOIN levels l1 ON y1.level_id = l1.id
            LEFT JOIN years y2 ON m.year_id = y2.id
            LEFT JOIN levels l2 ON y2.level_id = l2.id
            WHERE ls.professor_id = $1 
            ORDER BY ls.start_time DESC
        `, [professor_id]);
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

// PATCH /api/live-sessions/:sessionId/admin → admin update endpoint for approval and other fields
router.patch('/live-sessions/:sessionId/admin', verifyToken, requireRole(['admin']), async (req, res) => {
    const { sessionId } = req.params;
    const updates = req.body;

    try {
        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        // Handle different update fields
        if (updates.isApproved !== undefined) {
            updateFields.push(`is_approved = $${paramCount++}`);
            updateValues.push(updates.isApproved);
        }
        
        if (updates.approvedAt !== undefined) {
            updateFields.push(`approved_at = $${paramCount++}`);
            updateValues.push(updates.approvedAt);
        }
        
        if (updates.status !== undefined) {
            updateFields.push(`status = $${paramCount++}`);
            updateValues.push(updates.status);
        }
        
        if (updates.attendeesCount !== undefined) {
            updateFields.push(`attendees_count = $${paramCount++}`);
            updateValues.push(updates.attendeesCount);
        }
        
        if (updates.recordingUrl !== undefined) {
            updateFields.push(`recording_url = $${paramCount++}`);
            updateValues.push(updates.recordingUrl);
        }
        
        if (updates.isRecorded !== undefined) {
            updateFields.push(`is_recorded = $${paramCount++}`);
            updateValues.push(updates.isRecorded);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Add session ID to values
        updateValues.push(sessionId);

        const query = `
            UPDATE live_sessions 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, updateValues);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Live session not found' });
        }

        // If approving, set approved_by to current admin
        if (updates.isApproved === true) {
            await pool.query(
                'UPDATE live_sessions SET approved_by = $1 WHERE id = $2',
                [req.user.id, sessionId]
            );
        }

        // Send notifications and emails for approval/rejection
        if (updates.isApproved !== undefined) {
            try {
                // Import notification and email services
                const NotificationService = (await import('../services/notificationService.js')).default;
                const { sendLiveSessionApprovedEmailToProfessor, sendLiveSessionRejectedEmailToProfessor } = await import('../services/emailService.js');

                // Get session information
                const sessionRes = await pool.query('SELECT title, professor_id, professor_name FROM live_sessions WHERE id = $1', [sessionId]);
                if (sessionRes.rows.length > 0) {
                    const session = sessionRes.rows[0];
                    
                    // Get professor information
                    const professorRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [session.professor_id]);
                    const professor = professorRes.rows[0];

                    // Get admin information
                    const adminRes = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
                    const admin = adminRes.rows[0];

                    if (updates.isApproved === true) {
                        // Send approval notifications and emails
                        await NotificationService.notifyLiveSessionApproved(
                            sessionId,
                            session.title,
                            session.professor_id,
                            professor.name,
                            admin.name
                        );

                        await sendLiveSessionApprovedEmailToProfessor(
                            professor.email,
                            professor.name,
                            session.title,
                            admin.name
                        );

                        console.log(`✅ Live session approval notifications and emails sent for session ${sessionId}`);
                    } else if (updates.isApproved === false) {
                        // Send rejection notifications and emails
                        const reason = updates.rejectionReason || 'No reason provided';
                        
                        await NotificationService.notifyLiveSessionRejected(
                            sessionId,
                            session.title,
                            session.professor_id,
                            professor.name,
                            admin.name,
                            reason
                        );

                        await sendLiveSessionRejectedEmailToProfessor(
                            professor.email,
                            professor.name,
                            session.title,
                            admin.name,
                            reason
                        );

                        console.log(`✅ Live session rejection notifications and emails sent for session ${sessionId}`);
                    }
                }
            } catch (error) {
                console.error('Error sending live session approval/rejection notifications/emails:', error);
                // Don't fail the update if notifications fail
            }
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating live session (admin):', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;