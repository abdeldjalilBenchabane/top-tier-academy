import pool from './backend/db.js';

async function checkLiveSectionPurchasesColumns() {
  console.log('🔍 Checking live_section_purchases table columns...\n');
  
  try {
    // Check table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'live_section_purchases'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ live_section_purchases table columns:');
    tableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check sample data
    const sampleData = await pool.query(`
      SELECT * FROM live_section_purchases LIMIT 3
    `);
    
    console.log('\n✅ Sample data:');
    sampleData.rows.forEach((row, index) => {
      console.log(`  Row ${index + 1}:`, row);
    });
    
  } catch (error) {
    console.error('❌ Error checking columns:', error.message);
  } finally {
    await pool.end();
  }
}

checkLiveSectionPurchasesColumns(); 