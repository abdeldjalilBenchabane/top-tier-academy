-- The student's path has two shapes, not one.
--
-- They choose a KIND first — school or a language — and the rest of the
-- questions follow from that:
--
--   education   level  ->  year  ->  speciality (secondary only)
--   language    language -> language level
--
-- The content tables already make the same distinction in their root_type
-- column ('education' / 'language'), so path_type uses the same two words
-- rather than inventing a second vocabulary for the same idea.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS path_type varchar(20)
      CHECK (path_type IN ('education', 'language')),
  ADD COLUMN IF NOT EXISTS language_id       integer REFERENCES languages(id)       ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS language_level_id integer REFERENCES language_levels(id) ON DELETE SET NULL;

COMMENT ON COLUMN users.path_type IS
  'Which kind of path the student follows: education (level/year/speciality) '
  'or language (language/level). Matches root_type on the content tables.';
COMMENT ON COLUMN users.language_id IS
  'Language the student is learning. NULL on the education path.';
COMMENT ON COLUMN users.language_level_id IS
  'Their level in that language (A1, A2…). NULL on the education path.';

-- The language feed filters on these the way the education feed filters on
-- level/year/speciality.
CREATE INDEX IF NOT EXISTS idx_users_language_path
  ON users (language_id, language_level_id)
  WHERE role = 'student' AND path_type = 'language';

COMMIT;
