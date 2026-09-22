-- The student path covers school only.
--
-- Languages have their own page in the mobile app, so a language never needs
-- to be stored against the student: they reach that content by going there,
-- not by having their whole feed switched over to it. path_type had exactly
-- two values and one of them is gone, which leaves nothing for it to say.
--
-- Safe to drop: these three columns were added earlier today and no row has
-- ever held a value in any of them (checked: 0 of 2,644 users).

BEGIN;

DROP INDEX IF EXISTS idx_users_language_path;

ALTER TABLE users
  DROP COLUMN IF EXISTS path_type,
  DROP COLUMN IF EXISTS language_id,
  DROP COLUMN IF EXISTS language_level_id;

-- level_id, year_id, speciality_id and path_set_at stay. path_set_at still
-- earns its place: it separates "has never been asked" from "was asked and
-- skipped", which the feed treats the same way but the app may not want to.
COMMENT ON COLUMN users.path_set_at IS
  'When the student last chose their school path. NULL means they have not '
  'chosen — either never asked, or asked and skipped. Either way the feed '
  'falls back to showing everything.';

COMMIT;
