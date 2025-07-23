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
import privateClassRequestsRoutes from './routes/private-class-requests.js';
import AgoraToken from 'agora-access-token';
import hierarchyRoutes from './routes/hierarchy.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import pointCodesRoutes from './routes/pointCodes.js';
import privateClassSettingsRoutes from './routes/private-class-settings.js';

const { RtcTokenBuilder, RtcRole } = AgoraToken;// Agora token builder

const roomUsers = {};
// Persistent mute state for each room
const roomMuteState = {}; // { [roomId]: true/false }

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
app.use('/api/private-class-requests', privateClassRequestsRoutes);
app.use('/api', liveSessionRoutes);
app.use('/api', hierarchyRoutes);
app.use('/api/structure', hierarchyRoutes); // <-- Add this line to alias structure endpoints
app.use('/api/points', pointCodesRoutes);
app.use('/api/private-class-settings', privateClassSettingsRoutes);

// Socket.IO chat functionality
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room (live session)
  socket.on('join-room', (roomId, userData) => {
    socket.join(roomId);
    socket.userData = userData;
    socket.roomId = roomId;

    // Send current mute state to the new user
    const isMuted = roomMuteState[roomId] ?? false; // default to unmuted
    socket.emit('students-muted-state', isMuted);

    console.log(`User ${userData.name} (${userData.role}) joined room ${roomId}`);

    // Remove any existing socket for this user (in case of reconnection)
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    if (roomSockets) {
      for (const socketId of roomSockets) {
        const existingSocket = io.sockets.sockets.get(socketId);
        if (existingSocket && existingSocket.userData && existingSocket.userData.id === userData.id && existingSocket.id !== socket.id) {
          console.log(`[DEBUG] Removing duplicate user ${userData.name} (${existingSocket.id})`);
          existingSocket.leave(roomId);
          existingSocket.to(roomId).emit('user-left', {
            id: existingSocket.id,
            userId: existingSocket.userData.id,
            name: existingSocket.userData.name || 'مستخدم'
          });
        }
      }
    }

    // Notify others in the room about the new user
    socket.to(roomId).emit('user-joined', {
      id: socket.id,
      userId: userData.id,
      name: userData.name,
      role: userData.role,
      avatar_url: userData.avatar_url
    });

    // Get all users in this room and send the list to the new user
    const updatedRoomSockets = io.sockets.adapter.rooms.get(roomId);
    if (updatedRoomSockets) {
      const participants = Array.from(updatedRoomSockets).map(socketId => {
        const userSocket = io.sockets.sockets.get(socketId);
        if (userSocket && userSocket.userData) {
          return {
            id: userSocket.id,
            userId: userSocket.userData.id,
            name: userSocket.userData.name,
            role: userSocket.userData.role,
            avatar_url: userSocket.userData.avatar_url
          };
        }
        return null;
      }).filter(Boolean);

      console.log(`[DEBUG] Sending participants list to ${userData.name}:`, participants);
      socket.emit('participants-list', participants);

      // Also send updated list to all other users in the room
      socket.to(roomId).emit('participants-list', participants);
    }
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
    roomMuteState[roomId] = true;
    console.log(`[DEBUG] Professor ${socket.userData?.name} (${socket.id}) muted all students in room ${roomId}`);
    socket.to(roomId).emit('students-muted');
    // Also emit to the sender for immediate feedback
    socket.emit('students-muted');
    io.to(roomId).emit('students-muted-state', true);
  });

  socket.on('unmute-all', (roomId) => {
    roomMuteState[roomId] = false;
    console.log(`[DEBUG] Professor ${socket.userData?.name} (${socket.id}) unmuted all students in room ${roomId}`);
    socket.to(roomId).emit('students-unmuted');
    // Also emit to the sender for immediate feedback
    socket.emit('students-unmuted');
    io.to(roomId).emit('students-muted-state', false);
  });

  socket.on('toggle-chat', (roomId, enabled) => {
    io.to(roomId).emit('chat-toggled', enabled);
  });

  // Handle individual student mic control
  socket.on('toggle-student-mic', (roomId, data) => {
    console.log('Student mic toggle in room', roomId, ':', data);

    // Find the target student's socket by userId
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    if (roomSockets) {
      for (const socketId of roomSockets) {
        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket && targetSocket.userData && targetSocket.userData.id === data.studentId) {
          console.log(`[DEBUG] Found target student socket: ${socketId} for userId: ${data.studentId}`);
          // Send the signal to the specific student
          targetSocket.emit('student-mic-toggled', {
            studentId: data.studentId,
            studentName: data.studentName,
            muted: data.muted,
            timestamp: new Date().toISOString()
          });
          break;
        }
      }
    }

    // Also broadcast to all users in the room for UI updates
    io.to(roomId).emit('student-mic-toggled', {
      studentId: data.studentId,
      studentName: data.studentName,
      muted: data.muted,
      timestamp: new Date().toISOString()
    });
  });

  // [LIVE STREAM MODIF] --- Gestion de la fin de stream (professeur) ---
  socket.on('end-stream', (roomId) => {
    console.log('[DEBUG] end-stream event received', { roomId }); // [LIVE STREAM MODIF]
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    console.log('[DEBUG] Sockets in room before stream-ended:', roomSockets ? Array.from(roomSockets) : []); // [LIVE STREAM MODIF]
    io.to(roomId).emit('stream-ended', { roomId }); // [LIVE STREAM MODIF]
    // (Optionnel) : la mise à jour du statut du live se fait via l'API REST
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Notify all rooms this user was in
    if (socket.roomId && socket.userData) {
      console.log(`User ${socket.userData.name} left room ${socket.roomId}`);
      socket.to(socket.roomId).emit('user-left', {
        id: socket.id,
        userId: socket.userData.id,
        name: socket.userData.name || 'مستخدم'
      });

      // Also send updated participants list to remaining users
      const roomSockets = io.sockets.adapter.rooms.get(socket.roomId);
      if (roomSockets) {
        const participants = Array.from(roomSockets).map(socketId => {
          const userSocket = io.sockets.sockets.get(socketId);
          if (userSocket && userSocket.userData) {
            return {
              id: userSocket.id,
              userId: userSocket.userData.id,
              name: userSocket.userData.name,
              role: userSocket.userData.role,
              avatar_url: userSocket.userData.avatar_url
            };
          }
          return null;
        }).filter(Boolean);

        console.log(`Sending updated participants list after disconnect:`, participants);
        io.to(socket.roomId).emit('participants-list', participants);
      }
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
