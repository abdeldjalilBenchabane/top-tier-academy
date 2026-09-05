-- Simple SQL script to clear ALL private class tables
-- Use: psql -U postgres -d tth_database -f clear-all-private-classes-simple.sql

-- Clear live_private and related tables
DELETE FROM live_private_participants WHERE live_private_id IN (SELECT id FROM live_private);
TRUNCATE TABLE live_private CASCADE;
ALTER SEQUENCE live_private_id_seq RESTART WITH 1;

-- Clear private_class_requests table
TRUNCATE TABLE private_class_requests CASCADE;
ALTER SEQUENCE private_class_requests_id_seq RESTART WITH 1;

-- Verify results
SELECT 'live_private cleared. Remaining: ' || COUNT(*) FROM live_private;
SELECT 'private_class_requests cleared. Remaining: ' || COUNT(*) FROM private_class_requests;

