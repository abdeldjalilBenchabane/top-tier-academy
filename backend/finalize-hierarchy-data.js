import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function finalizeHierarchyData() {
  const client = await pool.connect();
  try {
    console.log('🚀 Finalizing hierarchy data for Arabic records...');
    
    // For Arabic Language records, set them to the Arabic speciality
    const arabicRecords = await client.query(`
      UPDATE private_class_requests 
      SET speciality_id = 11, material_id = 11
      WHERE subject = 'اللغة العربية' AND speciality_id IS NULL
      RETURNING id
    `);
    
    console.log(`✅ Updated ${arabicRecords.rows.length} Arabic language records`);
    
    // Show final stats
    const finalStats = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN level_id IS NOT NULL THEN 1 END) as with_level,
        COUNT(CASE WHEN year_id IS NOT NULL THEN 1 END) as with_year,
        COUNT(CASE WHEN speciality_id IS NOT NULL THEN 1 END) as with_speciality,
        COUNT(CASE WHEN material_id IS NOT NULL THEN 1 END) as with_material
      FROM private_class_requests
    `);
    
    const stats = finalStats.rows[0];
    console.log('📊 Final Statistics:');
    console.log(`  - Total records: ${stats.total_records}`);
    console.log(`  - With level: ${stats.with_level}`);
    console.log(`  - With year: ${stats.with_year}`);
    console.log(`  - With speciality: ${stats.with_speciality}`);
    console.log(`  - With material: ${stats.with_material}`);
    
    // Show sample records with hierarchy path
    console.log('\n📋 Sample records with hierarchy:');
    const sampleRecords = await client.query(`
      SELECT id, subject, grade, level_id, year_id, speciality_id, material_id
      FROM private_class_requests
      ORDER BY id
    `);
    
    for (const record of sampleRecords.rows) {
      console.log(`  Record ${record.id}: ${record.subject} - ${record.grade}`);
      console.log(`    Level: ${record.level_id}, Year: ${record.year_id}, Speciality: ${record.speciality_id}, Material: ${record.material_id}`);
    }
    
  } catch (err) {
    console.error('❌ Error finalizing hierarchy data:', err);
  } finally {
    client.release();
    process.exit();
  }
}

finalizeHierarchyData(); 