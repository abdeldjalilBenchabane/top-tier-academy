import pool from './backend/db.js';

async function debugCoursePurchase() {
  console.log('🔍 Debugging Course Purchase Points Deduction...\n');
  
  try {
    // 1. Check a specific user's points balance
    const userId = 4; // Student user
    console.log(`1. Checking user ${userId} points balance...`);
    
    const balanceResult = await pool.query('SELECT balance FROM user_points WHERE user_id = $1', [userId]);
    const currentBalance = balanceResult.rows[0]?.balance || 0;
    console.log(`   Current balance: ${currentBalance} points`);
    console.log('');
    
    // 2. Check user's recent course purchases
    console.log('2. Recent course purchases:');
    const purchasesResult = await pool.query(`
      SELECT 
        sc.course_id,
        sc.buy_at,
        c.title as course_title,
        c.price as course_price,
        c.material_id,
        c.language_level_id
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE sc.student_id = $1
      ORDER BY sc.buy_at DESC
      LIMIT 5
    `, [userId]);
    
    console.log(`   Found ${purchasesResult.rows.length} recent purchases:`);
    purchasesResult.rows.forEach((purchase, index) => {
      console.log(`   ${index + 1}. Course: ${purchase.course_title} (ID: ${purchase.course_id})`);
      console.log(`      Price: ${purchase.course_price} DZD`);
      console.log(`      Material ID: ${purchase.material_id}`);
      console.log(`      Language Level ID: ${purchase.language_level_id}`);
      console.log(`      Buy Date: ${purchase.buy_at}`);
      console.log('');
    });
    
    // 3. Check user's point transaction history
    console.log('3. Recent point transactions:');
    const transactionsResult = await pool.query(`
      SELECT 
        transaction_type,
        points,
        amount,
        status,
        created_at,
        metadata
      FROM point_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);
    
    console.log(`   Found ${transactionsResult.rows.length} recent transactions:`);
    transactionsResult.rows.forEach((transaction, index) => {
      console.log(`   ${index + 1}. Type: ${transaction.transaction_type}`);
      console.log(`      Points: ${transaction.points}`);
      console.log(`      Amount: ${transaction.amount} DZD`);
      console.log(`      Status: ${transaction.status}`);
      console.log(`      Date: ${transaction.created_at}`);
      if (transaction.metadata) {
        console.log(`      Metadata: ${JSON.stringify(transaction.metadata)}`);
      }
      console.log('');
    });
    
    // 4. Check if there are any courses available for purchase
    console.log('4. Available courses for purchase:');
    const availableCoursesResult = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.price,
        c.material_id,
        c.language_level_id,
        CASE 
          WHEN c.material_id IS NOT NULL THEN m.price
          WHEN c.language_level_id IS NOT NULL THEN lcp.price
          ELSE c.price
        END as resolved_price
      FROM courses c
      LEFT JOIN materials m ON c.material_id = m.id
      LEFT JOIN language_course_prices lcp ON c.id = lcp.course_id
      WHERE c.status = 'approved'
      AND c.id NOT IN (
        SELECT course_id FROM student_courses WHERE student_id = $1
      )
      LIMIT 5
    `, [userId]);
    
    console.log(`   Found ${availableCoursesResult.rows.length} available courses:`);
    availableCoursesResult.rows.forEach((course, index) => {
      console.log(`   ${index + 1}. Course: ${course.title} (ID: ${course.id})`);
      console.log(`      Course Price: ${course.price} DZD`);
      console.log(`      Resolved Price: ${course.resolved_price} DZD`);
      console.log(`      Material ID: ${course.material_id}`);
      console.log(`      Language Level ID: ${course.language_level_id}`);
      console.log('');
    });
    
    // 5. Test the exact purchase logic for one course
    if (availableCoursesResult.rows.length > 0) {
      const testCourse = availableCoursesResult.rows[0];
      console.log(`5. Testing purchase logic for course ${testCourse.id}:`);
      
      // Get price resolution
      let price = parseInt(testCourse.price);
      if (!price || price <= 0) {
        if (testCourse.material_id) {
          const matRes = await pool.query('SELECT price FROM materials WHERE id = $1', [testCourse.material_id]);
          price = matRes.rows[0] ? parseInt(matRes.rows[0].price) : 0;
          console.log(`   Material price: ${price} DZD`);
        } else if (testCourse.language_level_id) {
          const langRes = await pool.query('SELECT price FROM language_course_prices WHERE course_id = $1 AND language_level_id = $2', [testCourse.id, testCourse.language_level_id]);
          price = langRes.rows[0] ? parseInt(langRes.rows[0].price) : 0;
          console.log(`   Language course price: ${price} DZD`);
        }
      }
      
      console.log(`   Final resolved price: ${price} DZD`);
      console.log(`   User has enough points: ${currentBalance >= price ? '✅ Yes' : '❌ No'}`);
      console.log(`   Points needed: ${price}, Available: ${currentBalance}`);
      console.log('');
    }
    
    // 6. Check if there are any database triggers that might affect points
    console.log('6. Checking for points-related database triggers:');
    const triggersResult = await pool.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table IN ('user_points', 'point_transactions')
      OR trigger_name LIKE '%point%'
    `);
    
    console.log(`   Found ${triggersResult.rows.length} relevant triggers:`);
    triggersResult.rows.forEach((trigger, index) => {
      console.log(`   ${index + 1}. Trigger: ${trigger.trigger_name}`);
      console.log(`      Table: ${trigger.event_object_table}`);
      console.log(`      Event: ${trigger.event_manipulation}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error debugging course purchase:', error.message);
  } finally {
    await pool.end();
  }
}

debugCoursePurchase(); 