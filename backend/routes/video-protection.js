import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getRow, query } from '../db.js';
import { generatePresignedUrl, extractKeyFromUrl, isR2Url } from '../services/r2Service.js';
import crypto from 'crypto';

const router = express.Router();

// Store active video sessions (in production, use Redis)
const videoSessions = new Map();

/**
 * Generate a secure token for video access
 */
function generateVideoToken(userId, courseId, videoPath, expiresIn = 3600) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  const data = `${userId}-${courseId}-${videoPath}-${timestamp}-${random}`;
  const token = crypto.createHash('sha256').update(data).digest('hex');
  
  // Store session
  videoSessions.set(token, {
    userId,
    courseId,
    videoPath,
    createdAt: timestamp,
    expiresAt: timestamp + (expiresIn * 1000),
    views: 0,
    maxViews: 3 // Allow 3 views per token
  });
  
  // Clean up expired sessions
  setTimeout(() => {
    videoSessions.delete(token);
  }, expiresIn * 1000);
  
  return token;
}

/**
 * Verify video token and track view
 */
function verifyVideoToken(token, userId) {
  const session = videoSessions.get(token);
  
  if (!session) {
    return { valid: false, error: 'Invalid or expired token' };
  }
  
  if (Date.now() > session.expiresAt) {
    videoSessions.delete(token);
    return { valid: false, error: 'Token expired' };
  }
  
  if (session.userId !== userId) {
    return { valid: false, error: 'Token not authorized for this user' };
  }
  
  if (session.views >= session.maxViews) {
    return { valid: false, error: 'Maximum views reached' };
  }
  
  // Increment view count
  session.views++;
  
  return { valid: true, session };
}

/**
 * Get protected video URL with signed access
 * POST /api/video-protection/get-url
 */
router.post('/get-url', verifyToken, async (req, res) => {
  try {
    const { videoUrl, courseId } = req.body;
    const userId = req.user.id;
    
    if (!videoUrl || !courseId) {
      return res.status(400).json({ error: 'videoUrl and courseId are required' });
    }
    
    // Verify user has access to the course
    const purchaseCheck = await getRow(`
      SELECT 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM course_purchases 
            WHERE course_id = $1 AND user_id = $2
          ) THEN true
          WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE id = $2 AND role IN ('admin', 'professor')
          ) THEN true
          ELSE false
        END as has_access
    `, [courseId, userId]);
    
    if (!purchaseCheck?.has_access) {
      return res.status(403).json({ error: 'You do not have access to this course' });
    }
    
    // Extract R2 key from URL
    let r2Key;
    if (isR2Url(videoUrl)) {
      r2Key = extractKeyFromUrl(videoUrl);
    } else {
      // If it's not an R2 URL, we can't protect it
      return res.status(400).json({ error: 'Video URL is not from R2 storage' });
    }
    
    // Generate presigned URL (expires in 1 hour)
    const presignedUrl = await generatePresignedUrl(r2Key, 3600);
    
    // Generate token for tracking
    const token = generateVideoToken(userId, courseId, r2Key, 3600);
    
    // Log video access
    await query(`
      INSERT INTO video_views (user_id, course_id, video_path, viewed_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT DO NOTHING
    `, [userId, courseId, r2Key]);
    
    res.json({
      videoUrl: presignedUrl,
      token,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error generating protected video URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Track video view
 * POST /api/video-protection/track-view
 */
router.post('/track-view', verifyToken, async (req, res) => {
  try {
    const { token, videoUrl, courseId, currentTime, duration } = req.body;
    const userId = req.user.id;
    
    if (!token || !videoUrl || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Verify token
    const verification = verifyVideoToken(token, userId);
    if (!verification.valid) {
      return res.status(403).json({ error: verification.error });
    }
    
    // Track view progress
    const r2Key = extractKeyFromUrl(videoUrl);
    // First try to update existing view for today
    const updateResult = await query(`
      UPDATE video_views 
      SET watch_time = GREATEST(watch_time, $4),
          video_duration = $5,
          viewed_at = NOW()
      WHERE user_id = $1 
        AND course_id = $2 
        AND video_path = $3 
        AND DATE(viewed_at) = CURRENT_DATE
      RETURNING id
    `, [userId, courseId, r2Key, currentTime || 0, duration || 0]);
    
    // If no row was updated, insert a new one
    if (updateResult.rows.length === 0) {
      await query(`
        INSERT INTO video_views (user_id, course_id, video_path, viewed_at, watch_time, video_duration)
        VALUES ($1, $2, $3, NOW(), $4, $5)
      `, [userId, courseId, r2Key, currentTime || 0, duration || 0]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking video view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get video watermark data (user-specific)
 * GET /api/video-protection/watermark/:courseId
 */
router.get('/watermark/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    // Get user info for watermark
    const user = await getRow('SELECT id, email, name FROM users WHERE id = $1', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate watermark text (user email + timestamp)
    const watermark = {
      text: user.email || user.name || `User-${userId}`,
      userId: userId,
      courseId: courseId,
      timestamp: Date.now()
    };
    
    res.json(watermark);
  } catch (error) {
    console.error('Error generating watermark:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

