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
import privateClassSettingsRoutes from './routes/private-class-settings.js';
import liveSectionsRoutes from './routes/live-sections.js';
import AgoraToken from 'agora-access-token';
import NotificationService from './services/notificationService.js';
import hierarchyRoutes from './routes/hierarchy.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import pointCodesRoutes from './routes/pointCodes.js';
import homepageMaterialsRoutes from './routes/homepage-materials.js';
import footerContentRoutes from './routes/footer-content.js';
import notificationsRoutes from './routes/notifications.js';
import quizzesRoutes from './routes/quizzes.js';
import adminRoutes from './routes/admin.js';
import yearResetRoutes from './routes/year-reset.js';
import purchasesAdminRoutes from './routes/purchases-admin.js';
import mobileConfigRoutes from './routes/mobile-config.js';
import professorRoutes from './routes/professor.js';
import studentPathRoutes from './routes/student-path.js';
import pushRoutes from './routes/push.js';
import chatNotificationsRouter from './routes/chat-notifications.js';
import chatMessagesRouter from './routes/chat-messages.js';
import sessionReminderScheduler from './session-reminder-scheduler.js';
import { getUploadProgress, getActiveUploads } from './middleware/uploadProgressMiddleware.js';
import speedTestRouter from './routes/speed-test.js';
import uploadTestRouter from './routes/upload-test.js';
import videoProtectionRoutes from './routes/video-protection.js';
import { cleanUpSpooledUploads, sweepStaleSpooledUploads } from './middleware/r2MulterStorage.js';

const { RtcTokenBuilder, RtcRole } = AgoraToken;// Agora token builder

const roomUsers = {};
// Persistent mute state for each room
const roomMuteState = {}; // { [roomId]: true/false }
const roomChatState = {}; // { [roomId]: true/false } — chat open/closed, sent to late joiners
// The one message a teacher wants everyone to keep seeing. Memory is the right
// home: it belongs to the lesson happening now, not to the session's record,
// and a teacher who restarts mid-lesson pins it again in a second.
const roomPinned = {}; // { [roomId]: { sender, text } | null }

// The memory above is only a cache: it is emptied by every restart, which
// used to silently unlock chat and mics while the teacher's screen still
// showed them locked. The session row is the real record.
async function loadRoomLocks(roomId) {
  const sessionId = Number(roomId);
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return { chatEnabled: roomChatState[roomId] ?? true, studentsMuted: roomMuteState[roomId] ?? false };
  }
  try {
    const row = await pool.query(
      'SELECT chat_enabled, students_muted FROM live_sessions WHERE id = $1', [sessionId]);
    const found = row.rows[0];
    if (found) {
      roomChatState[roomId] = found.chat_enabled !== false;
      roomMuteState[roomId] = found.students_muted === true;
    }
  } catch (error) {
    console.error('[locks] could not read session locks:', error.message);
  }
  return { chatEnabled: roomChatState[roomId] ?? true, studentsMuted: roomMuteState[roomId] ?? false };
}

async function saveRoomLock(roomId, column, value) {
  const sessionId = Number(roomId);
  if (!Number.isInteger(sessionId) || sessionId <= 0) return;
  try {
    await pool.query(`UPDATE live_sessions SET ${column} = $1 WHERE id = $2`, [value, sessionId]);
  } catch (error) {
    console.error('[locks] could not save session lock:', error.message);
  }
}

// Sessions already announced as ended, so a double click doesn't notify twice.
const endedAnnounced = new Set();

async function announceStreamEnded(roomId) {
  const sessionId = Number(roomId);
  if (!Number.isInteger(sessionId) || sessionId <= 0) return;
  if (endedAnnounced.has(sessionId)) return;
  endedAnnounced.add(sessionId);
  setTimeout(() => endedAnnounced.delete(sessionId), 60 * 60 * 1000);

  const session = await pool.query(
    "UPDATE live_sessions SET status = 'ended' WHERE id = $1 RETURNING title",
    [sessionId]);
  const title = session.rows[0]?.title || 'الحصة المباشرة';

  // Only the students who actually attended.
  const attendees = await pool.query(
    'SELECT DISTINCT user_id FROM live_session_participants WHERE session_id = $1',
    [sessionId]);
  for (const { user_id } of attendees.rows) {
    try {
      await NotificationService.createNotification(
        user_id, 'live_session_ended', 'انتهى البث المباشر',
        `انتهت «${title}». شكراً لحضورك!`,
        JSON.stringify({ session_id: sessionId }), { route: null });
    } catch { /* one failure must not stop the rest */ }
  }
  console.log(`[stream-ended] session ${sessionId} ended, ${attendees.rows.length} attendee(s) notified`);
}

