// Records what a student actually paid for a course, so changing a course
// price later never rewrites historical earnings.
import pool from '../db.js';

const client = await pool.connect();
try {
  await client.query('BEGIN');

  await client.query(`ALTER TABLE student_courses ADD COLUMN IF NOT EXISTS points_spent INTEGER`);

  // Backfill from the recorded spend transaction where one exists.
  const fromTx = await client.query(`
    UPDATE student_courses sc
       SET points_spent = pt.points
      FROM (
        SELECT DISTINCT ON (user_id, (metadata->>'course_id'))
               user_id, (metadata->>'course_id')::int AS course_id, points
          FROM point_transactions
         WHERE transaction_type = 'spend'
           AND status = 'completed'
           AND metadata->>'course_id' ~ '^[0-9]+$'
         ORDER BY user_id, (metadata->>'course_id'), created_at DESC
      ) pt
     WHERE sc.student_id = pt.user_id AND sc.course_id = pt.course_id
       AND sc.points_spent IS NULL`);

  // Anything older than the transaction log falls back to the current price,
  // which is the best information available for those rows.
  const fromPrice = await client.query(`
    UPDATE student_courses sc
       SET points_spent = COALESCE(c.price, 0)
      FROM courses c
     WHERE c.id = sc.course_id AND sc.points_spent IS NULL`);

  await client.query('COMMIT');
  console.error(`MIG_OK backfilled_from_transactions=${fromTx.rowCount} backfilled_from_price=${fromPrice.rowCount}`);
} catch (e) {
  await client.query('ROLLBACK');
  console.error('MIG_FAIL ' + e.message);
} finally {
  client.release();
  process.exit(0);
}
