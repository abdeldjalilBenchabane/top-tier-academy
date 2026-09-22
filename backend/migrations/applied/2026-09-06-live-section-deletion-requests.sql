-- Deleting a دورة stops being something a professor can do alone.
--
-- Before this, the professor route deleted the section and every purchase of
-- it outright, so students silently lost the points they had paid. The refund
-- question cannot be answered by whoever happens to press the button: a دورة
-- withdrawn in October owes its students their points back, one retired the
-- following June does not. So the professor now asks, and the admin decides
-- both whether to delete and whether to refund.

BEGIN;

CREATE TABLE IF NOT EXISTS live_section_deletion_requests (
  id              serial PRIMARY KEY,

  -- Approving a request deletes the دورة, so this column becomes NULL at the
  -- exact moment the row becomes most worth keeping. ON DELETE SET NULL (not
  -- CASCADE) keeps the decision, and section_title keeps it readable.
  live_section_id integer     REFERENCES live_sections(id) ON DELETE SET NULL,
  section_title   text        NOT NULL,

  professor_id    integer     REFERENCES users(id) ON DELETE SET NULL,
  reason          text,
  status          varchar(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at    timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  decided_by      integer     REFERENCES users(id) ON DELETE SET NULL,
  decided_at      timestamp,
  admin_note      text,

  -- what the admin chose, recorded at decision time
  refunded          boolean,
  points_returned   integer   NOT NULL DEFAULT 0,
  students_refunded integer   NOT NULL DEFAULT 0
);

-- One open request per دورة: a professor pressing the button twice must not
-- give the admin the same decision to make twice. Decided rows stay as history,
-- and rows whose section is gone (live_section_id NULL) never block anything.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_deletion_request
  ON live_section_deletion_requests (live_section_id)
  WHERE status = 'pending' AND live_section_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status
  ON live_section_deletion_requests (status, requested_at DESC);

COMMENT ON TABLE live_section_deletion_requests IS
  'Professor requests to delete a دورة; the admin approves (choosing whether '
  'students are refunded) or rejects. Approving deletes the section, which '
  'nulls live_section_id — section_title, points_returned and students_refunded '
  'preserve the decision after the thing it refers to is gone.';

COMMIT;
