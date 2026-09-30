import express from 'express';
import { notifyCommentReply } from '../services/commentReplyNotify.js';
import { notifyCourseContentAdded, courseIdOfSection } from '../services/contentUpdateNotify.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getRows, getRow, query } from '../db.js';
import pool from '../db.js';
import { createR2Multer } from '../middleware/r2MulterStorage.js';
import { deleteFromR2, extractKeyFromUrl, uploadToR2, generateR2Key } from '../services/r2Service.js';
import { uploadProgressService } from '../services/uploadProgressService.js';
import { debugLog } from '../utils/logger.js';
import { fileURLToPath } from 'url';

// This file is an ES module, where __dirname does not exist. Three places
// below reached for it anyway: the two legacy local-file branches threw
// ReferenceError into a catch that logged and carried on, and the admin
// scan-files endpoint threw it straight back as a 500.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

// Configure multer for course file uploads with R2 storage
const courseUpload = createR2Multer('courses', null, {
  fileFilter: (req, file, cb) => {
    debugLog('Course file upload attempt:', {
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
  console.error('❌ Upload error:', error);
  console.error('Error type:', error.constructor.name);
  console.error('Error message:', error.message);
  
  if (error instanceof multer.MulterError) {
    console.error('Multer error code:', error.code);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 100GB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Maximum is 5 files.',
        code: 'TOO_MANY_FILES'
      });
    }
    
    return res.status(400).json({ 
      error: error.message,
      code: error.code
    });
  } else if (error) {
    return res.status(400).json({ 
      error: error.message,
      code: 'UPLOAD_ERROR'
    });
  }
  next();
};

// Get all courses (optionally filter by created_by)
router.get('/', async (req, res) => {
  try {
    const { created_by, status, material_id, speciality_id } = req.query;
    let queryStr = `
      SELECT 
        c.id, c.title, c.description, c.price, c.is_published as "isPublished", c.created_at as "createdAt",
        c.approved_at as "approvedAt", c.created_by as "createdBy", c.status, u.name as created_by_name,
        m.name as material_name, m.price as material_price, m.speciality_id as "specialityId", cc.cover as cover_url,
        c.language_level_id as "languageLevelId", c.material_id as "materialId",
        s.name as speciality_name,
        ll.name as language_level_name,
        l.name as language_name,
        COALESCE(sy.name, dy.name) as year_name,
        COALESCE(sl.name, dl.name) as level_name
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN materials m ON c.material_id = m.id
      LEFT JOIN specialities s ON m.speciality_id = s.id
      LEFT JOIN years sy ON s.year_id = sy.id
      LEFT JOIN levels sl ON sy.level_id = sl.id
      LEFT JOIN years dy ON m.year_id = dy.id
      LEFT JOIN levels dl ON dy.level_id = dl.id
      LEFT JOIN language_levels ll ON c.language_level_id = ll.id
      LEFT JOIN languages l ON ll.language_id = l.id
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
    if (material_id) {
      params.push(material_id);
      queryStr += ` AND c.material_id = $${params.length}`;
    }
    if (speciality_id) {
      params.push(speciality_id);
      queryStr += ` AND m.speciality_id = $${params.length}`;
    }
    queryStr += ' ORDER BY c.created_at DESC';
    const courses = await getRows(queryStr, params);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all language course prices
router.get('/language-course-prices', async (req, res) => {
  try {
    debugLog('Fetching language course prices...');
    const result = await query('SELECT * FROM language_course_prices', []);
    debugLog('Language course prices fetched:', result.rows.length, 'records');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching language course prices:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
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
        c.language_level_id,
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
      ORDER BY "order", id
    `, [courseId]);
    // Get blocks for each section
    for (let section of sections) {
      const blocks = await getRows(`
        SELECT id, type, title, content, "order"
        FROM section_blocks
        WHERE section_id = $1
        ORDER BY "order", id
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
  debugLog('📝 Course creation request received');
  
  // Use multer.any() to accept all files (cover and content blocks)
  courseUpload.any()(req, res, async (err) => {
    if (err) {
      console.error('❌ Multer error in course creation:', err);
      return handleUploadError(err, req, res, next);
    }
    debugLog('✅ Multer processing completed');
    debugLog('📦 Request body after multer:', req.body);
    debugLog('📦 Request body keys:', req.body ? Object.keys(req.body) : 'No body');
    debugLog('📦 Processed files:', req.files ? req.files.length : 'No files');
    
    // Upload files to R2 if they exist
    if (req.files && req.files.length > 0) {
      debugLog('📤 Uploading files to R2...');
      for (const file of req.files) {
        debugLog(`📁 Processing file: ${file.originalname}`);
        debugLog(`📊 File size: ${file.size}`);
        debugLog(`📦 Spooled to: ${file.path || '(nothing)'}`);
        
        if (file.path) {
          try {
            // Check file size and warn for large files
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 50) {
              debugLog(`⚠️ Large file detected: ${file.originalname} (${fileSizeMB.toFixed(1)}MB)`);
            }
            
            // Generate upload ID for progress tracking
            const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            
            // Start progress tracking
            uploadProgressService.startUpload(uploadId, file.size, file.originalname);
            debugLog('📊 Started progress tracking for:', uploadId);
            
            // Generate R2 key
            const r2Key = generateR2Key('courses', null, file.originalname, file.fieldname);
            debugLog('🔑 Generated R2 key:', r2Key);
            
            // Upload to R2
            debugLog(`📤 Starting upload for ${file.originalname} (${fileSizeMB.toFixed(1)}MB)...`);
            const publicUrl = await uploadToR2(file, r2Key, file.mimetype);
            debugLog('✅ File uploaded to R2:', publicUrl);
            
            // Mark upload as completed
            uploadProgressService.completeUpload(uploadId, true);
            debugLog('✅ Progress tracking completed for:', uploadId);
            
            // Update file object with R2 URL
            file.path = publicUrl;
            file.filename = r2Key;
            file.uploadId = uploadId; // Store upload ID for frontend
          } catch (error) {
            console.error('❌ Error uploading file to R2:', error);
            
            // Mark upload as failed
            if (file.uploadId) {
              uploadProgressService.completeUpload(file.uploadId, false, error.message);
            }
            
            if (error.message.includes('timeout')) {
              debugLog(`⚠️ File ${file.originalname} upload timed out, skipping...`);
              // Continue with course creation but mark this file as failed
              file.uploadFailed = true;
              file.error = 'Upload timed out';
            } else {
              debugLog(`⚠️ File ${file.originalname} upload failed, skipping...`);
              file.uploadFailed = true;
              file.error = error.message;
            }
          }
        } else {
          console.error('❌ File buffer not available for:', file.originalname);
          return res.status(400).json({ error: 'File buffer not available' });
        }
      }
    }
    
    next();
  });
}, async (req, res) => {
  try {
    debugLog('🎯 Starting course creation process...');
    debugLog('📋 Request body:', req.body || 'No body');
    debugLog('📁 Files received:', req.files ? req.files.length : 0);
    
    const { title, description, material_id, price, sections } = req.body;
    const created_by = req.user.id;
    
    debugLog('👤 User ID:', created_by);
    debugLog('📝 Course title:', title);
    debugLog('📝 Course description:', description);
    
    // Set status: 'draft' if no material_id, else 'pending'
    const status = material_id ? 'pending' : 'draft';
    debugLog('📊 Course status:', status);
    
    // Validate required fields
    if (!title || !description) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    debugLog('✅ Validation passed, starting database transaction...');
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      debugLog('✅ Database transaction started');
      
      // Insert new course - set price to null if empty or '0' to use material price
      const coursePrice = (!price || price === '0' || price === 0) ? null : price;
      debugLog('💰 Course price:', coursePrice);
      
      const courseResult = await client.query(
        'INSERT INTO courses (title, description, material_id, created_by, price, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [title, description, material_id || null, created_by, coursePrice, status]
      );
      const courseId = courseResult.rows[0].id;
      debugLog('✅ Course created with ID:', courseId);
      
      // Handle cover upload
      if (req.files && req.files.length > 0) {
        const coverFile = req.files.find(f => f.fieldname === 'cover');
        if (coverFile && !coverFile.uploadFailed) {
          debugLog('🖼️ Processing cover file:', coverFile.originalname);
          // Use R2 URL instead of local path
          const coverUrl = coverFile.path; // R2 public URL
          await client.query(
            'INSERT INTO course_covers (course_id, cover) VALUES ($1, $2)',
            [courseId, coverUrl]
          );
          debugLog('✅ Cover uploaded to R2:', coverUrl);
        } else if (coverFile && coverFile.uploadFailed) {
          debugLog('⚠️ Cover file upload failed, skipping cover...');
        }
      }
      
      // Handle sections and content files
      if (sections && Array.isArray(JSON.parse(sections))) {
        const sectionsData = JSON.parse(sections);
        debugLog('📚 Processing sections:', sectionsData.length);
        
        for (let i = 0; i < sectionsData.length; i++) {
          const section = sectionsData[i];
          debugLog(`📖 Processing section ${i + 1}:`, section.title);
          
          // Insert section
          const sectionResult = await client.query(
            'INSERT INTO course_sections (course_id, title, "order") VALUES ($1, $2, $3) RETURNING id',
            [courseId, section.title, i + 1]
          );
          const sectionId = sectionResult.rows[0].id;
          debugLog('✅ Section created with ID:', sectionId);
          
          // Insert blocks
          if (section.blocks && Array.isArray(section.blocks)) {
            debugLog(`📝 Processing ${section.blocks.length} blocks for section ${sectionId}`);
            
            for (let j = 0; j < section.blocks.length; j++) {
              const block = section.blocks[j];
              debugLog(`📄 Processing block ${j + 1}:`, block.type);
              
              let contentValue = block.type === 'text' ? block.content || '' : '';
              const blockResult = await client.query(
                'INSERT INTO section_blocks (section_id, type, title, content, "order") VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [sectionId, block.type, block.title || null, contentValue, j + 1]
              );
              const blockId = blockResult.rows[0].id;
              debugLog('✅ Block created with ID:', blockId);
              
              // Handle content files for this block (image, pdf, video)
              if (block.type !== 'text' && req.files && req.files.length > 0) {
                // The frontend sends files as content_{blockId}
                const fileField = `content_${block.id}`;
                const file = req.files.find(f => f.fieldname === fileField);
                if (file && !file.uploadFailed) {
                  debugLog(`📁 Processing file for block ${blockId}:`, file.originalname);
                  // Use R2 URL instead of local path
                  const fileUrl = file.path; // R2 public URL
                  await client.query(
                    'INSERT INTO course_files (course_id, section_id, block_id, file_name, file_path, file_type, file_size, original_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    [courseId, sectionId, blockId, file.filename, fileUrl, file.mimetype, file.size, file.originalname]
                  );
                  debugLog('✅ File uploaded to R2:', fileUrl);
                } else if (file && file.uploadFailed) {
                  debugLog(`⚠️ File upload failed for block ${blockId}: ${file.originalname}`);
                } else {
                  debugLog(`⚠️ No file found for block ${blockId} with field ${fileField}`);
                }
              }
            }
          }
        }
      }
      
      await client.query('COMMIT');
      debugLog('✅ Database transaction committed');
      
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
      
      debugLog('✅ Course creation completed successfully');
      
      // Collect upload IDs from processed files
      const uploadIds = {};
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.uploadId) {
            uploadIds[file.fieldname] = file.uploadId;
          }
        });
      }
      
      res.status(201).json({
        ...createdCourse,
        uploadIds
      });
      
    } catch (error) {
      console.error('❌ Database error:', error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Course creation error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create course',
      details: error.message 
    });
  }
});

// Add endpoint to get complete course path data
router.get('/:id/path', verifyToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Get course with complete path details
    const result = await query(`
      SELECT 
        c.id, 
        c.title, 
        c.status, 
        c.material_id, 
        c.language_level_id,
        m.name as material_name,
        m.speciality_id,
        m.year_id,
        s.name as speciality_name,
        s.year_id as speciality_year_id,
        y.name as year_name,
        y.level_id,
        l.name as level_name,
        ll.name as language_level_name,
        lang.name as language_name
      FROM courses c
      LEFT JOIN materials m ON c.material_id = m.id
      LEFT JOIN specialities s ON m.speciality_id = s.id
      LEFT JOIN years y ON m.year_id = y.id OR s.year_id = y.id
      LEFT JOIN levels l ON y.level_id = l.id
      LEFT JOIN language_levels ll ON c.language_level_id = ll.id
      LEFT JOIN languages lang ON ll.language_id = lang.id
      WHERE c.id = $1
    `, [courseId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const course = result.rows[0];
    
    // Build the path string
    let path = '';
    let pathType = '';
    
    if (course.language_level_id) {
      // Language path
      pathType = 'language';
      if (course.language_name) {
        path += course.language_name;
      }
      if (course.language_level_name) {
        path += path ? ` > ${course.language_level_name}` : course.language_level_name;
      }
    } else if (course.material_id) {
      // Education path
      pathType = 'education';
      if (course.level_name) {
        path += course.level_name;
      }
      if (course.year_name) {
        path += path ? ` > ${course.year_name}` : course.year_name;
      }
      if (course.speciality_name) {
        path += path ? ` > ${course.speciality_name}` : course.speciality_name;
      }
      if (course.material_name) {
        path += path ? ` > ${course.material_name}` : course.material_name;
      }
    }
    
    res.json({
      courseId: course.id,
      pathType,
      path,
      details: {
        level: course.level_name,
        year: course.year_name,
        speciality: course.speciality_name,
        material: course.material_name,
        language: course.language_name,
        languageLevel: course.language_level_name
      }
    });
  } catch (error) {
    console.error('Error getting course path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint for admins to assign material path to approved courses without path
router.put('/:id/assign-material-admin', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { material_id } = req.body;
    
    if (!material_id) {
      return res.status(400).json({ error: 'material_id is required' });
    }
    
    // Check if course exists
    const course = await getRow('SELECT id, status, material_id FROM courses WHERE id = $1', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Only allow assigning to approved courses
    if (course.status !== 'approved') {
      return res.status(400).json({ error: 'Can only assign paths to approved courses' });
    }
    
    // Update course with material_id (allow updating existing material_id)
    const result = await query(
      'UPDATE courses SET material_id = $1 WHERE id = $2 RETURNING *',
      [material_id, courseId]
    );
    
    res.json({ message: 'Course path assigned successfully', course: result.rows[0] });
  } catch (error) {
    console.error('Error assigning material path (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint for admins to create material and assign to approved course
router.put('/:id/create-material-admin', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { name, price, speciality_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Material name is required' });
    }
    
    // Check if course exists
    const course = await getRow('SELECT id, status, material_id FROM courses WHERE id = $1', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Only allow assigning to approved courses that don't have a material_id
    if (course.status !== 'approved') {
      return res.status(400).json({ error: 'Can only assign paths to approved courses' });
    }
    
    if (course.material_id) {
      return res.status(400).json({ error: 'Course already has a material path assigned' });
    }
    
    // Check if speciality exists if provided
    if (speciality_id) {
      const speciality = await getRow('SELECT * FROM specialities WHERE id = $1', [speciality_id]);
      if (!speciality) {
        return res.status(400).json({ error: 'Speciality not found' });
      }
    }
    
    // Start transaction to create material and assign to course
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create the material
      const materialResult = await client.query(
        'INSERT INTO materials (name, speciality_id, price) VALUES ($1, $2, $3) RETURNING *',
        [name, speciality_id || null, price || 0]
      );
      
      const materialId = materialResult.rows[0].id;
      
      // Update course with material_id
      const courseResult = await client.query(
        'UPDATE courses SET material_id = $1 WHERE id = $2 RETURNING *',
        [materialId, courseId]
      );
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Material created and course path assigned successfully', 
        course: courseResult.rows[0],
        material: materialResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating material and assigning to course (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint for admins to assign language path to approved courses without path
router.put('/:id/assign-language-admin', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { language_level_id, price } = req.body;
    
    if (!language_level_id) {
      return res.status(400).json({ error: 'language_level_id is required' });
    }
    
    // 0 is a price — a free language course — so only an empty or
    // non-numeric value counts as missing.
    if (price === undefined || price === null || price === '' || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'Valid price is required for language courses' });
    }
    
    // Check if course exists
    const course = await getRow('SELECT id, status, language_level_id FROM courses WHERE id = $1', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Only allow assigning to approved courses that don't have a language_level_id
    if (course.status !== 'approved') {
      return res.status(400).json({ error: 'Can only assign paths to approved courses' });
    }
    
    // Reassigning was refused outright, which made changing a course's path
    // impossible — the one thing this screen exists to do.
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update course with language_level_id
      await client.query(
        // Clearing the material matters when moving a course across from the
        // education path: left behind, it would still read as a school course.
        'UPDATE courses SET language_level_id = $1, material_id = NULL WHERE id = $2',
        [language_level_id, courseId]
      );
      
      // Set price for this language course
      await client.query(
        'INSERT INTO language_course_prices (course_id, language_level_id, price) VALUES ($1, $2, $3) ON CONFLICT (course_id, language_level_id) DO UPDATE SET price = EXCLUDED.price',
        [courseId, language_level_id, price]
      );
      
      await client.query('COMMIT');
      
      const result = await getRow('SELECT * FROM courses WHERE id = $1', [courseId]);
      res.json({ message: 'Course language path and price assigned successfully', course: result });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error assigning language path (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint for professors to assign material path to their draft courses
router.put('/:id/assign-material', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { material_id } = req.body;
    
    if (!material_id) {
      return res.status(400).json({ error: 'material_id is required' });
    }
    
    // Check if course exists and belongs to the professor
    const course = await getRow('SELECT id, created_by, status FROM courses WHERE id = $1', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only assign paths to your own courses' });
    }
    
    if (course.status !== 'draft') {
      return res.status(400).json({ error: 'Can only assign paths to draft courses' });
    }
    
    // Update course with material_id and set status to 'pending'
    const result = await query(
      'UPDATE courses SET material_id = $1, status = $2 WHERE id = $3 RETURNING *',
      [material_id, 'pending', courseId]
    );
    
    // Send notifications and emails for course path assignment
    try {
      // Import notification and email services
      const NotificationService = (await import('../services/notificationService.js')).default;
      const { sendCourseCreatedEmailToAdmin } = await import('../services/emailService.js');

      // Get professor information
      const professorRes = await query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
      const professor = professorRes.rows[0];

      // Get course title
      const courseTitle = result.rows[0].title;

      // Send notifications to all admins
      await NotificationService.notifyCourseCreated(
        courseId,
        courseTitle,
        professor.name,
        req.user.id
      );

      // Send emails to all admins
      const adminRes = await query('SELECT name, email FROM users WHERE role = $1', ['admin']);
      for (const admin of adminRes.rows) {
        await sendCourseCreatedEmailToAdmin(
          admin.email,
          admin.name,
          professor.name,
          courseTitle
        );
      }

      debugLog(`✅ Course path assignment notifications and emails sent for course ${courseId}`);
    } catch (error) {
      console.error('Error sending course path assignment notifications/emails:', error);
      // Don't fail the path assignment if notifications fail
    }
    
    res.json({ message: 'Course path assigned successfully', course: result.rows[0] });
  } catch (error) {
    console.error('Error assigning material path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint for professors to create material and assign to course
router.put('/:id/create-material', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { name, price, speciality_id, year_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Material name is required' });
    }
    
    if (!year_id) {
      return res.status(400).json({ error: 'Year ID is required' });
    }
    
    // Check if course exists and belongs to the professor
    const course = await getRow('SELECT id, created_by, status FROM courses WHERE id = $1', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only assign paths to your own courses' });
    }
    
    if (course.status !== 'draft') {
      return res.status(400).json({ error: 'Can only assign paths to draft courses' });
    }
    
    // Check if year exists
    const year = await getRow('SELECT * FROM years WHERE id = $1', [year_id]);
    if (!year) {
      return res.status(400).json({ error: 'Year not found' });
    }
    
    // Check if speciality exists if provided
    if (speciality_id) {
      const speciality = await getRow('SELECT * FROM specialities WHERE id = $1', [speciality_id]);
      if (!speciality) {
        return res.status(400).json({ error: 'Speciality not found' });
      }
    }
    
    // Start transaction to create material and assign to course
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create the material with both year_id and speciality_id
      const materialResult = await client.query(
        'INSERT INTO materials (name, year_id, speciality_id, price) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, year_id, speciality_id || null, price || 0]
      );
      
      const materialId = materialResult.rows[0].id;
      
      // Update course with material_id and set status to pending
      const courseResult = await client.query(
        'UPDATE courses SET material_id = $1, status = $2 WHERE id = $3 RETURNING *',
        [materialId, 'pending', courseId]
      );
      
      await client.query('COMMIT');
      
      // Send notifications and emails for course path assignment
      try {
        // Import notification and email services
        const NotificationService = (await import('../services/notificationService.js')).default;
        const { sendCourseCreatedEmailToAdmin } = await import('../services/emailService.js');

        // Get professor information
        const professorRes = await query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
        const professor = professorRes.rows[0];

        // Get course title
        const courseTitle = courseResult.rows[0].title;

        // Send notifications to all admins
        await NotificationService.notifyCourseCreated(
          courseId,
          courseTitle,
          professor.name,
          req.user.id
        );

        // Send emails to all admins
        const adminRes = await query('SELECT name, email FROM users WHERE role = $1', ['admin']);
        for (const admin of adminRes.rows) {
          await sendCourseCreatedEmailToAdmin(
            admin.email,
            admin.name,
            professor.name,
            courseTitle
          );
        }

        debugLog(`✅ Course path assignment notifications and emails sent for course ${courseId}`);
      } catch (error) {
        console.error('Error sending course path assignment notifications/emails:', error);
        // Don't fail the path assignment if notifications fail
      }
      
      res.json({ 
        message: 'Material created and course path assigned successfully', 
        course: courseResult.rows[0],
        material: materialResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating material and assigning to course:', error);
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
    
    // Check if course has a material_id (for education courses) or language_level_id (for language courses)
    if (!course.material_id && !course.language_level_id) {
      return res.status(400).json({ error: 'Course must have a material path or language path assigned before approval' });
    }
    
    // Get course creator information
    const courseCreatorRes = await query(
      'SELECT created_by FROM courses WHERE id = $1',
      [courseId]
    );
    
    if (courseCreatorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const professorId = courseCreatorRes.rows[0].created_by;
    
    // Get professor information
    const professorRes = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [professorId]
    );
    
    const professor = professorRes.rows[0];
    
    // Update course status to approved, preserving existing material_id and language_level_id
    const result = await query(
      'UPDATE courses SET status = $1, approved_at = NOW() WHERE id = $2 RETURNING *',
      ['approved', courseId]
    );
    
    // Send notifications and emails for course approval
    try {
      // Import notification and email services
      const NotificationService = (await import('../services/notificationService.js')).default;
      const { sendCourseApprovedEmailToProfessor } = await import('../services/emailService.js');

      // Get admin information
      const adminRes = await query('SELECT name FROM users WHERE id = $1', [req.user.id]);
      const admin = adminRes.rows[0];

      // Send notification to professor
      await NotificationService.notifyCourseApproved(
        courseId,
        result.rows[0].title,
        professorId,
        professor.name,
        admin.name
      );

      // Send email to professor
      await sendCourseApprovedEmailToProfessor(
        professor.email,
        professor.name,
        result.rows[0].title,
        admin.name
      );

      debugLog(`✅ Course approval notifications and emails sent for course ${courseId}`);
    } catch (error) {
      console.error('Error sending course approval notifications/emails:', error);
      // Don't fail the approval if notifications fail
    }
    
    res.json({ message: 'Course approved', course: result.rows[0] });
  } catch (error) {
    console.error('Error approving course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint to reject a course
router.put('/:id/reject', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { reason } = req.body;
    
    // Check if course exists
    const course = await getRow('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get course creator information
    const courseCreatorRes = await query(
      'SELECT created_by FROM courses WHERE id = $1',
      [courseId]
    );
    
    if (courseCreatorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const professorId = courseCreatorRes.rows[0].created_by;
    
    // Get professor information
    const professorRes = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [professorId]
    );
    
    const professor = professorRes.rows[0];
    
    // Update course status to rejected
    const result = await query(
      'UPDATE courses SET status = $1, rejected_at = NOW() WHERE id = $2 RETURNING *',
      ['rejected', courseId]
    );
    
    // Send notifications and emails for course rejection
    try {
      // Import notification and email services
      const NotificationService = (await import('../services/notificationService.js')).default;
      const { sendCourseRejectedEmailToProfessor } = await import('../services/emailService.js');

      // Get admin information
      const adminRes = await query('SELECT name FROM users WHERE id = $1', [req.user.id]);
      const admin = adminRes.rows[0];

      // Send notification to professor
      await NotificationService.notifyCourseRejected(
        courseId,
        result.rows[0].title,
        professorId,
        professor.name,
        admin.name,
        reason
      );

      // Send email to professor
      await sendCourseRejectedEmailToProfessor(
        professor.email,
        professor.name,
        result.rows[0].title,
        admin.name,
        reason
      );

      debugLog(`✅ Course rejection notifications and emails sent for course ${courseId}`);
    } catch (error) {
      console.error('Error sending course rejection notifications/emails:', error);
      // Don't fail the rejection if notifications fail
    }
    
    res.json({ message: 'Course rejected', course: result.rows[0] });
  } catch (error) {
    console.error('Error rejecting course:', error);
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
    
    // Send notifications and emails for course path assignment
    try {
      // Import notification and email services
      const NotificationService = (await import('../services/notificationService.js')).default;
      const { sendCourseCreatedEmailToAdmin } = await import('../services/emailService.js');

      // Get professor information
      const professorRes = await query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
      const professor = professorRes.rows[0];

      // Get course title
      const courseTitle = result.rows[0].title;

      // Send notifications to all admins
      await NotificationService.notifyCourseCreated(
        courseId,
        courseTitle,
        professor.name,
        req.user.id
      );

      // Send emails to all admins
      const adminRes = await query('SELECT name, email FROM users WHERE role = $1', ['admin']);
      for (const admin of adminRes.rows) {
        await sendCourseCreatedEmailToAdmin(
          admin.email,
          admin.name,
          professor.name,
          courseTitle
        );
      }

      debugLog(`✅ Course path assignment notifications and emails sent for course ${courseId}`);
    } catch (error) {
      console.error('Error sending course path assignment notifications/emails:', error);
      // Don't fail the path assignment if notifications fail
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating course language path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint to update course cover (admin or professor who owns the course)
router.put('/:id/cover', (req, res, next) => {
  debugLog('🔄 Cover upload request received');
  debugLog('📋 Request headers:', req.headers);
  debugLog('📋 Request method:', req.method);
  debugLog('📋 Request URL:', req.url);
  debugLog('📋 Request body type:', typeof req.body);
  next();
}, (req, res, next) => {
  debugLog('🔐 Verifying token...');
  next();
}, verifyToken, (req, res, next) => {
  debugLog('✅ Token verified, user:', req.user);
  next();
}, requireRole(['admin', 'professor']), (req, res, next) => {
  debugLog('✅ Role verified, processing upload...');
  next();
}, courseUpload.single('cover'), async (req, res, next) => {
  debugLog('📁 File upload processed:', req.file);
  
  // Handle R2 upload manually after file is buffered
  if (req.file && req.file.path) {
    try {
      debugLog('📤 Processing R2 upload for cover...');
      
      // Generate R2 key
      const r2Key = generateR2Key('courses', null, req.file.originalname, 'cover');
      debugLog('🔑 Generated R2 key:', r2Key);
      
      // Upload to R2
      const publicUrl = await uploadToR2(req.file, r2Key, req.file.mimetype);
      debugLog('✅ Cover uploaded to R2:', publicUrl);
      
      // Update file object with R2 URL
      req.file.path = publicUrl;
      req.file.filename = r2Key;
    } catch (error) {
      console.error('❌ Error uploading cover to R2:', error);
      return res.status(500).json({ 
        error: 'Failed to upload cover to R2',
        details: error.message 
      });
    }
  }
  
  next();
}, async (req, res) => {
  try {
    debugLog('🔄 Cover upload started for course:', req.params.id);
  } catch (error) {
    console.error('❌ Error in cover upload middleware:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ 
      error: 'Middleware error',
      details: error.message 
    });
  }
  
  try {
    
    const courseId = req.params.id;
    
    // Check if course exists
    const course = await getRow('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (!course) {
      debugLog('❌ Course not found:', courseId);
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // If professor, check ownership
    if (req.user.role === 'professor' && course.created_by !== req.user.id) {
      debugLog('❌ Permission denied for course:', courseId);
      return res.status(403).json({ error: 'You can only update your own courses' });
    }
    
    // Handle new cover upload
    if (!req.file) {
      debugLog('❌ No file uploaded');
      return res.status(400).json({ error: 'No cover file uploaded' });
    }
    
    debugLog('📁 File uploaded:', req.file.originalname, 'Size:', req.file.size);
    
    // Use R2 URL instead of local path
    const coverUrl = req.file.path; // R2 public URL
    debugLog('🔗 New cover URL:', coverUrl);
    
    // Get old cover if exists
    const oldCover = await getRow('SELECT cover FROM course_covers WHERE course_id = $1', [courseId]);
    debugLog('📷 Old cover:', oldCover?.cover);
    
    // Delete old cover file from R2 if exists
    if (oldCover && oldCover.cover) {
      try {
        debugLog('🗑️ Deleting old cover from R2...');
        const oldKey = extractKeyFromUrl(oldCover.cover);
        debugLog('🔑 Old key extracted:', oldKey);
        
        if (oldKey && oldKey !== oldCover.cover) {
          await deleteFromR2(oldKey);
          debugLog('✅ Old cover deleted from R2');
        }
      } catch (err) {
        console.error('⚠️ Error deleting old cover from R2:', err);
        // Don't fail the upload if old cover deletion fails
      }
    }
    
    // Update or insert cover row
    if (oldCover) {
      debugLog('📝 Updating existing cover row...');
      await query('UPDATE course_covers SET cover = $1 WHERE course_id = $2', [coverUrl, courseId]);
    } else {
      debugLog('📝 Inserting new cover row...');
      await query('INSERT INTO course_covers (course_id, cover) VALUES ($1, $2) ON CONFLICT (course_id) DO UPDATE SET cover = EXCLUDED.cover', [courseId, coverUrl]);
    }
    
    debugLog('✅ Cover upload completed successfully');
    res.json({ cover_url: coverUrl });
    
  } catch (error) {
    console.error('❌ Error updating course cover:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
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
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query('BEGIN');
    transactionStarted = true;
    const courseId = req.params.id;
    
    // Check if course exists and verify ownership (for professors)
    const courseResult = await client.query('SELECT id, created_by FROM courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(404).json({ error: 'Course not found' });
    }
    const course = courseResult.rows[0];
    
    // Verify professor can only delete their own courses
    if (req.user.role === 'professor' && course.created_by !== req.user.id) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(403).json({ error: 'You can only delete your own courses' });
    }
    
    debugLog(`🗑️ Starting deletion of course ${courseId} and all related data...`);
    
    // Helper function to execute query with savepoint for non-critical operations
    const executeWithSavepoint = async (queryFn, operationName) => {
      const savepointName = `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        await client.query(`SAVEPOINT ${savepointName}`);
        await queryFn();
        await client.query(`RELEASE SAVEPOINT ${savepointName}`);
      } catch (err) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`).catch(() => {});
        debugLog(`⚠️ Error in ${operationName}, continuing...`, err.message);
      }
    };
    
    // 1. Delete quiz-related data
    debugLog('Deleting quiz data...');
    await executeWithSavepoint(async () => {
      await client.query(`
        DELETE FROM quiz_attempt_answers 
        WHERE attempt_id IN (
          SELECT id FROM quiz_attempts 
          WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = $1)
        )
      `, [courseId]);
      
      await client.query(`
        DELETE FROM quiz_attempts 
        WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = $1)
      `, [courseId]);
      
      await client.query(`
        DELETE FROM quiz_answers 
        WHERE question_id IN (
          SELECT id FROM quiz_questions 
          WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = $1)
        )
      `, [courseId]);
      
      await client.query(`
        DELETE FROM quiz_questions 
        WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = $1)
      `, [courseId]);
      
      await client.query('DELETE FROM quizzes WHERE course_id = $1', [courseId]);
    }, 'quiz data deletion');
    
    // 2. Delete comment-related data
    debugLog('Deleting comment data...');
    await executeWithSavepoint(async () => {
      await client.query(`
        DELETE FROM comment_replies 
        WHERE comment_id IN (SELECT id FROM course_comments WHERE course_id = $1)
      `, [courseId]);
      
      await client.query('DELETE FROM course_comments WHERE course_id = $1', [courseId]);
    }, 'comment data deletion');
    
    // 3. Delete course files from R2 and database
    debugLog('Deleting course files...');
    await executeWithSavepoint(async () => {
      const courseFilesResult = await client.query('SELECT file_path FROM course_files WHERE course_id = $1', [courseId]);
      for (const file of courseFilesResult.rows) {
        if (file.file_path) {
          try {
            const fileKey = extractKeyFromUrl(file.file_path);
            if (fileKey && fileKey !== file.file_path) {
              await deleteFromR2(fileKey);
              debugLog('✅ Deleted file from R2:', fileKey);
            }
          } catch (err) {
            console.error('⚠️ Error deleting file from R2:', err);
          }
        }
      }
      await client.query('DELETE FROM course_files WHERE course_id = $1', [courseId]);
    }, 'course files deletion');
    
    // 4. Delete section blocks and their files
    debugLog('Deleting section blocks...');
    await executeWithSavepoint(async () => {
      const sectionsResult = await client.query('SELECT id FROM course_sections WHERE course_id = $1', [courseId]);
      for (const section of sectionsResult.rows) {
        const blocksResult = await client.query('SELECT id FROM section_blocks WHERE section_id = $1', [section.id]);
        for (const block of blocksResult.rows) {
          // Delete block files from R2
          const blockFilesResult = await client.query('SELECT file_path FROM course_files WHERE block_id = $1', [block.id]);
          for (const file of blockFilesResult.rows) {
            if (file.file_path) {
              try {
                const fileKey = extractKeyFromUrl(file.file_path);
                if (fileKey && fileKey !== file.file_path) {
                  await deleteFromR2(fileKey);
                }
              } catch (err) {
                console.error('⚠️ Error deleting block file from R2:', err);
              }
            }
          }
          await client.query('DELETE FROM course_files WHERE block_id = $1', [block.id]);
        }
        await client.query('DELETE FROM section_blocks WHERE section_id = $1', [section.id]);
      }
    }, 'section blocks deletion');
    
    // 5. Delete course sections
    await executeWithSavepoint(async () => {
      await client.query('DELETE FROM course_sections WHERE course_id = $1', [courseId]);
    }, 'course sections deletion');
    
    // 6. Delete student course enrollments and purchases
    debugLog('Deleting student enrollments and purchases...');
    // Try to delete from course_purchases if table exists
    await executeWithSavepoint(async () => {
      await client.query('DELETE FROM course_purchases WHERE course_id = $1', [courseId]);
    }, 'course_purchases deletion');
    
    // Delete from course_enrollments if table exists (do this first as it might have CASCADE)
    await executeWithSavepoint(async () => {
      await client.query('DELETE FROM course_enrollments WHERE course_id = $1', [courseId]);
      debugLog('✅ Deleted course_enrollments records');
    }, 'course_enrollments deletion');
    
    // Delete from student_courses (this is where purchases are actually stored)
    // This MUST succeed - it's critical for purchased courses
    // Don't use savepoint here - if this fails, we need to know about it
    const deleteResult = await client.query('DELETE FROM student_courses WHERE course_id = $1', [courseId]);
    debugLog(`✅ Deleted ${deleteResult.rowCount} student_courses records`);
    
    // 7. Delete activities related to this course
    debugLog('Deleting activities...');
    await executeWithSavepoint(async () => {
      await client.query(`
        DELETE FROM activities 
        WHERE related_id = $1 OR extra::text LIKE '%"course_id":' || $1 || '%'
      `, [courseId]);
    }, 'activities deletion');
    
    // 8. Delete course cover from R2 if exists
    await executeWithSavepoint(async () => {
      const courseCoverResult = await client.query('SELECT cover FROM course_covers WHERE course_id = $1', [courseId]);
      if (courseCoverResult.rows.length > 0 && courseCoverResult.rows[0].cover) {
        try {
          debugLog('🗑️ Deleting course cover from R2:', courseCoverResult.rows[0].cover);
          const coverKey = extractKeyFromUrl(courseCoverResult.rows[0].cover);
          if (coverKey && coverKey !== courseCoverResult.rows[0].cover) {
            await deleteFromR2(coverKey);
            debugLog('✅ Course cover deleted from R2:', coverKey);
          }
        } catch (err) {
          console.error('⚠️ Error deleting course cover from R2:', err);
        }
      }
    }, 'course cover R2 deletion');
    
    // 9. Delete course cover from database
    await executeWithSavepoint(async () => {
      await client.query('DELETE FROM course_covers WHERE course_id = $1', [courseId]);
    }, 'course cover database deletion');
    
    // 10. Delete point transactions related to this course (in metadata)
    debugLog('Deleting point transactions related to course...');
    await executeWithSavepoint(async () => {
      await client.query(`
        DELETE FROM point_transactions 
        WHERE metadata::text LIKE '%"course_id":' || $1 || '%'
      `, [courseId]);
    }, 'point transactions deletion');
    
    // 11. Delete video views and security logs
    debugLog('Deleting video views and security logs...');
    await executeWithSavepoint(async () => {
      await client.query('DELETE FROM video_views WHERE course_id = $1', [courseId]);
    }, 'video_views deletion');
    await executeWithSavepoint(async () => {
      await client.query('DELETE FROM video_security_logs WHERE course_id = $1', [courseId]);
    }, 'video_security_logs deletion');
    
    // 12. Delete language course prices if exists
    await executeWithSavepoint(async () => {
      await client.query('DELETE FROM language_course_prices WHERE course_id = $1', [courseId]);
    }, 'language_course_prices deletion');
    
    // 13. Delete live_sessions that reference this course (if course_id column exists)
    await executeWithSavepoint(async () => {
      // First check if column exists by trying to query it
      const liveSessionsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'live_sessions' AND column_name = 'course_id'
      `);
      if (liveSessionsResult.rows.length > 0) {
        // Delete purchases for live sessions related to this course
        await client.query(`
          DELETE FROM purchases 
          WHERE session_id IN (SELECT id FROM live_sessions WHERE course_id = $1)
        `, [courseId]);
        // Delete live sessions
        await client.query('DELETE FROM live_sessions WHERE course_id = $1', [courseId]);
        debugLog('✅ Deleted live_sessions related to course');
      }
    }, 'live_sessions deletion');
    
    // 15. Finally, delete the course itself
    // If there are still foreign key constraints, this will fail and we'll catch it
    debugLog('Deleting course...');
    await client.query('DELETE FROM courses WHERE id = $1', [courseId]);
    
    await client.query('COMMIT');
    transactionStarted = false;
    debugLog('✅ Course and all related data deleted successfully!');
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    // Only rollback if transaction is still active
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Error during rollback:', rollbackErr);
      }
    }
    console.error('❌ Error deleting course:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      schema: error.schema,
      column: error.column
    });
    
    // Return detailed error for debugging
    const errorResponse = {
      error: 'Failed to delete course',
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table
    };
    
    res.status(500).json(errorResponse);
  } finally {
    client.release();
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
        try {
          // Check if it's an R2 URL
          if (file.file_path && (file.file_path.startsWith('http') || file.file_path.startsWith('https'))) {
            debugLog('🗑️ Deleting R2 file:', file.file_path);
            const key = extractKeyFromUrl(file.file_path);
            if (key && key !== file.file_path) {
              await deleteFromR2(key);
              debugLog('✅ R2 file deleted:', key);
            }
          } else {
            // Local file deletion (fallback)
            const filePath = path.join(__dirname, '..', '..', 'public', file.file_path);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              debugLog('✅ Local file deleted:', filePath);
            }
          }
        } catch (err) {
          console.error('⚠️ Error deleting file:', err);
          // Continue with other files even if one fails
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
    try {
      // Check if it's an R2 URL
      if (file.file_path && (file.file_path.startsWith('http') || file.file_path.startsWith('https'))) {
        debugLog('🗑️ Deleting R2 file:', file.file_path);
        const key = extractKeyFromUrl(file.file_path);
        if (key && key !== file.file_path) {
          await deleteFromR2(key);
          debugLog('✅ R2 file deleted:', key);
        }
      } else {
        // Local file deletion (fallback)
        const filePath = path.join(__dirname, '..', '..', 'public', file.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          debugLog('✅ Local file deleted:', filePath);
        }
      }
    } catch (err) {
      console.error('⚠️ Error deleting file:', err);
      // Continue with other files even if one fails
    }
  }
  await query('DELETE FROM course_files WHERE block_id = $1', [blockId]);
}

