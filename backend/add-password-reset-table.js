import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function addPasswordResetTable() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Adding Password Reset Tokens Table...\n');

        // Create password_reset_tokens table
        console.log('📋 Creating password_reset_tokens table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ password_reset_tokens table created successfully');

        // Create indexes for better performance
        console.log('📊 Creating indexes...');
        
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);',
            'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);'
        ];

        for (const indexQuery of indexes) {
            await client.query(indexQuery);
        }
        console.log('✅ All indexes created successfully');

        // Create cleanup function
        console.log('🔧 Creating cleanup function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION cleanup_expired_password_tokens()
            RETURNS void AS $$
            BEGIN
                DELETE FROM password_reset_tokens 
                WHERE expires_at < CURRENT_TIMESTAMP 
                OR used_at IS NOT NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Cleanup function created successfully');

        console.log('\n🎉 Password reset functionality setup completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Configure email settings in your .env file:');
        console.log('   EMAIL_USER=your-email@gmail.com');
        console.log('   EMAIL_PASSWORD=your-app-password');
        console.log('   FRONTEND_URL=http://localhost:5173');
        console.log('2. Start your server: npm run server:dev');
        console.log('3. Test the forgot password functionality');

    } catch (error) {
        console.error('❌ Error setting up password reset table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the setup
addPasswordResetTable()
    .then(() => {
        console.log('✅ Setup completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }); 