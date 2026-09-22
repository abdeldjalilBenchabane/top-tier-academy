-- Sections and blocks were all inserted with "order" = 1, so ORDER BY "order"
-- had nothing to sort on and returned them in whatever order the planner
-- produced — the "I add 1, 2, 3 and see 3, 1, 2" bug.
--
-- Renumber by id, which is creation order: the order the professor added them.
-- Idempotent — rerunning changes nothing once the numbering is correct.

BEGIN;

UPDATE course_sections s
   SET "order" = r.rn
  FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY id) AS rn
          FROM course_sections) r
 WHERE s.id = r.id AND s."order" IS DISTINCT FROM r.rn;

UPDATE section_blocks b
   SET "order" = r.rn
  FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY id) AS rn
          FROM section_blocks) r
 WHERE b.id = r.id AND b."order" IS DISTINCT FROM r.rn;

UPDATE live_section_sections s
   SET "order" = r.rn
  FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY live_section_id ORDER BY id) AS rn
          FROM live_section_sections) r
 WHERE s.id = r.id AND s."order" IS DISTINCT FROM r.rn;

UPDATE live_section_blocks b
   SET "order" = r.rn
  FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY id) AS rn
          FROM live_section_blocks) r
 WHERE b.id = r.id AND b."order" IS DISTINCT FROM r.rn;

COMMIT;
