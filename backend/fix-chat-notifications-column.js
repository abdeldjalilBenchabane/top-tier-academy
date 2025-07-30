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

async function fixChatNotificationsColumn() {
    try {
        console.log('🔄 Fixing chat_notifications table column type...');
        
        // First, check if the column exists and its current type
        const checkColumnQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'chat_notifications' 
            AND column_name = 'last_seen_message_id'
        `;
        
        const columnCheck = await pool.query(checkColumnQuery);
        
        if (columnCheck.rows.length === 0) {
            console.log('❌ Column last_seen_message_id does not exist');
            return;
        }
        
        const currentType = columnCheck.rows[0].data_type;
        console.log(`📊 Current column type: ${currentType}`);
        
        if (currentType === 'integer') {
            console.log('🔄 Converting last_seen_message_id from INTEGER to VARCHAR...');
            
            // Convert the column type
            const alterQuery = `
                ALTER TABLE chat_notifications 
                ALTER COLUMN last_seen_message_id TYPE VARCHAR(255)
            `;
            
            await pool.query(alterQuery);
            
            // Update default value
            const updateDefaultQuery = `
                ALTER TABLE chat_notifications 
                ALTER COLUMN last_seen_message_id SET DEFAULT '0'
            `;
            
            await pool.query(updateDefaultQuery);
            
            console.log('✅ Successfully converted last_seen_message_id to VARCHAR(255)');
        } else {
            console.log('✅ Column is already VARCHAR type');
        }
        
    } catch (error) {
        console.error('💥 Error fixing chat notifications column:', error);
    } finally {
        await pool.end();
    }
}

fixChatNotificationsColumn(); 