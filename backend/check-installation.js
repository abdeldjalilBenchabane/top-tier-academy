import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Checking database installation...');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
});

async function checkInstallation() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Connected to database successfully!');
    console.log('');

    // Check all tables
    console.log('📋 Checking all tables...');
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('quizzes', 'quiz_questions', 'quiz_answers', 'quiz_attempts', 'quiz_attempt_answers', 'notifications', 'live_sessions', 'live_sections')
      ORDER BY table_name
    `);
    
    console.log('✅ Found tables:');
    allTables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check live_sessions columns
    console.log('\n📋 Live Sessions table columns:');
    const liveSessionsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions'
      ORDER BY ordinal_position
    `);
    
    liveSessionsColumns.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'not null';
      console.log(`   - ${row.column_name}: ${row.data_type} (${nullable})`);
    });

    // Check indexes
    console.log('\n📋 Checking indexes...');
    const indexes = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes 
      WHERE tablename IN ('quizzes', 'quiz_questions', 'quiz_answers', 'quiz_attempts', 'quiz_attempt_answers', 'notifications', 'live_sessions')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    console.log('✅ Found indexes:');
    indexes.rows.forEach(row => {
      console.log(`   - ${row.indexname} on ${row.tablename}`);
    });

    // Check triggers
    console.log('\n📋 Checking triggers...');
    const triggers = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE event_object_table IN ('quizzes', 'live_sessions')
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log('✅ Found triggers:');
    triggers.rows.forEach(row => {
      console.log(`   - ${row.trigger_name} on ${row.event_object_table}`);
    });

    console.log('\n🎉 Installation Summary:');
    console.log(`✅ Tables created: ${allTables.rows.length}`);
    console.log(`✅ Indexes created: ${indexes.rows.length}`);
    console.log(`✅ Triggers created: ${triggers.rows.length}`);
    
    if (allTables.rows.length >= 6) {
      console.log('\n🎊 SUCCESS! Your database has been successfully updated with:');
      console.log('   • Quiz system (5 tables)');
      console.log('   • Notifications system (1 table)');
      console.log('   • Enhanced live sessions');
      console.log('   • Performance indexes');
      console.log('   • Automatic timestamp triggers');
    } else {
      console.log('\n⚠️  Some tables may not have been created. Check the migration logs.');
    }

  } catch (error) {
    console.error('❌ Error checking installation:', error);
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkInstallation(); 