-- Script to empty the live_sections table and delete related references
-- Execute this script on your PostgreSQL VPS

BEGIN;

-- 1. First, delete records in tables that reference live_sections
-- Order is important due to foreign keys

-- Delete records from live_section_files (most specific, can reference blocks and sections)
DELETE FROM live_section_files 
WHERE live_section_id IN (SELECT id FROM live_sections);

-- Delete records from live_section_blocks (references live_section_sections and live_sections)
DELETE FROM live_section_blocks 
WHERE live_section_id IN (SELECT id FROM live_sections);

-- Delete records from live_section_sections (references live_sections)
DELETE FROM live_section_sections 
WHERE live_section_id IN (SELECT id FROM live_sections);

-- Delete records from live_section_purchases (references live_sections)
DELETE FROM live_section_purchases 
WHERE live_section_id IN (SELECT id FROM live_sections);

-- Delete records from live_sessions that reference live_sections
DELETE FROM live_sessions 
WHERE section_id IN (SELECT id FROM live_sections);

-- 2. Now, empty the live_sections table
TRUNCATE TABLE live_sections CASCADE;

-- 3. Optional: Reset the ID sequence (back to 1)
ALTER SEQUENCE live_sections_id_seq RESTART WITH 1;

COMMIT;

-- Verify that it's empty
SELECT COUNT(*) as remaining_count FROM live_sections;

