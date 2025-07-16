import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tth_database',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  port: process.env.DB_PORT || 5432,
});

async function createPointsTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating points system tables...');
    
    // SQL statements for points system
    const sqlStatements = [
      // User points balance
      `CREATE TABLE IF NOT EXISTS user_points (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        balance INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )`,
      
      // Point packages/products
      `CREATE TABLE IF NOT EXISTS point_packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        points INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'DZD',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Point transactions
      `CREATE TABLE IF NOT EXISTS point_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        package_id INTEGER REFERENCES point_packages(id) ON DELETE SET NULL,
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'spend', 'refund', 'bonus')),
        points INTEGER NOT NULL,
        amount DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'DZD',
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
        payment_reference VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Insert default packages
      `INSERT INTO point_packages (name, points, price, currency) VALUES
        ('الباقة الأولى', 1000, 1000.00, 'DZD'),
        ('الباقة الثانية', 2000, 2000.00, 'DZD'),
        ('الباقة الثالثة', 3000, 3000.00, 'DZD')
      ON CONFLICT DO NOTHING`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_point_transactions_status ON point_transactions(status)`,
      `CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_point_packages_active ON point_packages(is_active)`,
      
      // Function to update user points balance
      `CREATE OR REPLACE FUNCTION update_user_points_balance()
      RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO user_points (user_id, balance, updated_at)
          VALUES (NEW.user_id, 
                  COALESCE((SELECT balance FROM user_points WHERE user_id = NEW.user_id), 0) + 
                  CASE WHEN NEW.transaction_type = 'purchase' OR NEW.transaction_type = 'bonus' THEN NEW.points
                       WHEN NEW.transaction_type = 'spend' THEN -NEW.points
                       ELSE 0
                  END,
                  CURRENT_TIMESTAMP)
          ON CONFLICT (user_id) 
          DO UPDATE SET 
              balance = user_points.balance + 
                        CASE WHEN NEW.transaction_type = 'purchase' OR NEW.transaction_type = 'bonus' THEN NEW.points
                             WHEN NEW.transaction_type = 'spend' THEN -NEW.points
                             ELSE 0
                        END,
              updated_at = CURRENT_TIMESTAMP;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql`,
      
      // Trigger to automatically update user points balance
      `DROP TRIGGER IF EXISTS trigger_update_user_points_balance ON point_transactions`,
      `CREATE TRIGGER trigger_update_user_points_balance
          AFTER INSERT ON point_transactions
          FOR EACH ROW
          EXECUTE FUNCTION update_user_points_balance()`
    ];
    
    // Execute each statement
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`⏳ Executing statement ${i + 1}/${sqlStatements.length}...`);
      try {
        await client.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.log(`⚠️  Statement ${i + 1} had an issue: ${error.message}`);
        // Continue with next statement
      }
    }
    
    console.log('🎉 Points tables created successfully!');
    
    // Verify tables
    const tables = ['user_points', 'point_packages', 'point_transactions'];
    console.log('\n📊 Verification:');
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   📈 ${table} has ${countResult.rows[0].count} rows`);
      } else {
        console.log(`❌ Table '${table}' was not created`);
      }
    }
    
    // Show packages
    const packagesResult = await client.query('SELECT * FROM point_packages ORDER BY points ASC;');
    console.log('\n💰 Available packages:');
    packagesResult.rows.forEach(pkg => {
      console.log(`   💎 ${pkg.name}: ${pkg.points} points for ${pkg.price} ${pkg.currency}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating points tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createPointsTables()
    .then(() => {
      console.log('\n🎊 Points system ready!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed:', error);
      process.exit(1);
    });
}

export { createPointsTables }; 