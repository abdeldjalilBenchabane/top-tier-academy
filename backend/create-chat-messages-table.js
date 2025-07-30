import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
});

const createChatMessagesTable = async () => {
  try {
    console.log('Creating chat_messages table...');
    
    const query = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        message_text TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create index for faster queries by session_id
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
      
      -- Create index for timestamp ordering
      CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
    `;
    
    await pool.query(query);
    console.log('✅ chat_messages table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating chat_messages table:', error);
  } finally {
    await pool.end();
  }
};

createChatMessagesTable(); 