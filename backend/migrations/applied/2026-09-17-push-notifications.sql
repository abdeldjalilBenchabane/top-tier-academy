-- Push notifications: the devices to send to.
--
-- A user has as many rows here as they have devices signed in. The app
-- registers its FCM token after login and whenever Firebase rotates it, which
-- it does on reinstall, restore and occasionally on its own.

BEGIN;

CREATE TABLE IF NOT EXISTS device_tokens (
  id           serial PRIMARY KEY,
  user_id      integer      NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- The FCM registration token. UNIQUE, not (user_id, token): the same handset
  -- handed to a sibling must move to the new account rather than notify both.
  token        text         NOT NULL UNIQUE,

  platform     varchar(20)  CHECK (platform IN ('android', 'ios', 'web')),
  device_name  text,

  created_at   timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Set to false when Firebase tells us the token is dead (UNREGISTERED /
  -- INVALID_ARGUMENT). Kept rather than deleted so a device that comes back
  -- with the same token is recognised instead of counted as new.
  is_active    boolean      NOT NULL DEFAULT TRUE,
  failure_count integer     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user
  ON device_tokens (user_id) WHERE is_active;

COMMENT ON TABLE device_tokens IS
  'FCM registration tokens, one row per signed-in device. Rows are deactivated '
  'rather than deleted when Firebase reports them dead.';

-- --------------------------------------------------------------- notifications
-- Where a tap should land. Stored per notification rather than derived in the
-- app, so the backend decides where its own messages point and old
-- notifications keep working when routes change.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS route text,
  -- Optional image for admin announcements.
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN notifications.route IS
  'In-app destination for a tap, e.g. /live-session/76 or /course/131. NULL '
  'means the notification opens nothing in particular.';

COMMIT;
