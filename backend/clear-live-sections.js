import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function clearLiveSections() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting cleanup of live_sections table...\n');
    
    await client.query('BEGIN');

    // 1. Count records before cleanup
    const beforeCount = await client.query('SELECT COUNT(*) as count FROM live_sections');
    console.log(`📊 Records in live_sections before: ${beforeCount.rows[0].count}`);

    // 2. Delete records in related tables
    console.log('\n🗑️  Deleting related records...');

    // live_section_files
    const filesResult = await client.query(`
      DELETE FROM live_section_files 
      WHERE live_section_id IN (SELECT id FROM live_sections)
    `);
    console.log(`   ✓ Deleted ${filesResult.rowCount} records from live_section_files`);

    // live_section_blocks
    const blocksResult = await client.query(`
      DELETE FROM live_section_blocks 
      WHERE live_section_id IN (SELECT id FROM live_sections)
    `);
    console.log(`   ✓ Deleted ${blocksResult.rowCount} records from live_section_blocks`);

    // live_section_sections
    const sectionsResult = await client.query(`
      DELETE FROM live_section_sections 
      WHERE live_section_id IN (SELECT id FROM live_sections)
    `);
    console.log(`   ✓ Deleted ${sectionsResult.rowCount} records from live_section_sections`);

    // live_section_purchases
    const purchasesResult = await client.query(`
      DELETE FROM live_section_purchases 
      WHERE live_section_id IN (SELECT id FROM live_sections)
    `);
    console.log(`   ✓ Deleted ${purchasesResult.rowCount} records from live_section_purchases`);

    // live_sessions
    const sessionsResult = await client.query(`
      DELETE FROM live_sessions 
      WHERE section_id IN (SELECT id FROM live_sections)
    `);
    console.log(`   ✓ Deleted ${sessionsResult.rowCount} records from live_sessions`);

    // 3. Empty the live_sections table
    console.log('\n🗑️  Emptying live_sections table...');
    await client.query('TRUNCATE TABLE live_sections CASCADE');
    console.log('   ✓ live_sections table emptied');

    // 4. Reset the ID sequence
    console.log('\n🔄 Resetting ID sequence...');
    await client.query('ALTER SEQUENCE live_sections_id_seq RESTART WITH 1');
    console.log('   ✓ Sequence reset to 1');

    await client.query('COMMIT');
    console.log('\n✅ Cleanup completed successfully!');

    // 5. Verify result
    const afterCount = await client.query('SELECT COUNT(*) as count FROM live_sections');
    console.log(`📊 Records in live_sections after: ${afterCount.rows[0].count}\n`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute
clearLiveSections()
  .then(() => {
    console.log('✅ Script executed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error executing script:', error);
    process.exit(1);
  });

