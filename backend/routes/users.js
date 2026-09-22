import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getRows, getRow, query } from '../db.js';
import { createR2Multer } from '../middleware/r2MulterStorage.js';
import { deleteFromR2, extractKeyFromUrl, uploadToR2, generateR2Key } from '../services/r2Service.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { debugLog } from '../utils/logger.js';

const router = express.Router();

// Configure multer for avatar uploads with R2 storage
const avatarUpload = createR2Multer('avatars', null, {
  fileFilter: (req, file, cb) => {
    debugLog('Avatar upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Allow only image files for avatars. The mobile app uploads without a
    // content type (application/octet-stream), so the file extension alone is
    // enough — the route below checks the type again before saving.
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedImageTypes.test(file.mimetype);

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed for avatars!'));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.error('Multer error:', error);
  
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  } else if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};

// Get all users (admin only)
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await getRows(`
      SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.created_at,
             u.level_id, l.name AS level_name
      FROM users u
      LEFT JOIN levels l ON u.level_id = l.id
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all teachers (professors)
router.get('/teachers', verifyToken, async (req, res) => {
  try {
    const teachers = await getRows(`
      SELECT u.id, u.name, u.email, u.avatar_url, u.created_at,
             u.level_id, l.name AS level_name
      FROM users u
      LEFT JOIN levels l ON u.level_id = l.id
      WHERE u.role = 'professor'
      ORDER BY u.name ASC
    `);

    res.json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (admin only)
router.get('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const user = await getRow(
      'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (admin only)
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, level_id } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await getRow('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Only persist level_id when role is professor
    let levelIdToStore = null;
    if (role === 'professor' && level_id) {
      const lvl = await getRow('SELECT id FROM levels WHERE id = $1', [level_id]);
      if (!lvl) {
        return res.status(400).json({ error: 'Invalid level_id' });
      }
      levelIdToStore = level_id;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, level_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, avatar_url, created_at, level_id`,
      [name, email, passwordHash, role, levelIdToStore]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, avatar_url, level_id } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const existingUser = await getRow('SELECT id, role FROM users WHERE id = $1', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare update fields
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      updateValues.push(email);
    }
    if (role !== undefined) {
      updateFields.push(`role = $${paramCount++}`);
      updateValues.push(role);
    }
    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramCount++}`);
      updateValues.push(avatar_url);
    }

    // level_id: only meaningful for professors. Clear it if role is being changed away from professor.
    const finalRole = role !== undefined ? role : existingUser.role;
    if (finalRole === 'professor') {
      if (level_id !== undefined) {
        if (level_id === null || level_id === '') {
          updateFields.push(`level_id = $${paramCount++}`);
          updateValues.push(null);
        } else {
          const lvl = await getRow('SELECT id FROM levels WHERE id = $1', [level_id]);
          if (!lvl) return res.status(400).json({ error: 'Invalid level_id' });
          updateFields.push(`level_id = $${paramCount++}`);
          updateValues.push(level_id);
        }
      }
    } else if (role !== undefined && role !== 'professor') {
      // role changed to non-professor → clear level_id
      updateFields.push(`level_id = $${paramCount++}`);
      updateValues.push(null);
    }

    // Handle password update if provided
    if (password) {
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updateFields.push(`password_hash = $${paramCount++}`);
      updateValues.push(passwordHash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(userId);

    // Update user
    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, role, avatar_url, created_at, level_id`,
      updateValues
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload avatar (admin only)
router.post('/:id/avatar', verifyToken, requireRole(['admin']), avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const existingUser = await getRow('SELECT id, avatar_url FROM users WHERE id = $1', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No avatar file uploaded' });
    }

    // Handle R2 upload manually after file is buffered
    if (req.file && req.file.buffer) {
      try {
        debugLog('📤 Processing R2 upload for avatar...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key, deleteFromR2, extractKeyFromUrl } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('avatars', null, req.file.originalname, 'avatar');
        debugLog('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        debugLog('✅ Avatar uploaded to R2:', publicUrl);
        
        // Update file object with R2 URL
        req.file.path = publicUrl;
        req.file.filename = r2Key;
      } catch (error) {
        console.error('❌ Error uploading avatar to R2:', error);
        return res.status(500).json({ 
          error: 'Failed to upload avatar to R2',
          details: error.message 
        });
      }
    }

    // Delete old avatar from R2 if it exists
    if (existingUser.avatar_url) {
      try {
        debugLog('🗑️ Deleting old avatar from R2:', existingUser.avatar_url);
        const { deleteFromR2, extractKeyFromUrl } = await import('../services/r2Service.js');
        const oldKey = extractKeyFromUrl(existingUser.avatar_url);
        if (oldKey && oldKey !== existingUser.avatar_url) {
          await deleteFromR2(oldKey);
          debugLog('✅ Old avatar deleted from R2:', oldKey);
        }
      } catch (fileError) {
        console.error('⚠️ Error deleting old avatar from R2:', fileError);
        // Continue with new avatar upload even if old avatar deletion fails
      }
    }

    // Save new avatar URL (R2)
    // The upload middleware keeps the file in memory (multer.memoryStorage),
    // so it has a buffer and no path — send it to R2 here, the way course
    // files are handled. Reading req.file.path saved an empty avatar_url.
    const r2Key = generateR2Key('avatars', null, req.file.originalname, 'avatar');
    const avatarUrl = await uploadToR2(
      req.file.buffer, r2Key, req.file.mimetype || 'image/jpeg');
    if (!avatarUrl) {
      return res.status(500).json({ error: 'تعذر حفظ الصورة. حاول مرة أخرى.' });
    }
    await query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, email, role, avatar_url, created_at',
      [avatarUrl, userId]
    );

    res.json({
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload avatar for students (own profile only)
router.post('/student/avatar', verifyToken, requireRole(['student']), avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    debugLog('Avatar upload request received');
    debugLog('User:', req.user);
    debugLog('File:', req.file);

    const studentId = req.user.id;

    // Check if user exists
    const existingUser = await getRow('SELECT id, avatar_url, role FROM users WHERE id = $1', [studentId]);
    debugLog('Existing user:', existingUser);

    if (!existingUser) {
      debugLog('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    if (!req.file) {
      debugLog('No file uploaded');
      return res.status(400).json({ error: 'No avatar file uploaded' });
    }

    // Handle R2 upload manually after file is buffered
    if (req.file && req.file.buffer) {
      try {
        debugLog('📤 Processing R2 upload for student avatar...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key, deleteFromR2, extractKeyFromUrl } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('avatars', null, req.file.originalname, 'avatar');
        debugLog('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        debugLog('✅ Student avatar uploaded to R2:', publicUrl);
        
        // Update file object with R2 URL
        req.file.path = publicUrl;
        req.file.filename = r2Key;
      } catch (error) {
        console.error('❌ Error uploading student avatar to R2:', error);
        return res.status(500).json({ 
          error: 'Failed to upload avatar to R2',
          details: error.message 
        });
      }
    }

    // Delete old avatar from R2 if it exists
    if (existingUser.avatar_url) {
      try {
        debugLog('🗑️ Deleting old student avatar from R2:', existingUser.avatar_url);
        const { deleteFromR2, extractKeyFromUrl } = await import('../services/r2Service.js');
        const oldKey = extractKeyFromUrl(existingUser.avatar_url);
        if (oldKey && oldKey !== existingUser.avatar_url) {
          await deleteFromR2(oldKey);
          debugLog('✅ Old student avatar deleted from R2:', oldKey);
        }
      } catch (fileError) {
        console.error('⚠️ Error deleting old student avatar from R2:', fileError);
        // Continue with new avatar upload even if old avatar deletion fails
      }
    }

    // Save new avatar URL (R2)
    // The upload middleware keeps the file in memory (multer.memoryStorage),
    // so it has a buffer and no path — send it to R2 here, the way course
    // files are handled. Reading req.file.path saved an empty avatar_url.
    const r2Key = generateR2Key('avatars', null, req.file.originalname, 'avatar');
    const avatarUrl = await uploadToR2(
      req.file.buffer, r2Key, req.file.mimetype || 'image/jpeg');
    if (!avatarUrl) {
      return res.status(500).json({ error: 'تعذر حفظ الصورة. حاول مرة أخرى.' });
    }
    await query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, email, role, avatar_url, created_at',
      [avatarUrl, studentId]
    );

    debugLog('Avatar uploaded successfully:', avatarUrl);
    res.json({
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload avatar for current user (any role)
router.post('/me/avatar', verifyToken, avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    debugLog('Avatar upload (me) request received');
    debugLog('User:', req.user);
    debugLog('File:', req.file);
    const userId = req.user.id;
    
    // Check if user exists
    const existingUser = await getRow('SELECT id, avatar_url FROM users WHERE id = $1', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar file uploaded' });
    }

    // Handle R2 upload manually after file is buffered
    if (req.file && req.file.buffer) {
      try {
        debugLog('📤 Processing R2 upload for user avatar...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key, deleteFromR2, extractKeyFromUrl } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('avatars', null, req.file.originalname, 'avatar');
        debugLog('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        debugLog('✅ User avatar uploaded to R2:', publicUrl);
        
        // Update file object with R2 URL
        req.file.path = publicUrl;
        req.file.filename = r2Key;
      } catch (error) {
        console.error('❌ Error uploading user avatar to R2:', error);
        return res.status(500).json({ 
          error: 'Failed to upload avatar to R2',
          details: error.message 
        });
      }
    }

    // Delete old avatar from R2 if it exists
    if (existingUser.avatar_url) {
      try {
        debugLog('🗑️ Deleting old user avatar from R2:', existingUser.avatar_url);
        const { deleteFromR2, extractKeyFromUrl } = await import('../services/r2Service.js');
        const oldKey = extractKeyFromUrl(existingUser.avatar_url);
        if (oldKey && oldKey !== existingUser.avatar_url) {
          await deleteFromR2(oldKey);
          debugLog('✅ Old user avatar deleted from R2:', oldKey);
        }
      } catch (fileError) {
        console.error('⚠️ Error deleting old user avatar from R2:', fileError);
        // Continue with new avatar upload even if old avatar deletion fails
      }
    }

    // Save new avatar URL (R2)
    // The upload middleware keeps the file in memory (multer.memoryStorage),
    // so it has a buffer and no path — send it to R2 here, the way course
    // files are handled. Reading req.file.path saved an empty avatar_url.
    const r2Key = generateR2Key('avatars', null, req.file.originalname, 'avatar');
    const avatarUrl = await uploadToR2(
      req.file.buffer, r2Key, req.file.mimetype || 'image/jpeg');
    if (!avatarUrl) {
      return res.status(500).json({ error: 'تعذر حفظ الصورة. حاول مرة أخرى.' });
    }
    await query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, email, role, avatar_url, created_at',
      [avatarUrl, userId]
    );
    debugLog('Avatar uploaded successfully (me):', avatarUrl);
    res.json({
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar (me):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Universal avatar upload endpoint (works for all roles)
router.post('/avatar-profile', verifyToken, (req, res, next) => {
  // Without this wrapper a rejected upload falls through to Express's
  // default handler, which answers with an HTML error page — the mobile app
  // then fails parsing it ("Unexpected character … <!DOCTYPE html").
  avatarUpload.single('avatar')(req, res, (error) =>
    error ? handleMulterError(error, req, res, next) : next());
}, async (req, res) => {
  try {
    debugLog('Universal avatar upload request received');
    debugLog('User:', req.user);
    debugLog('File:', req.file);

    const userId = req.user.id;

    // Check if user exists
    const existingUser = await getRow('SELECT id, avatar_url, role FROM users WHERE id = $1', [userId]);
    debugLog('Existing user:', existingUser);

    if (!existingUser) {
      debugLog('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    if (!req.file) {
      debugLog('No file uploaded');
      return res.status(400).json({ error: 'No avatar file uploaded' });
    }

    // Validate file type: by content type, or by extension when the client
    // didn't send one (the mobile app sends application/octet-stream).
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const extension = path.extname(req.file.originalname || '').toLowerCase();
    if (!allowedTypes.includes(req.file.mimetype) && !allowedExtensions.includes(extension)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' });
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }

    // Delete old avatar if it exists
    if (existingUser.avatar_url) {
      const oldAvatarPath = path.join(__dirname, '..', '..', 'public', existingUser.avatar_url);
      try {
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
          debugLog(`Old avatar deleted: ${oldAvatarPath}`);
        }
      } catch (fileError) {
        console.error('Error deleting old avatar:', fileError);
      }
    }

    // Save new avatar URL (R2)
    // The upload middleware keeps the file in memory (multer.memoryStorage),
    // so it has a buffer and no path — send it to R2 here, the way course
    // files are handled. Reading req.file.path saved an empty avatar_url.
    const r2Key = generateR2Key('avatars', null, req.file.originalname, 'avatar');
    const avatarUrl = await uploadToR2(
      req.file.buffer, r2Key, req.file.mimetype || 'image/jpeg');
    if (!avatarUrl) {
      return res.status(500).json({ error: 'تعذر حفظ الصورة. حاول مرة أخرى.' });
    }
    await query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, email, role, avatar_url, created_at',
      [avatarUrl, userId]
    );

    debugLog('Avatar uploaded successfully (universal):', avatarUrl);
    res.json({
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl,
      user: {
        id: userId,
        role: existingUser.role
      }
    });
  } catch (error) {
    console.error('Error uploading avatar (universal):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const existingUser = await getRow('SELECT id, avatar_url FROM users WHERE id = $1', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the current user
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete avatar file if it exists
    if (existingUser.avatar_url) {
      const avatarPath = path.join(__dirname, '..', '..', 'public', existingUser.avatar_url);
      try {
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
          debugLog(`Avatar deleted: ${avatarPath}`);
        }
      } catch (fileError) {
        console.error('Error deleting avatar:', fileError);
      }
    }

    // Delete user
    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Student Dashboard Endpoints ===
// Get student overview (stats)
router.get('/student/overview', verifyToken, requireRole(['student']), async (req, res) => {
  try {
    const studentId = req.user.id;
    // Total courses
    const totalCourses = await getRow('SELECT COUNT(*) FROM student_courses WHERE student_id = $1', [studentId]);
    // Completed courses
    const completedCourses = await getRow('SELECT COUNT(*) FROM student_courses WHERE student_id = $1 AND completed = TRUE', [studentId]);
    // In progress courses
    const inProgressCourses = await getRow('SELECT COUNT(*) FROM student_courses WHERE student_id = $1 AND completed = FALSE', [studentId]);
    // Total hours
    const totalHours = await getRow('SELECT COALESCE(SUM(hours_spent),0) FROM student_courses WHERE student_id = $1', [studentId]);
    // Upcoming live sessions (only purchased by this student)
    const upcomingLives = await getRow(`SELECT COUNT(*) FROM live_sessions ls
      JOIN purchases p ON ls.id = p.session_id
      WHERE ls.start_time > NOW() AND ls.is_approved = TRUE AND p.student_id = $1`, [studentId]);
    res.json({
      totalCourses: Number(totalCourses.count),
      completedCourses: Number(completedCourses.count),
      inProgressCourses: Number(inProgressCourses.count),
      totalHours: Number(totalHours.coalesce || totalHours.sum || 0),
      upcomingLives: Number(upcomingLives.count)
    });
  } catch (error) {
    console.error('Student overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student activities
router.get('/student/activities', verifyToken, requireRole(['student']), async (req, res) => {
  try {
    const studentId = req.user.id;
    const activities = await getRows('SELECT * FROM activities WHERE student_id = $1 ORDER BY time DESC LIMIT 20', [studentId]);
    res.json(activities);
  } catch (error) {
    console.error('Student activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student profile
router.get('/student/profile', verifyToken, requireRole(['student']), async (req, res) => {
  try {
    const studentId = req.user.id;
    debugLog('Student profile request for user:', studentId);
    const user = await getRow('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1', [studentId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    debugLog('User profile:', user);
    res.json(user);
  } catch (error) {
    console.error('Student profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to check user role
router.get('/test-role', verifyToken, async (req, res) => {
  try {
    debugLog('Test role request - User:', req.user);
    res.json({
      user: req.user,
      message: 'Role check successful'
    });
  } catch (error) {
    console.error('Test role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to check if /me/profile route is accessible
router.get('/test-me-profile', verifyToken, async (req, res) => {
  try {
    debugLog('Test me/profile route - User:', req.user);
    res.json({
      message: '/me/profile route is accessible',
      user: req.user
    });
  } catch (error) {
    console.error('Test me/profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile (works for all roles)
router.get('/me', verifyToken, async (req, res) => {
  try {
    debugLog('Get current user request - User:', req.user);
    const userId = req.user.id;
    const user = await getRow('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1', [userId]);
    if (!user) {
      debugLog('User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    debugLog('Current user profile:', user);
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student live sessions (purchased and public)
router.get('/student/live-sessions', verifyToken, requireRole(['student']), async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get sessions that the student has purchased
    const purchasedSessions = await getRows(`
      SELECT 
        ls.*,
        u.name as professor_name,
        'purchased' as access_type
      FROM live_sessions ls
      JOIN purchases p ON ls.id = p.session_id
      JOIN users u ON ls.professor_id = u.id
      WHERE p.student_id = $1 AND ls.is_approved = TRUE
      ORDER BY ls.start_time ASC
    `, [studentId]);

    // Get public sessions (not purchased but available)
    const publicSessions = await getRows(`
      SELECT 
        ls.*,
        u.name as professor_name,
        'public' as access_type
      FROM live_sessions ls
      JOIN users u ON ls.professor_id = u.id
      WHERE ls.is_approved = TRUE 
        AND ls.start_time > NOW()
        AND ls.id NOT IN (
          SELECT session_id FROM purchases WHERE student_id = $1
        )
      ORDER BY ls.start_time ASC
      LIMIT 10
    `, [studentId]);

    // Combine and format sessions
    const allSessions = [...purchasedSessions, ...publicSessions].map(session => ({
      id: session.id,
      title: session.title,
      professor: session.professor_name,
      course: session.title, // Using title as course name for now
      date: new Date(session.start_time).toISOString().split('T')[0],
      time: new Date(session.start_time).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      duration: `${session.duration} دقيقة`,
      attendees: 0, // Not tracked yet
      maxAttendees: 50, // Default
      status: new Date(session.start_time) > new Date() ? 'upcoming' : 'completed',
      description: session.title,
      meetingLink: session.meeting_url || null,
      accessType: session.access_type,
      price: session.price,
      cover_image_url: session.cover_image_url, // Include cover image URL
      start_time: session.start_time, // Include start time for proper formatting
      professor_name: session.professor_name // Include professor name
    }));

    res.json(allSessions);
  } catch (error) {
    console.error('Student live sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user profile (name and password)
router.put('/me/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, currentPassword, newPassword, confirmPassword } = req.body;

    // Check if user exists
    const existingUser = await getRow('SELECT id, name, email, password_hash FROM users WHERE id = $1', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare update fields
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;

    // Handle name update
    if (name !== undefined && name.trim() !== '') {
      if (name.length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long' });
      }
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(name.trim());
    }

    // Handle password update
    if (newPassword) {
      // Validate current password
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }

      const isValidCurrentPassword = await bcrypt.compare(currentPassword, existingUser.password_hash);
      if (!isValidCurrentPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirmation do not match' });
      }

      // Hash new password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      updateFields.push(`password_hash = $${paramCount++}`);
      updateValues.push(passwordHash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(userId);

    // Update user
    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, avatar_url, created_at`,
      updateValues
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;