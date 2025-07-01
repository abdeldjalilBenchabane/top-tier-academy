import express from 'express';
import { query, getRow } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth.js';

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

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
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

    // Generate JWT token
    const token = generateToken(newUser);
    console.log('JWT token generated');

    res.status(201).json({
      message: 'Registration successful',
      user: newUser,
      token
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

    res.json({ user });
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