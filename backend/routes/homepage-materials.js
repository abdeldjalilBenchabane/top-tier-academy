import express from 'express';
import { getRows, query } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/homepage-materials - Get all homepage materials
router.get('/', async (req, res) => {
  try {
    const { section_type, level_type } = req.query;
    
    let query = `
      SELECT id, name, section_type, level_type, level_name_ar, level_name_en, display_order, is_active
      FROM homepage_materials
      WHERE is_active = true
    `;
    
    const params = [];
    
    if (section_type) {
      query += ` AND section_type = $${params.length + 1}`;
      params.push(section_type);
    }
    
    if (level_type) {
      query += ` AND level_type = $${params.length + 1}`;
      params.push(level_type);
    }
    
    query += ` ORDER BY section_type, level_type, display_order, name`;
    
    const materials = await getRows(query, params);
    res.json(materials);
  } catch (error) {
    console.error('Error fetching homepage materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/homepage-materials/education - Get education materials only
router.get('/education', async (req, res) => {
  try {
    const { level_type } = req.query;
    
    let query = `
      SELECT id, name, level_type, level_name_ar, level_name_en, display_order
      FROM homepage_materials
      WHERE section_type = 'education' AND is_active = true
    `;
    
    const params = [];
    
    if (level_type) {
      query += ` AND level_type = $${params.length + 1}`;
      params.push(level_type);
    }
    
    query += ` ORDER BY level_type, display_order, name`;
    
    const materials = await getRows(query, params);
    res.json(materials);
  } catch (error) {
    console.error('Error fetching education materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/homepage-materials/languages - Get language materials only
router.get('/languages', async (req, res) => {
  try {
    const { level_type } = req.query;
    
    let query = `
      SELECT id, name, level_type, level_name_ar, level_name_en, display_order
      FROM homepage_materials
      WHERE section_type = 'languages' AND is_active = true
    `;
    
    const params = [];
    
    if (level_type) {
      query += ` AND level_type = $${params.length + 1}`;
      params.push(level_type);
    }
    
    query += ` ORDER BY level_type, display_order, name`;
    
    const materials = await getRows(query, params);
    res.json(materials);
  } catch (error) {
    console.error('Error fetching language materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/homepage-materials - Create new material (Admin only)
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, section_type, level_type, level_name_ar, level_name_en, display_order } = req.body;
    
    if (!name || !section_type || !level_type || !level_name_ar) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await query(`
      INSERT INTO homepage_materials (name, section_type, level_type, level_name_ar, level_name_en, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, section_type, level_type, level_name_ar, level_name_en, display_order, is_active
    `, [name, section_type, level_type, level_name_ar, level_name_en || null, display_order || 0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating homepage material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/homepage-materials/:id - Update material (Admin only)
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, section_type, level_type, level_name_ar, level_name_en, display_order, is_active } = req.body;
    
    const result = await query(`
      UPDATE homepage_materials 
      SET name = COALESCE($1, name),
          section_type = COALESCE($2, section_type),
          level_type = COALESCE($3, level_type),
          level_name_ar = COALESCE($4, level_name_ar),
          level_name_en = COALESCE($5, level_name_en),
          display_order = COALESCE($6, display_order),
          is_active = COALESCE($7, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, name, section_type, level_type, level_name_ar, level_name_en, display_order, is_active
    `, [name, section_type, level_type, level_name_ar, level_name_en, display_order, is_active, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating homepage material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/homepage-materials/:id - Delete material (Admin only)
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      DELETE FROM homepage_materials WHERE id = $1
    `, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting homepage material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/homepage-materials/levels - Get available levels for each section
router.get('/levels', async (req, res) => {
  try {
    const result = await getRows(`
      SELECT DISTINCT section_type, level_type, level_name_ar, level_name_en
      FROM homepage_materials
      WHERE is_active = true
      ORDER BY section_type, display_order
    `);
    
    const levels = {
      education: [],
      languages: []
    };
    
    result.forEach(row => {
      if (row.section_type === 'education') {
        levels.education.push({
          level_type: row.level_type,
          level_name_ar: row.level_name_ar,
          level_name_en: row.level_name_en
        });
      } else if (row.section_type === 'languages') {
        levels.languages.push({
          level_type: row.level_type,
          level_name_ar: row.level_name_ar,
          level_name_en: row.level_name_en
        });
      }
    });
    
    res.json(levels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 