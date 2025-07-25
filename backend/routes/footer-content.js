import express from 'express';
import { getRows, query } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/footer-content - Get all footer content
router.get('/', async (req, res) => {
  try {
    const { section_name } = req.query;
    
    let sql = `
      SELECT id, section_name, content_key, content_value, content_type, display_order, is_active
      FROM footer_content
      WHERE is_active = true
    `;
    
    const params = [];
    
    if (section_name) {
      sql += ` AND section_name = $${params.length + 1}`;
      params.push(section_name);
    }
    
    sql += ` ORDER BY section_name, display_order, content_key`;
    
    const content = await getRows(sql, params);
    res.json(content);
  } catch (error) {
    console.error('Error fetching footer content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/footer-content/sections - Get all sections
router.get('/sections', async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT section_name
      FROM footer_content
      WHERE is_active = true
      ORDER BY section_name
    `;
    
    const sections = await getRows(sql);
    res.json(sections.map(s => s.section_name));
  } catch (error) {
    console.error('Error fetching footer sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/footer-content/section/:sectionName - Get content by section
router.get('/section/:sectionName', async (req, res) => {
  try {
    const { sectionName } = req.params;
    
    const sql = `
      SELECT id, section_name, content_key, content_value, content_type, display_order
      FROM footer_content
      WHERE section_name = $1 AND is_active = true
      ORDER BY display_order, content_key
    `;
    
    const content = await getRows(sql, [sectionName]);
    res.json(content);
  } catch (error) {
    console.error('Error fetching footer section content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/footer-content - Create new footer content (Admin only)
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { section_name, content_key, content_value, content_type, display_order } = req.body;
    
    if (!section_name || !content_key || !content_value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const sql = `
      INSERT INTO footer_content (section_name, content_key, content_value, content_type, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, section_name, content_key, content_value, content_type, display_order
    `;
    
    const result = await query(sql, [section_name, content_key, content_value, content_type || 'text', display_order || 0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating footer content:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Content key already exists for this section' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// PUT /api/footer-content/:id - Update footer content (Admin only)
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { section_name, content_key, content_value, content_type, display_order, is_active } = req.body;
    
    const sql = `
      UPDATE footer_content
      SET section_name = $1, content_key = $2, content_value = $3, content_type = $4, display_order = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, section_name, content_key, content_value, content_type, display_order, is_active
    `;
    
    const result = await query(sql, [
      section_name, content_key, content_value, content_type || 'text', 
      display_order || 0, is_active !== undefined ? is_active : true, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Footer content not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating footer content:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Content key already exists for this section' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// DELETE /api/footer-content/:id - Delete footer content (Admin only)
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `DELETE FROM footer_content WHERE id = $1`;
    const result = await query(sql, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Footer content not found' });
    }
    
    res.json({ message: 'Footer content deleted successfully' });
  } catch (error) {
    console.error('Error deleting footer content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 