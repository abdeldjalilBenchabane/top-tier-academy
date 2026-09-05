import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tth_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '***REMOVED***',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  statement_timeout: 30000, // Query timeout after 30 seconds
  query_timeout: 30000, // Query timeout after 30 seconds
    options: '-c timezone=UTC' // Add timezone configuration
};

// Create a new pool instance
const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', (client) => {
  console.log('Connected to PostgreSQL database');
  // Set timezone for this connection
  client.query('SET timezone = \'UTC\';');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    // If it's a connection error, try to reconnect
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.message.includes('Connection terminated')) {
      console.log('Attempting to reconnect to database...');
      // The pool will automatically try to reconnect on the next query
    }
    throw error;
  }
};

// Helper function to get a single row
export const getRow = async (text, params) => {
  const res = await query(text, params);
  return res.rows[0];
};

// Helper function to get multiple rows
export const getRows = async (text, params) => {
  const res = await query(text, params);
  return res.rows;
};

// Helper function to execute a transaction
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool; 