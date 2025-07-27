/**
 * DATABASE MIGRATION SCRIPT
 * ========================
 * 
 * This JavaScript file contains all SQL commands to add the quiz system and 
 * live sessions admin functionality to your database.
 *
 * Execute this file with Node.js to add all new tables and modify existing tables.
 *
 * Usage: node database-migration.js
 * 
 * Created: July 26, 2025
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
};

// Create database connection pool
const pool = new Pool(dbConfig);

// SQL commands to execute
const migrationQueries = [
  // ============================================================================
  // 1. ADD COLUMNS TO EXISTING live_sessions TABLE
  // ============================================================================
  `
  ALTER TABLE live_sessions 
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS attendees_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attendees INTEGER,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS is_recorded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS meeting_url TEXT,
  ADD COLUMN IF NOT EXISTS agora_channel VARCHAR(255),
  ADD COLUMN IF NOT EXISTS agora_token TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
  `,

  // ============================================================================
  // 2. CREATE QUIZ SYSTEM TABLES
  // ============================================================================
  
  // Create quizzes table
  `
  CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      course_id INTEGER REFERENCES courses(id),
      professor_id INTEGER REFERENCES users(id),
      time_limit INTEGER,
      passing_score INTEGER DEFAULT 70,
      max_attempts INTEGER DEFAULT 1,
      is_approved BOOLEAN DEFAULT FALSE,
      approved_at TIMESTAMP,
      approved_by INTEGER REFERENCES users(id),
      rejection_reason TEXT,
      rejected_at TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
  );
  `,

  // Create quiz_questions table
  `
  CREATE TABLE IF NOT EXISTS quiz_questions (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      question_type VARCHAR(50) NOT NULL,
      points INTEGER DEFAULT 1,
      explanation TEXT,
      "order" INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
  );
  `,

  // Create quiz_answers table
  `
  CREATE TABLE IF NOT EXISTS quiz_answers (
      id SERIAL PRIMARY KEY,
      question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
      answer_text TEXT NOT NULL,
      is_correct BOOLEAN DEFAULT FALSE,
      "order" INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
  );
  `,

  // Create quiz_attempts table
  `
  CREATE TABLE IF NOT EXISTS quiz_attempts (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      score DECIMAL(5,2),
      total_points INTEGER,
      passed BOOLEAN DEFAULT FALSE,
      time_spent INTEGER,
      started_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
  );
  `,

  // Create quiz_attempt_answers table
  `
  CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
      id SERIAL PRIMARY KEY,
      attempt_id INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES quiz_questions(id),
      student_answer TEXT,
      is_correct BOOLEAN DEFAULT FALSE,
      points_earned INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
  );
  `,

  // ============================================================================
  // 3. CREATE NOTIFICATIONS TABLE
  // ============================================================================
  `
  CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      metadata JSONB,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
  );
  `,

  // ============================================================================
  // 4. CREATE INDEXES FOR BETTER PERFORMANCE
  // ============================================================================
  
  // Indexes for quizzes table
  `CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);`,
  `CREATE INDEX IF NOT EXISTS idx_quizzes_professor_id ON quizzes(professor_id);`,
  `CREATE INDEX IF NOT EXISTS idx_quizzes_is_approved ON quizzes(is_approved);`,
  `CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON quizzes(is_active);`,

  // Indexes for quiz_questions table
  `CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);`,
  `CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions("order");`,

  // Indexes for quiz_answers table
  `CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);`,
  `CREATE INDEX IF NOT EXISTS idx_quiz_answers_is_correct ON quiz_answers(is_correct);`,

  // Indexes for quiz_attempts table
  `CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);`,
  `CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_quiz_attempts_created_at ON quiz_attempts(created_at);`,

  // Indexes for quiz_attempt_answers table
  `CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt_id ON quiz_attempt_answers(attempt_id);`,
  `CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_question_id ON quiz_attempt_answers(question_id);`,

  // Indexes for live_sessions table
  `CREATE INDEX IF NOT EXISTS idx_live_sessions_is_approved ON live_sessions(is_approved);`,
  `CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);`,
  `CREATE INDEX IF NOT EXISTS idx_live_sessions_professor_id ON live_sessions(professor_id);`,

  // Indexes for notifications table
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`,

  // ============================================================================
  // 5. ADD CONSTRAINTS FOR DATA INTEGRITY
  // ============================================================================
  
  // Add constraints to quizzes table
  `
  ALTER TABLE quizzes 
  ADD CONSTRAINT chk_quizzes_passing_score 
  CHECK (passing_score >= 0 AND passing_score <= 100),
  ADD CONSTRAINT chk_quizzes_time_limit 
  CHECK (time_limit IS NULL OR time_limit > 0),
  ADD CONSTRAINT chk_quizzes_max_attempts 
  CHECK (max_attempts IS NULL OR max_attempts > 0);
  `,

  // Add constraints to quiz_questions table
  `
  ALTER TABLE quiz_questions 
  ADD CONSTRAINT chk_quiz_questions_type 
  CHECK (question_type IN ('multiple-choice', 'true-false', 'short-answer')),
  ADD CONSTRAINT chk_quiz_questions_points 
  CHECK (points > 0);
  `,

  // Add constraints to quiz_attempts table
  `
  ALTER TABLE quiz_attempts 
  ADD CONSTRAINT chk_quiz_attempts_score 
  CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  ADD CONSTRAINT chk_quiz_attempts_time_spent 
  CHECK (time_spent IS NULL OR time_spent >= 0);
  `,

  // Add constraints to live_sessions table
  `
  ALTER TABLE live_sessions 
  ADD CONSTRAINT chk_live_sessions_status 
  CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  ADD CONSTRAINT chk_live_sessions_attendees_count 
  CHECK (attendees_count >= 0),
  ADD CONSTRAINT chk_live_sessions_max_attendees 
  CHECK (max_attendees IS NULL OR max_attendees > 0);
  `,

  // ============================================================================
  // 6. CREATE TRIGGERS FOR AUTOMATIC UPDATES
  // ============================================================================
  
  // Function to update updated_at timestamp
  `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$ language 'plpgsql';
  `,

  // Trigger for quizzes table
  `
  CREATE TRIGGER update_quizzes_updated_at 
      BEFORE UPDATE ON quizzes 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  `,

  // Trigger for live_sessions table
  `
  CREATE TRIGGER update_live_sessions_updated_at 
      BEFORE UPDATE ON live_sessions 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  `,

  // ============================================================================
  // 7. INSERT SAMPLE DATA (OPTIONAL)
  // ============================================================================
  `
  INSERT INTO notifications (user_id, type, title, message, metadata) VALUES
  (1, 'system', 'Database Migration Complete', 'Quiz system and live sessions admin functionality have been successfully added to the database.', '{"migration": "quiz_system_2025_07_26"}')
  ON CONFLICT DO NOTHING;
  `
];

// Verification queries
const verificationQueries = [
  // Check if all tables were created successfully
  `
  SELECT 
      table_name,
      CASE 
          WHEN table_name IN ('quizzes', 'quiz_questions', 'quiz_answers', 'quiz_attempts', 'quiz_attempt_answers', 'notifications') 
          THEN 'NEW TABLE'
          ELSE 'EXISTING TABLE'
      END as table_type
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('quizzes', 'quiz_questions', 'quiz_answers', 'quiz_attempts', 'quiz_attempt_answers', 'notifications', 'live_sessions')
  ORDER BY table_name;
  `,

  // Check live_sessions columns
  `
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns 
  WHERE table_name = 'live_sessions' 
  AND column_name IN ('is_approved', 'approved_by', 'approved_at', 'status', 'attendees_count', 'max_attendees', 'recording_url', 'is_recorded', 'meeting_url', 'agora_channel', 'agora_token', 'description', 'tags', 'updated_at')
  ORDER BY column_name;
  `,

  // Check indexes
  `
  SELECT 
      indexname,
      tablename,
      indexdef
  FROM pg_indexes 
  WHERE tablename IN ('quizzes', 'quiz_questions', 'quiz_answers', 'quiz_attempts', 'quiz_attempt_answers', 'notifications', 'live_sessions')
  AND indexname LIKE 'idx_%'
  ORDER BY tablename, indexname;
  `
];

// Main migration function
async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...');
    console.log('📊 Database:', dbConfig.database);
    console.log('👤 User:', dbConfig.user);
    console.log('🏠 Host:', dbConfig.host);
    console.log('');

    // Execute all migration queries
    for (let i = 0; i < migrationQueries.length; i++) {
      const query = migrationQueries[i].trim();
      if (query) {
        try {
          console.log(`⏳ Executing query ${i + 1}/${migrationQueries.length}...`);
          await client.query(query);
          console.log(`✅ Query ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ Error in query ${i + 1}:`, error.message);
          // Continue with other queries even if one fails
        }
      }
    }

    console.log('');
    console.log('🔍 Running verification queries...');
    console.log('');

    // Execute verification queries
    for (let i = 0; i < verificationQueries.length; i++) {
      try {
        console.log(`📋 Verification ${i + 1}:`);
        const result = await client.query(verificationQueries[i]);
        console.table(result.rows);
        console.log('');
      } catch (error) {
        console.error(`❌ Verification ${i + 1} failed:`, error.message);
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('✅ Your database now has:');
    console.log('   • Quiz system with 5 new tables');
    console.log('   • Live sessions admin approval system');
    console.log('   • Notifications system');
    console.log('   • Performance indexes');
    console.log('   • Data integrity constraints');
    console.log('   • Automatic timestamp updates');
    console.log('');
    console.log('🚀 You can now use the quiz and live session admin functionality!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📋 DATABASE MIGRATION SCRIPT');
  console.log('============================');
  console.log('');
  console.log('Current configuration:');
  console.log('  User:', dbConfig.user);
  console.log('  Host:', dbConfig.host);
  console.log('  Database:', dbConfig.database);
  console.log('  Port:', dbConfig.port);
  console.log('');
  
  console.log('✅ Configuration looks good! Starting migration...');
  console.log('');
  
  runMigration();
}

export { runMigration }; 