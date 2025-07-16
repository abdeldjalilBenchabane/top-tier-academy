import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the schema file
const schemaPath = path.join(__dirname, '..', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
        console.log('Executed:', statement.substring(0, 50) + '...');
      }
    }

    console.log('Database initialized successfully!');
    
    // Insert some sample data
    await insertSampleData();
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function insertSampleData() {
  try {
    console.log('Inserting sample data...');

    // Insert sample levels
    await pool.query(`
      INSERT INTO levels (name) VALUES 
      ('Bachelor'), 
      ('Master'), 
      ('PhD')
      ON CONFLICT DO NOTHING
    `);

    // Insert sample years
    await pool.query(`
      INSERT INTO years (name, level_id) VALUES 
      ('First Year', 1), 
      ('Second Year', 1), 
      ('Third Year', 1),
      ('First Year', 2),
      ('Second Year', 2)
      ON CONFLICT DO NOTHING
    `);

    // Insert sample specialities
    await pool.query(`
      INSERT INTO specialities (name, year_id) VALUES 
      ('Computer Science', 1), 
      ('Mathematics', 1), 
      ('Physics', 2),
      ('Data Science', 4),
      ('Software Engineering', 4)
      ON CONFLICT DO NOTHING
    `);

    // Insert sample materials
    await pool.query(`
      INSERT INTO materials (name, speciality_id, price) VALUES 
      ('Programming Fundamentals', 1, 29.99), 
      ('Calculus I', 2, 24.99), 
      ('Quantum Mechanics', 3, 34.99),
      ('Machine Learning', 4, 39.99),
      ('Web Development', 5, 44.99)
      ON CONFLICT DO NOTHING
    `);

    // Insert sample slides
    await pool.query(`
      INSERT INTO slides (title, description, is_enhanced, "order") VALUES 
      ('Welcome to Our Platform', 'Start your learning journey with us', false, 1),
      ('Featured Courses', 'Discover our most popular courses', true, 2),
      ('Expert Instructors', 'Learn from industry professionals', false, 3)
      ON CONFLICT DO NOTHING
    `);

    console.log('Sample data inserted successfully!');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}

// Run the initialization
initializeDatabase().catch(console.error); 