// Create a new section
router.post('/sections', verifyToken, requireRole(['professor', 'admin']), async (req, res) => {
  try {
    const { course_id, title, order } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title are required' });
    // No explicit order means "put it last". It used to mean 1, so every
    // section a professor added landed with the same order and the list came
    // back in whatever order the planner chose — the random order bug.
    const result = await query(
      `INSERT INTO course_sections (course_id, title, "order")
       VALUES ($1, $2, COALESCE($3::int,
         (SELECT COALESCE(MAX("order"), 0) + 1 FROM course_sections WHERE course_id = $1)))
       RETURNING *`,
      [course_id, title, order ?? null]
    );
    res.status(201).json(result.rows[0]);

    // Students who bought this course hear about it. Fire and forget: the
    // teacher's upload must not wait on a fan-out.
    notifyCourseContentAdded(course_id).catch((e) =>
      console.error('[content-added] course section notify failed:', e.message));
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
router.post('/blocks', verifyToken, requireRole(['professor', 'admin']), courseUpload.single('file'), async (req, res, next) => {
  debugLog('📁 Block creation request received');
  
  // Handle R2 upload manually after file is buffered
  if (req.file && req.file.path) {
    try {
      debugLog('📤 Processing R2 upload for block file...');
      
      // Generate R2 key
      const r2Key = generateR2Key('courses', null, req.file.originalname, 'content');
      debugLog('🔑 Generated R2 key:', r2Key);
      
      // Upload to R2
      const publicUrl = await uploadToR2(req.file, r2Key, req.file.mimetype);
      debugLog('✅ Block file uploaded to R2:', publicUrl);
      
      // Update file object with R2 URL
      req.file.path = publicUrl;
      req.file.filename = r2Key;
    } catch (error) {
      console.error('❌ Error uploading block file to R2:', error);
      return res.status(500).json({ 
        error: 'Failed to upload block file to R2',
        details: error.message 
      });
    }
  }
  
  next();
}, async (req, res) => {
  try {
    const { section_id, type, title, content } = req.body;
    if (!section_id || !type) return res.status(400).json({ error: 'section_id and type are required' });
    
    debugLog('📝 Creating block with data:', { section_id, type, title, content });
    
    // Insert block
    // Same as sections: a new block belongs at the end of its section, not
    // tied with every other block at order 1.
    const blockResult = await query(
      `INSERT INTO section_blocks (section_id, type, title, content, "order")
       VALUES ($1, $2, $3, $4,
         (SELECT COALESCE(MAX("order"), 0) + 1 FROM section_blocks WHERE section_id = $1))
       RETURNING *`,
      [section_id, type, title || null, type === 'text' ? content : '']
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
      
      debugLog('✅ File info saved to database');
    }
    
    debugLog('✅ Block creation completed successfully');
    res.status(201).json({ ...block, files: fileInfo ? [fileInfo] : [] });

    // Adding a video or a PDF to an existing section is news too. The block
    // only knows its section, so resolve the course it belongs to.
    courseIdOfSection(section_id)
      .then((courseId) => notifyCourseContentAdded(courseId))
      .catch((e) => console.error('[content-added] course block notify failed:', e.message));
  } catch (error) {
    console.error('❌ Error creating block:', error);
    console.error('Stack trace:', error.stack);
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

// Set price for a language course
router.post('/language-course-price', async (req, res) => {
  const { course_id, language_level_id, price } = req.body;
  if (!course_id || !language_level_id || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Insert or update price for this course/language_level
    await query(
      'INSERT INTO language_course_prices (course_id, language_level_id, price) VALUES ($1, $2, $3) ON CONFLICT (course_id, language_level_id) DO UPDATE SET price = EXCLUDED.price',
      [course_id, language_level_id, price]
    );
    // Update course status to pending and set language_level_id
    await query(
      'UPDATE courses SET status = $1, language_level_id = $2 WHERE id = $3',
      ['pending', language_level_id, course_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting language course price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for a specific course created by the logged-in professor
router.get('/professor/comments/:courseId', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const professorId = req.user.id;
    const { courseId } = req.params;
    
    // First verify that the course belongs to this professor
    const courseCheck = await query(
      'SELECT id FROM courses WHERE id = $1 AND created_by = $2',
      [courseId, professorId]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view comments for this course' });
    }
    
    const result = await query(
      `SELECT 
         c.id, c.course_id, c.name, c.comment, c.tab, c.rating, c.created_at AT TIME ZONE 'UTC' AS created_at, c.reply,
         COALESCE(u.name, c.name) as student_name
       FROM course_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.course_id = $1
       ORDER BY c.created_at DESC`,
      [courseId]
    );
    
    // Get threaded replies for each comment
    const commentsWithReplies = await Promise.all(
      result.rows.map(async (comment) => {
        const repliesResult = await query(
          `SELECT r.id, r.user_id, r.user_name, r.reply_text, r.user_role, r.created_at AT TIME ZONE 'UTC' AS created_at
           FROM comment_replies r
           WHERE r.comment_id = $1
           ORDER BY r.created_at ASC`,
          [comment.id]
        );
        return {
          ...comment,
          threaded_replies: repliesResult.rows
        };
      })
    );
    
    res.json({ comments: commentsWithReplies });
  } catch (err) {
    console.error('Error fetching course comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all courses with comment counts for the logged-in professor
router.get('/professor/courses-with-comments', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const professorId = req.user.id;
    const result = await query(
      `SELECT 
         c.id, c.title, c.description, c.price, c.status, c.created_at,
         cc.cover as cover_url,
         COALESCE(comment_counts.comment_count, 0) as comment_count
       FROM courses c
       LEFT JOIN course_covers cc ON c.id = cc.course_id
       LEFT JOIN (
         SELECT course_id, COUNT(*) as comment_count
         FROM course_comments
         GROUP BY course_id
       ) comment_counts ON c.id = comment_counts.course_id
       WHERE c.created_by = $1
       ORDER BY c.created_at DESC`,
      [professorId]
    );
    
    res.json({ courses: result.rows });
  } catch (err) {
    console.error('Error fetching professor courses with comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all comments for courses created by the logged-in professor (from course_comments) - LEGACY ENDPOINT
router.get('/professor/comments', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const professorId = req.user.id;
    const result = await query(
      `SELECT 
         c.id, c.course_id, c.name, c.comment, c.tab, c.rating, c.created_at AT TIME ZONE 'UTC' AS created_at, c.reply,
         COALESCE(u.name, c.name) as student_name,
         crs.title as course_title
       FROM course_comments c
       LEFT JOIN users u ON c.user_id = u.id
       JOIN courses crs ON c.course_id = crs.id
       WHERE crs.created_by = $1
       ORDER BY c.created_at DESC`,
      [professorId]
    );
    
    // Get threaded replies for each comment
    const commentsWithReplies = await Promise.all(
      result.rows.map(async (comment) => {
        const repliesResult = await query(
          `SELECT r.id, r.user_id, r.user_name, r.reply_text, r.user_role, r.created_at AT TIME ZONE 'UTC' AS created_at
           FROM comment_replies r
           WHERE r.comment_id = $1
           ORDER BY r.created_at ASC`,
          [comment.id]
        );
        return {
          ...comment,
          threaded_replies: repliesResult.rows
        };
      })
    );
    
    res.json({ comments: commentsWithReplies });
  } catch (err) {
    console.error('Error fetching professor comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for a course and tab (now from course_comments table)
// Also handles getting all comments by a user when id is 'user' and userId is provided
router.get('/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { tab, userId } = req.query;
  
  try {
    let result;
    
    // If id is 'user', get all comments by a specific user
    if (id === 'user' && userId) {
      result = await query(
        `SELECT c.id, c.user_id, u.name, c.comment, c.course_id, c.section_id, c.created_at AT TIME ZONE 'UTC' AS created_at, c.reply, c.tab, c.rating,
                crs.title as course_title
         FROM course_comments c
         LEFT JOIN users u ON c.user_id = u.id
         JOIN courses crs ON c.course_id = crs.id
         WHERE c.user_id = $1
         ORDER BY c.created_at DESC`,
        [userId]
      );
    } else {
      // Get comments for a specific course
      result = await query(
        `SELECT c.id, c.user_id, u.name, c.comment, c.course_id, c.section_id, c.created_at AT TIME ZONE 'UTC' AS created_at, c.reply, c.tab, c.rating
         FROM course_comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.course_id = $1
         ORDER BY c.created_at DESC`,
        [id]
      );
    }
    
    // Get threaded replies for each comment
    const commentsWithReplies = await Promise.all(
      result.rows.map(async (comment) => {
        const repliesResult = await query(
          `SELECT r.id, r.user_id, r.user_name, r.reply_text, r.user_role, r.created_at AT TIME ZONE 'UTC' AS created_at
           FROM comment_replies r
           WHERE r.comment_id = $1
           ORDER BY r.created_at ASC`,
          [comment.id]
        );
        return {
          ...comment,
          threaded_replies: repliesResult.rows
        };
      })
    );
    
    res.json({ comments: commentsWithReplies });
  } catch (err) {
    console.error('Error fetching course comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a comment to a course (now to course_comments table)
router.post('/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { name, comment, user_id, section_id, tab, rating } = req.body;
  if (!comment || !user_id || !name || !tab) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await query(
      `INSERT INTO course_comments (user_id, course_id, section_id, name, comment, tab, rating, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id, user_id, course_id, section_id, name, comment, tab, rating, created_at` ,
      [user_id, id, section_id || null, name, comment, tab, rating || null]
    );
    res.json({ success: true, comment: result.rows[0] });
  } catch (err) {
    console.error('Error adding course comment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a threaded reply to a comment (for both students and professors)
router.post('/comments/:commentId/replies', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const { reply_text } = req.body;
    
    if (!reply_text) return res.status(400).json({ error: 'Reply text is required' });
    
    // Get user info
    const userResult = await query('SELECT name, role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = userResult.rows[0];
    
    // Check if comment exists and get course info
    const commentResult = await query(
      `SELECT c.id, c.course_id, crs.created_by as course_creator_id 
       FROM course_comments c 
       JOIN courses crs ON c.course_id = crs.id 
       WHERE c.id = $1`,
      [commentId]
    );
    
    if (commentResult.rows.length === 0) return res.status(404).json({ error: 'Comment not found' });
    
    const comment = commentResult.rows[0];
    
    // Determine user role for this reply
    let userRole = 'student';
    if (user.role === 'professor' && comment.course_creator_id === userId) {
      userRole = 'professor';
    }
    
    // Add the reply
    const replyResult = await query(
      `INSERT INTO comment_replies (comment_id, user_id, user_name, reply_text, user_role, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, user_id, user_name, reply_text, user_role, created_at`,
      [commentId, userId, user.name, reply_text, userRole]
    );
    
    res.json({ success: true, reply: replyResult.rows[0] });
    notifyCommentReply('course', commentId, userId, user.name, reply_text).catch((e) =>
      console.error('[comment-reply] notify failed:', e.message));
  } catch (err) {
    console.error('Error adding threaded reply:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get threaded replies for a specific comment
router.get('/comments/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const repliesResult = await query(
      `SELECT r.id, r.user_id, r.user_name, r.reply_text, r.user_role, r.created_at AT TIME ZONE 'UTC' AS created_at
       FROM comment_replies r
       WHERE r.comment_id = $1
       ORDER BY r.created_at ASC`,
      [commentId]
    );
    
    res.json({ replies: repliesResult.rows });
  } catch (err) {
    console.error('Error fetching threaded replies:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all comments made by a specific user (dynamic - works for any user)
router.get('/all-comments-by-user/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify the user is requesting their own comments
    if (req.user.id != userId) {
      return res.status(403).json({ error: 'Not authorized to view these comments' });
    }
    
    const result = await query(
      `SELECT 
         c.id, c.course_id, c.user_id, c.name, c.comment, c.tab, c.rating, c.created_at AT TIME ZONE 'UTC' AS created_at, c.reply,
         COALESCE(u.name, c.name) as student_name,
         crs.title as course_title
       FROM course_comments c
       LEFT JOIN users u ON c.user_id = u.id
       JOIN courses crs ON c.course_id = crs.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    
    // Get threaded replies for each comment
    const commentsWithReplies = await Promise.all(
      result.rows.map(async (comment) => {
        const repliesResult = await query(
          `SELECT r.id, r.user_id, r.user_name, r.reply_text, r.user_role, r.created_at AT TIME ZONE 'UTC' AS created_at
           FROM comment_replies r
           WHERE r.comment_id = $1
           ORDER BY r.created_at ASC`,
          [comment.id]
        );
        return {
          ...comment,
          threaded_replies: repliesResult.rows
        };
      })
    );
    
    debugLog(`Found ${commentsWithReplies.length} comments for user ${userId}`);
    res.json({ comments: commentsWithReplies });
  } catch (err) {
    console.error('Error fetching user comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Professor replies to a comment (update reply column in course_comments) - KEEP FOR BACKWARD COMPATIBILITY
router.post('/professor/comments/:commentId/reply', verifyToken, requireRole(['professor']), async (req, res) => {
  try {
    const professorId = req.user.id;
    const { commentId } = req.params;
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ error: 'Reply is required' });
    // Ensure the comment belongs to a course created by this professor
    const check = await query(
      `SELECT c.id FROM course_comments c JOIN courses crs ON c.course_id = crs.id WHERE c.id = $1 AND crs.created_by = $2`,
      [commentId, professorId]
    );
    if (check.rows.length === 0) return res.status(403).json({ error: 'Not allowed' });
    await query(
      `UPDATE course_comments SET reply = $1 WHERE id = $2`,
      [reply, commentId]
    );
    res.json({ success: true });
    notifyCommentReply('course', commentId, professorId, req.user.name, reply).catch((e) =>
      console.error('[comment-reply] notify failed:', e.message));
  } catch (err) {
    console.error('Error replying to comment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ ADMIN COMMENT MANAGEMENT ============

// Get all professors/teachers with comment counts (Admin only)
router.get('/admin/professors-with-comments', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await query(
      `SELECT 
         u.id, u.name, u.email, u.avatar_url,
         COALESCE(comment_counts.total_comments, 0) as total_comments,
         COALESCE(course_counts.total_courses, 0) as total_courses
       FROM users u
       LEFT JOIN (
         SELECT crs.created_by, COUNT(DISTINCT cc.id) as total_comments
         FROM course_comments cc
         JOIN courses crs ON cc.course_id = crs.id
         GROUP BY crs.created_by
       ) comment_counts ON u.id = comment_counts.created_by
       LEFT JOIN (
         SELECT created_by, COUNT(*) as total_courses
         FROM courses
         GROUP BY created_by
       ) course_counts ON u.id = course_counts.created_by
       WHERE u.role = 'professor'
       ORDER BY comment_counts.total_comments DESC NULLS LAST, u.name ASC`
    );
    
    res.json({ professors: result.rows });
  } catch (err) {
    console.error('Error fetching professors with comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all courses for a specific professor with comment counts (Admin only)
router.get('/admin/professor/:professorId/courses-with-comments', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { professorId } = req.params;
    
    const result = await query(
      `SELECT 
         c.id, c.title, c.description, c.price, c.status, c.created_at,
         cc.cover as cover_url,
         COALESCE(comment_counts.comment_count, 0) as comment_count
       FROM courses c
       LEFT JOIN course_covers cc ON c.id = cc.course_id
       LEFT JOIN (
         SELECT course_id, COUNT(*) as comment_count
         FROM course_comments
         GROUP BY course_id
       ) comment_counts ON c.id = comment_counts.course_id
       WHERE c.created_by = $1
       ORDER BY c.created_at DESC`,
      [professorId]
    );
    
    res.json({ courses: result.rows });
  } catch (err) {
    console.error('Error fetching professor courses with comments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all comments for a specific course (Admin only)
router.get('/admin/comments/:courseId', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const result = await query(
      `SELECT 
         c.id, c.course_id, c.name, c.comment, c.tab, c.rating, c.created_at AT TIME ZONE 'UTC' AS created_at, c.reply,
         COALESCE(u.name, c.name) as student_name,
         u.id as user_id
       FROM course_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.course_id = $1
       ORDER BY c.created_at DESC`,
      [courseId]
    );
    
    // Get threaded replies for each comment
    const commentsWithReplies = await Promise.all(
      result.rows.map(async (comment) => {
        const repliesResult = await query(
          `SELECT r.id, r.user_id, r.user_name, r.reply_text, r.user_role, r.created_at AT TIME ZONE 'UTC' AS created_at
           FROM comment_replies r
           WHERE r.comment_id = $1
           ORDER BY r.created_at ASC`,
          [comment.id]
        );
        return {
          ...comment,
          threaded_replies: repliesResult.rows
        };
      })
    );
    
    res.json({ comments: commentsWithReplies });
  } catch (err) {
    console.error('Error fetching course comments for admin:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment (Admin only)
router.delete('/admin/comments/:commentId', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // First delete all threaded replies
    await query('DELETE FROM comment_replies WHERE comment_id = $1', [commentId]);
    
    // Then delete the comment
    const result = await query('DELETE FROM course_comments WHERE id = $1 RETURNING id', [commentId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin reply to a comment (threaded reply)
router.post('/admin/comments/:commentId/reply', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminName = req.user.name;
    const { commentId } = req.params;
    const { reply } = req.body;
    
    if (!reply) {
      return res.status(400).json({ error: 'Reply text is required' });
    }
    
    const result = await query(
      `INSERT INTO comment_replies (comment_id, user_id, user_name, reply_text, user_role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, comment_id, user_id, user_name, reply_text, user_role, created_at`,
      [commentId, adminId, adminName, reply]
    );
    
    res.json({ success: true, reply: result.rows[0] });
    notifyCommentReply('course', commentId, adminId, adminName, reply).catch((e) =>
      console.error('[comment-reply] notify failed:', e.message));
  } catch (err) {
    console.error('Error adding admin reply:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 