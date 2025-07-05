import express from 'express';
import { query, getRow } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth.js';
import AgoraToken from 'agora-access-token';

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || '***REMOVED***',
    { expiresIn: '7d' }
  );
};

// Helper to generate Agora RTM token
const generateAgoraRtmToken = (uid) => {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  if (!appID || !appCertificate) return null;
  const expireTime = 3600; // 1 hour
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTime + expireTime;
  // Sanitize UID for Agora
  const safeUid = String(uid).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (!safeUid) return null;
  return AgoraToken.RtmTokenBuilder.buildToken(
    appID,
    appCertificate,
    safeUid,
    AgoraToken.RtmRole.Rtm_User,
    privilegeExpiredTs
  );
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await getRow(
      'SELECT id, name, email, password_hash, role, avatar_url FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;
    // Ensure id is a string
    userWithoutPassword.id = String(userWithoutPassword.id);
    // Sanitize for Agora
    const agoraUid = String(userWithoutPassword.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    const agoraRtmToken = generateAgoraRtmToken(agoraUid);

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      agoraUid,
      agoraRtmToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  console.log('--- /register endpoint hit ---');
  try {
    console.log('Received registration request:', req.body);
    const { name, email, password, role = 'student', phoneNumber, nationalId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Validation failed: missing fields');
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 8) {
      console.log('Validation failed: password too short');
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingUser = await getRow('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      console.log('Validation failed: user already exists');
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Insert new user
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, avatar_url, created_at',
      [name, email, passwordHash, role]
    );
    console.log('User inserted into database:', result.rows[0]);

    const newUser = result.rows[0];
    // Ensure id is a string
    newUser.id = String(newUser.id);
    // Sanitize for Agora
    const agoraUid = String(newUser.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    const agoraRtmToken = generateAgoraRtmToken(agoraUid);

    // Generate JWT token
    const token = generateToken(newUser);
    console.log('JWT token generated');

    res.status(201).json({
      message: 'Registration successful',
      user: newUser,
      token,
      agoraUid,
      agoraRtmToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (protected route)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await getRow(
      'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure id is a string
    user.id = String(user.id);
    // Sanitize for Agora
    const agoraUid = String(user.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    const agoraRtmToken = generateAgoraRtmToken(agoraUid);

    res.json({ user, agoraUid, agoraRtmToken });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Verify token endpoint
router.post('/verify', verifyToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

export default router; 