// app.use('/api', hierarchyRoutes);
dotenv.config();

const app = express();

// Every request arrives through nginx on this same machine, so without this
// Express reports req.ip as 127.0.0.1 for everyone. All 371 rows in
// user_sessions were recorded that way: no way to tell where a login came
// from, for support or for security. The 1 means trust exactly one proxy hop
// — nginx — and read the client address from the last entry it appends to
// X-Forwarded-For. A larger number, or `true`, would let a caller forge the
// header by sending their own X-Forwarded-For.
app.set('trust proxy', 1);
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
// Routes need to reach live rooms (a status change has to reach the students
// already inside), and this is the one place the server exists.
app.set('io', io);
const PORT = process.env.PORT || 5001;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({ 
  origin: ['http://5.135.200.148:8080', 'http://localhost:8080', 'http://5.135.200.148:5173'],
  credentials: true 
}));    // En dev : '*' ; en prod, remplace par ton domaine
// A JSON body has to be held in memory to be parsed, so the limit is the
// amount of RAM one request can claim. It was 100gb, which is not a limit at
// all — a single malformed or hostile request could have taken the machine
// down. Every JSON body here is metadata; files arrive as multipart and are
// spooled to disk. Override with JSON_BODY_LIMIT if a route ever needs more.
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '10mb';
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

