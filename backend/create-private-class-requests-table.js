import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

async function createPrivateClassRequestsTable() {
  const client = await pool.connect();
  try {
    console.log('🚀 Creating private_class_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS private_class_requests (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        teacher_name VARCHAR(100) NOT NULL,
        subject VARCHAR(100),
        grade VARCHAR(100),
        date VARCHAR(50),
        time VARCHAR(50),
        sessions_count INTEGER,
        title VARCHAR(255),
        description TEXT,
        status VARCHAR(50) DEFAULT 'في الانتظار',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('🎉 private_class_requests table created successfully!');
  } catch (err) {
    console.error('❌ Error creating private_class_requests table:', err);
  } finally {
    client.release();
    process.exit();
  }
}

createPrivateClassRequestsTable(); 