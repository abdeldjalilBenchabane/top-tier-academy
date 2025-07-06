const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function installLiveDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starting Live Session Database Installation...\n');

        // 1. Create live_sessions table
        console.log('📋 Creating live_sessions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS live_sessions (
                id SERIAL PRIMARY KEY,
                professor_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                presenter VARCHAR(255),
                start_time TIMESTAMP NOT NULL,
                duration INTEGER NOT NULL,
                price NUMERIC(10, 2) NOT NULL,
                material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
                is_published BOOLEAN DEFAULT FALSE,
                is_approved BOOLEAN DEFAULT FALSE,
                is_rejected BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled', 'starting', 'paused', 'technical_issues')),
                meeting_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ live_sessions table created successfully');

        // 2. Create purchases table
        console.log('📋 Creating purchases table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS purchases (
                id SERIAL PRIMARY KEY,
                session_id INTEGER REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
                amount_paid NUMERIC(10, 2) NOT NULL,
                purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(session_id, student_id)
            );
        `);
        console.log('✅ purchases table created successfully');

        // 3. Create live_private table
        console.log('📋 Creating live_private table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS live_private (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                scheduled_at TIMESTAMP NOT NULL,
                professor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ live_private table created successfully');

        // 4. Create live_private_participants table
        console.log('📋 Creating live_private_participants table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS live_private_participants (
                id SERIAL PRIMARY KEY,
                live_private_id INTEGER REFERENCES live_private(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ live_private_participants table created successfully');

        // 5. Add missing columns to live_sessions if they don't exist
        console.log('🔧 Adding missing columns to live_sessions...');
        
        // Check and add description column
        try {
            await client.query('ALTER TABLE live_sessions ADD COLUMN description TEXT;');
            console.log('✅ Added description column to live_sessions');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  description column already exists');
            } else {
                throw error;
            }
        }

        // Check and add presenter column
        try {
            await client.query('ALTER TABLE live_sessions ADD COLUMN presenter VARCHAR(255);');
            console.log('✅ Added presenter column to live_sessions');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  presenter column already exists');
            } else {
                throw error;
            }
        }

        // Check and add is_approved column
        try {
            await client.query('ALTER TABLE live_sessions ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;');
            console.log('✅ Added is_approved column to live_sessions');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  is_approved column already exists');
            } else {
                throw error;
            }
        }

        // Check and add is_rejected column
        try {
            await client.query('ALTER TABLE live_sessions ADD COLUMN is_rejected BOOLEAN DEFAULT FALSE;');
            console.log('✅ Added is_rejected column to live_sessions');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  is_rejected column already exists');
            } else {
                throw error;
            }
        }

        // Check and add status column
        try {
            await client.query('ALTER TABLE live_sessions ADD COLUMN status VARCHAR(50) DEFAULT \'scheduled\' CHECK (status IN (\'scheduled\', \'live\', \'ended\', \'cancelled\', \'starting\', \'paused\', \'technical_issues\'));');
            console.log('✅ Added status column to live_sessions');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  status column already exists');
            } else {
                throw error;
            }
        }

        // Check and add meeting_url column
        try {
            await client.query('ALTER TABLE live_sessions ADD COLUMN meeting_url VARCHAR(500);');
            console.log('✅ Added meeting_url column to live_sessions');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  meeting_url column already exists');
            } else {
                throw error;
            }
        }

        // 6. Create indexes for better performance
        console.log('📊 Creating indexes...');
        
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_live_sessions_professor_id ON live_sessions(professor_id);',
            'CREATE INDEX IF NOT EXISTS idx_live_sessions_start_time ON live_sessions(start_time);',
            'CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);',
            'CREATE INDEX IF NOT EXISTS idx_live_sessions_is_approved ON live_sessions(is_approved);',
            'CREATE INDEX IF NOT EXISTS idx_live_sessions_is_rejected ON live_sessions(is_rejected);',
            'CREATE INDEX IF NOT EXISTS idx_purchases_session_id ON purchases(session_id);',
            'CREATE INDEX IF NOT EXISTS idx_purchases_student_id ON purchases(student_id);',
            'CREATE INDEX IF NOT EXISTS idx_live_private_professor_id ON live_private(professor_id);',
            'CREATE INDEX IF NOT EXISTS idx_live_private_scheduled_at ON live_private(scheduled_at);',
            'CREATE INDEX IF NOT EXISTS idx_live_private_participants_live_private_id ON live_private_participants(live_private_id);',
            'CREATE INDEX IF NOT EXISTS idx_live_private_participants_user_id ON live_private_participants(user_id);'
        ];

        for (const indexQuery of indexes) {
            await client.query(indexQuery);
        }
        console.log('✅ All indexes created successfully');

        // 7. Insert sample data (optional)
        console.log('📝 Inserting sample live session data...');
        
        // Check if sample data already exists
        const existingSessions = await client.query('SELECT COUNT(*) FROM live_sessions');
        if (existingSessions.rows[0].count === '0') {
            // Get a professor user
            const professorResult = await client.query('SELECT id FROM users WHERE role = \'professor\' LIMIT 1');
            
            if (professorResult.rows.length > 0) {
                const professorId = professorResult.rows[0].id;
                
                await client.query(`
                    INSERT INTO live_sessions (professor_id, title, description, presenter, start_time, duration, price, status, is_approved) 
                    VALUES 
                    ($1, 'درس الرياضيات المباشر', 'درس تفاعلي في الرياضيات للمبتدئين', 'أستاذ أحمد', NOW() + INTERVAL '1 day', 60, 500.00, 'scheduled', true),
                    ($1, 'درس اللغة العربية', 'تعلم أساسيات اللغة العربية', 'أستاذة فاطمة', NOW() + INTERVAL '2 days', 90, 750.00, 'scheduled', true),
                    ($1, 'درس العلوم', 'تجارب علمية تفاعلية', 'أستاذ محمد', NOW() + INTERVAL '3 days', 120, 1000.00, 'scheduled', false)
                `, [professorId]);
                
                console.log('✅ Sample live sessions inserted successfully');
            } else {
                console.log('⚠️  No professor found, skipping sample data insertion');
            }
        } else {
            console.log('ℹ️  Sample data already exists, skipping insertion');
        }

        console.log('\n🎉 Live Session Database Installation Completed Successfully!');
        console.log('\n📋 Summary of installed components:');
        console.log('   ✅ live_sessions table with all required columns');
        console.log('   ✅ purchases table for session purchases');
        console.log('   ✅ live_private table for private sessions');
        console.log('   ✅ live_private_participants table');
        console.log('   ✅ All necessary indexes for performance');
        console.log('   ✅ Sample data (if no existing data)');
        
        console.log('\n🔧 Live session features now available:');
        console.log('   • Create and manage live sessions');
        console.log('   • Session approval workflow');
        console.log('   • Purchase tracking');
        console.log('   • Private session management');
        console.log('   • Status tracking (scheduled, live, ended, etc.)');

    } catch (error) {
        console.error('❌ Error during installation:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the installation
if (require.main === module) {
    installLiveDatabase()
        .then(() => {
            console.log('\n✨ Installation completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Installation failed:', error);
            process.exit(1);
        });
}

module.exports = { installLiveDatabase }; 