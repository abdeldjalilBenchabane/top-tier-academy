import express from 'express';
import { query, getRow, getRows } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '../public/uploads/slides';
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

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'));
    }
  }
});

// Get all slides (admin only)
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const slides = await getRows(`
      SELECT 
        es.*,
        u.name as created_by_name,
        array_agg(sta.audience_role) as target_audience_roles
      FROM enhanced_slides es
      LEFT JOIN users u ON es.created_by = u.id
      LEFT JOIN slide_target_audience sta ON es.id = sta.slide_id
      GROUP BY es.id, u.name
      ORDER BY es."order" ASC, es.created_at DESC
    `);

    res.json({ slides });
  } catch (error) {
    console.error('Error fetching slides:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active slides for homepage (public)
router.get('/active', async (req, res) => {
  try {
    const slides = await getRows(`
      SELECT 
        es.*,
        array_agg(sta.audience_role) FILTER (WHERE sta.audience_role IS NOT NULL) as target_audience_roles
      FROM enhanced_slides es
      LEFT JOIN slide_target_audience sta ON es.id = sta.slide_id
      WHERE es.is_active = true
        AND (es.start_date IS NULL OR es.start_date <= CURRENT_TIMESTAMP)
        AND (es.end_date IS NULL OR es.end_date >= CURRENT_TIMESTAMP)
      GROUP BY es.id
      ORDER BY es."order" ASC
    `);

    res.json({ slides });
  } catch (error) {
    console.error('Error fetching active slides:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single slide
router.get('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const slide = await getRow(`
      SELECT 
        es.*,
        u.name as created_by_name,
        array_agg(sta.audience_role) as target_audience_roles
      FROM enhanced_slides es
      LEFT JOIN users u ON es.created_by = u.id
      LEFT JOIN slide_target_audience sta ON es.id = sta.slide_id
      WHERE es.id = $1
      GROUP BY es.id, u.name
    `, [id]);

    if (!slide) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    res.json({ slide });
  } catch (error) {
    console.error('Error fetching slide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new slide
router.post('/', verifyToken, requireRole(['admin']), upload.single('media'), async (req, res) => {
  try {
    console.log('Received slide data:', req.body); // Debug log
    console.log('Received file:', req.file); // Debug log
    
    const {
      title,
      description,
      mediaType = 'image',
      order,
      isActive = true,
      duration,
      startDate,
      endDate,
      targetAudience,
      ctaText,
      ctaLink,
      overlayColor = '#000000',
      overlayOpacity = 0.3,
      transition = 'fade',
      altText
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Handle file upload
    let imageUrl = null;
    let videoUrl = null;
    
    if (req.file) {
      const fileUrl = `/uploads/slides/${req.file.filename}`;
      if (mediaType === 'image') {
        imageUrl = fileUrl;
      } else if (mediaType === 'video') {
        videoUrl = fileUrl;
      }
    }

    // Insert slide
    const result = await query(`
      INSERT INTO enhanced_slides (
        title, description, image_url, video_url, media_type, "order", 
        is_active, duration, start_date, end_date, cta_text, cta_link,
        overlay_color, overlay_opacity, transition, alt_text, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      title, description, imageUrl, videoUrl, mediaType, order || 0,
      isActive, duration, startDate, endDate, ctaText, ctaLink,
      overlayColor, overlayOpacity, transition, altText, req.user.id
    ]);

    const slide = result.rows[0];

    // Insert target audience
    if (targetAudience) {
      let audienceArray = targetAudience;
      if (typeof targetAudience === 'string') {
        try {
          audienceArray = JSON.parse(targetAudience);
        } catch (e) {
          audienceArray = [targetAudience];
        }
      }
      
      if (Array.isArray(audienceArray)) {
        for (const role of audienceArray) {
          await query(`
            INSERT INTO slide_target_audience (slide_id, audience_role)
            VALUES ($1, $2)
          `, [slide.id, role]);
        }
      }
    }

    res.status(201).json({ 
      message: 'Slide created successfully',
      slide 
    });
  } catch (error) {
    console.error('Error creating slide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update slide
router.put('/:id', verifyToken, requireRole(['admin']), upload.single('media'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      mediaType,
      order,
      isActive,
      duration,
      startDate,
      endDate,
      targetAudience,
      ctaText,
      ctaLink,
      overlayColor,
      overlayOpacity,
      transition,
      altText
    } = req.body;

    // Check if slide exists
    const existingSlide = await getRow('SELECT * FROM enhanced_slides WHERE id = $1', [id]);
    if (!existingSlide) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    // Handle file upload
    let imageUrl = existingSlide.image_url;
    let videoUrl = existingSlide.video_url;
    
    if (req.file) {
      const fileUrl = `/uploads/slides/${req.file.filename}`;
      if (mediaType === 'image') {
        imageUrl = fileUrl;
        videoUrl = null; // Clear video URL if switching to image
      } else if (mediaType === 'video') {
        videoUrl = fileUrl;
        imageUrl = null; // Clear image URL if switching to video
      }
    }

    // Update slide
    const result = await query(`
      UPDATE enhanced_slides SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        image_url = $3,
        video_url = $4,
        media_type = COALESCE($5, media_type),
        "order" = COALESCE($6, "order"),
        is_active = COALESCE($7, is_active),
        duration = COALESCE($8, duration),
        start_date = COALESCE($9, start_date),
        end_date = COALESCE($10, end_date),
        cta_text = COALESCE($11, cta_text),
        cta_link = COALESCE($12, cta_link),
        overlay_color = COALESCE($13, overlay_color),
        overlay_opacity = COALESCE($14, overlay_opacity),
        transition = COALESCE($15, transition),
        alt_text = COALESCE($16, alt_text)
      WHERE id = $17
      RETURNING *
    `, [
      title, description, imageUrl, videoUrl, mediaType, order,
      isActive, duration, startDate, endDate, ctaText, ctaLink,
      overlayColor, overlayOpacity, transition, altText, id
    ]);

    const slide = result.rows[0];

    // Update target audience
    if (targetAudience !== undefined) {
      // Remove existing target audience
      await query('DELETE FROM slide_target_audience WHERE slide_id = $1', [id]);
      
      // Add new target audience
      let audienceArray = targetAudience;
      if (typeof targetAudience === 'string') {
        try {
          audienceArray = JSON.parse(targetAudience);
        } catch (e) {
          audienceArray = [targetAudience];
        }
      }
      
      if (Array.isArray(audienceArray)) {
        for (const role of audienceArray) {
          await query(`
            INSERT INTO slide_target_audience (slide_id, audience_role)
            VALUES ($1, $2)
          `, [id, role]);
        }
      }
    }

    res.json({ 
      message: 'Slide updated successfully',
      slide 
    });
  } catch (error) {
    console.error('Error updating slide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete slide
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if slide exists
    const slide = await getRow('SELECT * FROM enhanced_slides WHERE id = $1', [id]);
    if (!slide) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    // Delete slide (cascade will handle related records)
    await query('DELETE FROM enhanced_slides WHERE id = $1', [id]);

    res.json({ message: 'Slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting slide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track slide view
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const { userAgent } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check if slide exists and is active
    const slide = await getRow(`
      SELECT * FROM enhanced_slides 
      WHERE id = $1 AND is_active = true
    `, [id]);

    if (!slide) {
      return res.status(404).json({ error: 'Slide not found or inactive' });
    }

    // Record analytics
    await query(`
      INSERT INTO slide_analytics (slide_id, user_id, action_type, ip_address, user_agent)
      VALUES ($1, $2, 'view', $3, $4)
    `, [id, req.user?.id || null, ipAddress, userAgent]);

    // Update view count
    await query(`
      UPDATE enhanced_slides 
      SET views = views + 1 
      WHERE id = $1
    `, [id]);

    res.json({ message: 'View tracked successfully' });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track slide click
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    const { userAgent } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check if slide exists and is active
    const slide = await getRow(`
      SELECT * FROM enhanced_slides 
      WHERE id = $1 AND is_active = true
    `, [id]);

    if (!slide) {
      return res.status(404).json({ error: 'Slide not found or inactive' });
    }

    // Record analytics
    await query(`
      INSERT INTO slide_analytics (slide_id, user_id, action_type, ip_address, user_agent)
      VALUES ($1, $2, 'click', $3, $4)
    `, [id, req.user?.id || null, ipAddress, userAgent]);

    // Update click count
    await query(`
      UPDATE enhanced_slides 
      SET clicks = clicks + 1 
      WHERE id = $1
    `, [id]);

    res.json({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get slide analytics
router.get('/:id/analytics', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    let dateFilter = '';
    let params = [id];

    switch (period) {
      case '24h':
        dateFilter = 'AND created_at >= CURRENT_TIMESTAMP - INTERVAL \'24 hours\'';
        break;
      case '7d':
        dateFilter = 'AND created_at >= CURRENT_TIMESTAMP - INTERVAL \'7 days\'';
        break;
      case '30d':
        dateFilter = 'AND created_at >= CURRENT_TIMESTAMP - INTERVAL \'30 days\'';
        break;
      case '90d':
        dateFilter = 'AND created_at >= CURRENT_TIMESTAMP - INTERVAL \'90 days\'';
        break;
    }

    const analytics = await getRows(`
      SELECT 
        action_type,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM slide_analytics 
      WHERE slide_id = $1 ${dateFilter}
      GROUP BY action_type, DATE(created_at)
      ORDER BY date DESC, action_type
    `, params);

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 