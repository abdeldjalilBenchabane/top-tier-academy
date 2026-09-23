import jwt from 'jsonwebtoken';
import { getRow } from '../db.js';

// No fallback on purpose. A signing key that quietly defaults to a
// placeholder anyone can guess is not a key. If it is missing, fail here,
// loudly, rather than accept forged tokens.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in backend/.env — refusing to start.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Session enforcement.
//
// A signed JWT cannot be taken back; a session row can. So every token issued
// at login carries `sid`, the session it belongs to, and this middleware
// refuses tokens whose session has been retired. Without it "one device per
// student" was a promise the server never kept: logging in elsewhere marked
// the old session inactive and nothing ever read that flag, so the first
// device kept working until the token expired months later.
//
// The lookup is cached so this does not become a database round trip on every
// request. A login that retires other sessions drops them from the cache
// immediately (see forgetUserSessions), so the old device is locked out at
// once rather than after the TTL.
// ---------------------------------------------------------------------------
const SESSION_CACHE_TTL_MS = 30_000;
const sessionCache = new Map(); // sid -> { userId, active, checkedAt }

export function forgetUserSessions(userId) {
  for (const [sid, entry] of sessionCache) {
    if (String(entry.userId) === String(userId)) sessionCache.delete(sid);
  }
}

async function sessionIsActive(sid, userId) {
  const hit = sessionCache.get(sid);
  if (hit && Date.now() - hit.checkedAt < SESSION_CACHE_TTL_MS) return hit.active;

  const row = await getRow(
    'SELECT is_active, expires_at FROM user_sessions WHERE session_token = $1',
    [sid]);

  // A token whose session row is gone stays valid: rows are pruned, and
  // logging every one of those users out would be a worse failure than the
  // one this check exists to prevent.
  const active = !row
    || (row.is_active === true && new Date(row.expires_at) > new Date());

  sessionCache.set(sid, { userId, active, checkedAt: Date.now() });
  return active;
}

// Middleware to verify JWT token
export const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid token.' });
  }

  // Tokens issued before sessions were enforced have no `sid`. They keep
  // working until they expire, because logging every existing user out to
  // turn this on would cost more than it buys.
  if (decoded.sid) {
    try {
      if (!await sessionIsActive(decoded.sid, decoded.id)) {
        return res.status(401).json({
          error: 'تم تسجيل الدخول من جهاز آخر',
          sessionInvalid: true,
        });
      }
    } catch (error) {
      // The database being unreachable must not lock everyone out.
      console.error('Session check failed, allowing request:', error.message);
    }
  }

  req.user = decoded;
  next();
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
    const decoded = jwt.verify(token, JWT_SECRET);
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