import express from 'express';
import { query, getRow, getRows } from '../db.js';

const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await getRows(`
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.price, 
        c.is_published, 
        c.created_at,
        c.approved_at,
        u.name as created_by_name,
        m.name as material_name
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN materials m ON c.material_id = m.id
      ORDER BY c.created_at DESC
    `);
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
        c.created_at,
        c.approved_at,
        u.name as created_by_name,
        m.name as material_name
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN materials m ON c.material_id = m.id
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
      section.blocks = blocks;
    }
    
    course.sections = sections;
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new course
router.post('/', async (req, res) => {
  try {
    const { title, description, material_id, created_by, price } = req.body;
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    // Insert new course
    const result = await query(
      'INSERT INTO courses (title, description, material_id, created_by, price) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, description, price, created_at',
      [title, description, material_id, created_by, price]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course
router.put('/:id', async (req, res) => {
  try {
    const { title, description, material_id, price, is_published } = req.body;
    const courseId = req.params.id;
    
    // Check if course exists
    const existingCourse = await getRow('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
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
router.delete('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Check if course exists
    const existingCourse = await getRow('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Delete course (this will cascade delete sections and blocks)
    await query('DELETE FROM courses WHERE id = $1', [courseId]);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
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

export default router; 