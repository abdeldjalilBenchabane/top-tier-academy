import jwt from 'jsonwebtoken';
import { getRow } from '../db.js';

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '***REMOVED***');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Middleware to verify JWT token AND session
export const verifyTokenAndSession = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const sessionToken = req.header('X-Session-Token');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '***REMOVED***');
    req.user = decoded;
    
    // If session token is provided, validate it
    if (sessionToken) {
      const session = await getRow(
        'SELECT id, user_id, is_active, expires_at FROM user_sessions WHERE session_token = $1 AND user_id = $2',
        [sessionToken, decoded.id]
      );
      
      if (!session) {
        return res.status(401).json({ error: 'Invalid session.', sessionInvalid: true });
      }
      
      if (!session.is_active) {
        return res.status(401).json({ error: 'Session has been invalidated.', sessionInvalid: true });
      }
      
      if (new Date(session.expires_at) < new Date()) {
        return res.status(401).json({ error: 'Session has expired.', sessionInvalid: true });
      }
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// Middleware to check if user is professor
export const requireProfessor = (req, res, next) => {
  if (req.user.role !== 'professor' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Professor or admin role required.' });
  }
  next();
};

// Middleware to check if user is student
export const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student' && req.user.role !== 'professor' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Valid role required.' });
  }
  next();
};

// Flexible middleware to check for any allowed roles
export const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
};

export default verifyToken; 