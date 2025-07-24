import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkLiveSessions() {
  try {
    console.log('🔍 Checking live sessions in database...\n');

    const result = await pool.query(`
      SELECT ls.*, u.name as professor_name 
      FROM live_sessions ls 
      LEFT JOIN users u ON ls.professor_id = u.id 
      WHERE ls.is_approved = TRUE 
      ORDER BY ls.start_time DESC
    `);

    console.log(`✅ Found ${result.rows.length} approved live sessions:\n`);

    result.rows.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title}`);
      console.log(`   Professor: ${session.professor_name || 'Unknown'}`);
      console.log(`   Time: ${new Date(session.start_time).toLocaleString('en-US')}`);
      console.log(`   Price: ${session.price} DZD`);
      console.log(`   Approved: ${session.is_approved}`);
      console.log(`   Description: ${session.description || 'No description'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkLiveSessions(); 