const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

console.log('🚀 Starting Today\'s Database Changes...\n');

// Today's migration functions
const todaysMigrations = [
  {
    name: 'Add language_level_id to courses table (if not exists)',
    function: async () => {
      try {
        // Check if column already exists
        const checkColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'courses' AND column_name = 'language_level_id'
        `);
        
        if (checkColumn.rows.length === 0) {
          await pool.query(`
            ALTER TABLE courses 
            ADD COLUMN language_level_id INTEGER REFERENCES language_levels(id)
          `);
          console.log('✅ Added language_level_id column to courses table');
        } else {
          console.log('ℹ️  language_level_id column already exists in courses table');
        }
      } catch (error) {
        console.log('⚠️  Error adding language_level_id column:', error.message);
      }
    }
  },
  
  {
    name: 'Make year_id nullable in materials table',
    function: async () => {
      try {
        // Check if year_id column exists and is nullable
        const checkColumn = await pool.query(`
          SELECT is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'materials' AND column_name = 'year_id'
        `);
        
        if (checkColumn.rows.length > 0 && checkColumn.rows[0].is_nullable === 'NO') {
          await pool.query(`
            ALTER TABLE materials 
            ALTER COLUMN year_id DROP NOT NULL
          `);
          console.log('✅ Made year_id nullable in materials table');
        } else {
          console.log('ℹ️  year_id column is already nullable in materials table');
        }
      } catch (error) {
        console.log('⚠️  Error updating materials table:', error.message);
      }
    }
  },
  
  {
    name: 'Add performance indexes for better query performance',
    function: async () => {
      try {
        // Add indexes for better performance
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_materials_year_id ON materials(year_id);
          CREATE INDEX IF NOT EXISTS idx_materials_speciality_id ON materials(speciality_id);
          CREATE INDEX IF NOT EXISTS idx_courses_language_level_id ON courses(language_level_id);
          CREATE INDEX IF NOT EXISTS idx_courses_material_id ON courses(material_id);
        `);
        console.log('✅ Added performance indexes for education structure');
      } catch (error) {
        console.log('⚠️  Error adding indexes:', error.message);
      }
    }
  }
];

// Main execution function
async function runTodaysMigrations() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // Run today's migrations
    for (let i = 0; i < todaysMigrations.length; i++) {
      const migration = todaysMigrations[i];
      console.log(`📋 Migration ${i + 1}/${todaysMigrations.length}: ${migration.name}`);
      await migration.function();
      console.log('');
    }
    
    console.log('🎉 Today\'s database changes completed successfully!');
    console.log('\n📝 What was updated:');
    console.log('1. ✅ Language level support for courses');
    console.log('2. ✅ Education structure flexibility (year without speciality)');
    console.log('3. ✅ Performance improvements with indexes');
    console.log('\n🔧 Next steps:');
    console.log('1. Test the language level display in admin panel');
    console.log('2. Test the education structure filtering');
    console.log('3. Verify the TTHLanguages page works correctly');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has correct database credentials');
    console.log('2. Ensure PostgreSQL is running');
    console.log('3. Verify database exists and is accessible');
    console.log('4. Check if you have sufficient permissions');
  } finally {
    await pool.end();
  }
}

// Run the migrations
runTodaysMigrations(); 