import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function migratePoints() {
  const client = await pool.connect();
  
  try {
    console.log('Starting points system migration...');
    
    // Read the points system SQL from schema.sql
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract only the points system tables (from -- POINTS SYSTEM TABLES to the end)
    const pointsSystemStart = schemaContent.indexOf('-- POINTS SYSTEM TABLES');
    if (pointsSystemStart === -1) {
      throw new Error('Points system tables not found in schema.sql');
    }
    
    const pointsSystemSQL = schemaContent.substring(pointsSystemStart);
    
    // Split into individual statements, but handle function definitions specially
    const statements = [];
    const lines = pointsSystemSQL.split('\n');
    let currentStatement = '';
    let inFunction = false;
    let dollarQuoteCount = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }
      
      // Check if we're starting a function definition
      if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || trimmedLine.includes('CREATE FUNCTION')) {
        inFunction = true;
        dollarQuoteCount = 0;
      }
      
      // Count dollar quotes to track function body
      if (inFunction) {
        const dollarQuotes = trimmedLine.match(/\$\$/g);
        if (dollarQuotes) {
          dollarQuoteCount += dollarQuotes.length;
        }
      }
      
      currentStatement += line + '\n';
      
      // If we're in a function and we have an even number of dollar quotes, we've reached the end
      if (inFunction && dollarQuoteCount > 0 && dollarQuoteCount % 2 === 0) {
        inFunction = false;
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      }
      // If we're not in a function and we see a semicolon, it's the end of a statement
      else if (!inFunction && trimmedLine.endsWith(';')) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        try {
          await client.query(statement);
        } catch (error) {
          // If table/index already exists, skip it
          if (error.code === '42P07' || error.message.includes('already exists')) {
            console.log(`Skipping (already exists): ${statement.substring(0, 50)}...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('Points system migration completed successfully!');
    
    // Verify the tables were created
    const tables = ['user_points', 'point_packages', 'point_transactions'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✓ Table '${table}' created successfully`);
      } else {
        console.log(`✗ Table '${table}' was not created`);
      }
    }
    
    // Check if default packages were inserted
    const packagesResult = await client.query('SELECT COUNT(*) FROM point_packages;');
    console.log(`✓ ${packagesResult.rows[0].count} default point packages inserted`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migratePoints()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migratePoints }; 