import express from 'express';
import { verifyToken, requireProfessor, requireStudent, requireRole } from '../middleware/auth.js';
import AgoraToken from 'agora-access-token';
import jwt from 'jsonwebtoken';
import { getRow, getRows, query } from '../db.js';
import pool from '../db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import NotificationService from '../services/notificationService.js';
import { createR2Multer } from '../middleware/r2MulterStorage.js';
import { deleteFromR2, extractKeyFromUrl } from '../services/r2Service.js';
import { convertDatetimeLocalToUTC, convertUTCToDatetimeLocal } from '../utils/timezone.js';
import { debugLog } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { RtcTokenBuilder, RtcRole } = AgoraToken;
const router = express.Router();

// Configure multer for live session cover image uploads with R2 storage
const liveSessionUpload = createR2Multer('live-sessions', null, {
  fileFilter: (req, file, cb) => {
    debugLog('Live session file upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Allow only image files for live session covers
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedImageTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed for live session covers!'));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.error('Multer error:', error);
  
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  } else if (error) {
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
  async (req, res, next) => {
    debugLog('[DEBUG] POST /professors/:professorId/live-sessions', {
        paramId: req.params.professorId,
        userId: req.user.id,
        userRole: req.user.role,
        body: req.body,
        contentType: req.headers['content-type']
    });
    
    // Extract data from request body (FormData)
    const { title, start_time, duration, price, material_id, description, section_id, telegram_channel } = req.body;
    
    debugLog('[DEBUG] Extracted data:', {
        title,
        start_time,
        duration,
        price,
        material_id,
        description,
        section_id,
        telegram_channel
    });
    
    debugLog('[DEBUG] start_time type and value:', {
        type: typeof start_time,
        value: start_time,
        isNull: start_time === null,
        isUndefined: start_time === undefined,
        isEmpty: start_time === ''
    });
    

    // Store datetime as-is without timezone conversion
    // The datetime-local input from the client is already in the desired format
    let processedStartTime = start_time;
    if (start_time) {
        try {
            // Just validate the format, don't convert timezone
            const testDate = new Date(start_time);
            if (isNaN(testDate.getTime())) {
                throw new Error('Invalid date format');
            }
            // Keep the original datetime-local value
            processedStartTime = start_time;
            debugLog('[DEBUG] Storing start_time as-is:', processedStartTime);
        } catch (error) {
            console.error('[ERROR] Failed to validate start_time:', error);
            return res.status(400).json({ error: 'Invalid date/time format' });
        }
    }
    
    const professor_id = req.user.id;

    if (parseInt(req.params.professorId, 10) !== professor_id) {
        return res.status(403).json({ error: "Forbidden: You can only create sessions for yourself." });
    }

    if (!title || !start_time || !duration || !price) {
        return res.status(400).json({ error: 'Missing required fields: title, start_time, duration, price' });
    }

    try {
        // Fetch professor name from database
        const professorRes = await getRow('SELECT name FROM users WHERE id = $1', [professor_id]);
        if (!professorRes) {
            return res.status(404).json({ error: 'Professor not found' });
        }
        const professor_name = professorRes.name;

        // Handle R2 upload manually after file is buffered
        let cover_image_url = null;
        if (req.file && req.file.buffer) {
            try {
                debugLog('📤 Processing R2 upload for live session cover...');
                
                // Import R2 functions
                const { uploadToR2, generateR2Key } = await import('../services/r2Service.js');
                
                // Generate R2 key
                const r2Key = generateR2Key('live-sessions', null, req.file.originalname, 'cover');
                debugLog('🔑 Generated R2 key:', r2Key);
                
                // Upload to R2
                const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
                debugLog('✅ Live session cover uploaded to R2:', publicUrl);
                
                // Update file object with R2 URL
                req.file.path = publicUrl;
                req.file.filename = r2Key;
                cover_image_url = publicUrl;
            } catch (error) {
                console.error('❌ Error uploading live session cover to R2:', error);
                return res.status(500).json({ 
                    error: 'Failed to upload cover to R2',
                    details: error.message 
                });
            }
        } else if (req.file) {
            // Fallback for non-buffer uploads (shouldn't happen with our setup)
            cover_image_url = req.file.path;
            debugLog('[DEBUG] Cover image uploaded (fallback):', cover_image_url);
        }

        // A session inside an already-approved دورة inherits that approval.
        // The admin approved the دورة and everything in it; a session added
        // afterwards is part of the same thing, and leaving it pending asked
        // for a decision that had already been made. A standalone session, or
        // one in a دورة still under review, stays pending as before.
        let inheritsApproval = false;
        if (section_id) {
            const parent = await getRow(
                'SELECT status FROM live_sections WHERE id = $1', [section_id]);
            inheritsApproval = parent?.status === 'approved';
        }

        const result = await query(
            `INSERT INTO live_sessions
               (professor_id, professor_name, title, description, start_time, duration,
                price, material_id, cover_image_url, section_id, telegram_channel,
                is_approved, approved_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                     CASE WHEN $12 THEN CURRENT_TIMESTAMP ELSE NULL END)
             RETURNING *`,
            [professor_id, professor_name, title, description, processedStartTime, duration,
             price, material_id, cover_image_url, section_id || null, telegram_channel || null,
             inheritsApproval]
        );
        const session = result.rows[0];

        debugLog('[DEBUG] Created live session:', {
            id: session.id,
            title: session.title,
            section_id: session.section_id,
            start_time: session.start_time,
            start_time_type: typeof session.start_time,
            description: session.description,
            duration: session.duration
        });
        
        debugLog('[DEBUG] Insert values used:', {
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
            // getRows returns the rows themselves — `.rows` on that is undefined,
            // which threw on every session and swallowed the whole notification.
            const admins = await getRows('SELECT name, email FROM users WHERE role = $1', ['admin']);
            for (const admin of admins) {
                await sendLiveSessionCreatedEmailToAdmin(
                    admin.email,
                    admin.name,
                    professor_name,
                    title
                );
            }

            debugLog(`✅ Live session creation notifications and emails sent for session ${session.id}`);
        } catch (error) {
            console.error('Error sending live session creation notifications/emails:', error);
            // Don't fail the session creation if notifications fail
        }

        res.status(201).json(session);

        // Students who already bought the دورة hear about the new session.
        if (session.section_id && inheritsApproval) {
            announceSessionAdded(session).catch((e) =>
                console.error('[live-added] announce failed:', e.message));
        }
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

        // Remember the old schedule so students who paid can be told if it moves.
        const previous = await getRow('SELECT start_time, title FROM live_sessions WHERE id = $1', [id]);

        // Check if the session belongs to the professor
        const sessionCheck = await getRow(
            'SELECT professor_id FROM live_sessions WHERE id = $1',
            [id]
        );

        if (!sessionCheck) {
            return res.status(404).json({ error: 'Live session not found' });
        }

        if (sessionCheck.professor_id != professor_id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (!title || !start_time || !duration || !price) {
            return res.status(400).json({ error: 'Missing required fields: title, start_time, duration, price' });
        }

        // Store datetime as-is without timezone conversion
        let processedStartTime = start_time;
        if (start_time) {
            try {
                // Just validate the format, don't convert timezone
                const testDate = new Date(start_time);
                if (isNaN(testDate.getTime())) {
                    throw new Error('Invalid date format');
                }
                // Keep the original datetime-local value
                processedStartTime = start_time;
                debugLog('[DEBUG] Update - Storing start_time as-is:', processedStartTime);
            } catch (error) {
                console.error('[ERROR] Failed to validate start_time for update:', error);
                return res.status(400).json({ error: 'Invalid date/time format' });
            }
        }

        // Handle R2 upload manually after file is buffered
        let cover_image_url = null;
        if (req.files && req.files.length > 0) {
            const coverFile = req.files.find(f => f.fieldname === 'cover_image');
            if (coverFile && coverFile.buffer) {
                try {
                    debugLog('📤 Processing R2 upload for live session cover update...');
                    
                    // Import R2 functions
                    const { uploadToR2, generateR2Key } = await import('../services/r2Service.js');
                    
                    // Generate R2 key
                    const r2Key = generateR2Key('live-sessions', null, coverFile.originalname, 'cover');
                    debugLog('🔑 Generated R2 key:', r2Key);
                    
                    // Upload to R2
                    const publicUrl = await uploadToR2(coverFile.buffer, r2Key, coverFile.mimetype);
                    debugLog('✅ Live session cover updated to R2:', publicUrl);
                    
                    // Update file object with R2 URL
                    coverFile.path = publicUrl;
                    coverFile.filename = r2Key;
                    cover_image_url = publicUrl;
                } catch (error) {
                    console.error('❌ Error uploading live session cover update to R2:', error);
                    return res.status(500).json({ 
                        error: 'Failed to upload cover to R2',
                        details: error.message 
                    });
                }
            } else if (coverFile) {
                // Fallback for non-buffer uploads
                cover_image_url = coverFile.path;
                debugLog('[DEBUG] Cover image uploaded (fallback):', cover_image_url);
            }
        }

        const updateFields = ['title = $1', 'description = $2', 'start_time = $3', 'duration = $4', 'price = $5', 'telegram_channel = $6'];
        const updateValues = [title, description, processedStartTime, duration, price, telegram_channel || null];
        let paramIndex = 7;

        if (cover_image_url) {
            updateFields.push(`cover_image_url = $${paramIndex}`);
            updateValues.push(cover_image_url);
            paramIndex++;
        }

        // Let a wrongly filed session be corrected, education or language.
        // The two are mutually exclusive, so setting one clears the other.
        const rootType = req.body.root_type;
        if (rootType === 'education' && req.body.material_id) {
            updateFields.push(`root_type = $${paramIndex}`); updateValues.push('education'); paramIndex++;
            updateFields.push(`material_id = $${paramIndex}`); updateValues.push(req.body.material_id); paramIndex++;
            updateFields.push('language_id = NULL', 'language_level_id = NULL');
        } else if (rootType === 'language' && req.body.language_level_id) {
            updateFields.push(`root_type = $${paramIndex}`); updateValues.push('language'); paramIndex++;
            updateFields.push(`language_id = $${paramIndex}`); updateValues.push(req.body.language_id || null); paramIndex++;
            updateFields.push(`language_level_id = $${paramIndex}`); updateValues.push(req.body.language_level_id); paramIndex++;
            updateFields.push('material_id = NULL');
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');

        const updateQuery = `
            UPDATE live_sessions 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        updateValues.push(id);

        const result = await query(updateQuery, updateValues);
        const session = result.rows[0];

        // Tell every student who bought this session that the time moved.
        try {
            const before = previous?.start_time ? new Date(previous.start_time).getTime() : null;
            const after = session?.start_time ? new Date(session.start_time).getTime() : null;
            if (before && after && before !== after) {
                const buyers = await getRows(
                    'SELECT DISTINCT student_id FROM purchases WHERE session_id = $1', [id]);
                if (buyers.length) {
                    const NotificationService = (await import('../services/notificationService.js')).default;
                    const when = new Date(session.start_time).toLocaleString('ar-DZ', {
                        dateStyle: 'full', timeStyle: 'short',
                    });
                    await Promise.all(buyers.map(b => NotificationService.createNotification(
                        b.student_id,
                        'live_session_time_updated',
                        'تغيير موعد البث المباشر',
                        `تم تغيير موعد «${session.title}» إلى ${when}.`,
                        JSON.stringify({ session_id: Number(id), old_start_time: previous.start_time, new_start_time: session.start_time })
                    ).catch(e => console.error('[notify] failed for student', b.student_id, e.message))));
                    debugLog(`Notified ${buyers.length} student(s) that session ${id} was rescheduled`);
                }
            }
        } catch (notifyError) {
            // A notification failure must never fail the update itself.
            console.error('[notify] reschedule notification failed:', notifyError.message);
        }

        res.json(session);
    } catch (error) {
        console.error('Error updating live session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/live-sessions/pending → liste toutes les sessions en attente d'approbation (admin)
router.get('/live-sessions/pending', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const result = await getRows(`
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
        res.json(result);
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
            result = await getRows(`
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
            result = await getRows(`
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
                -- A session created inside a دورة belongs to that section and is
                -- reached through it, so it must not appear in the standalone
                -- live classes list. The admin branch above still shows all.
                WHERE ls.is_approved = TRUE
                  AND ls.section_id IS NULL
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
                const purchaseResult = await getRows(
                    'SELECT session_id FROM purchases WHERE student_id = $1',
                    [userId]
                );
                // getRows() already returns the row array; reading .rows here threw
                // and the error was swallowed below, so is_paid never reached the
                // client and every card had to re-check on its own.
                const purchasedSessionIds = purchaseResult.map(row => row.session_id);

                // Add is_paid field to each session
                const sessionsWithPurchaseInfo = result.map(session => ({
                    ...session,
                    is_paid: purchasedSessionIds.includes(session.id)
                }));

                res.json(sessionsWithPurchaseInfo);
            } catch (jwtError) {
                console.error('[live-sessions] purchase info unavailable:', jwtError.message);
                res.json(result);
            }
        } else {
            res.json(result);
        }
    } catch (error) {
        console.error('Error fetching live sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/live-sessions/:sessionId → delete a live session (must be before GET to avoid route conflicts)
// Give every buyer of a live session their points back. Used when a session is
// deleted: the student paid for something that no longer exists.
// 'refund' matches no branch of trigger_update_user_points_balance, so the row
// is an audit record and the balance must be credited explicitly here.
async function refundSessionBuyers(sessionId, actorId) {
    // A session that already ran was delivered: deleting the record afterwards
    // must not hand the points back. Only sessions that never finished refund.
    // live_sessions has no is_ended column — selecting it made this query throw,
    // which meant every admin delete failed with
    //     column "is_ended" does not exist
    // and no student was ever refunded. Whether a session finished is derived
    // from its status and its scheduled end.
    const s = await getRow(
        'SELECT status, start_time, duration FROM live_sessions WHERE id = $1', [sessionId]);
    if (s) {
        const ended = s.status === 'ended' ||
            (s.start_time &&
             Date.now() > new Date(s.start_time).getTime() + (s.duration || 60) * 60 * 1000);
        if (ended) {
            debugLog(`Session ${sessionId} already ended — deleting without refunds.`);
            return 0;
        }
    }

    const buyers = await getRows(
        'SELECT student_id, amount_paid FROM purchases WHERE session_id = $1', [sessionId]);
    let refunded = 0;
    for (const buyer of buyers) {
        try {
            const spend = await getRow(
                `SELECT points FROM point_transactions
                  WHERE user_id = $1 AND transaction_type = 'spend' AND status = 'completed'
                    AND (metadata->>'session_id') = $2::text
                  ORDER BY created_at DESC LIMIT 1`, [buyer.student_id, String(sessionId)]);
            const points = parseInt(spend?.points ?? buyer.amount_paid ?? 0, 10);
            if (!Number.isFinite(points) || points <= 0) continue;

            await query(
                `INSERT INTO point_transactions (user_id, transaction_type, points, amount, status, metadata)
                 VALUES ($1, 'refund', $2, $3, 'completed', $4)`,
                [buyer.student_id, points, points, JSON.stringify({
                    type: 'live_session_deleted', session_id: Number(sessionId), refunded_by: actorId,
                })]);
            await query(
                `INSERT INTO user_points (user_id, balance, updated_at)
                 VALUES ($1, $2, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id) DO UPDATE
                   SET balance = user_points.balance + $2, updated_at = CURRENT_TIMESTAMP`,
                [buyer.student_id, points]);
            refunded += 1;

            const NotificationService = (await import('../services/notificationService.js')).default;
            await NotificationService.createNotification(
                buyer.student_id, 'live_session_deleted', 'تم إلغاء البث المباشر',
                `تم إلغاء البث المباشر وأعيدت إليك ${points} نقطة.`,
                JSON.stringify({ session_id: Number(sessionId), points })
            ).catch(() => {});
        } catch (e) {
            console.error(`[refund] session ${sessionId} student ${buyer.student_id}:`, e.message);
        }
    }
    if (refunded) debugLog(`Refunded ${refunded} student(s) for deleted session ${sessionId}`);
    return refunded;
}

// Admin: edit any live session. The professor route is ownership-locked, so
// an admin had no way to correct a session at all.
router.put('/admin/live-sessions/:sessionId',
  verifyToken,
  requireRole('admin'),
  // Accept the same multipart payload the professor form sends, so the admin
  // can use the identical form, cover image included.
  liveSessionUpload.any(),
  async (req, res) => {
    const { sessionId } = req.params;
    try {
        const previous = await getRow('SELECT start_time, title FROM live_sessions WHERE id = $1', [sessionId]);
        if (!previous) return res.status(404).json({ error: 'Live session not found' });

        const { title, description, start_time, duration, price, telegram_channel } = req.body;
        const sets = [], values = [];
        const push = (col, val) => { values.push(val); sets.push(`${col} = $${values.length}`); };
        if (title !== undefined) push('title', title);
        if (description !== undefined) push('description', description);
        if (start_time !== undefined) push('start_time', start_time);
        if (duration !== undefined) push('duration', parseInt(duration, 10) || 60);
        if (price !== undefined) push('price', parseInt(price, 10) || 0);
        if (telegram_channel !== undefined) push('telegram_channel', telegram_channel);

        // Correcting the path, either kind. Setting one clears the other.
        const rootType = req.body.root_type;
        if (rootType === 'education' && req.body.material_id) {
            push('root_type', 'education');
            push('material_id', req.body.material_id);
            sets.push('language_id = NULL', 'language_level_id = NULL');
        } else if (rootType === 'language' && req.body.language_level_id) {
            push('root_type', 'language');
            push('language_id', req.body.language_id || null);
            push('language_level_id', req.body.language_level_id);
            sets.push('material_id = NULL');
        }

        // Optional new cover, uploaded the same way the create route does it.
        const coverFile = (req.files || []).find(f => f.fieldname === 'cover_image');
        if (coverFile && coverFile.buffer) {
            try {
                const { uploadToR2, generateR2Key } = await import('../services/r2Service.js');
                const key = generateR2Key('live-sessions', null, coverFile.originalname, 'cover');
                push('cover_image_url', await uploadToR2(coverFile.buffer, key, coverFile.mimetype));
            } catch (e) {
                console.error('[admin] cover upload failed:', e.message);
            }
        }

        if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

        sets.push('updated_at = CURRENT_TIMESTAMP');
        values.push(sessionId);
        const result = await query(
            `UPDATE live_sessions SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
        const session = result.rows[0];

        // Same courtesy as the professor route: tell paying students if it moved.
        try {
            const before = previous.start_time ? new Date(previous.start_time).getTime() : null;
            const after = session.start_time ? new Date(session.start_time).getTime() : null;
            if (before && after && before !== after) {
                const buyers = await getRows('SELECT DISTINCT student_id FROM purchases WHERE session_id = $1', [sessionId]);
                if (buyers.length) {
                    const NotificationService = (await import('../services/notificationService.js')).default;
                    const when = new Date(session.start_time).toLocaleString('ar-DZ', { dateStyle: 'full', timeStyle: 'short' });
                    await Promise.all(buyers.map(b => NotificationService.createNotification(
                        b.student_id, 'live_session_time_updated', 'تغيير موعد البث المباشر',
                        `تم تغيير موعد «${session.title}» إلى ${when}.`,
                        JSON.stringify({ session_id: Number(sessionId), old_start_time: previous.start_time, new_start_time: session.start_time })
                    ).catch(e => console.error('[notify]', e.message))));
                    debugLog(`Notified ${buyers.length} student(s) of reschedule (admin)`);
                }
            }
        } catch (e) { console.error('[notify] admin reschedule failed:', e.message); }

        res.json({ success: true, session });
    } catch (error) {
        console.error('Error updating live session (admin):', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: delete any live session.
router.delete('/admin/live-sessions/:sessionId', verifyToken, requireRole('admin'), async (req, res) => {
    const { sessionId } = req.params;
    try {
        const session = await getRow('SELECT id, title FROM live_sessions WHERE id = $1', [sessionId]);
        if (!session) return res.status(404).json({ error: 'Live session not found' });

        // Refund first: once the purchase rows are gone the amounts are lost.
        const refunded = await refundSessionBuyers(sessionId, req.user.id);

        // purchases has no foreign key to live_sessions, so clear those rows
        // explicitly rather than leaving them pointing at a deleted session.
        await query('DELETE FROM purchases WHERE session_id = $1', [sessionId]);
        await query('DELETE FROM live_session_participants WHERE session_id = $1', [sessionId]);
        await query('DELETE FROM live_sessions WHERE id = $1', [sessionId]);

        debugLog(`Live session ${sessionId} ("${session.title}") deleted by admin ${req.user.id}`);
        res.json({ success: true, refunded });
    } catch (error) {
        console.error('Error deleting live session (admin):', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/live-sessions/:sessionId', verifyToken, requireProfessor, async (req, res) => {
    const sessionId = parseInt(req.params.sessionId, 10);
    const userId = req.user.id;

    try {
        // Check if session exists and belongs to the professor
        const session = await getRow(
            'SELECT id, professor_id, cover_image_url FROM live_sessions WHERE id = $1',
            [sessionId]
        );

        if (!session) {
            return res.status(404).json({ error: 'Live session not found' });
        }

        // Verify ownership
        if (session.professor_id !== userId) {
            return res.status(403).json({ error: 'Forbidden: You can only delete your own sessions' });
        }

        // Delete cover image from R2 if it exists
        if (session.cover_image_url) {
            try {
                const r2Key = extractKeyFromUrl(session.cover_image_url);
                if (r2Key) {
                    await deleteFromR2(r2Key);
                    debugLog(`[DEBUG] Deleted cover image from R2: ${r2Key}`);
                }
            } catch (r2Error) {
                console.error('[DEBUG] Error deleting cover image from R2:', r2Error);
                // Continue with deletion even if R2 deletion fails
            }
        }

        // Delete the session from database
        // A student paid for this. Refund before the purchase rows disappear.
        const refunded = await refundSessionBuyers(sessionId, userId);
        await query('DELETE FROM purchases WHERE session_id = $1', [sessionId]);
        await query('DELETE FROM live_session_participants WHERE session_id = $1', [sessionId]);
        await query('DELETE FROM live_sessions WHERE id = $1', [sessionId]);

        debugLog(`[DEBUG] Live session ${sessionId} deleted successfully by professor ${userId}`);

        res.json({ message: 'Live session deleted successfully', id: sessionId, refunded });
    } catch (error) {
        console.error('Error deleting live session:', error);
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
        const result = await getRow(`
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
        if (!result) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        res.json(result);
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
        const sessionRes = await getRow(`
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
        if (!sessionRes) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        
        const session = sessionRes;
        const pointsNeeded = Math.round(session.price); // 1 DZD = 1 point

        // Check if already purchased
        const existingPurchase = await getRow(
            'SELECT * FROM purchases WHERE session_id = $1 AND student_id = $2',
            [sessionId, student_id]
        );
        
        if (existingPurchase) {
            return res.status(409).json({ error: 'You have already purchased this session.' });
        }

        // Get student's points balance
        // A student only gets a user_points row once points first move. Most
        // students have never had one, and refusing them here meant a free
        // session could not be joined by the very people it is aimed at —
        // "No points balance found. Please purchase points first." for
        // something that costs nothing. No row simply means nothing in it;
        // the price check below still stops a paid session.
        const studentPoints = await getRow('SELECT balance FROM user_points WHERE user_id = $1', [student_id]);
        const currentBalance = Number(studentPoints?.balance) || 0;
        
        // Only check balance if live session is not free
        if (pointsNeeded > 0 && currentBalance < pointsNeeded) {
            return res.status(400).json({ 
                error: `Insufficient points. You need ${pointsNeeded} points but have ${currentBalance} points.`,
                pointsNeeded,
                currentBalance
            });
        }

        // Start transaction
        // const client = await pool.connect(); // This line is removed as per the new_code
        try {
            // await client.query('BEGIN'); // This line is removed as per the new_code
            
            // Only deduct points if live session is not free
            if (pointsNeeded > 0) {
                // Deduct points from student (using the trigger system)
                await query(`
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
            await query(
                'INSERT INTO purchases (session_id, student_id, amount_paid) VALUES ($1, $2, $3)',
                [sessionId, student_id, session.price]
            );

            // await client.query('COMMIT'); // This line is removed as per the new_code

            debugLog(`[PURCHASE] Successfully purchased session ${sessionId} for student ${student_id}, amount: ${session.price}`);

            // Send notifications and emails
            try {
                // Import notification and email services
                const NotificationService = (await import('../services/notificationService.js')).default;
                const { sendLiveSessionPurchaseEmailToProfessor, sendLiveSessionPurchaseEmailToAdmin } = await import('../services/emailService.js');

                // Get student information
                const studentRes = await getRow('SELECT name, email FROM users WHERE id = $1', [student_id]);
                const student = studentRes;

                // Get professor information
                let professor = null;
                if (session.professor_id) {
                    const professorRes = await getRow('SELECT name, email FROM users WHERE id = $1', [session.professor_id]);
                    professor = professorRes;
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
                // getRows returns the rows; `.rows` on that is undefined.
                const admins = await getRows('SELECT name, email FROM users WHERE role = $1', ['admin']);
                for (const admin of admins) {
                    await sendLiveSessionPurchaseEmailToAdmin(
                        admin.email,
                        admin.name,
                        student.name,
                        session.title,
                        session.price
                    );
                }

                debugLog(`✅ Live session purchase notifications and emails sent for session ${sessionId}`);
            } catch (error) {
                console.error('Error sending live session purchase notifications/emails:', error);
                // Don't fail the purchase if notifications fail
            }

            // Get updated balance
            const newBalanceRes = await getRow('SELECT balance FROM user_points WHERE user_id = $1', [student_id]);
            // Free sessions move no points, so a student who never had a row
            // still has none here. Reading .balance off nothing threw after
            // the purchase was already saved: the student owned the session
            // and was told the server had failed.
            const newBalance = Number(newBalanceRes?.balance) || 0;

            res.status(201).json({
                message: 'Live session purchased successfully',
                pointsDeducted: pointsNeeded,
                newBalance: newBalance,
                session: session
            });
        } catch (error) {
            // await client.query('ROLLBACK'); // This line is removed as per the new_code
            throw error;
        } finally {
            // client.release(); // This line is removed as per the new_code
        }
    } catch (error) {
        console.error('Error purchasing live session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/live-sessions/:sessionId/access → Check if user can access the session
// The effective path of a session, education or language.
// A standalone session carries its own; one created inside a دورة has none of
// its own and inherits the section's, which may be either kind.
router.get('/live-sessions/:sessionId/path', async (req, res) => {
    try {
        const sess = await getRow(
            `SELECT id, material_id, language_id, language_level_id, root_type, section_id
               FROM live_sessions WHERE id = $1`, [req.params.sessionId]);
        if (!sess) return res.status(404).json({ error: 'Live session not found' });

        let src = sess;
        let inheritedFrom = null;

        // Nothing of its own: fall back to the دورة it belongs to.
        if (!sess.material_id && !sess.language_level_id && sess.section_id) {
            const section = await getRow(
                `SELECT root_type, material_id, language_id, language_level_id
                   FROM live_sections WHERE id = $1`, [sess.section_id]);
            if (section && (section.material_id || section.language_level_id)) {
                src = section;
                inheritedFrom = sess.section_id;
            }
        }

        const rootType = src.root_type
            || (src.language_level_id ? 'language' : (src.material_id ? 'education' : null));

        if (rootType === 'language' && src.language_level_id) {
            const row = await getRow(`
                SELECT ll.id AS language_level_id, ll.name AS language_level_name,
                       l.id  AS language_id,       l.name AS language_name
                  FROM language_levels ll
                  LEFT JOIN languages l ON l.id = ll.language_id
                 WHERE ll.id = $1`, [src.language_level_id]);
            return res.json({ root_type: 'language', ...(row || {}), inheritedFrom });
        }

        if (src.material_id) {
            const row = await getRow(`
                SELECT m.id  AS material_id,    m.name  AS material_name,
                       sp.id AS speciality_id,  sp.name AS speciality_name,
                       y.id  AS year_id,        y.name  AS year_name,
                       l.id  AS level_id,       l.name  AS level_name
                  FROM materials m
                  LEFT JOIN specialities sp ON sp.id = m.speciality_id
                  LEFT JOIN years y  ON y.id = COALESCE(sp.year_id, m.year_id)
                  LEFT JOIN levels l ON l.id = y.level_id
                 WHERE m.id = $1`, [src.material_id]);
            return res.json({ root_type: 'education', ...(row || { material_id: src.material_id }), inheritedFrom });
        }

        res.json({ root_type: null, material_id: null, inheritedFrom: null });
    } catch (error) {
        console.error('Error resolving session path:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Record that a student actually entered the room. Called by the streaming
// page on connect, not by the cards, so the count reflects real attendance.
router.post('/live-sessions/:sessionId/join', verifyToken, async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    try {
        const session = await getRow('SELECT id FROM live_sessions WHERE id = $1', [sessionId]);
        if (!session) return res.status(404).json({ error: 'Live session not found' });

        // One row per user per session: re-joining must not inflate the count.
        const existing = await getRow(
            'SELECT id FROM live_session_participants WHERE session_id = $1 AND user_id = $2',
            [sessionId, userId]);
        if (!existing) {
            await query(
                'INSERT INTO live_session_participants (session_id, user_id, joined_at) VALUES ($1, $2, NOW())',
                [sessionId, userId]);
        }

        const countRow = await getRow(
            'SELECT COUNT(DISTINCT user_id)::int AS n FROM live_session_participants WHERE session_id = $1',
            [sessionId]);
        const attendees = countRow?.n || 0;

        // Mirror onto the session so existing readers of attendees_count work.
        await query('UPDATE live_sessions SET attendees_count = $1 WHERE id = $2', [attendees, sessionId]);

        res.json({ success: true, attendees });
    } catch (error) {
        console.error('Error recording session join:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/live-sessions/:sessionId/access', verifyToken, async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    try {
        // Get session details
        const sessionRes = await getRow(`
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
        if (!sessionRes) {
            return res.status(404).json({ error: 'Live section not found' });
        }

        const session = sessionRes;
        const isLive = true; // Live sections are always considered "live"

        // A session can be paid for in two different ways, and this used to
        // check only the first one.
        const directPurchase = await getRow(
          'SELECT 1 FROM purchases WHERE session_id = $1 AND student_id = $2',
          [sessionId, userId]
        );

        // Buying the دورة buys everything inside it. Without this, a student
        // who paid for the whole course was turned away from every session in
        // it — the purchase is recorded against the section, not the session.
        let sectionPurchase = null;
        if (session.section_id) {
            sectionPurchase = await getRow(
              'SELECT 1 FROM live_section_purchases WHERE live_section_id = $1 AND student_id = $2',
              [session.section_id, userId]
            );
        }

        // The person teaching it, and the admins, are not customers and will
        // never appear in either purchase table.
        const isOwner = String(session.professor_id) === String(userId);
        const isAdmin = req.user.role === 'admin';

        const hasPurchased = !!(directPurchase || sectionPurchase);
        // A free standalone session (price 0, not inside a paid دورة) is open
        // to every signed-in user; there is nothing to buy.
        const isFree = Number(session.price) === 0 && !session.section_id;
        const canAccess = hasPurchased || isFree || isOwner || isAdmin;

        debugLog(`[ACCESS] Session ${sessionId}, User ${userId}, HasPurchased: ${hasPurchased}, CanAccess: ${canAccess}`);
        debugLog(`[ACCESS] direct=${!!directPurchase} section=${!!sectionPurchase} owner=${isOwner} admin=${isAdmin}`);
        debugLog(`[ACCESS] Response object:`, {
            canAccess: canAccess,
            hasPurchased: hasPurchased,
            isLive: isLive,
            session: session
        });

        res.json({
            canAccess: canAccess,
            hasPurchased: hasPurchased,
            isLive: isLive,
            // How access was granted — useful to a client deciding what to show.
            accessVia: directPurchase ? 'session_purchase'
                     : sectionPurchase ? 'section_purchase'
                     : isOwner ? 'professor'
                     : isAdmin ? 'admin'
                     : null,
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

    debugLog('[DEBUG] RTC Token generation:', {
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
        debugLog('[DEBUG] Using provided UID:', numericUid);
    } else {
        // Use 0 to let Agora assign UID automatically (prevents conflicts)
        numericUid = 0;
        debugLog('[DEBUG] Using UID 0 (Agora will assign automatically)');
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

        debugLog('[DEBUG] Token generated successfully for UID:', numericUid);
        debugLog('[DEBUG] Token length:', token.length);

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
        const result = await query(
            'UPDATE live_sessions SET is_approved = TRUE, is_rejected = FALSE WHERE id = $1 RETURNING *',
            [id]
        );
        if (!result) {
            return res.status(404).json({ error: 'Session not found' });
        }
        const session = result.rows[0];
        
        // Send notifications and emails for live session approval
        try {
            // Import notification and email services
            const NotificationService = (await import('../services/notificationService.js')).default;
            const { sendLiveSessionApprovedEmailToProfessor } = await import('../services/emailService.js');

            // Get professor information
            const professorRes = await getRow('SELECT name, email FROM users WHERE id = $1', [session.professor_id]);
            const professor = professorRes;

            // Get admin information
            const adminRes = await getRow('SELECT name FROM users WHERE id = $1', [req.user.id]);
            const admin = adminRes;

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

            debugLog(`✅ Live session approval notifications and emails sent for session ${session.id}`);
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
        const result = await query(
            'UPDATE live_sessions SET is_approved = FALSE, is_rejected = TRUE WHERE id = $1 RETURNING *',
            [id]
        );
        if (!result) {
            return res.status(404).json({ error: 'Session not found' });
        }
        const session = result.rows[0];
        
        // Send notifications and emails for live session rejection
        try {
            // Import notification and email services
            const NotificationService = (await import('../services/notificationService.js')).default;
            const { sendLiveSessionRejectedEmailToProfessor } = await import('../services/emailService.js');

            // Get professor information
            const professorRes = await getRow('SELECT name, email FROM users WHERE id = $1', [session.professor_id]);
            const professor = professorRes;

            // Get admin information
            const adminRes = await getRow('SELECT name FROM users WHERE id = $1', [req.user.id]);
            const admin = adminRes;

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

            debugLog(`✅ Live session rejection notifications and emails sent for session ${session.id}`);
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
    debugLog('[DEBUG] GET /professors/:professorId/live-sessions', {
        paramId: req.params.professorId,
        userId: req.user.id,
        userRole: req.user.role
    });
    const professor_id = parseInt(req.params.professorId, 10);
    if (professor_id !== req.user.id) {
        return res.status(403).json({ error: "Forbidden: You can only view your own sessions." });
    }

    try {
        const result = await getRows(`
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

        res.json(result);
    } catch (error) {
        console.error('Error fetching professor live sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// When a teacher starts a free session, every student gets a push inviting
// them in. At most once per session per 6 hours, so pausing and resuming (or
// pressing start twice) doesn't spam everyone. In memory: a restart only means
// a session could be announced once more.
const FREE_LIVE_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const freeLiveAnnounced = new Map(); // sessionId -> timestamp

async function announceFreeLive(session) {
    const key = String(session.id);
    const last = freeLiveAnnounced.get(key);
    if (last && Date.now() - last < FREE_LIVE_COOLDOWN_MS) return;
    freeLiveAnnounced.set(key, Date.now());

    const professor = await getRow('SELECT name FROM users WHERE id = $1', [session.professor_id]);
    const teacher = (professor && professor.name) || 'الأستاذ';
    const title = `${teacher} في بث مباشر الآن`;
    const message = `«${session.title || 'حصة مباشرة'}» — حصة مجانية، انضم الآن!`;
    const metadata = JSON.stringify({ session_id: session.id, free: true });
    const route = `/live-session/${session.id}`;

    const students = await getRows('SELECT id FROM users WHERE role = $1', ['student']);
    let created = 0;
    for (const { id } of students) {
        try {
            await NotificationService.createNotification(
                id, 'free_live_started', title, message, metadata, { route });
            created += 1;
        } catch { /* one bad row must not stop the broadcast */ }
    }
    debugLog(`[free-live] session ${session.id} announced to ${created}/${students.length} students`);
}

// Everyone who can attend a paid session: bought it directly (الحصص
// المباشرة) or bought the دورة it belongs to (الدورات).
async function buyersOf(session) {
    const rows = session.section_id
        ? await getRows(
            `SELECT student_id FROM purchases WHERE session_id = $1
             UNION
             SELECT student_id FROM live_section_purchases WHERE live_section_id = $2`,
            [session.id, session.section_id])
        : await getRows(
            'SELECT DISTINCT student_id FROM purchases WHERE session_id = $1',
            [session.id]);
    return rows.map((r) => r.student_id);
}

async function notifyAll(ids, type, title, message, metadata, route) {
    let created = 0;
    for (const id of ids) {
        try {
            await NotificationService.createNotification(
                id, type, title, message, metadata, { route });
            created += 1;
        } catch { /* one bad row must not stop the rest */ }
    }
    return created;
}

// A paid session went live: only the students who paid for it are told.
async function announcePaidLive(session) {
    const key = String(session.id);
    const last = freeLiveAnnounced.get(key);
    if (last && Date.now() - last < FREE_LIVE_COOLDOWN_MS) return;
    freeLiveAnnounced.set(key, Date.now());

    const buyers = await buyersOf(session);
    if (buyers.length === 0) return;
    const professor = await getRow('SELECT name FROM users WHERE id = $1', [session.professor_id]);
    const teacher = (professor && professor.name) || 'الأستاذ';
    const created = await notifyAll(
        buyers,
        'paid_live_started',
        `${teacher} بدأ البث المباشر الآن`,
        `«${session.title || 'حصتك المباشرة'}» بدأت الآن — ادخل إلى حصتك`,
        JSON.stringify({ session_id: session.id }),
        `/live-session/${session.id}`);
    debugLog(`[paid-live] session ${session.id} announced to ${created}/${buyers.length} buyers`);
}

// A new session was added to a دورة: tell the students who bought the دورة.
async function announceSessionAdded(session) {
    const buyers = await getRows(
        'SELECT DISTINCT student_id FROM live_section_purchases WHERE live_section_id = $1',
        [session.section_id]);
    if (buyers.length === 0) return;
    const section = await getRow('SELECT title FROM live_sections WHERE id = $1', [session.section_id]);
    const when = session.start_time
        ? new Date(session.start_time).toLocaleString('ar-DZ', { dateStyle: 'full', timeStyle: 'short' })
        : '';
    const created = await notifyAll(
        buyers.map((b) => b.student_id),
        'live_session_added',
        `حصة جديدة في دورة «${(section && section.title) || 'دورتك'}»`,
        `«${session.title || 'حصة مباشرة'}»${when ? ` — ${when}` : ''}`,
        JSON.stringify({ session_id: session.id, section_id: session.section_id }),
        null);
    debugLog(`[live-added] session ${session.id} announced to ${created} buyers of section ${session.section_id}`);
}

// GET /api/student/live-now → sessions live right now that this student can
// join: free standalone ones, ones they bought, and ones in a دورة they bought.
// Bought ones first. Feeds the "live now" card on the app's home screen.
router.get('/student/live-now', verifyToken, async (req, res) => {
    try {
        const rows = await getRows(`
            SELECT ls.id, ls.title, ls.price, ls.section_id,
                   COALESCE(u.name, ls.professor_name) AS professor_name,
                   COALESCE(NULLIF(ls.cover_image_url, ''), sec.cover_image_url) AS cover,
                   (COALESCE(ls.price, 0) = 0 AND ls.section_id IS NULL) AS is_free
            FROM live_sessions ls
            LEFT JOIN users u ON u.id = ls.professor_id
            LEFT JOIN live_sections sec ON sec.id = ls.section_id
            WHERE ls.status = 'live'
              AND ls.is_approved = TRUE
              AND COALESCE(ls.is_rejected, FALSE) = FALSE
              AND (
                    (COALESCE(ls.price, 0) = 0 AND ls.section_id IS NULL)
                 OR EXISTS (SELECT 1 FROM purchases p
                            WHERE p.session_id = ls.id AND p.student_id = $1)
                 OR (ls.section_id IS NOT NULL AND EXISTS (
                            SELECT 1 FROM live_section_purchases lp
                            WHERE lp.live_section_id = ls.section_id AND lp.student_id = $1))
              )
            ORDER BY is_free ASC, ls.start_time DESC
        `, [req.user.id]);
        res.json({ sessions: rows });
    } catch (error) {
        console.error('Error fetching live-now sessions:', error);
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
        const before = await getRow('SELECT status FROM live_sessions WHERE id = $1', [sessionId]);
        const result = await query(
            'UPDATE live_sessions SET status = $1 WHERE id = $2 RETURNING *',
            [status, sessionId]
        );
        if (!result) {
            return res.status(404).json({ error: 'Live session not found' });
        }
        const updated = result.rows[0];
        res.json(updated);

        // Everyone already inside the room learns about it now, not on their
        // next reload: paused, technical problem, back live. Room id is the
        // session id, as both the web page and the mobile app join it.
        const io = req.app.get('io');
        if (io && updated) {
            io.to(String(sessionId)).emit('session-status', { status: updated.status });
        }

        // After responding, so the teacher's "start" isn't slowed down by
        // sending to every student.
        const wentLive = status === 'live' && before && before.status !== 'live';
        const isFree = updated && Number(updated.price) === 0 && !updated.section_id;
        const visible = updated && updated.is_approved !== false && updated.is_rejected !== true;
        if (wentLive && visible) {
            (isFree ? announceFreeLive(updated) : announcePaidLive(updated)).catch((e) =>
                console.error('[live-announce] failed:', e.message));
        }
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

        const adminUpdateQuery = `
            UPDATE live_sessions 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await query(adminUpdateQuery, updateValues);
        
        if (!result) {
            return res.status(404).json({ error: 'Live session not found' });
        }

        // If approving, set approved_by to current admin
        if (updates.isApproved === true) {
            await query(
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
                const sessionRes = await getRow('SELECT title, professor_id, professor_name FROM live_sessions WHERE id = $1', [sessionId]);
                if (sessionRes) {
                    const session = sessionRes;
                    
                    // Get professor information
                    const professorRes = await getRow('SELECT name, email FROM users WHERE id = $1', [session.professor_id]);
                    const professor = professorRes;

                    // Get admin information
                    const adminRes = await getRow('SELECT name FROM users WHERE id = $1', [req.user.id]);
                    const admin = adminRes;

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

                        debugLog(`✅ Live session approval notifications and emails sent for session ${sessionId}`);
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

                        debugLog(`✅ Live session rejection notifications and emails sent for session ${sessionId}`);
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