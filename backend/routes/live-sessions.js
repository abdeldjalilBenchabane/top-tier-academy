import express from 'express';
import pool from '../db.js';
import { verifyToken, requireProfessor, requireStudent, requireRole } from '../middleware/auth.js';
import AgoraToken from 'agora-access-token';
import jwt from 'jsonwebtoken';
import { getRow } from '../db.js';

const { RtcTokenBuilder, RtcRole } = AgoraToken;
const router = express.Router();

// POST /api/professors/:professorId/live-sessions → crée une session (titre, date, durée, prix)
// Note: The professorId will be taken from the authenticated user token, not from the URL directly for security.
router.post('/professors/:professorId/live-sessions', verifyToken, requireProfessor, async (req, res) => {
    console.log('[DEBUG] POST /professors/:professorId/live-sessions', {
        paramId: req.params.professorId,
        userId: req.user.id,
        userRole: req.user.role
    });
    const { title, start_time, duration, price } = req.body;
    const professor_id = req.user.id;
    const professor_name = req.user.name || req.user.email || `ID ${professor_id}`;

    if (parseInt(req.params.professorId, 10) !== professor_id) {
        return res.status(403).json({ error: "Forbidden: You can only create sessions for yourself." });
    }

    if (!title || !start_time || !duration || !price) {
        return res.status(400).json({ error: 'Missing required fields: title, start_time, duration, price' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO live_sessions (professor_id, title, start_time, duration, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [professor_id, title, start_time, duration, price]
        );
        const session = result.rows[0];

        // Notify all admins
        const adminsRes = await pool.query('SELECT id FROM users WHERE role = $1', ['admin']);
        const notificationMessage = `Prof. ${professor_name} scheduled a new session: \"${title}\"`;
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
            result = await pool.query('SELECT * FROM live_sessions ORDER BY start_time DESC');
        } else {
            result = await pool.query(
                'SELECT * FROM live_sessions WHERE is_approved = TRUE ORDER BY start_time DESC'
            );
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
    const role = req.user.role === 'professor' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

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

export default router;