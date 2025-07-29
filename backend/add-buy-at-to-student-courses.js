import pool from './db.js';

async function addBuyAtColumn() {
  console.log('🔧 Adding buy_at column to student_courses table...\n');
  
  try {
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'student_courses' AND column_name = 'buy_at'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ buy_at column already exists!');
      return;
    }
    
    // Add buy_at column
    await pool.query(`
      ALTER TABLE student_courses 
      ADD COLUMN buy_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    console.log('✅ Successfully added buy_at column to student_courses table');
    
    // Update existing records to set buy_at to last_accessed (as approximation)
    const updateResult = await pool.query(`
      UPDATE student_courses 
      SET buy_at = last_accessed 
      WHERE buy_at IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} existing records with buy_at timestamp`);
    
    // Verify the column was added
    const verifyColumn = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'student_courses' AND column_name = 'buy_at'
    `);
    
    if (verifyColumn.rows.length > 0) {
      const column = verifyColumn.rows[0];
      console.log(`✅ Verified buy_at column: ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not null'}, default: ${column.column_default})`);
    }
    
  } catch (error) {
    console.error('❌ Error adding buy_at column:', error.message);
  } finally {
    await pool.end();
  }
}

addBuyAtColumn(); 