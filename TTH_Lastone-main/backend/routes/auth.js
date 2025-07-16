import express from 'express';
import { query, getRow } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth.js';
import AgoraToken from 'agora-access-token';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendSchoolHousePasswordResetEmail } from '../services/emailService.js';

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

// Request password reset (forgot password)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, platform = 'tth' } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await getRow('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing tokens for this user
    await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    // Save new token
    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    // Send email based on platform
    try {
      if (platform === 'schoolhouse') {
        await sendSchoolHousePasswordResetEmail(user.email, resetToken, user.name);
      } else {
        await sendPasswordResetEmail(user.email, resetToken, user.name);
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Delete the token if email fails
      await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
      return res.status(500).json({ error: 'Failed to send password reset email. Please try again later.' });
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify reset token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find valid token
    const tokenRecord = await getRow(
      'SELECT prt.*, u.name, u.email FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id WHERE prt.token = $1 AND prt.expires_at > CURRENT_TIMESTAMP AND prt.used_at IS NULL',
      [token]
    );

    if (!tokenRecord) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ 
      message: 'Token is valid',
      user: {
        name: tokenRecord.name,
        email: tokenRecord.email
      }
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find valid token
    const tokenRecord = await getRow(
      'SELECT prt.*, u.name, u.email FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id WHERE prt.token = $1 AND prt.expires_at > CURRENT_TIMESTAMP AND prt.used_at IS NULL',
      [token]
    );

    if (!tokenRecord) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, tokenRecord.user_id]
    );

    // Mark token as used
    await query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [tokenRecord.id]
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 