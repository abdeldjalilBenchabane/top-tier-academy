-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'professor', 'admin')),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LEVELS
CREATE TABLE levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- YEARS
CREATE TABLE years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level_id INTEGER REFERENCES levels(id) ON DELETE CASCADE
);

-- SPECIALITIES
CREATE TABLE specialities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    year_id INTEGER REFERENCES years(id) ON DELETE CASCADE
);

-- MATERIALS
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    speciality_id INTEGER REFERENCES specialities(id) ON DELETE CASCADE,
    price NUMERIC(10,2)
);

-- LANGUAGES
CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    flag VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LANGUAGE LEVELS
CREATE TABLE language_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
    "order" INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COURSES
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    price NUMERIC(10,2),
    is_published BOOLEAN DEFAULT FALSE
);

-- COURSE SECTIONS
CREATE TABLE course_sections (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    "order" INTEGER
);

-- SECTION BLOCKS
CREATE TABLE section_blocks (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES course_sections(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- text, video, quiz, etc.
    title VARCHAR(255),
    content TEXT,
    "order" INTEGER
);

-- PENDING COURSES (for approval workflow)
CREATE TABLE pending_courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    rejection_reason TEXT,
    rejected_at TIMESTAMP
);

-- PENDING COURSE SECTIONS
CREATE TABLE pending_course_sections (
    id SERIAL PRIMARY KEY,
    pending_course_id INTEGER REFERENCES pending_courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    "order" INTEGER
);

-- PENDING SECTION BLOCKS
CREATE TABLE pending_section_blocks (
    id SERIAL PRIMARY KEY,
    pending_section_id INTEGER REFERENCES pending_course_sections(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    "order" INTEGER
)

-- QUIZZES
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    rejected_at TIMESTAMP
);

-- QUIZ QUESTIONS
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- e.g., multiple_choice, true_false
    "order" INTEGER
);

-- QUIZ ANSWERS
CREATE TABLE quiz_answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE
);

-- QUIZ ATTEMPTS
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- QUIZ ATTEMPT ANSWERS
CREATE TABLE quiz_attempt_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_id INTEGER REFERENCES quiz_answers(id) ON DELETE SET NULL
);

-- LIVE SESSIONS
CREATE TABLE live_sessions (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PURCHASES
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

-- LIVE PRIVATE SESSIONS (1-on-1 or small group private classes)
CREATE TABLE live_private (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP NOT NULL,
    professor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LIVE PRIVATE PARTICIPANTS (students in private sessions)
CREATE TABLE live_private_participants (
    id SERIAL PRIMARY KEY,
    live_private_id INTEGER REFERENCES live_private(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- permet de connecter un live à une matière
ALTER TABLE live_sessions
ADD COLUMN material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL;

-- (Optionnel) Ajouter is_published pour la bibliothèque
ALTER TABLE live_sessions
ADD COLUMN is_published BOOLEAN DEFAULT FALSE;

-- ENHANCED SLIDES (Homepage and Enhanced)
CREATE TABLE enhanced_slides (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    media_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    "order" INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    duration INTEGER, -- in seconds for video slides
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    target_audience TEXT[], -- array of roles: ['student', 'professor', 'admin']
    cta_text VARCHAR(100),
    cta_link VARCHAR(500),
    overlay_color VARCHAR(7) DEFAULT '#000000', -- hex color
    overlay_opacity DECIMAL(3,2) DEFAULT 0.3 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 1),
    transition VARCHAR(20) DEFAULT 'fade' CHECK (transition IN ('fade', 'slide', 'zoom', 'none')),
    alt_text VARCHAR(255),
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SLIDE ANALYTICS (for tracking views and clicks)
CREATE TABLE slide_analytics (
    id SERIAL PRIMARY KEY,
    slide_id INTEGER REFERENCES enhanced_slides(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('view', 'click')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SLIDE TARGET AUDIENCE (many-to-many relationship for better performance)
CREATE TABLE slide_target_audience (
    slide_id INTEGER REFERENCES enhanced_slides(id) ON DELETE CASCADE,
    audience_role VARCHAR(20) NOT NULL CHECK (audience_role IN ('student', 'professor', 'admin')),
    PRIMARY KEY (slide_id, audience_role)
);

-- Create indexes for better performance
CREATE INDEX idx_enhanced_slides_active ON enhanced_slides(is_active);
CREATE INDEX idx_enhanced_slides_order ON enhanced_slides("order");
CREATE INDEX idx_enhanced_slides_created_at ON enhanced_slides(created_at);
CREATE INDEX idx_slide_analytics_slide_id ON slide_analytics(slide_id);
CREATE INDEX idx_slide_analytics_created_at ON slide_analytics(created_at);
CREATE INDEX idx_slide_target_audience_slide_id ON slide_target_audience(slide_id);

-- Language indexes
CREATE INDEX idx_languages_active ON languages(is_active);
CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_language_levels_language_id ON language_levels(language_id);
CREATE INDEX idx_language_levels_order ON language_levels("order");
CREATE INDEX idx_language_levels_active ON language_levels(is_active);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_enhanced_slides_updated_at 
    BEFORE UPDATE ON enhanced_slides 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- COMMENTS/FEEDBACK
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    section_id INTEGER REFERENCES course_sections(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SETTINGS (per user)
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    settings_json JSONB
);

-- FILE UPLOADS (avatars, slides, etc.)
CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


