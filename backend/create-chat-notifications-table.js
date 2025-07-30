import { Pool } from 'pg';
import dotenv from 'dotenv';

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'tth_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'aw dir code ta3k ajalol ',
  });

async function createChatNotificationsTable() {
    try {
        console.log('🔄 Creating chat notifications table...');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS chat_notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                session_id VARCHAR(255) NOT NULL,
                last_seen_message_id INTEGER DEFAULT 0,
                unseen_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, session_id)
            );
        `;
        
        await pool.query(createTableQuery);
        
        console.log('✅ Chat notifications table created successfully!');
        
    } catch (error) {
        console.error('💥 Error creating chat notifications table:', error);
    } finally {
        await pool.end();
    }
}

createChatNotificationsTable(); 