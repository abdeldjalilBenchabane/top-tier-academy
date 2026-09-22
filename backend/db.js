import pkg from 'pg';
const { Pool, types } = pkg;

// TIMESTAMP WITHOUT TIME ZONE (oid 1114) -> plain string, not a JS Date.
//
// These columns hold wall-clock time: the hour a professor picked, with no
// zone attached. Converting them to a Date made the API serialise them with a
// trailing "Z", claiming UTC, and every client then shifted them by its own
// offset — the mobile app showed a 2 PM session at 3 PM, and the web did too
// until each call site was taught to ignore the Z.
//
// Returning the raw text means the wire format makes no claim the database
// cannot back up, and a client that simply reads the digits is correct.
// Backend code that wraps these in `new Date(...)` is unaffected: it parses
// the string in the server's timezone and gets the same instant as before.
types.setTypeParser(1114, (value) => value);
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

// Query logging. Off by default: logging every statement is what produced a
// 2.1 GB log file. DB_SLOW_QUERY_MS still surfaces genuinely slow queries.
const DB_DEBUG = process.env.DB_DEBUG === 'true';
const SLOW_QUERY_MS = Number(process.env.DB_SLOW_QUERY_MS) || 1000;

// Create a new pool instance
const pool = new Pool(dbConfig);

// Test the connection
let announcedConnection = false;
pool.on('connect', (client) => {
  // One line on first connect, not one per pooled client: with max:20 and a
  // 30s idle timeout this handler fires constantly.
  if (!announcedConnection) {
    console.log('Connected to PostgreSQL database');
    announcedConnection = true;
  }
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
    // This used to log every query unconditionally and grew pm2's out.log to
    // 2.1 GB. Keep the signal — queries slow enough to matter — and drop the
    // noise. Set DB_DEBUG=true in backend/.env to get the old behaviour back
    // while debugging.
    if (DB_DEBUG) {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    } else if (duration >= SLOW_QUERY_MS) {
      console.warn(`Slow query (${duration}ms, ${res.rowCount} rows):`,
                   String(text).replace(/\s+/g, ' ').slice(0, 300));
    }
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