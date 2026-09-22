-- The notifications table had no index at all beyond its primary key, so both
-- of the queries the app runs on every page load scanned all 18,000 rows:
--
--   getUserNotifications: WHERE user_id = $1 ORDER BY created_at DESC LIMIT n
--   getUnreadCount:       WHERE user_id = $1 AND is_read = FALSE
--
-- CONCURRENTLY so the build never blocks writes on a live table. It cannot run
-- inside a transaction block, which is why there is no BEGIN/COMMIT here — each
-- statement stands on its own and is safe to re-run.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- Partial: only unread rows are ever counted, and they are the minority once
-- the retention job is running.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id)
  WHERE is_read = FALSE;

-- Used by the retention job, which sweeps by age.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at
  ON notifications (created_at);
