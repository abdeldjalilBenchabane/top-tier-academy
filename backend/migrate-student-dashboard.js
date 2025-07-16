// Script de migration pour les tables du dashboard étudiant
import pool from './db.js';

async function migrate() {
  // Table de progression des étudiants dans les cours
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_courses (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES users(id),
      course_id INTEGER REFERENCES courses(id),
      completed BOOLEAN DEFAULT FALSE,
      progress INTEGER DEFAULT 0,
      hours_spent INTEGER DEFAULT 0,
      last_accessed TIMESTAMP DEFAULT NOW()
    );
  `);

  // Table des activités récentes
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES users(id),
      type VARCHAR(50),
      title VARCHAR(255),
      time TIMESTAMP DEFAULT NOW(),
      related_id INTEGER,
      extra JSON
    );
  `);

  // Table des sessions live (avec course_id pour compatibilité)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS live_sessions (
      id SERIAL PRIMARY KEY,
      professor_id INTEGER REFERENCES users(id),
      course_id INTEGER REFERENCES courses(id),
      title VARCHAR(255) NOT NULL,
      start_time TIMESTAMP NOT NULL,
      duration INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      is_approved BOOLEAN DEFAULT FALSE,
      is_rejected BOOLEAN DEFAULT FALSE,
      status VARCHAR(50) DEFAULT 'pending',
      meeting_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Table des achats de sessions live
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES live_sessions(id),
      student_id INTEGER REFERENCES users(id),
      amount_paid DECIMAL(10,2) NOT NULL,
      purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(session_id, student_id)
    );
  `);

  console.log('Migration terminée : tables student_courses, activities, live_sessions, purchases créées.');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); }); 