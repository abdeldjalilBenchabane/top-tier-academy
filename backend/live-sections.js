import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getRows, getRow, query } from '../db.js';
import pool from '../db.js';
import { createR2Multer } from '../middleware/r2MulterStorage.js';
import { deleteFromR2, extractKeyFromUrl } from '../services/r2Service.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for live section file uploads with R2 storage
const liveSectionUpload = createR2Multer('live-sections', null, {
  fileFilter: (req, file, cb) => {
    console.log('Live section file upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Allow only image files for live section covers
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedImageTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed for live section covers!'));
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
        console.log('📤 Processing R2 upload for live section cover...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('live-sections', null, req.file.originalname, 'cover');
        console.log('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        console.log('✅ Live section cover uploaded to R2:', publicUrl);
        
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
        
        console.log(`✅ Live section creation notifications and emails sent for section ${sectionId}`);
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
      WHERE ls.status IN ('pending', 'rejected')
      ORDER BY ls.created_at ASC
    `;

    const result = await getRows(selectAllQuery);
    res.json(result);
  } catch (error) {
    console.error('Error fetching live sections:', error);
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

    if (sectionCheck.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending sections can be approved' });
    }

    const approveQuery = `
      UPDATE live_sections 
      SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(approveQuery, [adminId, sectionId]);
    
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
        
        console.log(`✅ Live section approval notifications and emails sent for section ${sectionId}`);
      }
    } catch (error) {
      console.error('Error sending live section approval notifications/emails:', error);
      // Don't fail the update if notifications fail
    }
    
    res.json(result.rows[0]);
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

    if (sectionCheck.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending sections can be rejected' });
    }

    const rejectQuery = `
      UPDATE live_sections 
      SET status = 'rejected', approved_by = $1, rejected_reason = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await query(rejectQuery, [adminId, reason, sectionId]);
    
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
        
        console.log(`✅ Live section rejection notifications and emails sent for section ${sectionId}`);
      }
    } catch (error) {
      console.error('Error sending live section rejection notifications/emails:', error);
      // Don't fail the update if notifications fail
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error rejecting live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/live-sections/approved → fetch all approved live sections for public display
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
        console.log('📤 Processing R2 upload for live section cover update...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key, deleteFromR2, extractKeyFromUrl } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('live-sections', null, req.file.originalname, 'cover');
        console.log('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        console.log('✅ Live section cover updated to R2:', publicUrl);
        
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
          console.log('🗑️ Deleting old cover image from R2:', oldSection.cover_image_url);
          const oldKey = extractKeyFromUrl(oldSection.cover_image_url);
          if (oldKey && oldKey !== oldSection.cover_image_url) {
            await deleteFromR2(oldKey);
            console.log('✅ Old cover image deleted from R2:', oldKey);
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
      scheduledAt: row.start_time ? row.start_time.toISOString() : null,
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

// Delete a live section and all related data
router.delete('/live-sections/:sectionId', verifyToken, requireRole('professor'), async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;
  
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

    await client.query('BEGIN');
    transactionStarted = true;

    console.log(`🗑️ Starting deletion of live section ${sectionId} and all related data...`);

    // 1. Delete all blocks and their files from R2
    console.log('Deleting blocks and files...');
    const blocks = await client.query('SELECT id, type FROM live_section_blocks WHERE live_section_id = $1', [sectionId]);
    
    for (const block of blocks.rows) {
      if (block.type !== 'text') {
        const files = await client.query('SELECT file_path FROM live_section_files WHERE block_id = $1', [block.id]);
        for (const file of files.rows) {
          try {
            if (file.file_path && (file.file_path.startsWith('http') || file.file_path.startsWith('https'))) {
              console.log('🗑️ Deleting R2 file:', file.file_path);
              const key = extractKeyFromUrl(file.file_path);
              if (key && key !== file.file_path) {
                await deleteFromR2(key);
                console.log('✅ R2 file deleted:', key);
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
    console.log('✅ Deleted live_section_files records');

    // 3. Delete all blocks
    await client.query('DELETE FROM live_section_blocks WHERE live_section_id = $1', [sectionId]);
    console.log('✅ Deleted live_section_blocks records');

    // 4. Delete all content sections
    await client.query('DELETE FROM live_section_sections WHERE live_section_id = $1', [sectionId]);
    console.log('✅ Deleted live_section_sections records');

    // 5. Delete all live sessions and their related data
    console.log('Deleting live sessions...');
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
    console.log('✅ Deleted live_sessions records');

    // 6. Delete live section purchases
    await client.query('DELETE FROM live_section_purchases WHERE live_section_id = $1', [sectionId]);
    console.log('✅ Deleted live_section_purchases records');

    // 7. Delete cover image from R2 if exists
    if (sectionCheck.cover_image_url) {
      try {
        console.log('🗑️ Deleting cover image from R2:', sectionCheck.cover_image_url);
        const coverKey = extractKeyFromUrl(sectionCheck.cover_image_url);
        if (coverKey && coverKey !== sectionCheck.cover_image_url) {
          await deleteFromR2(coverKey);
          console.log('✅ Cover image deleted from R2:', coverKey);
        }
      } catch (err) {
        console.error('⚠️ Error deleting cover image from R2:', err);
      }
    }

    // 8. Finally, delete the live section itself
    console.log('Deleting live section...');
    await client.query('DELETE FROM live_sections WHERE id = $1', [sectionId]);
    console.log('✅ Deleted live_sections record');

    await client.query('COMMIT');
    transactionStarted = false;
    console.log('✅ Live section and all related data deleted successfully!');
    
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

// ==================== CONTENT SECTIONS AND BLOCKS ROUTES ====================

// Configure multer for live section content files (video, pdf, images, etc.)
const liveSectionContentUpload = createR2Multer('live-sections', null, {
  fileFilter: (req, file, cb) => {
    console.log('Live section content file upload attempt:', {
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
      ORDER BY "order"
    `, [liveSectionId]);

    // Get blocks for each section
    for (let section of sections) {
      const blocks = await getRows(`
        SELECT id, type, title, content, "order"
        FROM live_section_blocks
        WHERE section_id = $1
        ORDER BY "order"
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

    const result = await query(
      'INSERT INTO live_section_sections (live_section_id, title, "order") VALUES ($1, $2, $3) RETURNING *',
      [live_section_id, title, order || 1]
    );

    res.status(201).json(result.rows[0]);
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
              console.log('🗑️ Deleting R2 file:', file.file_path);
              const key = extractKeyFromUrl(file.file_path);
              if (key && key !== file.file_path) {
                await deleteFromR2(key);
                console.log('✅ R2 file deleted:', key);
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
        console.log('📤 Processing R2 upload for live section block file...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('live-sections', null, req.file.originalname, 'content');
        console.log('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        console.log('✅ Live section block file uploaded to R2:', publicUrl);
        
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

      console.log('📝 Creating live section block with data:', { section_id, live_section_id, type, title, content });

      // Insert block
      const blockResult = await query(
        'INSERT INTO live_section_blocks (section_id, live_section_id, type, title, content, "order") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [section_id, live_section_id, type, title || null, type === 'text' ? content : '', 1]
      );
      const block = blockResult.rows[0];
      console.log('✅ Block created:', block.id);

      let fileInfo = null;
      if (type !== 'text' && req.file) {
        console.log('📁 Processing file for block:', req.file.originalname);
        
        // Use R2 URL instead of local path
        const fileUrl = req.file.path; // R2 public URL
        console.log('🔗 File URL:', fileUrl);
        
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
        
        console.log('✅ File info saved to database');
      }

      console.log('✅ Block creation completed successfully');
      res.status(201).json({ ...block, files: fileInfo ? [fileInfo] : [] });
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
        console.log('📤 Processing R2 upload for live section block file update...');
        
        // Import R2 functions
        const { uploadToR2, generateR2Key } = await import('../services/r2Service.js');
        
        // Generate R2 key
        const r2Key = generateR2Key('live-sections', null, req.file.originalname, 'content');
        console.log('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        const publicUrl = await uploadToR2(req.file.buffer, r2Key, req.file.mimetype);
        console.log('✅ Live section block file updated to R2:', publicUrl);
        
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
        console.log('🗑️ Deleting cover image from R2:', sectionCheck.cover_image_url);
        const key = extractKeyFromUrl(sectionCheck.cover_image_url);
        if (key && key !== sectionCheck.cover_image_url) {
          await deleteFromR2(key);
          console.log('✅ Cover image deleted from R2:', key);
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
            console.log('🗑️ Deleting R2 file:', file.file_path);
            const key = extractKeyFromUrl(file.file_path);
            if (key && key !== file.file_path) {
              await deleteFromR2(key);
              console.log('✅ R2 file deleted:', key);
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

export default router;