import express from 'express';
import { verifyToken, requireProfessor, requireAdmin } from '../middleware/auth.js';
import pool from '../db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';

const router = express.Router();

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for live section file uploads
const liveSectionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', '..', 'public', 'uploads', 'live-sections');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const liveSectionUpload = multer({
  storage: liveSectionStorage,
  fileFilter: (req, file, cb) => {
    console.log('Live section file upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Allow images for covers
    if (file.fieldname === 'cover_image') {
      const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedImageTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        return cb(null, true);
      } else {
        return cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed for covers!'));
      }
    }
    
    return cb(null, true);
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  console.error('Upload error:', error);
  
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  } else if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', '..', '..', 'public', 'uploads', 'live-sections');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all live sections for a professor
router.get('/professors/:professorId/live-sections', verifyToken, requireProfessor, async (req, res) => {
  try {
    const { professorId } = req.params;
    
    // Verify the professor is accessing their own sections
    if (req.user.id != professorId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const query = `
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

    const result = await pool.query(query, [professorId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching live sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new live section
router.post('/professors/:professorId/live-sections', 
  verifyToken, 
  requireProfessor, 
  liveSectionUpload.single('cover_image'),
  handleUploadError,
  async (req, res) => {
  try {
    console.log('[DEBUG] Creating live section...');
    console.log('[DEBUG] Request body:', req.body);
    console.log('[DEBUG] Request file:', req.file);
    console.log('[DEBUG] User:', req.user);
    
    const { title, description, price, level_id, year_id, speciality_id, material_id, language_id, language_level_id } = req.body;
    const professor_id = req.user.id;
    const professor_name = req.user.name;

    // Validate required fields
    if (!title || !description || !price) {
      return res.status(400).json({ error: 'Title, description, and price are required' });
    }

    // Get telegram_channel from request body (optional)
    const telegram_channel = req.body.telegram_channel || null;

    const query = `
      INSERT INTO live_sections (
        professor_id, professor_name, title, description, price, 
        level_id, year_id, speciality_id, material_id, language_id, language_level_id,
        telegram_channel, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await pool.query(query, [
      professor_id, professor_name, title, description, price,
      level_id, year_id, speciality_id, material_id, language_id, language_level_id,
      telegram_channel, 'draft'
    ]);
    
    console.log('[DEBUG] Live section created:', result.rows[0]);
    
    // Handle cover upload if present
    let cover_image_url = null;
    if (req.file) {
      cover_image_url = `/uploads/live-sections/${req.file.filename}`;
      await pool.query(
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
router.post('/live-sections/:sectionId/assign-path', verifyToken, requireProfessor, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { 
      rootType, 
      levelId, yearId, specialityId, materialId,
      languageId, languageLevelId 
    } = req.body;

    // Check if the section belongs to the professor and is in draft status
    const sectionCheck = await pool.query(
      'SELECT professor_id, status FROM live_sections WHERE id = $1',
      [sectionId]
    );

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (sectionCheck.rows[0].professor_id != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (sectionCheck.rows[0].status !== 'draft') {
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
      if (!levelId || !yearId || !specialityId || !materialId) {
        return res.status(400).json({ error: 'All education hierarchy fields are required' });
      }
      updateFields.level_id = levelId;
      updateFields.year_id = yearId;
      updateFields.speciality_id = specialityId;
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

    const query = `
      UPDATE live_sections 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const values = [sectionId, ...Object.values(updateFields)];
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning path to live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all live sections (pending and rejected)
router.get('/admin/live-sections/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const query = `
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

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching live sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all pending live sections
router.get('/admin/live-sections/pending', verifyToken, requireAdmin, async (req, res) => {
  try {
    const query = `
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

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending live sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Approve a live section
router.post('/admin/live-sections/:sectionId/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const adminId = req.user.id;

    // Check if the section exists and is pending
    const sectionCheck = await pool.query(
      'SELECT status FROM live_sections WHERE id = $1',
      [sectionId]
    );

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (sectionCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending sections can be approved' });
    }

    const query = `
      UPDATE live_sections 
      SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [adminId, sectionId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Reject a live section
router.post('/admin/live-sections/:sectionId/reject', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Check if the section exists and is pending
    const sectionCheck = await pool.query(
      'SELECT status FROM live_sections WHERE id = $1',
      [sectionId]
    );

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (sectionCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending sections can be rejected' });
    }

    const query = `
      UPDATE live_sections 
      SET status = 'rejected', approved_by = $1, rejected_reason = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [adminId, reason, sectionId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error rejecting live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/live-sections/approved → fetch all approved live sections for public display
router.get('/live-sections/approved', async (req, res) => {
    try {
        const query = `
            SELECT 
                ls.*,
                l.name as language_name,
                ll.name as language_level_name,
                u.name as professor_name,
                u.email as professor_email,
                (SELECT COUNT(*) FROM live_sessions WHERE section_id = ls.id) as live_sessions_count
            FROM live_sections ls
            LEFT JOIN languages l ON ls.language_id = l.id
            LEFT JOIN language_levels ll ON ls.language_level_id = ll.id
            LEFT JOIN users u ON ls.professor_id = u.id
            WHERE ls.status = 'approved'
            ORDER BY ls.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
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
    const purchaseRes = await pool.query(
      'SELECT * FROM live_section_purchases WHERE live_section_id = $1 AND student_id = $2',
      [sectionId, userId]
    );

    const hasPurchased = purchaseRes.rows.length > 0;

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
  requireProfessor, 
  liveSectionUpload.single('cover_image'),
  handleUploadError,
  async (req, res) => {
  try {
    
    const { sectionId } = req.params;
    const { title, description, price, telegram_channel } = req.body;

    // Check if the section belongs to the professor
    const sectionCheck = await pool.query(
      'SELECT professor_id FROM live_sections WHERE id = $1',
      [sectionId]
    );

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (sectionCheck.rows[0].professor_id != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const query = `
      UPDATE live_sections 
      SET title = $1, description = $2, price = $3, telegram_channel = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;

    const result = await pool.query(query, [title, description, price, telegram_channel, sectionId]);
    
    // Handle cover upload if present
    if (req.file) {
      const coverUrl = `/uploads/live-sections/${req.file.filename}`;
      await pool.query(
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

    const query = `
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

    const result = await pool.query(query, [sectionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get live sessions for a specific section
router.get('/live-sections/:sectionId/sessions', async (req, res) => {
  console.log('[DEBUG] 🔥 ENDPOINT HIT: /live-sections/:sectionId/sessions');
  console.log('[DEBUG] Section ID:', req.params.sectionId);
  
  try {
    const { sectionId } = req.params;
    console.log('[DEBUG] Fetching sessions for section:', sectionId);

    const query = `
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

    const result = await pool.query(query, [sectionId]);
    console.log('[DEBUG] Database result:', result.rows);
    console.log('[DEBUG] First session start_time:', result.rows[0]?.start_time);
    
    // Convert Date objects to ISO strings for proper JSON serialization
    const processedRows = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      scheduledAt: row.start_time ? row.start_time.toISOString() : null,
      duration: row.duration,
      price: row.price,
      cover_image_url: row.cover_image_url,
      created_at: row.created_at ? row.created_at.toISOString() : null,
      updated_at: row.updated_at ? row.updated_at.toISOString() : null,
      status: row.status
    }));
    
    console.log('[DEBUG] Processed rows:', processedRows);
    
    res.json(processedRows);
  } catch (error) {
    console.error('Error fetching live sessions for section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a live section (only if it's in draft status)
router.delete('/live-sections/:sectionId', verifyToken, requireProfessor, async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Check if the section belongs to the professor and is in draft status
    const sectionCheck = await pool.query(
      'SELECT professor_id, status FROM live_sections WHERE id = $1',
      [sectionId]
    );

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Live section not found' });
    }

    if (sectionCheck.rows[0].professor_id != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (sectionCheck.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Only draft sections can be deleted' });
    }

    await pool.query('DELETE FROM live_sections WHERE id = $1', [sectionId]);
    res.json({ message: 'Live section deleted successfully' });
  } catch (error) {
    console.error('Error deleting live section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;