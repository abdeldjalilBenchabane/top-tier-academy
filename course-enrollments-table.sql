-- ============================================================================
-- COURSE ENROLLMENTS TABLE
-- ============================================================================
-- Simple table to track course enrollments
-- ============================================================================

-- Course Enrollments table - tracks student enrollment in courses
CREATE TABLE IF NOT EXISTS course_enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    points_spent INTEGER DEFAULT 0,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_enrolled_at ON course_enrollments(enrolled_at);

-- ============================================================================
-- DONE!
-- ============================================================================
-- This table tracks:
-- • Which users are enrolled in which courses
-- • Points spent to enroll
-- • Enrollment date
-- • Prevents duplicate enrollments with UNIQUE constraint 