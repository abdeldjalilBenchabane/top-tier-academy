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

async function checkMaterials() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking materials in database...');
    
    const materials = await client.query('SELECT id, name FROM materials ORDER BY name');
    console.log('📋 Materials found:');
    materials.rows.forEach(material => {
      console.log(`  - ID: ${material.id}, Name: ${material.name}`);
    });
    
    console.log('\n🔍 Checking specialities...');
    const specialities = await client.query('SELECT id, name FROM specialities ORDER BY name');
    console.log('📋 Specialities found:');
    specialities.rows.forEach(speciality => {
      console.log(`  - ID: ${speciality.id}, Name: ${speciality.name}`);
    });
    
    console.log('\n🔍 Checking years...');
    const years = await client.query('SELECT id, name FROM years ORDER BY name');
    console.log('📋 Years found:');
    years.rows.forEach(year => {
      console.log(`  - ID: ${year.id}, Name: ${year.name}`);
    });
    
    console.log('\n🔍 Checking levels...');
    const levels = await client.query('SELECT id, name FROM levels ORDER BY name');
    console.log('📋 Levels found:');
    levels.rows.forEach(level => {
      console.log(`  - ID: ${level.id}, Name: ${level.name}`);
    });
    
  } catch (err) {
    console.error('❌ Error checking materials:', err);
  } finally {
    client.release();
    process.exit();
  }
}

checkMaterials(); 