import pool from './db.js';

const addPaymentStatusToPrivateClasses = async () => {
  const client = await pool.connect();
  try {
    console.log('🚀 Adding payment status to private_class_requests table...');
    
    // Add payment status field to private_class_requests table
    await client.query(`
      ALTER TABLE private_class_requests 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
      ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0
    `);
    
    console.log('🎉 Payment status fields added successfully!');
  } catch (err) {
    console.error('❌ Error adding payment status fields:', err);
  } finally {
    client.release();
    process.exit();
  }
};

addPaymentStatusToPrivateClasses(); 