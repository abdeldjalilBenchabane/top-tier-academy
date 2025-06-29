import express from 'express';
import pool from '../db.js';
import { verifyToken, requireProfessor, requireStudent } from '../middleware/auth.js';
import AgoraToken from 'agora-access-token';

const { RtcTokenBuilder, RtcRole } = AgoraToken;
const router = express.Router();

// POST /api/professors/:professorId/live-sessions → crée une session (titre, date, durée, prix)
// Note: The professorId will be taken from the authenticated user token, not from the URL directly for security.
router.post('/professors/:professorId/live-sessions', verifyToken, requireProfessor, async (req, res) => {
    const { title, start_time, duration, price } = req.body;
    const professor_id = req.user.id;

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
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating live session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/live-sessions → liste toutes les sessions publiques
router.get('/live-sessions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM live_sessions WHERE start_time >= NOW() ORDER BY start_time ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching live sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/live-sessions/:sessionId → récupère les détails d’une session
router.get('/live-sessions/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM live_sessions WHERE id = $1', [sessionId]);
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

// GET /api/live-sessions/:sessionId/access?student_id=… → vérifie si l’étudiant peut accéder
router.get('/live-sessions/:sessionId/access', verifyToken, async (req, res) => {
    const { sessionId } = req.params;
    const { student_id } = req.query;

    // A student can only check their own access, a professor/admin can check for any student.
    if (req.user.role === 'student' && parseInt(student_id, 10) !== req.user.id) {
        return res.status(403).json({ error: "Forbidden: You can only check your own access status." });
    }

    if (!student_id) {
        return res.status(400).json({ error: 'Missing required query parameter: student_id' });
    }

    try {
        const purchaseRes = await pool.query(
            'SELECT * FROM purchases WHERE session_id = $1 AND student_id = $2',
            [sessionId, student_id]
        );

        const sessionRes = await pool.query('SELECT start_time FROM live_sessions WHERE id = $1', [sessionId]);

        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Live session not found' });
        }

        const hasPurchased = purchaseRes.rows.length > 0;
        const isLive = new Date() >= new Date(sessionRes.rows[0].start_time);

        res.json({
            can_access: hasPurchased && isLive,
            has_purchased: hasPurchased,
            is_live: isLive
        });
    } catch (error) {
        console.error('Error checking access:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /rtcToken?channel=:channelName&uid=:uid → génère un token Agora
router.get('/rtcToken', (req, res) => {
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const channel = req.query.channel;
    const uid = req.query.uid ? Number(req.query.uid) : 0;
    const role = RtcRole.SUBSCRIBER;
    const expireTime = 3600; // 1 hour
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTime + expireTime;

    if (!appID || !appCertificate) {
        console.error('Agora App ID or Certificate is not set in .env file');
        return res.status(500).json({ error: 'Agora credentials not configured.' });
    }

    if (!channel) {
        return res.status(400).json({ error: 'Channel name is required' });
    }

    const token = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channel,
        uid,
        role,
        privilegeExpiredTs
    );

    res.json({ token, uid });
});


export default router;