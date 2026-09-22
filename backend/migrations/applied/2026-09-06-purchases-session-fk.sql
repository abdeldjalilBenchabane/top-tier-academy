-- Repair purchases.session_id: 30 rows pointed at live sessions that no longer
-- exist, and nothing stopped more from appearing.
--
-- ROOT CAUSE
-- purchases.session_id had no foreign key at all. The application deletes the
-- matching purchases whenever it deletes a session or a section, but the
-- database also deletes sessions on its own:
--     live_sessions.section_id   -> live_sections  ON DELETE CASCADE
--     live_sessions.professor_id -> users          ON DELETE CASCADE
-- Those cascades run inside the database, so no application code executes and
-- the purchase rows are left pointing at an id that is gone.
--
-- WHAT THIS DOES
-- 1. Archives the dangling rows instead of deleting them. They record that a
--    student paid for something, so they are kept even though the session they
--    refer to is unrecoverable.
-- 2. Removes them from purchases, which is required before a foreign key can
--    be created.
-- 3. Adds the missing foreign key with ON DELETE CASCADE, matching both what
--    the application already does by hand and the rule already used on the
--    sibling table live_section_purchases.
--
-- Everything runs in one transaction: it either all applies or none of it does.

BEGIN;

-- 1 ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases_orphaned_archive (
  id           integer PRIMARY KEY,
  session_id   integer        NOT NULL,
  student_id   integer        NOT NULL,
  amount_paid  numeric(10,2)  NOT NULL,
  purchased_at timestamp,
  archived_at  timestamp      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason       text
);

COMMENT ON TABLE purchases_orphaned_archive IS
  'Purchase rows recovered from purchases before the session_id foreign key was '
  'added on 2026-09-06. Each refers to a live session that had already been '
  'deleted. Kept as a record of payment; deliberately has no foreign keys, '
  'because the rows it holds are exactly the ones that cannot satisfy them.';

INSERT INTO purchases_orphaned_archive
       (id, session_id, student_id, amount_paid, purchased_at, reason)
SELECT p.id, p.session_id, p.student_id, p.amount_paid, p.purchased_at,
       'live session ' || p.session_id || ' no longer exists; archived '
       || CURRENT_DATE || ' before adding purchases_session_id_fkey'
  FROM purchases p
  LEFT JOIN live_sessions ls ON ls.id = p.session_id
 WHERE ls.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2 ------------------------------------------------------------------------
DELETE FROM purchases p
 USING (SELECT id FROM purchases_orphaned_archive) a
 WHERE p.id = a.id;

-- 3 ------------------------------------------------------------------------
ALTER TABLE purchases
  ADD CONSTRAINT purchases_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE;

COMMIT;
