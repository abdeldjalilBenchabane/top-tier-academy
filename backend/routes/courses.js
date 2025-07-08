import express from 'express';
import { query, getRow, getRows } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const router = express.Router();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for course file uploads
const courseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;
    if (file.fieldname === 'cover') {
      uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'courses', 'covers');
    } else {
      uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'courses', 'content');
    }
    
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

const courseUpload = multer({
  storage: courseStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Course file upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Allow images for covers
    if (file.fieldname === 'cover') {
      const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedImageTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        return cb(null, true);
      } else {
        return cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed for covers!'));
      }
    }
    
    // Allow various file types for content
    const allowedContentTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|mp4|webm|mov|avi|m4v|3gp|mp3|wav|zip|rar/;
    const extname = allowedContentTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedContentTypes.test(file.mimetype) || /application\//.test(file.mimetype);
    
    if (extname || mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('File type not allowed for course content!'));
    }
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  console.error('Upload error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: error.message });
  } else if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};

// Get all courses (optionally filter by created_by)
router.get('/', async (req, res) => {
  try {
    const { created_by, status } = req.query;
    let queryStr = `
      SELECT 
        c.id, c.title, c.description, c.price, c.is_published, c.created_at,
        c.approved_at, c.created_by, c.status, u.name as created_by_name,
        m.name as material_name, cc.cover as cover_url
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN materials m ON c.material_id = m.id
      LEFT JOIN course_covers cc ON c.id = cc.course_id
      WHERE 1=1
    `;
    const params = [];
    if (created_by) {
      params.push(created_by);
      queryStr += ` AND c.created_by = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND c.status = $${params.length}`;
    }
    queryStr += ' ORDER BY c.created_at DESC';
    const courses = await getRows(queryStr, params);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get course by ID with sections and blocks
router.get('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    // Get course details
    const course = await getRow(`
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.price, 
        c.is_published, 
        c.created_at AS "createdAt",
        c.approved_at AS "approvedAt",
        c.created_by AS "createdBy",
        c.material_id AS "materialId",
        c.status,
        u.name as created_by_name,
        m.name as material_name,
        m.speciality_id AS "specialityId",
        s.year_id AS "yearId",
        y.level_id AS "levelId",
        cc.cover as cover_url
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN materials m ON c.material_id = m.id
      LEFT JOIN specialities s ON m.speciality_id = s.id
      LEFT JOIN years y ON s.year_id = y.id
      LEFT JOIN levels l ON y.level_id = l.id
      LEFT JOIN course_covers cc ON c.id = cc.course_id
      WHERE c.id = $1
    `, [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    // Get course sections
    const sections = await getRows(`
      SELECT id, title, "order"
      FROM course_sections
      WHERE course_id = $1
      ORDER BY "order"
    `, [courseId]);
    // Get blocks for each section
    for (let section of sections) {
      const blocks = await getRows(`
        SELECT id, type, title, content, "order"
        FROM section_blocks
        WHERE section_id = $1
        ORDER BY "order"
      `, [section.id]);
      // Get files for each block
      for (let block of blocks) {
        if (block.type !== 'text') {
          const files = await getRows(`
            SELECT id, file_name, file_path, file_type, file_size, original_name
            FROM course_files
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
    course.sections = sections;
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new course with file uploads
router.post('/', verifyToken, requireRole(['professor']), (req, res, next) => {
  // Use multer.any() to accept all files (cover and content blocks)
  courseUpload.any()(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, description, material_id, price, sections } = req.body;
    const created_by = req.user.id;
    // Set status: 'draft' if no material_id, else 'pending'
    const status = material_id ? 'pending' : 'draft';
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Insert new course
      const courseResult = await client.query(
        'INSERT INTO courses (title, description, material_id, created_by, price, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [title, description, material_id || null, created_by, price, status]
      );
      const courseId = courseResult.rows[0].id;
      // Handle cover upload
      if (req.files && req.files.length > 0) {
        const coverFile = req.files.find(f => f.fieldname === 'cover');
        if (coverFile) {
          const coverUrl = `/uploads/courses/covers/${coverFile.filename}`;
          await client.query(
            'INSERT INTO course_covers (course_id, cover) VALUES ($1, $2)',
            [courseId, coverUrl]
          );
        }
      }
      // Handle sections and content files
      if (sections && Array.isArray(JSON.parse(sections))) {
        const sectionsData = JSON.parse(sections);
        for (let i = 0; i < sectionsData.length; i++) {
          const section = sectionsData[i];
          // Insert section
          const sectionResult = await client.query(
            'INSERT INTO course_sections (course_id, title, "order") VALUES ($1, $2, $3) RETURNING id',
            [courseId, section.title, i + 1]
          );
          const sectionId = sectionResult.rows[0].id;
          // Insert blocks
          if (section.blocks && Array.isArray(section.blocks)) {
            for (let j = 0; j < section.blocks.length; j++) {
              const block = section.blocks[j];
              let contentValue = block.type === 'text' ? block.content || '' : '';
              const blockResult = await client.query(
                'INSERT INTO section_blocks (section_id, type, title, content, "order") VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [sectionId, block.type, block.title || null, contentValue, j + 1]
              );
              const blockId = blockResult.rows[0].id;
              // Handle content files for this block (image, pdf, video)
              if (block.type !== 'text' && req.files && req.files.length > 0) {
                // The frontend sends files as content_{blockId}
                const fileField = `content_${block.id}`;
                const file = req.files.find(f => f.fieldname === fileField);
                if (file) {
                  const fileUrl = `/uploads/courses/content/${file.filename}`;
                  await client.query(
                    'INSERT INTO course_files (course_id, section_id, block_id, file_name, file_path, file_type, file_size, original_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    [courseId, sectionId, blockId, file.filename, fileUrl, file.mimetype, file.size, file.originalname]
                  );
                }
              }
            }
          }
        }
      }
      await client.query('COMMIT');
      // Get the created course with all details
      const createdCourse = await getRow(`
        SELECT 
          c.id, 
          c.title, 
          c.description, 
          c.price, 
          c.is_published, 
          c.created_at,
          c.status,
          cc.cover as cover_url
        FROM courses c
        LEFT JOIN course_covers cc ON c.id = cc.course_id
        WHERE c.id = $1
      `, [courseId]);
      res.status(201).json(createdCourse);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint to update course path (material_id) and set status to 'pending'
router.put('/:id/approve', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const courseId = req.params.id;
    // Check if course exists
    const course = await getRow('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    // Approve the course
    const result = await query(
      'UPDATE courses SET status = $1, approved_at = NOW() WHERE id = $2 RETURNING *',
      ['approved', courseId]
    );
    // Optionally: notify the professor (not implemented here)
    res.json({ message: 'Course approved', course: result.rows[0] });
  } catch (error) {
    console.error('Error approving course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint to update course language path (language_level_id) and set status to 'pending'
router.put('/:id/language-path', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { language_level_id } = req.body;
    if (!language_level_id) {
      return res.status(400).json({ error: 'language_level_id is required' });
    }
    // Only allow the professor who created the course to update it
    const course = await getRow('SELECT id, created_by FROM courses WHERE id = $1', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (course.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own courses' });
    }
    // Update language_level_id and set status to 'pending'
    const result = await query(
      'UPDATE courses SET language_level_id = $1, status = $2 WHERE id = $3 RETURNING *',
      [language_level_id, 'pending', courseId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating course language path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint to update course cover (admin only)
router.put('/:id/cover', verifyToken, requireRole(['admin']), courseUpload.single('cover'), async (req, res) => {
  try {
    const courseId = req.params.id;
    // Check if course exists
    const course = await getRow('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    // Get old cover if exists
    const oldCover = await getRow('SELECT cover FROM course_covers WHERE course_id = $1', [courseId]);
    // Handle new cover upload
    if (!req.file) {
      return res.status(400).json({ error: 'No cover file uploaded' });
    }
    const coverUrl = `/uploads/courses/covers/${req.file.filename}`;
    // Delete old cover file if exists
    if (oldCover && oldCover.cover) {
      const oldCoverPath = path.join(__dirname, '..', '..', 'public', oldCover.cover);
      try {
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
        }
      } catch (err) {
        console.error('Error deleting old cover:', err);
      }
      // Update cover row
      await query('UPDATE course_covers SET cover = $1 WHERE course_id = $2', [coverUrl, courseId]);
    } else {
      // Insert new cover row
      await query('INSERT INTO course_covers (course_id, cover) VALUES ($1, $2) ON CONFLICT (course_id) DO UPDATE SET cover = EXCLUDED.cover', [courseId, coverUrl]);
    }
    res.json({ cover_url: coverUrl });
  } catch (error) {
    console.error('Error updating course cover:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course
router.put('/:id', verifyToken, requireRole(['professor', 'admin']), async (req, res) => {
  try {
    const { title, description, material_id, price, is_published } = req.body;
    const courseId = req.params.id;
    
    // Check if course exists
    const existingCourse = await getRow('SELECT id, created_by FROM courses WHERE id = $1', [courseId]);
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check permissions
    if (req.user.role === 'professor' && existingCourse.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own courses' });
    }
    
    // Update course
    const result = await query(
      'UPDATE courses SET title = COALESCE($1, title), description = COALESCE($2, description), material_id = COALESCE($3, material_id), price = COALESCE($4, price), is_published = COALESCE($5, is_published) WHERE id = $6 RETURNING id, title, description, price, is_published, created_at',
      [title, description, material_id, price, is_published, courseId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete course
router.delete('/:id', verifyToken, requireRole(['professor', 'admin']), async (req, res) => {
  try {
    const courseId = req.params.id;
    // Get all sections in the course
    const sections = await getRows('SELECT id FROM course_sections WHERE course_id = $1', [courseId]);
    for (const section of sections) {
      const blocks = await getRows('SELECT id FROM section_blocks WHERE section_id = $1', [section.id]);
      for (const block of blocks) {
        await deleteBlockFiles(block.id);
      }
    }
    // Now delete course (this will cascade delete sections, blocks, covers, and files in DB)
    await query('DELETE FROM courses WHERE id = $1', [courseId]);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a block and its file (if any)
router.delete('/blocks/:blockId', verifyToken, requireRole(['professor', 'admin']), async (req, res) => {
  try {
    const blockId = req.params.blockId;
    // Always treat blockId as string
    const block = await getRow('SELECT type FROM section_blocks WHERE id = $1', [blockId]);
    if (!block) return res.status(200).json({ message: 'Block already deleted', blockId });
    if (block.type !== 'text') {
      const files = await getRows('SELECT file_path FROM course_files WHERE block_id = $1', [blockId]);
      for (const file of files) {
        const filePath = path.join(__dirname, '..', '..', 'public', file.file_path);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
      // Delete file records
      await query('DELETE FROM course_files WHERE block_id = $1', [blockId]);
    }
    // Delete the block
    await query('DELETE FROM section_blocks WHERE id = $1', [blockId]);
    res.json({ message: 'Block deleted', blockId });
  } catch (error) {
    console.error('Error deleting block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper to delete files for a block
async function deleteBlockFiles(blockId) {
  const files = await getRows('SELECT file_path FROM course_files WHERE block_id = $1', [blockId]);
  for (const file of files) {
    const filePath = path.join(__dirname, '..', '..', 'public', file.file_path);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  }
  await query('DELETE FROM course_files WHERE block_id = $1', [blockId]);
}

// Create a new section
router.post('/sections', verifyToken, requireRole(['professor', 'admin']), async (req, res) => {
  try {
    const { course_id, title, order } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title are required' });
    const result = await query(
      'INSERT INTO course_sections (course_id, title, "order") VALUES ($1, $2, $3) RETURNING *',
      [course_id, title, order || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a section's title
router.put('/sections/:sectionId', verifyToken, requireRole(['professor', 'admin']), async (req, res) => {
  try {
    const sectionId = req.params.sectionId;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const result = await query('UPDATE course_sections SET title = $1 WHERE id = $2 RETURNING *', [title, sectionId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update section delete endpoint
router.delete('/sections/:sectionId', verifyToken, requireRole(['professor', 'admin']), async (req, res) => {
  try {
    const sectionId = req.params.sectionId;
    // Get all blocks in the section
    const blocks = await getRows('SELECT id FROM section_blocks WHERE section_id = $1', [sectionId]);
    for (const block of blocks) {
      await deleteBlockFiles(block.id);
    }
    await query('DELETE FROM section_blocks WHERE section_id = $1', [sectionId]);
    await query('DELETE FROM course_sections WHERE id = $1', [sectionId]);
    res.json({ message: 'Section and its blocks deleted', sectionId });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a block's title/content
router.put('/blocks/:blockId', verifyToken, requireRole(['professor', 'admin']), async (req, res) => {
  try {
    const blockId = req.params.blockId;
    const { title, content } = req.body;
    const result = await query('UPDATE section_blocks SET title = $1, content = $2 WHERE id = $3 RETURNING *', [title, content, blockId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new block in a section
router.post('/blocks', verifyToken, requireRole(['professor', 'admin']), courseUpload.single('file'), async (req, res) => {
  try {
    const { section_id, type, title, content } = req.body;
    if (!section_id || !type) return res.status(400).json({ error: 'section_id and type are required' });
    // Insert block
    const blockResult = await query(
      'INSERT INTO section_blocks (section_id, type, title, content, "order") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [section_id, type, title || null, type === 'text' ? content : '', 1]
    );
    const block = blockResult.rows[0];
    let fileInfo = null;
    if (type !== 'text' && req.file) {
      const fileUrl = `/uploads/courses/content/${req.file.filename}`;
      await query(
        'INSERT INTO course_files (section_id, block_id, file_name, file_path, file_type, file_size, original_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [section_id, block.id, req.file.filename, fileUrl, req.file.mimetype, req.file.size, req.file.originalname]
      );
      fileInfo = {
        file_name: req.file.filename,
        file_path: fileUrl,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        original_name: req.file.originalname
      };
    }
    res.status(201).json({ ...block, files: fileInfo ? [fileInfo] : [] });
  } catch (error) {
    console.error('Error creating block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get materials for course creation
router.get('/materials/list', async (req, res) => {
  try {
    const materials = await getRows(`
      SELECT 
        m.id, 
        m.name, 
        m.price,
        s.name as speciality_name,
        y.name as year_name,
        l.name as level_name
      FROM materials m
      LEFT JOIN specialities s ON m.speciality_id = s.id
      LEFT JOIN years y ON s.year_id = y.id
      LEFT JOIN levels l ON y.level_id = l.id
      ORDER BY l.name, y.name, s.name, m.name
    `);
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to scan course files and folders
router.get('/admin/scan-files', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const coursesDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'courses');
    const coversDir = path.join(coursesDir, 'covers');
    const contentDir = path.join(coursesDir, 'content');
    
    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) {
        return [];
      }
      
      const items = [];
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          items.push({
            name: file,
            type: 'directory',
            path: filePath,
            size: null,
            modified: stat.mtime
          });
        } else {
          items.push({
            name: file,
            type: 'file',
            path: filePath,
            size: stat.size,
            modified: stat.mtime
          });
        }
      }
      
      return items;
    };
    
    const result = {
      covers: scanDirectory(coversDir),
      content: scanDirectory(contentDir),
      totalCovers: 0,
      totalContentFiles: 0,
      totalSize: 0
    };
    
    // Calculate totals
    result.totalCovers = result.covers.filter(item => item.type === 'file').length;
    result.totalContentFiles = result.content.filter(item => item.type === 'file').length;
    result.totalSize = [...result.covers, ...result.content]
      .filter(item => item.type === 'file')
      .reduce((sum, item) => sum + (item.size || 0), 0);
    
    res.json(result);
  } catch (error) {
    console.error('Error scanning course files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 