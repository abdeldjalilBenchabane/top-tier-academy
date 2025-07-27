import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Starting final migration...');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
});

async function runFinalMigration() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Connected to database successfully!');
    console.log('📊 Database:', process.env.DB_NAME || 'tth_database');
    console.log('👤 User:', process.env.DB_USER || 'postgres');
    console.log('');

    // Test connection first
    const testResult = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Database time:', testResult.rows[0].current_time);
    console.log('');

    // 1. Add only missing columns to live_sessions table
    console.log('🔧 Adding missing columns to live_sessions table...');
    
    const missingColumns = [
      'ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP',
      'ADD COLUMN IF NOT EXISTS attendees_count INTEGER DEFAULT 0',
      'ADD COLUMN IF NOT EXISTS max_attendees INTEGER',
      'ADD COLUMN IF NOT EXISTS recording_url TEXT'
    ];

    for (const column of missingColumns) {
      try {
        await client.query(`ALTER TABLE live_sessions ${column}`);
        console.log(`✅ Added column: ${column.split(' ')[3]}`);
      } catch (error) {
        console.log(`⚠️  Column might already exist: ${column.split(' ')[3]}`);
      }
    }

    // 2. Create quizzes table
    console.log('\n🔧 Creating quizzes table...');
    await client.query(`
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
      )
    `);
    console.log('✅ Created quizzes table');

    // 3. Create quiz_questions table
    console.log('🔧 Creating quiz_questions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
          id SERIAL PRIMARY KEY,
          quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          question_type VARCHAR(50) NOT NULL,
          points INTEGER DEFAULT 1,
          explanation TEXT,
          "order" INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created quiz_questions table');

    // 4. Create quiz_answers table
    console.log('🔧 Creating quiz_answers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_answers (
          id SERIAL PRIMARY KEY,
          question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
          answer_text TEXT NOT NULL,
          is_correct BOOLEAN DEFAULT FALSE,
          "order" INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created quiz_answers table');

    // 5. Create quiz_attempts table
    console.log('🔧 Creating quiz_attempts table...');
    await client.query(`
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
      )
    `);
    console.log('✅ Created quiz_attempts table');

    // 6. Create quiz_attempt_answers table
    console.log('🔧 Creating quiz_attempt_answers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
          id SERIAL PRIMARY KEY,
          attempt_id INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE,
          question_id INTEGER REFERENCES quiz_questions(id),
          student_answer TEXT,
          is_correct BOOLEAN DEFAULT FALSE,
          points_earned INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created quiz_attempt_answers table');

    // 7. Create notifications table
    console.log('🔧 Creating notifications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          metadata JSONB,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created notifications table');

    // 8. Create indexes
    console.log('\n🔍 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id)',
      'CREATE INDEX IF NOT EXISTS idx_quizzes_professor_id ON quizzes(professor_id)',
      'CREATE INDEX IF NOT EXISTS idx_quizzes_is_approved ON quizzes(is_approved)',
      'CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id)',
      'CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id)',
      'CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id)',
      'CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_live_sessions_is_approved ON live_sessions(is_approved)',
      'CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)'
    ];

    for (const indexQuery of indexes) {
      await client.query(indexQuery);
    }
    console.log('✅ Created all indexes');

    // 9. Create trigger function
    console.log('\n⚡ Creating trigger function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('✅ Created trigger function');

    // 10. Create triggers
    console.log('⚡ Creating triggers...');
    await client.query(`
      DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
      CREATE TRIGGER update_quizzes_updated_at 
          BEFORE UPDATE ON quizzes 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;
      CREATE TRIGGER update_live_sessions_updated_at 
          BEFORE UPDATE ON live_sessions 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Created triggers');

    // 11. Show results
    console.log('\n📋 Migration Results:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('quizzes', 'quiz_questions', 'quiz_answers', 'quiz_attempts', 'quiz_attempt_answers', 'notifications')
      ORDER BY table_name
    `);
    
    console.log('✅ Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Show live_sessions columns
    const liveSessionsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' 
      AND column_name IN ('is_approved', 'approved_by', 'approved_at', 'status', 'attendees_count', 'max_attendees', 'recording_url', 'is_recorded', 'meeting_url', 'agora_channel', 'agora_token', 'description', 'tags', 'updated_at')
      ORDER BY column_name
    `);
    
    console.log('\n✅ Live sessions columns:');
    liveSessionsColumns.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ Your database now has:');
    console.log('   • Quiz system with 5 new tables');
    console.log('   • Live sessions admin approval system');
    console.log('   • Notifications system');
    console.log('   • Performance indexes');
    console.log('   • Automatic timestamp updates');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
runFinalMigration().catch(console.error); 