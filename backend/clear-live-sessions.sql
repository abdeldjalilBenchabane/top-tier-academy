-- ⚠️  WARNING: This will permanently delete all live session data! ⚠️
-- Run this script to remove all live sessions, sections, and related data

-- 1. Delete live session attendees (if this table exists)
DELETE FROM live_session_attendees;

-- 2. Delete live section purchases
DELETE FROM live_section_purchases;

-- 3. Delete live sessions
DELETE FROM live_sessions;

-- 4. Delete live sections
DELETE FROM live_sections;

-- 5. Delete any related purchases for live sessions
DELETE FROM purchases WHERE session_id IN (SELECT id FROM live_sessions);

-- 6. Delete any notifications related to live sessions
DELETE FROM notifications WHERE type LIKE '%live_session%' OR type LIKE '%live_section%';

-- 7. Show confirmation
SELECT 'Live session data cleared successfully!' as message; 