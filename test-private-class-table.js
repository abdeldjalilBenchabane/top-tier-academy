import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
});

async function testTable() {
  try {
    console.log('🔍 Testing private_class_requests table...');
    
    // Test 1: Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'private_class_requests'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Table private_class_requests does not exist!');
      return;
    }
    
    console.log('✅ Table private_class_requests exists!');
    
    // Test 2: Get current table structure
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'private_class_requests'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Current table structure:');
    console.table(tableStructure.rows);
    
    // Test 3: Check if new columns already exist
    const existingColumns = tableStructure.rows.map(row => row.column_name);
    const newColumns = ['points_used', 'payment_date', 'payment_status'];
    const missingColumns = newColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('\n✅ All new columns already exist!');
      return;
    }
    
    console.log('\n📝 Missing columns:', missingColumns);
    
    // Test 4: Add missing columns
    console.log('\n🔧 Adding missing columns...');
    
    if (missingColumns.includes('points_used')) {
      await pool.query(`
        ALTER TABLE private_class_requests 
        ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0;
      `);
      console.log('✅ Added points_used column');
    }
    
    if (missingColumns.includes('payment_date')) {
      await pool.query(`
        ALTER TABLE private_class_requests 
        ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
      `);
      console.log('✅ Added payment_date column');
    }
    
    if (missingColumns.includes('payment_status')) {
      await pool.query(`
        ALTER TABLE private_class_requests 
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
      `);
      console.log('✅ Added payment_status column');
    }
    
    // Test 5: Add indexes
    console.log('\n🔍 Adding performance indexes...');
    
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_private_class_requests_payment_status 
        ON private_class_requests(payment_status);
      `);
      console.log('✅ Added payment_status index');
    } catch (error) {
      console.log('ℹ️  payment_status index already exists or error:', error.message);
    }
    
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_private_class_requests_payment_date 
        ON private_class_requests(payment_date);
      `);
      console.log('✅ Added payment_date index');
    } catch (error) {
      console.log('ℹ️  payment_date index already exists or error:', error.message);
    }
    
    // Test 6: Verify final structure
    const finalStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'private_class_requests'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n🎉 Final table structure:');
    console.table(finalStructure.rows);
    
    console.log('\n✅ All operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testTable(); 