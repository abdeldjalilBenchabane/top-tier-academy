-- Create table for tracking video views
CREATE TABLE IF NOT EXISTS video_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    video_path VARCHAR(500) NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    watch_time INTEGER DEFAULT 0, -- Time watched in seconds
    video_duration INTEGER DEFAULT 0, -- Total video duration in seconds
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_course_id ON video_views(course_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewed_at ON video_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_video_views_video_path ON video_views(video_path);

-- Create unique index to prevent duplicate views per user/course/video per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_views_unique_daily 
ON video_views(user_id, course_id, video_path, DATE(viewed_at));

-- Create table for tracking suspicious activity
CREATE TABLE IF NOT EXISTS video_security_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    video_path VARCHAR(500),
    event_type VARCHAR(50) NOT NULL, -- 'screenshot_attempt', 'recording_detected', 'multiple_views', etc.
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_security_logs_user_id ON video_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_security_logs_event_type ON video_security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_video_security_logs_created_at ON video_security_logs(created_at);

