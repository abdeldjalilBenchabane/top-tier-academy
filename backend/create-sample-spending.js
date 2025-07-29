import pool from './db.js';

async function createSampleSpending() {
  try {
    console.log('🔄 Creating sample spending transactions...\n');

    // Get existing students
    const students = await pool.query('SELECT id FROM users WHERE role = \'student\' LIMIT 10');
    if (students.rows.length === 0) {
      console.log('❌ No students found');
      return;
    }

    // Get existing professors
    const professors = await pool.query('SELECT id FROM users WHERE role = \'professor\' LIMIT 5');
    if (professors.rows.length === 0) {
      console.log('❌ No professors found');
      return;
    }

    const studentIds = students.rows.map(s => s.id);
    const professorIds = professors.rows.map(p => p.id);

    // Create sample spending transactions for the last 3 months
    const months = 3;
    let createdCount = 0;

    for (let month = 0; month < months; month++) {
      const date = new Date();
      date.setMonth(date.getMonth() - month);
      
      // Create 15-30 spending transactions per month
      const transactionsThisMonth = Math.floor(Math.random() * 16) + 15;
      
      for (let i = 0; i < transactionsThisMonth; i++) {
        const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
        const professorId = professorIds[Math.floor(Math.random() * professorIds.length)];
        
        // Random spending amount (courses: 1000-3000, live sessions: 200-800)
        const isCourse = Math.random() > 0.5;
        const amount = isCourse 
          ? Math.floor(Math.random() * 2000) + 1000  // 1000-3000 for courses
          : Math.floor(Math.random() * 600) + 200;   // 200-800 for live sessions
        
        const points = Math.floor(amount / 10); // 1 point = 10 DZD
        
        // Random transaction date within the month
        const transactionDate = new Date(date);
        transactionDate.setDate(Math.floor(Math.random() * 28) + 1);
        transactionDate.setHours(Math.floor(Math.random() * 24));
        transactionDate.setMinutes(Math.floor(Math.random() * 60));

        await pool.query(`
          INSERT INTO point_transactions 
          (user_id, transaction_type, points, amount, currency, status, created_at, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          studentId,
          'spend',
          points,
          amount,
          'DZD',
          'completed',
          transactionDate,
          JSON.stringify({
            source: 'sample_spending',
            type: isCourse ? 'course_purchase' : 'live_session_purchase',
            professor_id: professorId,
            month: month + 1
          })
        ]);
        
        createdCount++;
      }
    }

    console.log(`✅ Created ${createdCount} sample spending transactions!`);
    
    // Verify the data
    const totalSpending = await pool.query("SELECT COUNT(*) FROM point_transactions WHERE transaction_type = 'spend'");
    const totalAmount = await pool.query("SELECT SUM(amount) FROM point_transactions WHERE transaction_type = 'spend' AND status = 'completed'");
    
    console.log(`📊 Total spending transactions: ${totalSpending.rows[0].count}`);
    console.log(`💰 Total spending amount: ${totalAmount.rows[0].sum || 0} DZD`);

  } catch (error) {
    console.error('❌ Error creating sample spending:', error);
  } finally {
    await pool.end();
  }
}

createSampleSpending(); 