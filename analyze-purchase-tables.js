import pool from './backend/db.js';

async function analyzePurchaseTables() {
  console.log('🔍 Analyzing Purchase Tables Structure...\n');
  
  try {
    // 1. Check live_section_purchases table structure
    console.log('1. live_section_purchases table structure:');
    const liveSectionPurchasesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'live_section_purchases'
      ORDER BY ordinal_position
    `);
    console.log('✅ live_section_purchases columns:');
    liveSectionPurchasesStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // 2. Check point_transactions table structure
    console.log('\n2. point_transactions table structure:');
    const pointTransactionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'point_transactions'
      ORDER BY ordinal_position
    `);
    console.log('✅ point_transactions columns:');
    pointTransactionsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // 3. Check if 'purchases' table exists
    console.log('\n3. Checking if "purchases" table exists:');
    const purchasesTableExists = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'purchases'
    `);
    console.log('✅ Purchases table exists:', purchasesTableExists.rows.length > 0);
    
    if (purchasesTableExists.rows.length > 0) {
      const purchasesStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'purchases'
        ORDER BY ordinal_position
      `);
      console.log('✅ purchases columns:');
      purchasesStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }
    
    // 4. Check student_courses table structure
    console.log('\n4. student_courses table structure:');
    const studentCoursesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'student_courses'
      ORDER BY ordinal_position
    `);
    console.log('✅ student_courses columns:');
    studentCoursesStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // 5. Check live_sections vs live_sessions
    console.log('\n5. Checking live_sections vs live_sessions:');
    const liveSectionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'live_sections'
      ORDER BY ordinal_position
    `);
    console.log('✅ live_sections columns:');
    liveSectionsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    const liveSessionsTableExists = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'live_sessions'
    `);
    console.log('✅ Live_sessions table exists:', liveSessionsTableExists.rows.length > 0);
    
    if (liveSessionsTableExists.rows.length > 0) {
      const liveSessionsStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'live_sessions'
        ORDER BY ordinal_position
      `);
      console.log('✅ live_sessions columns:');
      liveSessionsStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }
    
    // 6. Sample data from live_section_purchases
    console.log('\n6. Sample data from live_section_purchases:');
    const liveSectionPurchasesData = await pool.query(`
      SELECT * FROM live_section_purchases LIMIT 5
    `);
    console.log('✅ live_section_purchases sample data:', liveSectionPurchasesData.rows);
    
    // 7. Sample data from point_transactions
    console.log('\n7. Sample data from point_transactions:');
    const pointTransactionsData = await pool.query(`
      SELECT * FROM point_transactions LIMIT 5
    `);
    console.log('✅ point_transactions sample data:', pointTransactionsData.rows);
    
    // 8. Sample data from student_courses
    console.log('\n8. Sample data from student_courses:');
    const studentCoursesData = await pool.query(`
      SELECT * FROM student_courses LIMIT 5
    `);
    console.log('✅ student_courses sample data:', studentCoursesData.rows);
    
    // 9. Check if there are any purchases for live_sessions
    if (liveSessionsTableExists.rows.length > 0) {
      console.log('\n9. Checking live_sessions purchases:');
      const liveSessionsPurchases = await pool.query(`
        SELECT * FROM live_sessions LIMIT 5
      `);
      console.log('✅ live_sessions sample data:', liveSessionsPurchases.rows);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing tables:', error.message);
  } finally {
    await pool.end();
  }
}

analyzePurchaseTables(); 