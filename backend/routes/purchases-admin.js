import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getRows } from '../db.js';
import pool from '../db.js';
import { debugLog } from '../utils/logger.js';

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Every way a student can pay for something, in one list. `row_id` identifies
// the exact record to cancel, since a student can hold several of the same kind.
const LIST_SQL = `
  SELECT * FROM (
    -- Structured courses (الدروس)
    SELECT 'course' AS kind, sc.id AS row_id, sc.student_id, u.name AS student_name, u.email AS student_email,
           c.id AS item_id, c.title AS item_title, sc.buy_at AS purchased_at,
           COALESCE(sc.points_spent, c.price, 0)::int AS points
      FROM student_courses sc
      JOIN users u ON u.id = sc.student_id
      JOIN courses c ON c.id = sc.course_id
     WHERE c.language_level_id IS NULL

    UNION ALL

    -- Language courses (دورات اللغات)
    SELECT 'language_course', sc.id, sc.student_id, u.name, u.email,
           c.id, c.title, sc.buy_at,
           COALESCE(sc.points_spent, c.price, 0)::int
      FROM student_courses sc
      JOIN users u ON u.id = sc.student_id
      JOIN courses c ON c.id = sc.course_id
     WHERE c.language_level_id IS NOT NULL

    UNION ALL

    -- Live sections (الدورات)
    SELECT 'live', p.id, p.student_id, u.name, u.email,
           ls.id, ls.title, p.purchase_date,
           COALESCE(p.points_spent, ls.price, 0)::int
      FROM live_section_purchases p
      JOIN users u ON u.id = p.student_id
      JOIN live_sections ls ON ls.id = p.live_section_id

    UNION ALL

    -- Live sessions (الحصص المباشرة)
    SELECT 'live_session', pu.id, pu.student_id, u.name, u.email,
           lses.id, lses.title, pu.purchased_at,
           COALESCE(pu.amount_paid, lses.price, 0)::int
      FROM purchases pu
      JOIN users u ON u.id = pu.student_id
      JOIN live_sessions lses ON lses.id = pu.session_id

    UNION ALL

    -- Private classes (الحصص الخاصة) — only the ones actually paid for
    SELECT 'private_class', pcr.id, pcr.student_id, u.name, u.email,
           pcr.id, COALESCE(NULLIF(pcr.title, ''), pcr.subject, 'حصة خاصة'), pcr.payment_date,
           COALESCE(pcr.points_used, pcr.price_per_session * COALESCE(pcr.sessions_count, 1), 0)::int
      FROM private_class_requests pcr
      JOIN users u ON u.id = pcr.student_id
     WHERE pcr.payment_status = 'paid'
  ) x
  ORDER BY purchased_at DESC NULLS LAST
  LIMIT 500`;

// GET /api/admin/purchases
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    res.json({ purchases: await getRows(LIST_SQL) });
  } catch (error) {
    console.error('Error listing purchases:', error);
    res.status(500).json({ error: 'Failed to list purchases' });
  }
});

// Which metadata key links a spend transaction back to each kind of item.
const META_KEY = {
  course: 'course_id',
  language_course: 'course_id',
  live: 'live_section_id',
  live_session: 'session_id',
  private_class: 'private_class_id',
};

// POST /api/admin/purchases/cancel
// Revokes the purchase and returns the points, in one transaction.
router.post('/cancel', verifyToken, requireAdmin, async (req, res) => {
  const kind = req.body?.kind;
  const rowId = parseInt(req.body?.rowId, 10);
  if (!META_KEY[kind]) return res.status(400).json({ error: 'Unknown purchase kind' });
  if (!Number.isInteger(rowId)) return res.status(400).json({ error: 'Invalid rowId' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the exact row so two admins cannot refund it twice.
    const table = {
      course: 'student_courses', language_course: 'student_courses',
      live: 'live_section_purchases', live_session: 'purchases',
      private_class: 'private_class_requests',
    }[kind];

    const owned = await client.query(`SELECT * FROM ${table} WHERE id = $1 FOR UPDATE`, [rowId]);
    if (owned.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'That purchase no longer exists (it may already be cancelled).' });
    }
    const row = owned.rows[0];
    const studentId = row.student_id;

    if (kind === 'private_class' && row.payment_status !== 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This private class is not in a paid state.' });
    }

    // What was actually paid: prefer the recorded transaction, then the stored
    // amount, so a refund never invents a number.
    const itemId = kind === 'private_class' ? row.id
      : kind === 'live' ? row.live_section_id
      : kind === 'live_session' ? row.session_id
      : row.course_id;

    const spend = await client.query(`
      SELECT id, points FROM point_transactions
       WHERE user_id = $1 AND transaction_type = 'spend' AND status = 'completed'
         AND (metadata->>$2) = $3::text
       ORDER BY created_at DESC LIMIT 1`, [studentId, META_KEY[kind], itemId]);

    let points = spend.rowCount ? parseInt(spend.rows[0].points, 10) : null;
    if (points === null) {
      points = parseInt(
        row.points_spent ?? row.amount_paid ?? row.points_used ??
        (row.price_per_session != null ? row.price_per_session * (row.sessions_count || 1) : 0), 10);
    }
    points = Number.isFinite(points) && points > 0 ? points : 0;

    // 1. Take the purchase away.
    if (kind === 'private_class') {
      await client.query(
        "UPDATE private_class_requests SET payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [rowId]);
    } else {
      await client.query(`DELETE FROM ${table} WHERE id = $1`, [rowId]);
    }

    // 2. Give the points back. 'refund' matches no branch of
    //    trigger_update_user_points_balance, so the balance must be credited
    //    here; using 'purchase' would double-credit via the trigger.
    if (points > 0) {
      await client.query(`
        INSERT INTO point_transactions (user_id, transaction_type, points, amount, status, metadata)
        VALUES ($1, 'refund', $2, $3, 'completed', $4)`,
        [studentId, points, points, JSON.stringify({
          type: 'purchase_cancelled', kind, item_id: itemId, cancelled_by: req.user.id,
        })]);

      await client.query(`
        INSERT INTO user_points (user_id, balance, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE
          SET balance = user_points.balance + $2, updated_at = CURRENT_TIMESTAMP`,
        [studentId, points]);
    }

    // 3. Mark the original spend cancelled. The trigger is AFTER INSERT only,
    //    so this update does not move the balance again.
    if (spend.rowCount) {
      await client.query(
        "UPDATE point_transactions SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [spend.rows[0].id]);
    }

    const balance = await client.query('SELECT balance FROM user_points WHERE user_id = $1', [studentId]);
    await client.query('COMMIT');

    debugLog(`Purchase cancelled by admin ${req.user.id}: ${kind} row ${rowId}, student ${studentId}, refunded ${points}`);
    res.json({ success: true, refunded: points, newBalance: parseInt(balance.rows[0]?.balance ?? 0, 10) });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Cancel purchase failed, rolled back:', error);
    res.status(500).json({ error: `Cancel failed and was rolled back. Nothing changed. (${error.message})` });
  } finally {
    client.release();
  }
});

export default router;
