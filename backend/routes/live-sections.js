import express from 'express';
import { notifyCommentReply } from '../services/commentReplyNotify.js';
import { notifyLiveSectionContentAdded } from '../services/contentUpdateNotify.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getRows, getRow, query } from '../db.js';
import pool from '../db.js';
import { createR2Multer } from '../middleware/r2MulterStorage.js';
import { deleteFromR2, extractKeyFromUrl } from '../services/r2Service.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { debugLog } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for live section file uploads with R2 storage
const liveSectionUpload = createR2Multer('live-sections', null, {
  fileFilter: (req, file, cb) => {
    debugLog('Live section file upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
        // The cover must be an image. Everything else about this check is about
    // not rejecting images the professor was allowed to pick: the file input
    // says accept="image/*", so the server has to honour the same promise.

    // The browser's mimetype is the reliable signal — it covers heic, avif and
    // anything else a phone produces without needing a list.
    const looksLikeImage = typeof file.mimetype === 'string'
      && file.mimetype.toLowerCase().startsWith('image/');

    // Some sources (downloads, cloud pickers) send application/octet-stream
    // for a perfectly ordinary .png. Fall back to the extension rather than
    // refusing the file. Requiring BOTH to match is what rejected those.
    const imageExtensions = /\.(jpe?g|png|gif|webp|bmp|tiff?|heic|heif|avif|jfif|svg)$/i;
    const hasImageExtension = imageExtensions.test(file.originalname || '');

    if (looksLikeImage || hasImageExtension) {
      return cb(null, true);
    }

    return cb(new Error(
      `الملف «${file.originalname || 'غير معروف'}» ليس صورة. اختر صورة للغلاف (JPG أو PNG أو WEBP أو HEIC).`
    ));
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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'live-sections');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all live sections for a professor
router.get('/professors/:professorId/live-sections', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const { professorId } = req.params;
    
    // Verify the professor is accessing their own sections
    if (req.user.id != professorId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const selectQuery = `
      SELECT 
        ls.*,
        l.name as level_name,
        y.name as year_name,
        s.name as speciality_name,
        m.name as material_name,
        lang.name as language_name,
        ll.name as language_level_name,
        u.name as professor_name,
        (SELECT COUNT(*) FROM live_sessions WHERE section_id = ls.id) as live_sessions_count
      FROM live_sections ls
      LEFT JOIN levels l ON ls.level_id = l.id
      LEFT JOIN years y ON ls.year_id = y.id
      LEFT JOIN specialities s ON ls.speciality_id = s.id
      LEFT JOIN materials m ON ls.material_id = m.id
      LEFT JOIN languages lang ON ls.language_id = lang.id
      LEFT JOIN language_levels ll ON ls.language_level_id = ll.id
      LEFT JOIN users u ON ls.professor_id = u.id
      WHERE ls.professor_id = $1
      ORDER BY ls.created_at DESC
    `;

    const result = await getRows(selectQuery, [professorId]);
    res.json(result);
  } catch (error) {
    console.error('Error fetching live sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new live section
router.post('/professors/:professorId/live-sections', 
  verifyToken, 
  requireRole('professor'), 
  liveSectionUpload.single('cover_image'),
  // Without this, a rejected file reaches Express's default handler and the
  // professor gets an HTML stack trace listing the server's absolute paths.
  handleMulterError,
  async (req, res, next) => {
  try {
    const { title, description, price, level_id, year_id, speciality_id, material_id, language_id, language_level_id } = req.body;
    const professor_id = req.user.id;
    const professor_name = req.user.name;

    // Validate required fields
    if (!title || !description || !price) {
      return res.status(400).json({ error: 'Title, description, and price are required' });
    }

    // Get telegram_channel from request body (optional)
    const telegram_channel = req.body.telegram_channel || null;

    // Handle R2 upload manually after file is buffered
    if (req.file && req.file.buffer) {
      try {
        debugLog('📤 Processing R2 upload for live section cover...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('live-sections', null, req.file.originalname, 'cover');
        debugLog('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        debugLog('✅ Live section cover uploaded to R2:', publicUrl);
        
        // Update file object with R2 URL
        req.file.path = publicUrl;
        req.file.filename = r2Key;
      } catch (error) {
        console.error('❌ Error uploading live section cover to R2:', error);
        return res.status(500).json({ 
          error: 'Failed to upload cover to R2',
          details: error.message 
        });
      }
    }

    const insertQuery = `
      INSERT INTO live_sections (
        professor_id, title, description, price, 
        level_id, year_id, speciality_id, material_id, 
        language_id, language_level_id, telegram_channel
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      professor_id, title, description, price,
      level_id || null, year_id || null, speciality_id || null, material_id || null,
      language_id || null, language_level_id || null, telegram_channel
    ]);

    // Handle cover upload if present
    if (req.file) {
      // Use R2 URL instead of local path
      const cover_image_url = req.file.path; // R2 public URL
      await query(
        'UPDATE live_sections SET cover_image_url = $1 WHERE id = $2',
        [cover_image_url, result.rows[0].id]
      );
      result.rows[0].cover_image_url = cover_image_url;
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign path to a live section (move from draft to pending)
router.post('/live-sections/:sectionId/assign-path', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { 
      rootType, 
      levelId, yearId, specialityId, materialId,
      languageId, languageLevelId 
    } = req.body;

    // Check if the section belongs to the professor and is in draft status
    const sectionCheck = await getRow('SELECT professor_id, status FROM live_sections WHERE id = $1', [sectionId]);

    if (!sectionCheck) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (sectionCheck.professor_id != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (sectionCheck.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft sections can be assigned a path' });
    }

    // Validate root type and required fields
    if (!rootType || !['education', 'language'].includes(rootType)) {
      return res.status(400).json({ error: 'Invalid root type' });
    }

    let updateFields = {
      root_type: rootType,
      status: 'pending'
    };

    if (rootType === 'education') {
      if (!levelId || !yearId || !materialId) {
        return res.status(400).json({ error: 'Level, year, and material are required' });
      }
      updateFields.level_id = levelId;
      updateFields.year_id = yearId;
      updateFields.speciality_id = specialityId || null; // Make speciality optional
      updateFields.material_id = materialId;
    } else if (rootType === 'language') {
      if (!languageId || !languageLevelId) {
        return res.status(400).json({ error: 'Language and language level are required' });
      }
      updateFields.language_id = languageId;
      updateFields.language_level_id = languageLevelId;
    }

    // Build dynamic query
    const setClause = Object.keys(updateFields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const updateQuery = `
      UPDATE live_sections 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const values = [sectionId, ...Object.values(updateFields)];
    const result = await query(updateQuery, values);

    // Send notifications and emails for live section creation (when path is assigned)
    try {
      const NotificationService = (await import('../services/notificationService.js')).default;
      const { sendLiveSectionCreatedEmailToAdmin } = await import('../services/emailService.js');
      
      // Get section information
      const sectionRes = await getRow('SELECT title, professor_id FROM live_sections WHERE id = $1', [sectionId]);
      if (sectionRes) {
        const section = sectionRes;
        
        // Get professor information
        const professorRes = await getRow('SELECT name FROM users WHERE id = $1', [section.professor_id]);
        const professor = professorRes;
        
        // Send notifications to admins
        await NotificationService.notifyLiveSectionCreated(
          sectionId,
          section.title,
          professor.name,
          section.professor_id
        );
        
        // Send emails to admins
        const adminRes = await getRows('SELECT name, email FROM users WHERE role = $1', ['admin']);
        for (const admin of adminRes) {
          await sendLiveSectionCreatedEmailToAdmin(
            admin.email,
            admin.name,
            professor.name,
            section.title
          );
        }
        
        debugLog(`✅ Live section creation notifications and emails sent for section ${sectionId}`);
      }
    } catch (error) {
      console.error('Error sending live section creation notifications/emails:', error);
      // Don't fail the update if notifications fail
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning path to live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all live sections (pending and rejected)
router.get('/admin/live-sections/all', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const selectAllQuery = `
      SELECT 
        ls.*,
        l.name as level_name,
        y.name as year_name,
        s.name as speciality_name,
        m.name as material_name,
        lang.name as language_name,
        ll.name as language_level_name,
        u.name as professor_name,
        u.email as professor_email,
        (SELECT COUNT(*) FROM live_sessions WHERE section_id = ls.id) as live_sessions_count
      FROM live_sections ls
      LEFT JOIN levels l ON ls.level_id = l.id
      LEFT JOIN years y ON ls.year_id = y.id
      LEFT JOIN specialities s ON ls.speciality_id = s.id
      LEFT JOIN materials m ON ls.material_id = m.id
      LEFT JOIN languages lang ON ls.language_id = lang.id
      LEFT JOIN language_levels ll ON ls.language_level_id = ll.id
      LEFT JOIN users u ON ls.professor_id = u.id
      WHERE ($1::text = 'all' OR ls.status = $1::text)
      ORDER BY ls.created_at DESC
    `;

    // Default keeps the old behaviour for existing callers.
    const filter = ['all', 'pending', 'approved', 'rejected', 'draft'].includes(req.query.status)
      ? req.query.status
      : null;
    const result = filter
      ? await getRows(selectAllQuery, [filter])
      : await getRows(selectAllQuery.replace("($1::text = 'all' OR ls.status = $1::text)", "ls.status IN ('pending', 'rejected')"));
    res.json(result);
  } catch (error) {
    console.error('Error fetching live sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: fix a live section's path and/or cover.
// Unlike the professor assign-path route this works at any status, does not
// change the status, and only touches the fields that were actually sent.
router.put('/admin/live-sections/:sectionId/path',
  verifyToken,
  requireRole('admin'),
  liveSectionUpload.single('cover_image'),
  // Without this, a rejected file reaches Express's default handler and the
  // professor gets an HTML stack trace listing the server's absolute paths.
  handleMulterError,
  async (req, res) => {
  try {
    const { sectionId } = req.params;
    const existing = await getRow('SELECT id FROM live_sections WHERE id = $1', [sectionId]);
    if (!existing) return res.status(404).json({ error: 'Live section not found' });

    // Same manual R2 upload the create route uses.
    let coverUrl = null;
    if (req.file && req.file.buffer) {
      try {
        const { uploadToR2, generateR2Key } = await import('../services/r2Service.js');
        const r2Key = generateR2Key('live-sections', null, req.file.originalname, 'cover');
        coverUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        debugLog('✅ Admin updated live section cover:', coverUrl);
      } catch (error) {
        console.error('❌ Cover upload failed:', error);
        return res.status(500).json({ error: 'Failed to upload cover: ' + error.message });
      }
    }

    const {
      rootType, levelId, yearId, specialityId, materialId,
      languageId, languageLevelId,
    } = req.body;

    const sets = [];
    const values = [];
    const push = (col, val) => { values.push(val); sets.push(`${col} = $${values.length}`); };

    // An empty string from a form select means "clear this".
    const norm = (v) => (v === undefined ? undefined : (v === '' || v === 'null' ? null : v));

    if (rootType === 'education') {
      push('root_type', 'education');
      if (norm(levelId) !== undefined) push('level_id', norm(levelId));
      if (norm(yearId) !== undefined) push('year_id', norm(yearId));
      if (norm(specialityId) !== undefined) push('speciality_id', norm(specialityId));
      if (norm(materialId) !== undefined) push('material_id', norm(materialId));
      // An education path and a language path are mutually exclusive.
      push('language_id', null);
      push('language_level_id', null);
    } else if (rootType === 'language') {
      push('root_type', 'language');
      if (norm(languageId) !== undefined) push('language_id', norm(languageId));
      if (norm(languageLevelId) !== undefined) push('language_level_id', norm(languageLevelId));
      push('level_id', null);
      push('year_id', null);
      push('speciality_id', null);
      push('material_id', null);
    }

    if (coverUrl) push('cover_image_url', coverUrl);

    if (sets.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    values.push(sectionId);

    const result = await query(
      `UPDATE live_sections SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    debugLog(`Live section ${sectionId} path/cover updated by admin ${req.user.id}`);
    res.json({ success: true, section: result.rows ? result.rows[0] : result[0] });
  } catch (error) {
    console.error('Error updating live section path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all pending live sections
router.get('/admin/live-sections/pending', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const selectPendingQuery = `
      SELECT 
        ls.*,
        l.name as level_name,
        y.name as year_name,
        s.name as speciality_name,
        m.name as material_name,
        lang.name as language_name,
        ll.name as language_level_name,
        u.name as professor_name,
        u.email as professor_email,
        (SELECT COUNT(*) FROM live_sessions WHERE section_id = ls.id) as live_sessions_count
      FROM live_sections ls
      LEFT JOIN levels l ON ls.level_id = l.id
      LEFT JOIN years y ON ls.year_id = y.id
      LEFT JOIN specialities s ON ls.speciality_id = s.id
      LEFT JOIN materials m ON ls.material_id = m.id
      LEFT JOIN languages lang ON ls.language_id = lang.id
      LEFT JOIN language_levels ll ON ls.language_level_id = ll.id
      LEFT JOIN users u ON ls.professor_id = u.id
      WHERE ls.status = 'pending'
      ORDER BY ls.created_at ASC
    `;

    const result = await getRows(selectPendingQuery);
    res.json(result);
  } catch (error) {
    console.error('Error fetching pending live sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Approve a live section
router.post('/admin/live-sections/:sectionId/approve', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { sectionId } = req.params;
    const adminId = req.user.id;

    // Check if the section exists and is pending
    const sectionCheck = await getRow('SELECT status FROM live_sections WHERE id = $1', [sectionId]);

    if (!sectionCheck) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    // A decision can be changed at any time so an admin can correct a mistake.
    // Only a no-op is refused.
    if (sectionCheck.status === 'approved') {
      return res.status(400).json({ error: 'This section is already approved' });
    }

    const approveQuery = `
      UPDATE live_sections 
      SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(approveQuery, [adminId, sectionId]);

    // The lives inside a دورة are part of the same submission and are only
    // reachable through it, so approving the دورة approves them too.
    let approvedSessions = 0;
    try {
      const cascade = await query(
        `UPDATE live_sessions
            SET is_approved = TRUE, is_rejected = FALSE, updated_at = CURRENT_TIMESTAMP
          WHERE section_id = $1 AND is_approved IS NOT TRUE`, [sectionId]);
      approvedSessions = cascade.rowCount || 0;
      if (approvedSessions) {
        debugLog(`Approved ${approvedSessions} live session(s) inside section ${sectionId}`);
      }
    } catch (cascadeError) {
      // Never fail the section approval because of the cascade.
      console.error('[approve] session cascade failed:', cascadeError.message);
    }

    
    // Send notifications and emails for live section approval
    try {
      const NotificationService = (await import('../services/notificationService.js')).default;
      const { sendLiveSectionApprovedEmailToProfessor } = await import('../services/emailService.js');
      
      // Get section information
      const sectionRes = await getRow('SELECT title, professor_id FROM live_sections WHERE id = $1', [sectionId]);
      if (sectionRes) {
        const section = sectionRes;
        
        // Get professor information
        const professorRes = await getRow('SELECT name, email FROM users WHERE id = $1', [section.professor_id]);
        const professor = professorRes;
        
        // Get admin information
        const adminRes = await getRow('SELECT name FROM users WHERE id = $1', [adminId]);
        const admin = adminRes;
        
        // Send notification to professor
        await NotificationService.notifyLiveSectionApproved(
          sectionId,
          section.title,
          section.professor_id,
          professor.name,
          admin.name
        );
        
        // Send email to professor
        await sendLiveSectionApprovedEmailToProfessor(
          professor.email,
          professor.name,
          section.title,
          admin.name
        );
        
        debugLog(`✅ Live section approval notifications and emails sent for section ${sectionId}`);
      }
    } catch (error) {
      console.error('Error sending live section approval notifications/emails:', error);
      // Don't fail the update if notifications fail
    }
    
    res.json({ ...result.rows[0], approvedSessions });
  } catch (error) {
    console.error('Error approving live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Reject a live section
router.post('/admin/live-sections/:sectionId/reject', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Check if the section exists and is pending
    const sectionCheck = await getRow('SELECT status FROM live_sections WHERE id = $1', [sectionId]);

    if (!sectionCheck) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (sectionCheck.status === 'rejected') {
      return res.status(400).json({ error: 'This section is already rejected' });
    }

    const rejectQuery = `
      UPDATE live_sections 
      SET status = 'rejected', approved_by = $1, rejected_reason = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await query(rejectQuery, [adminId, reason, sectionId]);

    // Mirror of the approve cascade: the lives inside a دورة are part of the
    // same submission, so rejecting the دورة takes them down with it. This
    // unpublishes only — nothing is deleted and no points are touched, so the
    // professor can fix the دورة and resubmit.
    let rejectedSessions = 0;
    try {
      const cascade = await query(
        `UPDATE live_sessions
            SET is_approved = FALSE, is_rejected = TRUE, updated_at = CURRENT_TIMESTAMP
          WHERE section_id = $1 AND is_rejected IS NOT TRUE`, [sectionId]);
      rejectedSessions = cascade.rowCount || 0;
      if (rejectedSessions) {
        debugLog(`Rejected ${rejectedSessions} live session(s) inside section ${sectionId}`);
      }
    } catch (cascadeError) {
      // Never fail the section rejection because of the cascade.
      console.error('[reject] session cascade failed:', cascadeError.message);
    }

    
    // Send notifications and emails for live section rejection
    try {
      const NotificationService = (await import('../services/notificationService.js')).default;
      const { sendLiveSectionRejectedEmailToProfessor } = await import('../services/emailService.js');
      
      // Get section information
      const sectionRes = await getRow('SELECT title, professor_id FROM live_sections WHERE id = $1', [sectionId]);
      if (sectionRes) {
        const section = sectionRes;
        
        // Get professor information
        const professorRes = await getRow('SELECT name, email FROM users WHERE id = $1', [section.professor_id]);
        const professor = professorRes;
        
        // Get admin information
        const adminRes = await getRow('SELECT name FROM users WHERE id = $1', [adminId]);
        const admin = adminRes;
        
        // Send notification to professor
        await NotificationService.notifyLiveSectionRejected(
          sectionId,
          section.title,
          section.professor_id,
          professor.name,
          admin.name,
          reason
        );
        
        // Send email to professor
        await sendLiveSectionRejectedEmailToProfessor(
          professor.email,
          professor.name,
          section.title,
          admin.name,
          reason
        );
        
        debugLog(`✅ Live section rejection notifications and emails sent for section ${sectionId}`);
      }
    } catch (error) {
      console.error('Error sending live section rejection notifications/emails:', error);
      // Don't fail the update if notifications fail
    }
    
    res.json({ ...result.rows[0], rejectedSessions });
  } catch (error) {
    console.error('Error rejecting live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/live-sections/approved → fetch all approved live sections for public display
// Professor: which of my دورات already have an open request, so the button can
// show that instead of offering to ask again.
router.get('/live-sections/my-deletion-requests',
  verifyToken, requireRole('professor'), async (req, res) => {
  try {
    res.json(await getRows(
      `SELECT id, live_section_id, section_title, status, reason, admin_note,
              requested_at, decided_at, refunded
         FROM live_section_deletion_requests
        WHERE professor_id = $1
        ORDER BY requested_at DESC`, [req.user.id]));
  } catch (error) {
    console.error('Error listing my deletion requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/live-sections/approved', async (req, res) => {
    try {
        const selectApprovedQuery = `
            SELECT 
                ls.*,
                -- Education hierarchy data
                l.name as level_name,
                y.name as year_name,
                s.name as speciality_name,
                m.name as material_name,
                -- Language data
                lang.name as language_name,
                ll.name as language_level_name,
                -- Professor data
                u.name as professor_name,
                u.email as professor_email,
                (SELECT COUNT(*) FROM live_sessions WHERE section_id = ls.id) as live_sessions_count
            FROM live_sections ls
            -- Education hierarchy joins
            LEFT JOIN levels l ON ls.level_id = l.id
            LEFT JOIN years y ON ls.year_id = y.id
            LEFT JOIN specialities s ON ls.speciality_id = s.id
            LEFT JOIN materials m ON ls.material_id = m.id
            -- Language joins
            LEFT JOIN languages lang ON ls.language_id = lang.id
            LEFT JOIN language_levels ll ON ls.language_level_id = ll.id
            -- Professor join
            LEFT JOIN users u ON ls.professor_id = u.id
            WHERE ls.status = 'approved'
            ORDER BY ls.created_at DESC
        `;
        const result = await getRows(selectApprovedQuery);
        res.json(result);
    } catch (error) {
        console.error('Error fetching approved live sections:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check if user can access a live section (purchase status)
router.get('/live-sections/:sectionId/access', verifyToken, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const userId = req.user.id;

    // Check if user has purchased this live section (using live_section_purchases table)
    const purchaseRes = await getRow('SELECT * FROM live_section_purchases WHERE live_section_id = $1 AND student_id = $2', [sectionId, userId]);

    const hasPurchased = !!purchaseRes;

    res.json({
      canAccess: hasPurchased,
      hasPurchased: hasPurchased,
      isLive: true
    });
  } catch (error) {
    console.error('Error checking live section access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a live section
router.put('/live-sections/:sectionId', 
  verifyToken, 
  requireRole('professor'), 
  liveSectionUpload.single('cover_image'),
  // Without this, a rejected file reaches Express's default handler and the
  // professor gets an HTML stack trace listing the server's absolute paths.
  handleMulterError,
  async (req, res, next) => {
  try {
    
    const { sectionId } = req.params;
    const { title, description, price, telegram_channel } = req.body;

    // Check if the section belongs to the professor
    const sectionCheck = await getRow('SELECT professor_id FROM live_sections WHERE id = $1', [sectionId]);

    if (!sectionCheck) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (sectionCheck.professor_id != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Handle R2 upload manually after file is buffered
    if (req.file && req.file.buffer) {
      try {
        debugLog('📤 Processing R2 upload for live section cover update...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key, deleteFromR2, extractKeyFromUrl } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('live-sections', null, req.file.originalname, 'cover');
        debugLog('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        debugLog('✅ Live section cover updated to R2:', publicUrl);
        
        // Update file object with R2 URL
        req.file.path = publicUrl;
        req.file.filename = r2Key;
      } catch (error) {
        console.error('❌ Error uploading live section cover update to R2:', error);
        return res.status(500).json({ 
          error: 'Failed to upload cover to R2',
          details: error.message 
        });
      }
    }

    const updateQuery = `
      UPDATE live_sections 
      SET title = $1, description = $2, price = $3, telegram_channel = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;

    const result = await query(updateQuery, [title, description, price, telegram_channel, sectionId]);
    
    // Handle cover upload if present
    if (req.file) {
      // Delete old cover image from R2 if it exists
      const oldSection = await getRow('SELECT cover_image_url FROM live_sections WHERE id = $1', [sectionId]);
      if (oldSection && oldSection.cover_image_url) {
        try {
          debugLog('🗑️ Deleting old cover image from R2:', oldSection.cover_image_url);
          const oldKey = extractKeyFromUrl(oldSection.cover_image_url);
          if (oldKey && oldKey !== oldSection.cover_image_url) {
            await deleteFromR2(oldKey);
            debugLog('✅ Old cover image deleted from R2:', oldKey);
          }
        } catch (err) {
          console.error('⚠️ Error deleting old cover image from R2:', err);
          // Continue with new upload even if old deletion fails
        }
      }
      
      // Use R2 URL instead of local path
      const coverUrl = req.file.path; // R2 public URL
      await query(
        'UPDATE live_sections SET cover_image_url = $1 WHERE id = $2',
        [coverUrl, sectionId]
      );
      result.rows[0].cover_image_url = coverUrl;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single live section by ID
router.get('/live-sections/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;

    const getByIdQuery = `
      SELECT 
        ls.*,
        l.name as level_name,
        y.name as year_name,
        s.name as speciality_name,
        m.name as material_name,
        lang.name as language_name,
        ll.name as language_level_name,
        u.name as professor_name,
        (SELECT COUNT(*) FROM live_sessions WHERE section_id = ls.id) as live_sessions_count
      FROM live_sections ls
      LEFT JOIN levels l ON ls.level_id = l.id
      LEFT JOIN years y ON ls.year_id = y.id
      LEFT JOIN specialities s ON ls.speciality_id = s.id
      LEFT JOIN materials m ON ls.material_id = m.id
      LEFT JOIN languages lang ON ls.language_id = lang.id
      LEFT JOIN language_levels ll ON ls.language_level_id = ll.id
      LEFT JOIN users u ON ls.professor_id = u.id
      WHERE ls.id = $1
    `;

    const result = await getRow(getByIdQuery, [sectionId]);
    
    if (!result) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get live sessions for a specific section
router.get('/live-sections/:sectionId/sessions', async (req, res) => {
  try {
    const { sectionId } = req.params;

    const getSessionsQuery = `
      SELECT 
        id,
        title,
        description,
        start_time,
        duration,
        price,
        cover_image_url,
        created_at,
        updated_at,
        status
      FROM live_sessions 
      WHERE section_id = $1
      ORDER BY start_time ASC
    `;

    const result = await getRows(getSessionsQuery, [sectionId]);
    
    // Convert Date objects to ISO strings for proper JSON serialization
    const processedRows = result.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      // start_time arrives as a plain wall-clock string now (see db.js), so
      // it is passed straight through rather than being given a false Z.
      scheduledAt: row.start_time || null,
      duration: row.duration,
      price: row.price,
      cover_image_url: row.cover_image_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status: row.status
    }));

    res.json(processedRows);
  } catch (error) {
    console.error('Error fetching live sessions for section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Remove a live section and everything hanging off it: R2 files, blocks,
// content sections, its live sessions and every purchase of either. Shared by
// the professor route and the admin route so the two can never drift apart.
// The caller owns the transaction.
async function purgeLiveSection(client, sectionId, coverImageUrl) {
    debugLog(`🗑️ Starting deletion of live section ${sectionId} and all related data...`);

    // 1. Delete all blocks and their files from R2
    debugLog('Deleting blocks and files...');
    const blocks = await client.query('SELECT id, type FROM live_section_blocks WHERE live_section_id = $1', [sectionId]);
    
    for (const block of blocks.rows) {
      if (block.type !== 'text') {
        const files = await client.query('SELECT file_path FROM live_section_files WHERE block_id = $1', [block.id]);
        for (const file of files.rows) {
          try {
            if (file.file_path && (file.file_path.startsWith('http') || file.file_path.startsWith('https'))) {
              debugLog('🗑️ Deleting R2 file:', file.file_path);
              const key = extractKeyFromUrl(file.file_path);
              if (key && key !== file.file_path) {
                await deleteFromR2(key);
                debugLog('✅ R2 file deleted:', key);
              }
            }
          } catch (err) {
            console.error('⚠️ Error deleting file from R2:', err);
          }
        }
      }
    }

    // 2. Delete all files from database
    await client.query('DELETE FROM live_section_files WHERE live_section_id = $1', [sectionId]);
    debugLog('✅ Deleted live_section_files records');

    // 3. Delete all blocks
    await client.query('DELETE FROM live_section_blocks WHERE live_section_id = $1', [sectionId]);
    debugLog('✅ Deleted live_section_blocks records');

    // 4. Delete all content sections
    await client.query('DELETE FROM live_section_sections WHERE live_section_id = $1', [sectionId]);
    debugLog('✅ Deleted live_section_sections records');

    // 5. Delete all live sessions and their related data
    debugLog('Deleting live sessions...');
    const sessions = await client.query('SELECT id FROM live_sessions WHERE section_id = $1', [sectionId]);
    
    for (const session of sessions.rows) {
      // Delete purchases related to this session
      await client.query('DELETE FROM purchases WHERE session_id = $1', [session.id]);
      // Delete session participants if table exists
      try {
        await client.query('DELETE FROM live_session_participants WHERE session_id = $1', [session.id]);
      } catch (err) {
        // Table might not exist, ignore
      }
    }
    
    await client.query('DELETE FROM live_sessions WHERE section_id = $1', [sectionId]);
    debugLog('✅ Deleted live_sessions records');

    // 6. Delete live section purchases
    await client.query('DELETE FROM live_section_purchases WHERE live_section_id = $1', [sectionId]);
    debugLog('✅ Deleted live_section_purchases records');

    // 7. Delete cover image from R2 if exists
    if (coverImageUrl) {
      try {
        debugLog('🗑️ Deleting cover image from R2:', coverImageUrl);
        const coverKey = extractKeyFromUrl(coverImageUrl);
        if (coverKey && coverKey !== coverImageUrl) {
          await deleteFromR2(coverKey);
          debugLog('✅ Cover image deleted from R2:', coverKey);
        }
      } catch (err) {
        console.error('⚠️ Error deleting cover image from R2:', err);
      }
    }

    // 8. Finally, delete the live section itself
    debugLog('Deleting live section...');
    await client.query('DELETE FROM live_sections WHERE id = $1', [sectionId]);
    debugLog('✅ Deleted live_sections record');
}

// Give the students who bought a دورة their points back.
//
// Deleting a دورة is not one situation but two, and only a person can tell
// them apart: a دورة withdrawn while students still expect it owes them a
// refund, while one retired at the end of the year has already been delivered
// and owes nothing. So the admin route asks, and passes the answer here.
//
// 'refund' matches no branch of trigger_update_user_points_balance, so the row
// is an audit record only and the balance has to be credited explicitly.
async function refundLiveSectionBuyers(client, sectionId, actorId) {
  const buyers = await client.query(
    'SELECT student_id, points_spent FROM live_section_purchases WHERE live_section_id = $1',
    [sectionId]);

  let refunded = 0;
  let points_total = 0;

  for (const buyer of buyers.rows) {
    const points = parseInt(buyer.points_spent ?? 0, 10);
    if (!Number.isFinite(points) || points <= 0) continue;
    try {
      await client.query(
        `INSERT INTO point_transactions (user_id, transaction_type, points, amount, status, metadata)
         VALUES ($1, 'refund', $2, $3, 'completed', $4)`,
        [buyer.student_id, points, points, JSON.stringify({
          type: 'live_section_deleted', live_section_id: Number(sectionId), refunded_by: actorId,
        })]);
      await client.query(
        `INSERT INTO user_points (user_id, balance, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE
           SET balance = user_points.balance + $2, updated_at = CURRENT_TIMESTAMP`,
        [buyer.student_id, points]);
      refunded += 1;
      points_total += points;
    } catch (e) {
      console.error(`[refund] section ${sectionId} student ${buyer.student_id}:`, e.message);
      throw e; // inside the caller's transaction: a partial refund must not commit
    }
  }
  return { refunded, points_total, buyers: buyers.rows };
}

// The individual live sessions inside a دورة follow their own rule, the same
// one that applies when a single session is deleted: a session the student
// already attended was delivered, so it is not refunded. Only sessions whose
// day never came hand the points back.
async function refundUnairedSessionsInSection(client, sectionId, actorId) {
  const sessions = await client.query(
    'SELECT id, status, start_time, duration FROM live_sessions WHERE section_id = $1', [sectionId]);

  let refunded = 0;
  let points_total = 0;
  let skipped_already_aired = 0;

  for (const session of sessions.rows) {
    const aired = session.status === 'ended' ||
      (session.start_time &&
       Date.now() > new Date(session.start_time).getTime() + (session.duration || 60) * 60 * 1000);
    if (aired) { skipped_already_aired += 1; continue; }

    const buyers = await client.query(
      'SELECT student_id, amount_paid FROM purchases WHERE session_id = $1', [session.id]);

    for (const buyer of buyers.rows) {
      // Prefer what the student was actually charged, recorded on the spend row.
      const spend = await client.query(
        `SELECT points FROM point_transactions
          WHERE user_id = $1 AND transaction_type = 'spend' AND status = 'completed'
            AND (metadata->>'session_id') = $2::text
          ORDER BY created_at DESC LIMIT 1`, [buyer.student_id, String(session.id)]);
      const points = parseInt(spend.rows[0]?.points ?? buyer.amount_paid ?? 0, 10);
      if (!Number.isFinite(points) || points <= 0) continue;

      await client.query(
        `INSERT INTO point_transactions (user_id, transaction_type, points, amount, status, metadata)
         VALUES ($1, 'refund', $2, $3, 'completed', $4)`,
        [buyer.student_id, points, points, JSON.stringify({
          type: 'live_session_deleted_with_section',
          session_id: Number(session.id), live_section_id: Number(sectionId), refunded_by: actorId,
        })]);
      await client.query(
        `INSERT INTO user_points (user_id, balance, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE
           SET balance = user_points.balance + $2, updated_at = CURRENT_TIMESTAMP`,
        [buyer.student_id, points]);
      refunded += 1;
      points_total += points;
    }
  }
  return { refunded, points_total, skipped_already_aired };
}

// Delete a live section and all related data.
//
// A professor can no longer do this alone. Deleting a دورة destroys purchases
// that students paid points for, and whether those points come back is not a
// decision the person pressing the button should make on their own — so this
// route now only runs for an admin who has approved a deletion request, and
// tells a professor where to go instead.
router.delete('/live-sections/:sectionId', verifyToken, requireRole(['professor', 'admin']), async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;
  
  try {
    const { sectionId } = req.params;

    // Check if the section belongs to the professor
    const sectionCheck = await getRow('SELECT professor_id, cover_image_url FROM live_sections WHERE id = $1', [sectionId]);

    if (!sectionCheck) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (req.user.role === 'professor') {
      return res.status(403).json({
        error: 'يجب طلب الحذف من الإدارة',
        detail: 'حذف الدورة يمس نقاط الطلاب الذين اشتروها، فالإدارة هي من تقرر. أرسل طلب حذف.',
        use: `POST /api/live-sections/${sectionId}/deletion-request`,
      });
    }

    if (sectionCheck.professor_id != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await client.query('BEGIN');
    transactionStarted = true;

    await purgeLiveSection(client, sectionId, sectionCheck.cover_image_url);

    await client.query('COMMIT');
    transactionStarted = false;
    debugLog('✅ Live section and all related data deleted successfully!');
    
    res.json({ message: 'Live section deleted successfully' });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Error during rollback:', rollbackErr);
      }
    }
    console.error('❌ Error deleting live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});


// ==================== DELETION REQUESTS ====================
// A professor asks; an admin decides both whether to delete and whether the
// students who paid get their points back.

// Professor: ask for a دورة to be deleted.
router.post('/live-sections/:sectionId/deletion-request',
  verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { reason } = req.body || {};

    const section = await getRow(
      'SELECT id, title, professor_id FROM live_sections WHERE id = $1', [sectionId]);
    if (!section) return res.status(404).json({ error: 'Live section not found' });
    if (section.professor_id != req.user.id) {
      return res.status(403).json({ error: 'هذه الدورة ليست لك' });
    }

    const open = await getRow(
      `SELECT id FROM live_section_deletion_requests
        WHERE live_section_id = $1 AND status = 'pending'`, [sectionId]);
    if (open) {
      return res.status(409).json({ error: 'يوجد طلب حذف قيد المراجعة لهذه الدورة بالفعل' });
    }

    // Show the admin what the decision actually costs before they take it.
    const impact = await getRow(
      `SELECT
         (SELECT COUNT(*) FROM live_section_purchases WHERE live_section_id = $1)::int  AS section_buyers,
         (SELECT COALESCE(SUM(points_spent),0) FROM live_section_purchases WHERE live_section_id = $1)::int AS section_points,
         (SELECT COUNT(*) FROM live_sessions WHERE section_id = $1)::int                AS sessions,
         (SELECT COUNT(*) FROM purchases p JOIN live_sessions ls ON ls.id = p.session_id
           WHERE ls.section_id = $1)::int                                               AS session_buyers`,
      [sectionId]);

    const row = await getRow(
      `INSERT INTO live_section_deletion_requests
         (live_section_id, section_title, professor_id, reason)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sectionId, section.title, req.user.id, (reason || '').trim() || null]);

    try {
      const NotificationService = (await import('../services/notificationService.js')).default;
      const admins = await getRows("SELECT id FROM users WHERE role = 'admin'");
      const who = await getRow('SELECT name FROM users WHERE id = $1', [req.user.id]);
      for (const a of admins) {
        await NotificationService.createNotification(
          a.id, 'live_section_deletion_requested', 'طلب حذف دورة',
          `طلب ${who?.name || 'أستاذ'} حذف دورة «${section.title}».`,
          JSON.stringify({ request_id: row.id, live_section_id: Number(sectionId) })
        ).catch(() => {});
      }
    } catch (e) { console.error('deletion-request notify:', e.message); }

    res.status(201).json({ message: 'تم إرسال طلب الحذف إلى الإدارة', request: row, impact });
  } catch (error) {
    console.error('Error creating deletion request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: the queue, with the impact figures attached so the refund choice is
// made against real numbers rather than a guess.
router.get('/admin/live-section-deletion-requests',
  verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const rows = await getRows(
      `SELECT r.*,
              u.name  AS professor_name,
              d.name  AS decided_by_name,
              ls.price, ls.cover_image_url,
              (SELECT COUNT(*) FROM live_section_purchases WHERE live_section_id = r.live_section_id)::int AS section_buyers,
              (SELECT COALESCE(SUM(points_spent),0) FROM live_section_purchases WHERE live_section_id = r.live_section_id)::int AS section_points,
              (SELECT COUNT(*) FROM live_sessions WHERE section_id = r.live_section_id)::int AS sessions_count,
              (SELECT COUNT(*) FROM purchases p JOIN live_sessions s2 ON s2.id = p.session_id
                WHERE s2.section_id = r.live_section_id)::int AS session_buyers,
              (SELECT COUNT(*) FROM live_sessions s3
                WHERE s3.section_id = r.live_section_id
                  AND s3.status <> 'ended'
                  AND s3.start_time > NOW())::int AS sessions_not_yet_aired
         FROM live_section_deletion_requests r
         LEFT JOIN users u  ON u.id = r.professor_id
         LEFT JOIN users d  ON d.id = r.decided_by
         LEFT JOIN live_sections ls ON ls.id = r.live_section_id
        WHERE ($1 = 'all' OR r.status = $1)
        ORDER BY r.requested_at DESC`, [status]);
    res.json(rows);
  } catch (error) {
    console.error('Error listing deletion requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: approve — delete the دورة, refunding or not as chosen.
//
//   POST /api/admin/live-section-deletion-requests/:id/approve
//   body { refund: true | false }
// refund is required: there is no sensible default when the two outcomes are
// "students keep their money" and "students lose it".
router.post('/admin/live-section-deletion-requests/:id/approve',
  verifyToken, requireRole('admin'), async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    const { id } = req.params;
    const { refund, note } = req.body || {};
    if (refund !== true && refund !== false) {
      return res.status(400).json({ error: 'يجب تحديد ما إذا كانت النقاط تُرجع أم لا (refund: true/false)' });
    }

    const reqRow = await getRow(
      'SELECT * FROM live_section_deletion_requests WHERE id = $1', [id]);
    if (!reqRow) return res.status(404).json({ error: 'الطلب غير موجود' });
    if (reqRow.status !== 'pending') {
      return res.status(409).json({ error: `الطلب ${reqRow.status === 'approved' ? 'منفَّذ' : 'مرفوض'} مسبقاً` });
    }
    const sectionId = reqRow.live_section_id;
    const section = sectionId
      ? await getRow('SELECT id, title, cover_image_url FROM live_sections WHERE id = $1', [sectionId])
      : null;
    if (!section) {
      // The دورة went away by another route; close the request honestly rather
      // than pretending a deletion happened.
      await query(
        `UPDATE live_section_deletion_requests
            SET status='approved', decided_by=$2, decided_at=NOW(),
                admin_note=COALESCE($3,'الدورة كانت محذوفة مسبقاً'), refunded=false
          WHERE id=$1`, [id, req.user.id, note || null]);
      return res.json({ message: 'الدورة كانت محذوفة مسبقاً — أُغلق الطلب', deleted: false });
    }

    await client.query('BEGIN');
    transactionStarted = true;

    let sectionRefund = { refunded: 0, points_total: 0 };
    let sessionRefund = { refunded: 0, points_total: 0, skipped_already_aired: 0 };
    if (refund === true) {
      sectionRefund = await refundLiveSectionBuyers(client, sectionId, req.user.id);
      sessionRefund = await refundUnairedSessionsInSection(client, sectionId, req.user.id);
    }

    const affected = await client.query(
      `SELECT DISTINCT student_id FROM live_section_purchases WHERE live_section_id = $1
       UNION
       SELECT DISTINCT p.student_id FROM purchases p
         JOIN live_sessions ls ON ls.id = p.session_id
        WHERE ls.section_id = $1`, [sectionId]);

    // Record the decision BEFORE the delete: the FK sets live_section_id to
    // NULL, and these numbers are the only thing left explaining what happened.
    await client.query(
      `UPDATE live_section_deletion_requests
          SET status='approved', decided_by=$2, decided_at=NOW(), admin_note=$3,
              refunded=$4, points_returned=$5, students_refunded=$6
        WHERE id=$1`,
      [id, req.user.id, note || null, refund === true,
       sectionRefund.points_total + sessionRefund.points_total,
       sectionRefund.refunded + sessionRefund.refunded]);

    await purgeLiveSection(client, sectionId, section.cover_image_url);

    await client.query('COMMIT');
    transactionStarted = false;

    try {
      const NotificationService = (await import('../services/notificationService.js')).default;
      for (const row of affected.rows) {
        await NotificationService.createNotification(
          row.student_id, 'live_section_deleted',
          refund ? 'تم إلغاء الدورة وإعادة نقاطك' : 'تم إلغاء الدورة',
          refund ? `تم إلغاء دورة «${section.title}» وأعيدت النقاط إلى رصيدك.`
                 : `تم إلغاء دورة «${section.title}».`,
          JSON.stringify({ live_section_id: Number(sectionId), refunded: !!refund })
        ).catch(() => {});
      }
      if (reqRow.professor_id) {
        await NotificationService.createNotification(
          reqRow.professor_id, 'live_section_deletion_approved', 'تمت الموافقة على حذف الدورة',
          refund ? `حُذفت دورة «${section.title}» وأُعيدت نقاط الطلاب.`
                 : `حُذفت دورة «${section.title}» دون إرجاع النقاط.`,
          JSON.stringify({ request_id: Number(id), refunded: !!refund })
        ).catch(() => {});
      }
    } catch (e) { console.error('approve-deletion notify:', e.message); }

    res.json({
      message: 'تم حذف الدورة',
      deleted: true,
      refunded: refund === true,
      section_buyers_refunded: sectionRefund.refunded,
      session_buyers_refunded: sessionRefund.refunded,
      sessions_already_aired: sessionRefund.skipped_already_aired,
      points_returned: sectionRefund.points_total + sessionRefund.points_total,
      students_notified: affected.rows.length,
    });
  } catch (error) {
    if (transactionStarted) {
      try { await client.query('ROLLBACK'); } catch (e) { console.error('Rollback failed:', e); }
    }
    console.error('❌ Error approving deletion request:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Admin: reject — the دورة stays exactly as it is.
router.post('/admin/live-section-deletion-requests/:id/reject',
  verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body || {};
    const reqRow = await getRow('SELECT * FROM live_section_deletion_requests WHERE id = $1', [id]);
    if (!reqRow) return res.status(404).json({ error: 'الطلب غير موجود' });
    if (reqRow.status !== 'pending') {
      return res.status(409).json({ error: 'تم البت في هذا الطلب مسبقاً' });
    }

    await query(
      `UPDATE live_section_deletion_requests
          SET status='rejected', decided_by=$2, decided_at=NOW(), admin_note=$3, refunded=NULL
        WHERE id=$1`, [id, req.user.id, (note || '').trim() || null]);

    try {
      const NotificationService = (await import('../services/notificationService.js')).default;
      if (reqRow.professor_id) {
        await NotificationService.createNotification(
          reqRow.professor_id, 'live_section_deletion_rejected', 'رُفض طلب حذف الدورة',
          `لم تتم الموافقة على حذف دورة «${reqRow.section_title}».` +
            (note ? ` السبب: ${note}` : ''),
          JSON.stringify({ request_id: Number(id) })
        ).catch(() => {});
      }
    } catch (e) { console.error('reject-deletion notify:', e.message); }

    res.json({ message: 'تم رفض طلب الحذف' });
  } catch (error) {
    console.error('Error rejecting deletion request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: delete a دورة, choosing whether its students are refunded.
//
// Until now no interface could delete a دورة at all, and the professor route
// deleted the purchase rows outright, so students silently lost their points.
// The refund is not something code can decide on its own — a دورة cancelled in
// October and one retired the following June are the same operation with
// opposite fairness — so the admin says which this is and the answer is
// recorded on every transaction row.
//
//   DELETE /api/admin/live-sections/:sectionId        -> no refund (default)
//   DELETE /api/admin/live-sections/:sectionId?refund=true
router.delete('/admin/live-sections/:sectionId', verifyToken, requireRole('admin'), async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const { sectionId } = req.params;
    // Refunding is the irreversible half, so it only happens when asked for
    // explicitly. Anything else means no refund.
    const shouldRefund = String(req.query.refund ?? req.body?.refund ?? 'false') === 'true';

    const section = await getRow(
      'SELECT id, title, professor_id, cover_image_url FROM live_sections WHERE id = $1', [sectionId]);
    if (!section) return res.status(404).json({ error: 'Live section not found' });

    await client.query('BEGIN');
    transactionStarted = true;

    let sectionRefund = { refunded: 0, points_total: 0, buyers: [] };
    let sessionRefund = { refunded: 0, points_total: 0, skipped_already_aired: 0 };

    if (shouldRefund) {
      sectionRefund = await refundLiveSectionBuyers(client, sectionId, req.user.id);
      sessionRefund = await refundUnairedSessionsInSection(client, sectionId, req.user.id);
    }

    // Who to tell, gathered before the rows are deleted.
    const affected = await client.query(
      `SELECT DISTINCT student_id FROM live_section_purchases WHERE live_section_id = $1
       UNION
       SELECT DISTINCT p.student_id FROM purchases p
         JOIN live_sessions ls ON ls.id = p.session_id
        WHERE ls.section_id = $1`, [sectionId]);

    await purgeLiveSection(client, sectionId, section.cover_image_url);

    await client.query('COMMIT');
    transactionStarted = false;

    // Notifications are not part of the transaction: a failure to notify must
    // not undo a completed deletion.
    try {
      const NotificationService = (await import('../services/notificationService.js')).default;
      const totalPoints = sectionRefund.points_total + sessionRefund.points_total;
      for (const row of affected.rows) {
        await NotificationService.createNotification(
          row.student_id,
          'live_section_deleted',
          shouldRefund ? 'تم إلغاء الدورة وإعادة نقاطك' : 'تم إلغاء الدورة',
          shouldRefund
            ? `تم إلغاء دورة «${section.title}» وأعيدت النقاط إلى رصيدك.`
            : `تم إلغاء دورة «${section.title}».`,
          JSON.stringify({ live_section_id: Number(sectionId), refunded: shouldRefund })
        ).catch(() => {});
      }
      if (totalPoints) debugLog(`Refunded ${totalPoints} points for deleted section ${sectionId}`);
    } catch (e) {
      console.error('Notification after section delete failed:', e.message);
    }

    res.json({
      message: 'Live section deleted successfully',
      refunded: shouldRefund,
      section_buyers_refunded: sectionRefund.refunded,
      session_buyers_refunded: sessionRefund.refunded,
      sessions_already_aired: sessionRefund.skipped_already_aired,
      points_returned: sectionRefund.points_total + sessionRefund.points_total,
      students_notified: affected.rows.length,
    });
  } catch (error) {
    if (transactionStarted) {
      try { await client.query('ROLLBACK'); } catch (e) { console.error('Rollback failed:', e); }
    }
    console.error('❌ Error deleting live section (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});


// ==================== CONTENT SECTIONS AND BLOCKS ROUTES ====================

// Configure multer for live section content files (video, pdf, images, etc.)
const liveSectionContentUpload = createR2Multer('live-sections', null, {
  fileFilter: (req, file, cb) => {
    debugLog('Live section content file upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Allow various file types for content
    const allowedContentTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|mp4|webm|mov|avi|m4v|3gp|mp3|wav|zip|rar/;
    const extname = allowedContentTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedContentTypes.test(file.mimetype) || /application\//.test(file.mimetype);
    
    if (extname || mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('File type not allowed for live section content!'));
    }
  }
});

// Get live section with all its content (sections and blocks)
router.get('/live-sections/:liveSectionId/content', async (req, res) => {
  try {
    const { liveSectionId } = req.params;

    // Get the live section
    const liveSection = await getRow('SELECT * FROM live_sections WHERE id = $1', [liveSectionId]);
    
    if (!liveSection) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    // Get content sections
    const sections = await getRows(`
      SELECT id, title, "order"
      FROM live_section_sections
      WHERE live_section_id = $1
      ORDER BY "order", id
    `, [liveSectionId]);

    // Get blocks for each section
    for (let section of sections) {
      const blocks = await getRows(`
        SELECT id, type, title, content, "order"
        FROM live_section_blocks
        WHERE section_id = $1
        ORDER BY "order", id
      `, [section.id]);

      // Get files for each block
      for (let block of blocks) {
        if (block.type !== 'text') {
          const files = await getRows(`
            SELECT id, file_name, file_path, file_type, file_size, original_name
            FROM live_section_files
            WHERE block_id = $1
            ORDER BY created_at
          `, [block.id]);
          block.files = files;
          if (files && files.length > 0) {
            block.fileUrl = files[0].file_path;
            block.content = files[0].file_path; // for frontend compatibility
          }
        }
      }
      section.blocks = blocks;
    }

    // Get live sessions for this live section
    const liveSessions = await getRows(`
      SELECT id, title, description, start_time as "scheduledAt", duration, price, cover_image_url, status, created_at, updated_at
      FROM live_sessions
      WHERE section_id = $1
      ORDER BY start_time ASC
    `, [liveSectionId]);

    // Return data in the format expected by frontend
    res.json({
      ...liveSection,
      sections: sections,
      live_sessions: liveSessions.map(session => ({
        ...session,
        // Keep start_time in datetime-local format without conversion
        scheduledAt: session.scheduledAt
      }))
    });
  } catch (error) {
    console.error('Error fetching live section content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new content section in a live section
// ---------------------------------------------------------------------------
// PUT /api/live-sections/:liveSectionId/order
//   { sections: [ { id, blocks: [blockId, ...] }, ... ] }
//
// The teacher's order, set in one go. Array position is the order: the first
// section is 1, and within each section the first block is 1.
//
// Done as one call, after the form has saved everything, rather than by
// sending an order with each section: new sections only get an id once they
// are created, and a half-applied order (some rows moved, some not) is exactly
// the shuffled list this exists to prevent — so it is a transaction.
// ---------------------------------------------------------------------------
router.put('/live-sections/:liveSectionId/order', verifyToken, requireRole('professor'), async (req, res) => {
  const liveSectionId = Number(req.params.liveSectionId);
  const sections = Array.isArray(req.body?.sections) ? req.body.sections : null;
  if (!liveSectionId || !sections) {
    return res.status(400).json({ error: 'sections array is required' });
  }

  const owner = await getRow('SELECT professor_id FROM live_sections WHERE id = $1', [liveSectionId]);
  if (!owner) return res.status(404).json({ error: 'Live section not found' });
  if (String(owner.professor_id) !== String(req.user.id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let moved = 0;
    for (let i = 0; i < sections.length; i++) {
      const sectionId = Number(sections[i]?.id);
      if (!sectionId) continue;
      // The live_section_id condition is the ownership check for the rows: an
      // id from someone else's دورة simply matches nothing.
      const r = await client.query(
        `UPDATE live_section_sections SET "order" = $1
          WHERE id = $2 AND live_section_id = $3`,
        [i + 1, sectionId, liveSectionId]);
      moved += r.rowCount;

      const blocks = Array.isArray(sections[i].blocks) ? sections[i].blocks : [];
      for (let j = 0; j < blocks.length; j++) {
        const blockId = Number(blocks[j]);
        if (!blockId) continue;
        await client.query(
          `UPDATE live_section_blocks SET "order" = $1
            WHERE id = $2 AND section_id = $3`,
          [j + 1, blockId, sectionId]);
      }
    }
    await client.query('COMMIT');
    debugLog(`[order] دورة ${liveSectionId}: ${moved} sections reordered`);
    res.json({ message: 'تم حفظ الترتيب', sections: moved });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error saving section order:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/live-sections/sections', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const { live_section_id, title, order } = req.body;

    if (!live_section_id || !title) {
      return res.status(400).json({ error: 'live_section_id and title are required' });
    }

    // Check if the live section belongs to the professor
    const liveSectionCheck = await getRow(
      'SELECT professor_id FROM live_sections WHERE id = $1',
      [live_section_id]
    );

    if (!liveSectionCheck) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (liveSectionCheck.professor_id != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // No explicit order means "put it last" — see course_sections for why.
    const result = await query(
      `INSERT INTO live_section_sections (live_section_id, title, "order")
       VALUES ($1, $2, COALESCE($3::int,
         (SELECT COALESCE(MAX("order"), 0) + 1
            FROM live_section_sections WHERE live_section_id = $1)))
       RETURNING *`,
      [live_section_id, title, order ?? null]
    );

    res.status(201).json(result.rows[0]);

    // Buyers of this دورة hear about it, once per 30 minutes however many
    // files the upload turns out to contain.
    notifyLiveSectionContentAdded(live_section_id).catch((e) =>
      console.error('[content-added] live section notify failed:', e.message));
  } catch (error) {
    console.error('Error creating live section content section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a content section
router.put('/live-sections/sections/:sectionId', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    // Check if the section belongs to the professor's live section
    const sectionCheck = await getRow(`
      SELECT lss.*, ls.professor_id
      FROM live_section_sections lss
      JOIN live_sections ls ON lss.live_section_id = ls.id
      WHERE lss.id = $1
    `, [sectionId]);

    if (!sectionCheck) {
      return res.status(404).json({ error: 'Content section not found' });
    }

    if (sectionCheck.professor_id != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      'UPDATE live_section_sections SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [title, sectionId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating live section content section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a content section
router.delete('/live-sections/sections/:sectionId', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Check if the section belongs to the professor's live section
    const sectionCheck = await getRow(`
      SELECT lss.*, ls.professor_id
      FROM live_section_sections lss
      JOIN live_sections ls ON lss.live_section_id = ls.id
      WHERE lss.id = $1
    `, [sectionId]);

    if (!sectionCheck) {
      return res.status(404).json({ error: 'Content section not found' });
    }

    if (sectionCheck.professor_id != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get all blocks in this section
    const blocks = await getRows('SELECT id, type FROM live_section_blocks WHERE section_id = $1', [sectionId]);
    
    // Delete all files from R2 for each block
    for (const block of blocks) {
      if (block.type !== 'text') {
        const files = await getRows('SELECT file_path FROM live_section_files WHERE block_id = $1', [block.id]);
        for (const file of files) {
          try {
            // Check if it's an R2 URL
            if (file.file_path && (file.file_path.startsWith('http') || file.file_path.startsWith('https'))) {
              debugLog('🗑️ Deleting R2 file:', file.file_path);
              const key = extractKeyFromUrl(file.file_path);
              if (key && key !== file.file_path) {
                await deleteFromR2(key);
                debugLog('✅ R2 file deleted:', key);
              }
            }
          } catch (err) {
            console.error('⚠️ Error deleting file from R2:', err);
            // Continue with other files even if one fails
          }
        }
        // Delete file records from database
        await query('DELETE FROM live_section_files WHERE block_id = $1', [block.id]);
      }
    }

    // Delete all blocks (CASCADE will handle this, but we do it explicitly for clarity)
    await query('DELETE FROM live_section_blocks WHERE section_id = $1', [sectionId]);
    
    // Delete the section
    await query('DELETE FROM live_section_sections WHERE id = $1', [sectionId]);
    res.json({ message: 'Content section deleted successfully' });
  } catch (error) {
    console.error('Error deleting live section content section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new block in a content section
router.post('/live-sections/blocks', 
  verifyToken, 
  requireRole('professor'),
  liveSectionContentUpload.single('file'),
  async (req, res, next) => {
    // Handle R2 upload manually after file is buffered
    if (req.file && req.file.buffer) {
      try {
        debugLog('📤 Processing R2 upload for live section block file...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('live-sections', null, req.file.originalname, 'content');
        debugLog('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        debugLog('✅ Live section block file uploaded to R2:', publicUrl);
        
        // Update file object with R2 URL
        req.file.path = publicUrl;
        req.file.filename = r2Key;
      } catch (error) {
        console.error('❌ Error uploading live section block file to R2:', error);
        return res.status(500).json({ 
          error: 'Failed to upload file to R2',
          details: error.message 
        });
      }
    }
    
    next();
  },
  async (req, res) => {
    try {
      const { section_id, live_section_id, type, title, content } = req.body;

      if (!section_id || !live_section_id || !type) {
        return res.status(400).json({ error: 'section_id, live_section_id, and type are required' });
      }

      // Check if the live section belongs to the professor
      const liveSectionCheck = await getRow(
        'SELECT professor_id FROM live_sections WHERE id = $1',
        [live_section_id]
      );

      if (!liveSectionCheck) {
        return res.status(404).json({ error: 'Live section not found' });
      }

      if (liveSectionCheck.professor_id != req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      debugLog('📝 Creating live section block with data:', { section_id, live_section_id, type, title, content });

      // Insert block
      const blockResult = await query(
        `INSERT INTO live_section_blocks (section_id, live_section_id, type, title, content, "order")
         VALUES ($1, $2, $3, $4, $5,
           (SELECT COALESCE(MAX("order"), 0) + 1
              FROM live_section_blocks WHERE section_id = $1))
         RETURNING *`,
        [section_id, live_section_id, type, title || null, type === 'text' ? content : '']
      );
      const block = blockResult.rows[0];
      debugLog('✅ Block created:', block.id);

      let fileInfo = null;
      if (type !== 'text' && req.file) {
        debugLog('📁 Processing file for block:', req.file.originalname);
        
        // Use R2 URL instead of local path
        const fileUrl = req.file.path; // R2 public URL
        debugLog('🔗 File URL:', fileUrl);
        
        await query(
          'INSERT INTO live_section_files (live_section_id, section_id, block_id, file_name, file_path, file_type, file_size, original_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [live_section_id, section_id, block.id, req.file.filename, fileUrl, req.file.mimetype, req.file.size, req.file.originalname]
        );
        
        fileInfo = {
          file_name: req.file.filename,
          file_path: fileUrl,
          file_type: req.file.mimetype,
          file_size: req.file.size,
          original_name: req.file.originalname
        };
        
        debugLog('✅ File info saved to database');
      }

      debugLog('✅ Block creation completed successfully');
      res.status(201).json({ ...block, files: fileInfo ? [fileInfo] : [] });

      // A new video or PDF in an existing section is news for the buyers.
      notifyLiveSectionContentAdded(live_section_id).catch((e) =>
        console.error('[content-added] live block notify failed:', e.message));
    } catch (error) {
      console.error('❌ Error creating live section block:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update a block
router.put('/live-sections/blocks/:blockId',
  verifyToken,
  requireRole('professor'),
  liveSectionContentUpload.single('file'),
  async (req, res, next) => {
    // Handle R2 upload manually after file is buffered
    if (req.file && req.file.buffer) {
      try {
        debugLog('📤 Processing R2 upload for live section block file update...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('live-sections', null, req.file.originalname, 'content');
        debugLog('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        debugLog('✅ Live section block file updated to R2:', publicUrl);
        
        // Update file object with R2 URL
        req.file.path = publicUrl;
        req.file.filename = r2Key;
      } catch (error) {
        console.error('❌ Error uploading live section block file update to R2:', error);
        return res.status(500).json({ 
          error: 'Failed to upload file to R2',
          details: error.message 
        });
      }
    }
    
    next();
  },
  async (req, res) => {
    try {
      const { blockId } = req.params;
      const { title, content } = req.body;

      // Check if the block belongs to the professor's live section
      const blockCheck = await getRow(`
        SELECT lsb.*, ls.professor_id
        FROM live_section_blocks lsb
        JOIN live_sections ls ON lsb.live_section_id = ls.id
        WHERE lsb.id = $1
      `, [blockId]);

      if (!blockCheck) {
        return res.status(404).json({ error: 'Block not found' });
      }

      if (blockCheck.professor_id != req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Update block text content
      const result = await query(
        'UPDATE live_section_blocks SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [title, content, blockId]
      );

      // Handle file upload if present
      if (req.file) {
        const fileUrl = req.file.path; // R2 public URL
        
        // Check if file already exists
        const existingFile = await getRow('SELECT * FROM live_section_files WHERE block_id = $1', [blockId]);
        
        if (existingFile) {
          // Update existing file
          await query(
            'UPDATE live_section_files SET file_name = $1, file_path = $2, file_type = $3, file_size = $4, original_name = $5 WHERE block_id = $6',
            [req.file.filename, fileUrl, req.file.mimetype, req.file.size, req.file.originalname, blockId]
          );
        } else {
          // Insert new file
          await query(
            'INSERT INTO live_section_files (live_section_id, section_id, block_id, file_name, file_path, file_type, file_size, original_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [blockCheck.live_section_id, blockCheck.section_id, blockId, req.file.filename, fileUrl, req.file.mimetype, req.file.size, req.file.originalname]
          );
        }
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating live section block:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete cover image
router.delete('/live-sections/:sectionId/cover', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Check if the section belongs to the professor
    const sectionCheck = await getRow('SELECT professor_id, cover_image_url FROM live_sections WHERE id = $1', [sectionId]);

    if (!sectionCheck) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (sectionCheck.professor_id != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete cover image from R2 if it exists
    if (sectionCheck.cover_image_url) {
      try {
        debugLog('🗑️ Deleting cover image from R2:', sectionCheck.cover_image_url);
        const key = extractKeyFromUrl(sectionCheck.cover_image_url);
        if (key && key !== sectionCheck.cover_image_url) {
          await deleteFromR2(key);
          debugLog('✅ Cover image deleted from R2:', key);
        }
      } catch (err) {
        console.error('⚠️ Error deleting cover image from R2:', err);
        // Continue with database update even if R2 deletion fails
      }
    }

    // Update database to remove cover image URL
    await query('UPDATE live_sections SET cover_image_url = NULL WHERE id = $1', [sectionId]);
    res.json({ message: 'Cover image deleted successfully' });
  } catch (error) {
    console.error('Error deleting cover image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a block
router.delete('/live-sections/blocks/:blockId', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const { blockId } = req.params;

    // Check if the block belongs to the professor's live section
    const blockCheck = await getRow(`
      SELECT lsb.*, ls.professor_id
      FROM live_section_blocks lsb
      JOIN live_sections ls ON lsb.live_section_id = ls.id
      WHERE lsb.id = $1
    `, [blockId]);

    if (!blockCheck) {
      return res.status(404).json({ error: 'Block not found' });
    }

    if (blockCheck.professor_id != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete files from R2 if block has files
    if (blockCheck.type !== 'text') {
      const files = await getRows('SELECT file_path FROM live_section_files WHERE block_id = $1', [blockId]);
      for (const file of files) {
        try {
          // Check if it's an R2 URL
          if (file.file_path && (file.file_path.startsWith('http') || file.file_path.startsWith('https'))) {
            debugLog('🗑️ Deleting R2 file:', file.file_path);
            const key = extractKeyFromUrl(file.file_path);
            if (key && key !== file.file_path) {
              await deleteFromR2(key);
              debugLog('✅ R2 file deleted:', key);
            }
          }
        } catch (err) {
          console.error('⚠️ Error deleting file from R2:', err);
          // Continue with other files even if one fails
        }
      }
      // Delete file records from database
      await query('DELETE FROM live_section_files WHERE block_id = $1', [blockId]);
    }

    // Delete the block
    await query('DELETE FROM live_section_blocks WHERE id = $1', [blockId]);
    res.json({ message: 'Block deleted successfully' });
  } catch (error) {
    console.error('Error deleting live section block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// LIVE-SECTION COMMENTS ("إسأل الاستاذ" — mirrors course_comments)
// ============================================================================

// GET comments for a live section
router.get('/live-sections/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT c.id, c.user_id, COALESCE(u.name, c.name) as name, c.comment,
              c.live_section_id, c.created_at AT TIME ZONE 'UTC' AS created_at, c.reply, c.tab, c.rating
       FROM live_section_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.live_section_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );
    const commentsWithReplies = await Promise.all(
      result.rows.map(async (comment) => {
        const repliesResult = await query(
          `SELECT r.id, r.user_id, r.user_name, r.reply_text, r.user_role, r.created_at AT TIME ZONE 'UTC' AS created_at
           FROM live_section_comment_replies r
           WHERE r.comment_id = $1
           ORDER BY r.created_at ASC`,
          [comment.id]
        );
        return { ...comment, threaded_replies: repliesResult.rows };
      })
    );
    res.json({ comments: commentsWithReplies });
  } catch (err) {
    console.error('Error fetching live section comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST a comment on a live section
router.post('/live-sections/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { name, comment, user_id, tab, rating } = req.body;
  if (!comment || !user_id || !name || !tab) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await query(
      `INSERT INTO live_section_comments (user_id, live_section_id, name, comment, tab, rating, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, user_id, live_section_id, name, comment, tab, rating, created_at`,
      [user_id, id, name, comment, tab, rating || null]
    );
    res.json({ success: true, comment: result.rows[0] });
  } catch (err) {
    console.error('Error adding live section comment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST a threaded reply on a live-section comment
router.post('/live-sections/comments/:commentId/replies', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const { reply_text } = req.body;
    if (!reply_text) return res.status(400).json({ error: 'Reply text is required' });

    const userResult = await query('SELECT name, role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userResult.rows[0];

    const commentResult = await query(
      `SELECT c.id, c.live_section_id, ls.professor_id
       FROM live_section_comments c
       JOIN live_sections ls ON c.live_section_id = ls.id
       WHERE c.id = $1`,
      [commentId]
    );
    if (commentResult.rows.length === 0) return res.status(404).json({ error: 'Comment not found' });
    const comment = commentResult.rows[0];

    let userRole = 'student';
    if (user.role === 'admin') {
      userRole = 'admin';
    } else if (user.role === 'professor' && comment.professor_id === userId) {
      userRole = 'professor';
    }

    const replyResult = await query(
      `INSERT INTO live_section_comment_replies (comment_id, user_id, user_name, reply_text, user_role, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, user_id, user_name, reply_text, user_role, created_at`,
      [commentId, userId, user.name, reply_text, userRole]
    );
    res.json({ success: true, reply: replyResult.rows[0] });
    notifyCommentReply('live_section', commentId, userId, user.name, reply_text).catch((e) =>
      console.error('[comment-reply] notify failed:', e.message));
  } catch (err) {
    console.error('Error adding live section reply:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET replies for a comment
router.get('/live-sections/comments/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const repliesResult = await query(
      `SELECT r.id, r.user_id, r.user_name, r.reply_text, r.user_role, r.created_at AT TIME ZONE 'UTC' AS created_at
       FROM live_section_comment_replies r
       WHERE r.comment_id = $1
       ORDER BY r.created_at ASC`,
      [commentId]
    );
    res.json({ replies: repliesResult.rows });
  } catch (err) {
    console.error('Error fetching live section replies:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----- PROFESSOR -----

// Sections owned by professor + comment counts
router.get('/professor/live-sections-with-comments', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const professorId = req.user.id;
    const result = await query(
      `SELECT ls.id, ls.title, ls.description, ls.price, ls.status, ls.created_at,
              ls.cover_image_url as cover_url,
              COALESCE(cc.comment_count, 0) as comment_count
       FROM live_sections ls
       LEFT JOIN (
         SELECT live_section_id, COUNT(*) as comment_count
         FROM live_section_comments
         GROUP BY live_section_id
       ) cc ON ls.id = cc.live_section_id
       WHERE ls.professor_id = $1
       ORDER BY ls.created_at DESC`,
      [professorId]
    );
    res.json({ sections: result.rows });
  } catch (err) {
    console.error('Error fetching professor live sections with comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Comments for one of the professor's sections
router.get('/professor/live-section-comments/:sectionId', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const professorId = req.user.id;
    const { sectionId } = req.params;
    const ownership = await query(
      'SELECT id FROM live_sections WHERE id = $1 AND professor_id = $2',
      [sectionId, professorId]
    );
    if (ownership.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view comments for this live section' });
    }
    const result = await query(
      `SELECT c.id, c.live_section_id, c.name, c.comment, c.tab, c.rating, c.created_at AT TIME ZONE 'UTC' AS created_at, c.reply,
              COALESCE(u.name, c.name) as student_name
       FROM live_section_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.live_section_id = $1
       ORDER BY c.created_at DESC`,
      [sectionId]
    );
    const commentsWithReplies = await Promise.all(
      result.rows.map(async (comment) => {
        const repliesResult = await query(
          `SELECT r.id, r.user_id, r.user_name, r.reply_text, r.user_role, r.created_at AT TIME ZONE 'UTC' AS created_at
           FROM live_section_comment_replies r
           WHERE r.comment_id = $1
           ORDER BY r.created_at ASC`,
          [comment.id]
        );
        return { ...comment, threaded_replies: repliesResult.rows };
      })
    );
    res.json({ comments: commentsWithReplies });
  } catch (err) {
    console.error('Error fetching professor live section comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----- ADMIN -----

// All professors with live-section comment counts
router.get('/admin/live-section-professors-with-comments', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url,
              COALESCE(comment_counts.total_comments, 0) as total_comments,
              COALESCE(section_counts.total_sections, 0) as total_courses
       FROM users u
       LEFT JOIN (
         SELECT ls.professor_id, COUNT(DISTINCT c.id) as total_comments
         FROM live_section_comments c
         JOIN live_sections ls ON c.live_section_id = ls.id
         GROUP BY ls.professor_id
       ) comment_counts ON u.id = comment_counts.professor_id
       LEFT JOIN (
         SELECT professor_id, COUNT(*) as total_sections
         FROM live_sections
         GROUP BY professor_id
       ) section_counts ON u.id = section_counts.professor_id
       WHERE u.role = 'professor'
       ORDER BY comment_counts.total_comments DESC NULLS LAST, u.name ASC`
    );
    res.json({ professors: result.rows });
  } catch (err) {
    console.error('Error fetching live-section professors with comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Live sections of a professor + comment counts (admin)
router.get('/admin/professor/:professorId/live-sections-with-comments', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { professorId } = req.params;
    const result = await query(
      `SELECT ls.id, ls.title, ls.description, ls.price, ls.status, ls.created_at,
              ls.cover_image_url as cover_url,
              COALESCE(cc.comment_count, 0) as comment_count
       FROM live_sections ls
       LEFT JOIN (
         SELECT live_section_id, COUNT(*) as comment_count
         FROM live_section_comments
         GROUP BY live_section_id
       ) cc ON ls.id = cc.live_section_id
       WHERE ls.professor_id = $1
       ORDER BY ls.created_at DESC`,
      [professorId]
    );
    res.json({ sections: result.rows });
  } catch (err) {
    console.error('Error fetching admin professor live sections with comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Comments for one section (admin)
router.get('/admin/live-section-comments/:sectionId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { sectionId } = req.params;
    const result = await query(
      `SELECT c.id, c.live_section_id, c.name, c.comment, c.tab, c.rating, c.created_at AT TIME ZONE 'UTC' AS created_at, c.reply,
              COALESCE(u.name, c.name) as student_name,
              u.id as user_id
       FROM live_section_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.live_section_id = $1
       ORDER BY c.created_at DESC`,
      [sectionId]
    );
    const commentsWithReplies = await Promise.all(
      result.rows.map(async (comment) => {
        const repliesResult = await query(
          `SELECT r.id, r.user_id, r.user_name, r.reply_text, r.user_role, r.created_at AT TIME ZONE 'UTC' AS created_at
           FROM live_section_comment_replies r
           WHERE r.comment_id = $1
           ORDER BY r.created_at ASC`,
          [comment.id]
        );
        return { ...comment, threaded_replies: repliesResult.rows };
      })
    );
    res.json({ comments: commentsWithReplies });
  } catch (err) {
    console.error('Error fetching admin live section comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin delete comment
router.delete('/admin/live-section-comments/:commentId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { commentId } = req.params;
    await query('DELETE FROM live_section_comment_replies WHERE comment_id = $1', [commentId]);
    const result = await query('DELETE FROM live_section_comments WHERE id = $1 RETURNING id', [commentId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Comment not found' });
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting live section comment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin reply
router.post('/admin/live-section-comments/:commentId/reply', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminName = req.user.name;
    const { commentId } = req.params;
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ error: 'Reply text is required' });
    const result = await query(
      `INSERT INTO live_section_comment_replies (comment_id, user_id, user_name, reply_text, user_role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, comment_id, user_id, user_name, reply_text, user_role, created_at`,
      [commentId, adminId, adminName, reply]
    );
    res.json({ success: true, reply: result.rows[0] });
    notifyCommentReply('live_section', commentId, adminId, adminName, reply).catch((e) =>
      console.error('[comment-reply] notify failed:', e.message));
  } catch (err) {
    console.error('Error adding admin live section reply:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;