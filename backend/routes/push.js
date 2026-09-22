import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getRow, getRows, query } from '../db.js';
import { debugLog } from '../utils/logger.js';
import NotificationService from '../services/notificationService.js';
import { isPushConfigured } from '../services/pushService.js';

const router = express.Router();

/**
 * Device registration, and the admin's own announcements.
 */

// ---------------------------------------------------------------------------
// POST /api/devices   { token, platform?, device_name? }
// The app calls this after signing in and every time Firebase hands it a new
// token — on reinstall, on restore, and occasionally for no visible reason.
// ---------------------------------------------------------------------------
router.post('/devices', verifyToken, async (req, res) => {
  try {
    const { token, platform, device_name } = req.body || {};
    if (!token || typeof token !== 'string' || token.length < 20) {
      return res.status(400).json({ error: 'رمز الجهاز غير صالح' });
    }

    // A handset that changes hands moves to the new account instead of
    // notifying both — hence ON CONFLICT on the token, not on (user, token).
    await query(`
      INSERT INTO device_tokens (user_id, token, platform, device_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (token) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            platform = COALESCE(EXCLUDED.platform, device_tokens.platform),
            device_name = COALESCE(EXCLUDED.device_name, device_tokens.device_name),
            last_seen_at = CURRENT_TIMESTAMP,
            is_active = TRUE,
            failure_count = 0
    `, [req.user.id, token, platform || null, device_name || null]);

    debugLog(`[push] device registered for user ${req.user.id} (${platform || 'unknown'})`);
    res.json({ message: 'تم تسجيل الجهاز', push_configured: isPushConfigured() });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/devices   { token }
// Called on sign-out so the next person to use the handset does not receive
// the previous user's notifications.
// ---------------------------------------------------------------------------
router.delete('/devices', verifyToken, async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'رمز الجهاز مطلوب' });

    await query(
      'UPDATE device_tokens SET is_active = FALSE WHERE token = $1 AND user_id = $2',
      [token, req.user.id]);
    res.json({ message: 'تم إلغاء تسجيل الجهاز' });
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/push/status
// Whether push is actually working, and how many devices could receive one.
// ---------------------------------------------------------------------------
router.get('/admin/push/status', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await getRow(`
      SELECT COUNT(*) FILTER (WHERE is_active)::int              AS active_devices,
             COUNT(*) FILTER (WHERE NOT is_active)::int          AS retired_devices,
             COUNT(DISTINCT user_id) FILTER (WHERE is_active)::int AS users_reachable
        FROM device_tokens
    `);
    res.json({
      // false means notifications are saved and shown in-app but not pushed.
      push_configured: isPushConfigured(),
      ...stats,
    });
  } catch (error) {
    console.error('Error reading push status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/notifications/send
//
//   { title, message, image_url?, route?, audience, ...targeting }
//
// audience:
//   all_students | all_professors | all_users
//   level        + level_ids[]        students studying at those levels
//   year         + year_ids[]         students in those school years
//   course       + course_id          everyone who bought that course
//   live_section + live_section_id    everyone who bought that دورة
//   live_session + session_id         everyone who bought that session
//   users        + user_ids[]         named people
// ---------------------------------------------------------------------------
const AUDIENCE_SQL = {
  all_students:   () => ['SELECT id FROM users WHERE role = $1', ['student']],
  all_professors: () => ['SELECT id FROM users WHERE role = $1', ['professor']],
  all_users:      () => ['SELECT id FROM users', []],

  level: (b) => ['SELECT id FROM users WHERE role = $1 AND level_id = ANY($2::int[])',
                 ['student', b.level_ids || []]],
  year:  (b) => ['SELECT id FROM users WHERE role = $1 AND year_id = ANY($2::int[])',
                 ['student', b.year_ids || []]],

  course: (b) => [`SELECT DISTINCT student_id AS id FROM student_courses WHERE course_id = $1`,
                  [b.course_id]],
  live_section: (b) => [`SELECT DISTINCT student_id AS id FROM live_section_purchases
                          WHERE live_section_id = $1`, [b.live_section_id]],
  live_session: (b) => [`SELECT DISTINCT student_id AS id FROM purchases WHERE session_id = $1`,
                        [b.session_id]],

  users: (b) => ['SELECT id FROM users WHERE id = ANY($1::int[])', [b.user_ids || []]],
};

router.post('/admin/notifications/send', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { title, message, image_url, route, audience } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'العنوان مطلوب' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'نص الإشعار مطلوب' });
    }

    const build = AUDIENCE_SQL[audience];
    if (!build) {
      return res.status(400).json({
        error: 'الفئة المستهدفة غير صالحة',
        allowed: Object.keys(AUDIENCE_SQL),
      });
    }

    // Targeted audiences need their target. Sending "to a course" with no
    // course would otherwise silently reach nobody and look like a success.
    const needs = {
      level: 'level_ids', year: 'year_ids', users: 'user_ids',
      course: 'course_id', live_section: 'live_section_id', live_session: 'session_id',
    }[audience];
    if (needs) {
      const v = req.body[needs];
      const empty = Array.isArray(v) ? v.length === 0 : !v;
      if (empty) return res.status(400).json({ error: `الحقل ${needs} مطلوب لهذه الفئة` });
    }

    const [sql, params] = build(req.body);
    const recipients = await getRows(sql, params);

    if (recipients.length === 0) {
      return res.status(200).json({
        message: 'لا يوجد مستخدمون في هذه الفئة',
        recipients: 0, sent: 0,
      });
    }

    const metadata = JSON.stringify({
      sent_by: req.user.id,
      audience,
      ...(route ? { route } : {}),
    });

    // One at a time so a single bad row cannot take the whole broadcast with
    // it; each failure is counted and reported rather than thrown.
    let created = 0, failed = 0;
    for (const { id } of recipients) {
      try {
        await NotificationService.createNotification(
          id, 'admin_announcement', String(title).trim(), String(message).trim(),
          metadata, { route: route || null, imageUrl: image_url || null });
        created += 1;
      } catch {
        failed += 1;
      }
    }

    debugLog(`[admin] announcement to ${audience}: ${created} created, ${failed} failed`);
    res.json({
      message: `تم إرسال الإشعار إلى ${created} مستخدم`,
      recipients: recipients.length,
      created,
      failed,
      // false means it reached the in-app notification centre only.
      pushed: isPushConfigured(),
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/notifications/audience-preview?audience=…
// How many people a choice would reach, before anything is sent.
// ---------------------------------------------------------------------------
router.get('/admin/notifications/audience-preview', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const audience = req.query.audience;
    const build = AUDIENCE_SQL[audience];
    if (!build) return res.status(400).json({ error: 'الفئة المستهدفة غير صالحة' });

    const asArray = (v) => (v ? String(v).split(',').map(Number).filter(Boolean) : []);
    const body = {
      level_ids: asArray(req.query.level_ids),
      year_ids: asArray(req.query.year_ids),
      user_ids: asArray(req.query.user_ids),
      course_id: req.query.course_id ? Number(req.query.course_id) : null,
      live_section_id: req.query.live_section_id ? Number(req.query.live_section_id) : null,
      session_id: req.query.session_id ? Number(req.query.session_id) : null,
    };

    const [sql, params] = build(body);
    const rows = await getRows(sql, params);

    const reachable = rows.length === 0 ? 0 : (await getRow(`
      SELECT COUNT(DISTINCT user_id)::int AS n
        FROM device_tokens
       WHERE is_active AND user_id = ANY($1::int[])
    `, [rows.map(r => r.id)]))?.n ?? 0;

    res.json({
      audience,
      recipients: rows.length,
      // How many of them have a device that could receive a push right now.
      reachable_by_push: reachable,
    });
  } catch (error) {
    console.error('Error previewing audience:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
