import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import authRoutes from './routes/auth.js';
import liveSessionRoutes from './routes/live-sessions.js';
import AgoraToken from 'agora-access-token';
import hierarchyRoutes from './routes/hierarchy.routes.js';

const { RtcTokenBuilder, RtcRole } = AgoraToken;// Agora token builder

app.use('/api', hierarchyRoutes);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;



// Middlewares
app.use(cors({ origin: '*' }));     // En dev : '*' ; en prod, remplace par ton domaine
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// DB health check
app.get('/api/db-health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'ok',
      message: 'Database is connected!',
      timestamp: result.rows[0].current_time
    });
  } catch (error) {
    console.error('DB health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});


// Routes métier
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', liveSessionRoutes);

// Vérification de la DB au démarrage
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Database connection failed at startup:', err);
  } else {
    console.log('Database connected at:', result.rows[0].now);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`DB → ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});
