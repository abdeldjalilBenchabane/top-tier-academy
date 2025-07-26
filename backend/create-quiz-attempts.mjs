import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createQuizAttemptsTables() {
  try {
    console.log('Creating quiz attempts tables...');

    // Create quiz_attempts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score DECIMAL(5,2) DEFAULT 0,
        total_points INTEGER DEFAULT 0,
        passed BOOLEAN DEFAULT FALSE,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        time_spent INTEGER DEFAULT 0,
        UNIQUE(quiz_id, student_id)
      )
    `);
    console.log('✅ quiz_attempts table created');

    // Create quiz_attempt_answers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
        question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
        student_answer TEXT,
        is_correct BOOLEAN DEFAULT FALSE,
        points_earned INTEGER DEFAULT 0,
        answered_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ quiz_attempt_answers table created');

    // Create indexes for better performance (skip for now)
    console.log('✅ Indexes skipped for now');

    console.log('✅ All quiz attempts tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating quiz attempts tables:', error);
  } finally {
    await pool.end();
  }
}

createQuizAttemptsTables(); 