// Uploads are spooled to disk on their way to R2, not held in memory. This
// deletes each spooled copy once the response has gone out, however the
// request ended.
app.use(cleanUpSpooledUploads);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Serve static files from images directory
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

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
app.use('/api/private-class-settings', privateClassSettingsRoutes);
app.use('/api', liveSectionsRoutes);
// A student's educational path, and the content that matches it (mobile).
app.use('/api', studentPathRoutes);
// Device registration and admin announcements (push).
app.use('/api', pushRoutes);
app.use('/api', liveSessionRoutes);
app.use('/api', hierarchyRoutes);
app.use('/api/structure', hierarchyRoutes); // <-- Add this line to alias structure endpoints
app.use('/api/points', pointCodesRoutes);
app.use('/api/homepage-materials', homepageMaterialsRoutes);
app.use('/api/footer-content', footerContentRoutes);
app.use('/api', notificationsRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/admin/year-reset', yearResetRoutes);
app.use('/api/admin/purchases', purchasesAdminRoutes);
app.use('/api', mobileConfigRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/chat-notifications', chatNotificationsRouter);
app.use('/api/chat-messages', chatMessagesRouter);
app.use('/api/video-protection', videoProtectionRoutes);

// Upload progress endpoints
app.get('/api/upload-progress/:uploadId', getUploadProgress);
app.get('/api/upload-progress', getActiveUploads);
app.use('/api/upload-test', uploadTestRouter);

// Speed test endpoint
app.use('/api/speed-test', speedTestRouter);

// Socket.IO chat functionality
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room (live session)
  socket.on('join-room', (roomId, userData) => {
    socket.join(roomId);
    socket.userData = userData;
    socket.roomId = roomId;

    // Send the stored state to the new user, so someone joining late — or
    // rejoining after leaving — sees exactly what the teacher set.
    loadRoomLocks(roomId).then(({ chatEnabled, studentsMuted }) => {
      socket.emit('students-muted-state', studentsMuted);
      socket.emit('chat-toggled', chatEnabled);
    });

    // A student arriving after the teacher pinned something still sees it.
    socket.emit('message-pinned', roomPinned[roomId] ?? null);

    // A student who arrives while the lesson is paused, or while the teacher
    // is dealing with a technical problem, has to be told on arrival — the
    // broadcast that announced it went out before they were here. Private
    // classes use a prefixed room id and have no such status.
    if (/^\d+$/.test(String(roomId))) {
      pool.query('SELECT status FROM live_sessions WHERE id = $1', [Number(roomId)])
        .then((r) => {
          if (r.rows[0]) socket.emit('session-status', { status: r.rows[0].status });
        })
        .catch((e) => console.error('[session-status] lookup failed:', e.message));
    }

    console.log(`User ${userData.name} (${userData.role}) joined room ${roomId}`);

    // Record attendance. This is the only point that knows a student actually
    // entered the room, so the admin attendee counter is built from it.
    // One row per user per session, so reconnecting never inflates the number.
    if (userData?.id && userData.role === 'student' && /^\d+$/.test(String(roomId))) {
      (async () => {
        try {
          await pool.query(
            `INSERT INTO live_session_participants (session_id, user_id, joined_at)
             SELECT $1, $2, NOW()
             WHERE NOT EXISTS (
               SELECT 1 FROM live_session_participants WHERE session_id = $1 AND user_id = $2
             )`, [roomId, userData.id]);
          await pool.query(
            `UPDATE live_sessions SET attendees_count = (
               SELECT COUNT(DISTINCT user_id) FROM live_session_participants WHERE session_id = $1
             ) WHERE id = $1`, [roomId]);
        } catch (e) {
          console.error('[attendance] could not record join:', e.message);
        }
      })();
    }

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
      avatar_url: userData.avatar_url,
      agoraUid: userData.agoraUid ?? null
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
            avatar_url: userSocket.userData.avatar_url,
              agoraUid: userSocket.userData.agoraUid ?? null
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
  socket.on('send-message', async (roomId, messageData) => {
    console.log('Message received in room', roomId, ':', messageData);

    try {
      // Save message to database
      const query = `
        INSERT INTO chat_messages (session_id, user_id, user_name, user_role, message_text)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        roomId, 
        socket.userData.id, 
        messageData.sender, 
        socket.userData.role || 'student', 
        messageData.text
      ];
      
      const result = await pool.query(query, values);
      const savedMessage = result.rows[0];

      // Broadcast message to all users in the room
      io.to(roomId).emit('new-message', {
        id: socket.id,
        sender: messageData.sender,
        text: messageData.text,
        timestamp: savedMessage.timestamp,
        messageId: savedMessage.id
      });
      
    } catch (error) {
      console.error('Error saving chat message to database:', error);
      // Still broadcast the message even if database save fails
      io.to(roomId).emit('new-message', {
        id: socket.id,
        sender: messageData.sender,
        text: messageData.text,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle professor controls
  socket.on('mute-all', (roomId) => {
    roomMuteState[roomId] = true;
    saveRoomLock(roomId, 'students_muted', true);
    console.log(`[DEBUG] Professor ${socket.userData?.name} (${socket.id}) muted all students in room ${roomId}`);
    socket.to(roomId).emit('students-muted');
    // Also emit to the sender for immediate feedback
    socket.emit('students-muted');
    io.to(roomId).emit('students-muted-state', true);
  });

  socket.on('unmute-all', (roomId) => {
    roomMuteState[roomId] = false;
    saveRoomLock(roomId, 'students_muted', false);
    console.log(`[DEBUG] Professor ${socket.userData?.name} (${socket.id}) unmuted all students in room ${roomId}`);
    socket.to(roomId).emit('students-unmuted');
    // Also emit to the sender for immediate feedback
    socket.emit('students-unmuted');
    io.to(roomId).emit('students-muted-state', false);
  });

  // Only the teacher pins. The client hides the control from students, and
  // this checks it again, because a hidden button is not a permission.
  socket.on('pin-message', (roomId, message) => {
    if (socket.userData?.role !== 'professor') return;
    roomPinned[roomId] = message && message.text ? message : null;
    io.to(roomId).emit('message-pinned', roomPinned[roomId]);
  });

  socket.on('unpin-message', (roomId) => {
    if (socket.userData?.role !== 'professor') return;
    roomPinned[roomId] = null;
    io.to(roomId).emit('message-pinned', null);
  });

  socket.on('toggle-chat', (roomId, enabled) => {
    roomChatState[roomId] = enabled !== false;
    saveRoomLock(roomId, 'chat_enabled', enabled !== false);
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
    
    // Emit stream-ended to all users in the room
    io.to(roomId).emit('stream-ended', { roomId }); // [LIVE STREAM MODIF]
    
    // Emit specific event to the professor who ended the stream
    socket.emit('stream-ended-professor', { roomId }); // [LIVE STREAM MODIF]

    // Mark the session ended and tell the students who attended. Ending is
    // announced once: pressing the button twice must not notify twice.
    announceStreamEnded(roomId).catch((e) =>
      console.error('[stream-ended] failed:', e.message));
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
              avatar_url: userSocket.userData.avatar_url,
              agoraUid: userSocket.userData.agoraUid ?? null
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

// Loopback only. nginx runs on this same machine and is the single way in;
// it terminates TLS, adds the security headers and is the only thing that
// should ever answer from outside. Binding 0.0.0.0 left the API one firewall
// rule away from being reachable directly on port 5001 — no TLS, no headers,
// nothing in front of it. Set HOST=0.0.0.0 in backend/.env only if something
// genuinely has to reach the API without going through nginx.
const HOST = process.env.HOST || '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`DB → ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  
  // Start the session reminder scheduler
  sessionReminderScheduler.start();

  // Clear anything a previous crash left behind in the upload spool.
  sweepStaleSpooledUploads();
});
