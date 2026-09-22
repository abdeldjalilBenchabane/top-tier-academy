-- A student picks where they are in school, and the app shows them that.
--
-- users.level_id already existed but on its own it is too coarse: every level
-- holds three or four years, and a third-year secondary student has nothing to
-- gain from first-year content. Year and speciality complete the picture.
--
-- DELIBERATELY NO material_id. A student does not follow one subject — they
-- follow a year, and every subject in it. Storing a material here would narrow
-- the feed to a single subject, which is the opposite of what it is for.
--
-- HOW DEEP THE PATH GOES DEPENDS ON THE LEVEL. Measured against the live data:
--   التعليم الابتدائي   3 years, 0 specialities  -> level + year is the whole path
--   التعليم المتوسط     4 years, 0 specialities  -> level + year
--   التعليم الثانوي     3 years, 14 specialities -> level + year + speciality
-- and in secondary every material hangs off a speciality, none off the year
-- directly — so speciality_id is required there and meaningless elsewhere.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS year_id       integer REFERENCES years(id)        ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS speciality_id integer REFERENCES specialities(id) ON DELETE SET NULL,
  -- When they chose it. Lets the app tell "never asked" from "asked and
  -- answered", so a returning student is not prompted again.
  ADD COLUMN IF NOT EXISTS path_set_at   timestamp;

COMMENT ON COLUMN users.year_id IS
  'School year the student follows. Set with PUT /api/student/path.';
COMMENT ON COLUMN users.speciality_id IS
  'Secondary-school speciality. NULL for primary and middle school, which have none.';
COMMENT ON COLUMN users.path_set_at IS
  'When the student last chose their path. NULL means they have never been asked.';

-- The feed filters on these three together on every request.
CREATE INDEX IF NOT EXISTS idx_users_path
  ON users (level_id, year_id, speciality_id)
  WHERE role = 'student';

COMMIT;
