-- Simple SQL script to execute directly in PostgreSQL
-- Use: psql -U postgres -d tth_database -f clear-live-sections-simple.sql

-- Delete all related rows and then empty live_sections

DELETE FROM live_section_files WHERE live_section_id IN (SELECT id FROM live_sections);
DELETE FROM live_section_blocks WHERE live_section_id IN (SELECT id FROM live_sections);
DELETE FROM live_section_sections WHERE live_section_id IN (SELECT id FROM live_sections);
DELETE FROM live_section_purchases WHERE live_section_id IN (SELECT id FROM live_sections);
DELETE FROM live_sessions WHERE section_id IN (SELECT id FROM live_sections);
TRUNCATE TABLE live_sections CASCADE;
ALTER SEQUENCE live_sections_id_seq RESTART WITH 1;

-- Verify result
SELECT 'live_sections cleared. Remaining count: ' || COUNT(*) FROM live_sections;

