import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createLiveSectionPurchasesTable() {
  try {
    console.log('Creating live_section_purchases table...');
    
    // Create the live_section_purchases table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS live_section_purchases (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        live_section_id INTEGER NOT NULL REFERENCES live_sections(id) ON DELETE CASCADE,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        points_spent INTEGER NOT NULL,
        UNIQUE(student_id, live_section_id)
      );
    `);

    // Create index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_section_purchases_student 
      ON live_section_purchases(student_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_live_section_purchases_section 
      ON live_section_purchases(live_section_id);
    `);

    console.log('✅ live_section_purchases table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating live_section_purchases table:', error);
  } finally {
    await pool.end();
  }
}

createLiveSectionPurchasesTable(); 