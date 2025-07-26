import pool from './db.js';

async function fixLanguageCoursePricesConstraint() {
  try {
    console.log('Checking language_course_prices table...');
    
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'language_course_prices'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Table language_course_prices does not exist. Creating it...');
      
      await pool.query(`
        CREATE TABLE language_course_prices (
          id SERIAL PRIMARY KEY,
          course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
          language_level_id INTEGER REFERENCES language_levels(id) ON DELETE CASCADE,
          price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(course_id, language_level_id)
        );
      `);
      
      console.log('Table language_course_prices created with unique constraint.');
    } else {
      console.log('Table language_course_prices exists. Checking for unique constraint...');
      
      // Check if unique constraint exists
      const constraintExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE table_name = 'language_course_prices' 
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%course_id%'
        );
      `);
      
      if (!constraintExists.rows[0].exists) {
        console.log('Adding unique constraint on (course_id, language_level_id)...');
        
        await pool.query(`
          ALTER TABLE language_course_prices 
          ADD CONSTRAINT language_course_prices_course_language_unique 
          UNIQUE (course_id, language_level_id);
        `);
        
        console.log('Unique constraint added successfully.');
      } else {
        console.log('Unique constraint already exists.');
      }
    }
    
    console.log('Fix completed successfully!');
  } catch (error) {
    console.error('Error fixing constraint:', error);
  } finally {
    await pool.end();
  }
}

fixLanguageCoursePricesConstraint(); 