import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './db.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import authRoutes from './routes/auth.js';
import liveSessionRoutes from './routes/live-sessions.js';
import slidesRoutes from './routes/slides.js';
import pointsRoutes from './routes/points.js';
import paymentsRoutes from './routes/payments.js';
import AgoraToken from 'agora-access-token';
import hierarchyRoutes from './routes/hierarchy.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const { RtcTokenBuilder, RtcRole } = AgoraToken;// Agora token builder

// app.use('/api', hierarchyRoutes);
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5001;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({ origin: '*' }));     // En dev : '*' ; en prod, remplace par ton domaine
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

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
app.use('/api/slides', slidesRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api', liveSessionRoutes);
app.use('/api', hierarchyRoutes);

// Socket.IO chat functionality
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room (live session)
  socket.on('join-room', (roomId, userData) => {
    socket.join(roomId);
    console.log(`User ${userData.name} joined room ${roomId}`);
    
    // Store user data in socket for later use
    socket.userData = userData;
    socket.roomId = roomId;
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      id: socket.id,
      name: userData.name,
      role: userData.role,
      avatar_url: userData.avatar_url
    });
  });

  // Handle chat messages
  socket.on('send-message', (roomId, messageData) => {
    console.log('Message received in room', roomId, ':', messageData);
    
    // Broadcast message to all users in the room
    io.to(roomId).emit('new-message', {
      id: socket.id,
      sender: messageData.sender,
      text: messageData.text,
      timestamp: new Date().toISOString()
    });
  });

  // Handle professor controls
  socket.on('mute-all', (roomId) => {
    socket.to(roomId).emit('students-muted');
  });

  socket.on('unmute-all', (roomId) => {
    socket.to(roomId).emit('students-unmuted');
  });

  socket.on('toggle-chat', (roomId, enabled) => {
    io.to(roomId).emit('chat-toggled', enabled);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Notify all rooms this user was in
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-left', {
        id: socket.id,
        name: socket.userData?.name || 'مستخدم'
      });
    }
  });
});

// Vérification de la DB au démarrage
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Database connection failed at startup:', err);
  } else {
    console.log('Database connected at:', result.rows[0].now);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`DB → ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});
