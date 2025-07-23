import express from 'express';
import { query, getRow, getRows } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ===== LEVELS =====

// GET /api/levels → list all levels
router.get('/levels', verifyToken, requireRole(['admin', 'professor']), async (req, res) => {
  try {
    const levels = await getRows('SELECT * FROM levels ORDER BY name');
    res.json(levels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/levels → create new level
router.post('/levels', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Level name is required' });
    }
    
    // Check if level already exists
    const existingLevel = await getRow('SELECT id FROM levels WHERE name = $1', [name]);
    if (existingLevel) {
      return res.status(400).json({ error: 'Level with this name already exists' });
    }
    
    const result = await query(
      'INSERT INTO levels (name) VALUES ($1) RETURNING *',
      [name]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/levels/:id → update level
router.put('/levels/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // Check if level exists
    const existingLevel = await getRow('SELECT id FROM levels WHERE id = $1', [id]);
    if (!existingLevel) {
      return res.status(404).json({ error: 'Level not found' });
    }
    
    // Check if name is being changed and if it conflicts
    if (name && name !== existingLevel.name) {
      const nameConflict = await getRow('SELECT id FROM levels WHERE name = $1 AND id != $2', [name, id]);
      if (nameConflict) {
        return res.status(400).json({ error: 'Level with this name already exists' });
      }
    }
    
    const result = await query(
      'UPDATE levels SET name = COALESCE($1, name) WHERE id = $2 RETURNING *',
      [name, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/levels/:id → delete level
router.delete('/levels/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if level exists
    const existingLevel = await getRow('SELECT id FROM levels WHERE id = $1', [id]);
    if (!existingLevel) {
      return res.status(404).json({ error: 'Level not found' });
    }
    
    await query('DELETE FROM levels WHERE id = $1', [id]);
    
    res.json({ message: 'Level deleted successfully' });
  } catch (error) {
    console.error('Error deleting level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== YEARS =====

// GET /api/years → list all years
router.get('/years', verifyToken, requireRole(['admin', 'professor']), async (req, res) => {
  try {
    const years = await getRows(`
      SELECT y.*, l.name as level_name,
             s.name as speciality_name, m.name as material_name
      FROM years y 
      LEFT JOIN levels l ON y.level_id = l.id 
      LEFT JOIN specialities s ON y.speciality_id = s.id
      LEFT JOIN materials m ON y.material_id = m.id
      ORDER BY l.name, y.name
    `);
    res.json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/levels/:levelId/years → list years for a specific level
router.get('/levels/:levelId/years', verifyToken, requireRole(['admin', 'professor']), async (req, res) => {
  const { levelId } = req.params;
  try {
    const years = await getRows(
      'SELECT * FROM years WHERE level_id = $1 ORDER BY name',
      [levelId]
    );
    res.json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/years → create new year
router.post('/years', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, level_id, speciality_id, material_id } = req.body;
    
    if (!name || !level_id) {
      return res.status(400).json({ error: 'Year name and level are required' });
    }
    
    // Validate path type - must have either speciality_id or material_id, but not both
    if (speciality_id && material_id) {
      return res.status(400).json({ error: 'Year cannot have both speciality and material' });
    }
    
    if (!speciality_id && !material_id) {
      return res.status(400).json({ error: 'Year must have either speciality or material' });
    }
    
    // Check if level exists
    const level = await getRow('SELECT id FROM levels WHERE id = $1', [level_id]);
    if (!level) {
      return res.status(400).json({ error: 'Level not found' });
    }
    
    // Check if speciality exists if provided
    if (speciality_id) {
      const speciality = await getRow('SELECT id FROM specialities WHERE id = $1', [speciality_id]);
      if (!speciality) {
        return res.status(400).json({ error: 'Speciality not found' });
      }
    }
    
    // Check if material exists if provided
    if (material_id) {
      const material = await getRow('SELECT id FROM materials WHERE id = $1', [material_id]);
      if (!material) {
        return res.status(400).json({ error: 'Material not found' });
      }
    }
    
    // Check if year already exists in this level with same path
    const existingYear = await getRow(
      'SELECT id FROM years WHERE name = $1 AND level_id = $2 AND (speciality_id = $3 OR material_id = $4)', 
      [name, level_id, speciality_id || null, material_id || null]
    );
    if (existingYear) {
      return res.status(400).json({ error: 'Year with this name already exists in this level with the same path' });
    }
    
    const result = await query(
      'INSERT INTO years (name, level_id, speciality_id, material_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, level_id, speciality_id || null, material_id || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating year:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/years/:id → update year
router.put('/years/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level_id, speciality_id, material_id } = req.body;
    
    // Check if year exists
    const existingYear = await getRow('SELECT id FROM years WHERE id = $1', [id]);
    if (!existingYear) {
      return res.status(404).json({ error: 'Year not found' });
    }
    
    // Validate path type - must have either speciality_id or material_id, but not both
    if (speciality_id && material_id) {
      return res.status(400).json({ error: 'Year cannot have both speciality and material' });
    }
    
    // Check if level exists if level_id is being changed
    if (level_id) {
      const level = await getRow('SELECT id FROM levels WHERE id = $1', [level_id]);
      if (!level) {
        return res.status(400).json({ error: 'Level not found' });
      }
    }
    
    // Check if speciality exists if provided
    if (speciality_id) {
      const speciality = await getRow('SELECT id FROM specialities WHERE id = $1', [speciality_id]);
      if (!speciality) {
        return res.status(400).json({ error: 'Speciality not found' });
      }
    }
    
    // Check if material exists if provided
    if (material_id) {
      const material = await getRow('SELECT id FROM materials WHERE id = $1', [material_id]);
      if (!material) {
        return res.status(400).json({ error: 'Material not found' });
      }
    }
    
    // Check if name conflicts with same path
    if (name) {
      const nameConflict = await getRow(
        'SELECT id FROM years WHERE name = $1 AND level_id = $2 AND (speciality_id = $3 OR material_id = $4) AND id != $5', 
        [name, level_id || existingYear.level_id, speciality_id || null, material_id || null, id]
      );
      if (nameConflict) {
        return res.status(400).json({ error: 'Year with this name already exists in this level with the same path' });
      }
    }
    
    const result = await query(
      'UPDATE years SET name = COALESCE($1, name), level_id = COALESCE($2, level_id), speciality_id = $3, material_id = $4 WHERE id = $5 RETURNING *',
      [name, level_id, speciality_id || null, material_id || null, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating year:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/years/:id → delete year
router.delete('/years/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if year exists
    const existingYear = await getRow('SELECT id FROM years WHERE id = $1', [id]);
    if (!existingYear) {
      return res.status(404).json({ error: 'Year not found' });
    }
    
    await query('DELETE FROM years WHERE id = $1', [id]);
    
    res.json({ message: 'Year deleted successfully' });
  } catch (error) {
    console.error('Error deleting year:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== SPECIALITIES =====

// GET /api/specialities → list all specialities
router.get('/specialities', verifyToken, requireRole(['admin', 'professor']), async (req, res) => {
  try {
    const specialities = await getRows(`
      SELECT s.*, y.name as year_name, l.name as level_name 
      FROM specialities s 
      LEFT JOIN years y ON s.year_id = y.id 
      LEFT JOIN levels l ON y.level_id = l.id 
      ORDER BY l.name, y.name, s.name
    `);
    res.json(specialities);
  } catch (error) {
    console.error('Error fetching specialities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/years/:yearId/specialities → list specialities for a specific year
router.get('/years/:yearId/specialities', verifyToken, requireRole(['admin', 'professor']), async (req, res) => {
  const { yearId } = req.params;
  try {
    const specialities = await getRows(
      'SELECT * FROM specialities WHERE year_id = $1 ORDER BY name',
      [yearId]
    );
    res.json(specialities);
  } catch (error) {
    console.error('Error fetching specialities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/specialities → create new speciality
router.post('/specialities', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, year_id } = req.body;
    
    if (!name || !year_id) {
      return res.status(400).json({ error: 'Speciality name and year are required' });
    }
    
    // Check if year exists
    const year = await getRow('SELECT id FROM years WHERE id = $1', [year_id]);
    if (!year) {
      return res.status(400).json({ error: 'Year not found' });
    }
    
    // Check if speciality already exists in this year
    const existingSpeciality = await getRow('SELECT id FROM specialities WHERE name = $1 AND year_id = $2', [name, year_id]);
    if (existingSpeciality) {
      return res.status(400).json({ error: 'Speciality with this name already exists in this year' });
    }
    
    const result = await query(
      'INSERT INTO specialities (name, year_id) VALUES ($1, $2) RETURNING *',
      [name, year_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating speciality:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/specialities/:id → update speciality
router.put('/specialities/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, year_id } = req.body;
    
    // Check if speciality exists
    const existingSpeciality = await getRow('SELECT id FROM specialities WHERE id = $1', [id]);
    if (!existingSpeciality) {
      return res.status(404).json({ error: 'Speciality not found' });
    }
    
    // Check if year exists if year_id is being changed
    if (year_id) {
      const year = await getRow('SELECT id FROM years WHERE id = $1', [year_id]);
      if (!year) {
        return res.status(400).json({ error: 'Year not found' });
      }
    }
    
    // Check if name conflicts
    if (name) {
      const nameConflict = await getRow(
        'SELECT id FROM specialities WHERE name = $1 AND year_id = $2 AND id != $3', 
        [name, year_id || existingSpeciality.year_id, id]
      );
      if (nameConflict) {
        return res.status(400).json({ error: 'Speciality with this name already exists in this year' });
      }
    }
    
    const result = await query(
      'UPDATE specialities SET name = COALESCE($1, name), year_id = COALESCE($2, year_id) WHERE id = $3 RETURNING *',
      [name, year_id, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating speciality:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/specialities/:id → delete speciality
router.delete('/specialities/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if speciality exists
    const existingSpeciality = await getRow('SELECT id FROM specialities WHERE id = $1', [id]);
    if (!existingSpeciality) {
      return res.status(404).json({ error: 'Speciality not found' });
    }
    
    await query('DELETE FROM specialities WHERE id = $1', [id]);
    
    res.json({ message: 'Speciality deleted successfully' });
  } catch (error) {
    console.error('Error deleting speciality:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== MATERIALS =====

// GET /api/materials → list all materials
router.get('/materials', verifyToken, requireRole(['admin', 'professor']), async (req, res) => {
  try {
    const materials = await getRows(`
      SELECT m.*, s.name as speciality_name, y.name as year_name, l.name as level_name 
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

// GET /api/specialities/:specialityId/materials → list materials for a specific speciality
router.get('/specialities/:specialityId/materials', verifyToken, requireRole(['admin', 'professor']), async (req, res) => {
  const { specialityId } = req.params;
  try {
    const materials = await getRows(
      'SELECT * FROM materials WHERE speciality_id = $1 ORDER BY name',
      [specialityId]
    );
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/materials → create new material
router.post('/materials', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, price, speciality_id } = req.body;
    
    if (!name || !speciality_id) {
      return res.status(400).json({ error: 'Material name and speciality are required' });
    }
    
    // Check if speciality exists
    const speciality = await getRow('SELECT id FROM specialities WHERE id = $1', [speciality_id]);
    if (!speciality) {
      return res.status(400).json({ error: 'Speciality not found' });
    }
    
    // Check if material already exists in this speciality
    const existingMaterial = await getRow('SELECT id FROM materials WHERE name = $1 AND speciality_id = $2', [name, speciality_id]);
    if (existingMaterial) {
      return res.status(400).json({ error: 'Material with this name already exists in this speciality' });
    }
    
    const result = await query(
      'INSERT INTO materials (name, price, speciality_id) VALUES ($1, $2, $3) RETURNING *',
      [name, price || 0, speciality_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/materials/:id → update material
router.put('/materials/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, speciality_id } = req.body;
    
    // Check if material exists
    const existingMaterial = await getRow('SELECT id FROM materials WHERE id = $1', [id]);
    if (!existingMaterial) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    // Check if speciality exists if speciality_id is being changed
    if (speciality_id) {
      const speciality = await getRow('SELECT id FROM specialities WHERE id = $1', [speciality_id]);
      if (!speciality) {
        return res.status(400).json({ error: 'Speciality not found' });
      }
    }
    
    // Check if name conflicts
    if (name) {
      const nameConflict = await getRow(
        'SELECT id FROM materials WHERE name = $1 AND speciality_id = $2 AND id != $3', 
        [name, speciality_id || existingMaterial.speciality_id, id]
      );
      if (nameConflict) {
        return res.status(400).json({ error: 'Material with this name already exists in this speciality' });
      }
    }
    
    const result = await query(
      'UPDATE materials SET name = COALESCE($1, name), price = COALESCE($2, price), speciality_id = COALESCE($3, speciality_id) WHERE id = $4 RETURNING *',
      [name, price, speciality_id, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/materials/:id → delete material
router.delete('/materials/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if material exists
    const existingMaterial = await getRow('SELECT id FROM materials WHERE id = $1', [id]);
    if (!existingMaterial) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    await query('DELETE FROM materials WHERE id = $1', [id]);
    
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== LANGUAGES =====

// GET /api/languages → list all languages
router.get('/languages', verifyToken, requireRole(['admin', 'professor']), async (req, res) => {
  try {
    const languages = await getRows('SELECT * FROM languages ORDER BY name');
    res.json(languages);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/languages → create new language
router.post('/languages', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, code, flag, is_active } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'Language name and code are required' });
    }
    
    // Check if language already exists
    const existingLanguage = await getRow('SELECT id FROM languages WHERE name = $1 OR code = $2', [name, code]);
    if (existingLanguage) {
      return res.status(400).json({ error: 'Language with this name or code already exists' });
    }
    
    const result = await query(
      'INSERT INTO languages (name, code, flag, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code, flag || null, is_active !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating language:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/languages/:id → update language
router.put('/languages/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, flag, is_active } = req.body;
    
    // Check if language exists
    const existingLanguage = await getRow('SELECT id FROM languages WHERE id = $1', [id]);
    if (!existingLanguage) {
      return res.status(404).json({ error: 'Language not found' });
    }
    
    // Check if name or code conflicts
    if (name || code) {
      const conflict = await getRow(
        'SELECT id FROM languages WHERE (name = $1 OR code = $2) AND id != $3', 
        [name || existingLanguage.name, code || existingLanguage.code, id]
      );
      if (conflict) {
        return res.status(400).json({ error: 'Language with this name or code already exists' });
      }
    }
    
    const result = await query(
      'UPDATE languages SET name = COALESCE($1, name), code = COALESCE($2, code), flag = $3, is_active = COALESCE($4, is_active) WHERE id = $5 RETURNING *',
      [name, code, flag, is_active, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating language:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/languages/:id → delete language
router.delete('/languages/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if language exists
    const existingLanguage = await getRow('SELECT id FROM languages WHERE id = $1', [id]);
    if (!existingLanguage) {
      return res.status(404).json({ error: 'Language not found' });
    }
    
    await query('DELETE FROM languages WHERE id = $1', [id]);
    
    res.json({ message: 'Language deleted successfully' });
  } catch (error) {
    console.error('Error deleting language:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== LANGUAGE LEVELS =====

// GET /api/language-levels → list all language levels
router.get('/language-levels', verifyToken, requireRole(['admin', 'professor']), async (req, res) => {
  try {
    const levels = await getRows(`
      SELECT ll.*, l.name as language_name, l.code as language_code 
      FROM language_levels ll 
      LEFT JOIN languages l ON ll.language_id = l.id 
      ORDER BY l.name, ll."order", ll.name
    `);
    res.json(levels);
  } catch (error) {
    console.error('Error fetching language levels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/languages/:languageId/levels → list levels for a specific language
router.get('/languages/:languageId/levels', verifyToken, requireRole(['admin', 'professor']), async (req, res) => {
  const { languageId } = req.params;
  try {
    const levels = await getRows(
      'SELECT * FROM language_levels WHERE language_id = $1 ORDER BY "order", name',
      [languageId]
    );
    res.json(levels);
  } catch (error) {
    console.error('Error fetching language levels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/language-levels → create new language level
router.post('/language-levels', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, language_id, order, is_active } = req.body;
    
    if (!name || !description || !language_id) {
      return res.status(400).json({ error: 'Level name, description, and language are required' });
    }
    
    // Check if language exists
    const language = await getRow('SELECT id FROM languages WHERE id = $1', [language_id]);
    if (!language) {
      return res.status(400).json({ error: 'Language not found' });
    }
    
    // Check if level already exists in this language
    const existingLevel = await getRow('SELECT id FROM language_levels WHERE name = $1 AND language_id = $2', [name, language_id]);
    if (existingLevel) {
      return res.status(400).json({ error: 'Level with this name already exists in this language' });
    }
    
    const result = await query(
      'INSERT INTO language_levels (name, description, language_id, "order", is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, language_id, order || 1, is_active !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating language level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/language-levels/:id → update language level
router.put('/language-levels/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, language_id, order, is_active } = req.body;
    
    // Check if level exists
    const existingLevel = await getRow('SELECT id FROM language_levels WHERE id = $1', [id]);
    if (!existingLevel) {
      return res.status(404).json({ error: 'Language level not found' });
    }
    
    // Check if language exists if language_id is being changed
    if (language_id) {
      const language = await getRow('SELECT id FROM languages WHERE id = $1', [language_id]);
      if (!language) {
        return res.status(400).json({ error: 'Language not found' });
      }
    }
    
    // Check if name conflicts
    if (name) {
      const nameConflict = await getRow(
        'SELECT id FROM language_levels WHERE name = $1 AND language_id = $2 AND id != $3', 
        [name, language_id || existingLevel.language_id, id]
      );
      if (nameConflict) {
        return res.status(400).json({ error: 'Level with this name already exists in this language' });
      }
    }
    
    const result = await query(
      'UPDATE language_levels SET name = COALESCE($1, name), description = COALESCE($2, description), language_id = COALESCE($3, language_id), "order" = COALESCE($4, "order"), is_active = COALESCE($5, is_active) WHERE id = $6 RETURNING *',
      [name, description, language_id, order, is_active, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating language level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/language-levels/:id → delete language level
router.delete('/language-levels/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if level exists
    const existingLevel = await getRow('SELECT id FROM language_levels WHERE id = $1', [id]);
    if (!existingLevel) {
      return res.status(404).json({ error: 'Language level not found' });
    }
    
    await query('DELETE FROM language_levels WHERE id = $1', [id]);
    
    res.json({ message: 'Language level deleted successfully' });
  } catch (error) {
    console.error('Error deleting language level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== PUBLIC ENDPOINTS (No authentication required) =====

// GET /api/public/levels → list all levels (public)
router.get('/public/levels', async (req, res) => {
  try {
    const levels = await getRows('SELECT * FROM levels ORDER BY name');
    res.json(levels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/public/levels/:levelId/years → list years for a specific level (public)
router.get('/public/levels/:levelId/years', async (req, res) => {
  const { levelId } = req.params;
  try {
    const years = await getRows(
      'SELECT * FROM years WHERE level_id = $1 ORDER BY name',
      [levelId]
    );
    res.json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/public/years/:yearId/specialities → list specialities for a specific year (public)
router.get('/public/years/:yearId/specialities', async (req, res) => {
  const { yearId } = req.params;
  try {
    const specialities = await getRows(
      'SELECT * FROM specialities WHERE year_id = $1 ORDER BY name',
      [yearId]
    );
    res.json(specialities);
  } catch (error) {
    console.error('Error fetching specialities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/public/specialities/:specialityId/materials → list materials for a specific speciality (public)
router.get('/public/specialities/:specialityId/materials', async (req, res) => {
  const { specialityId } = req.params;
  try {
    const materials = await getRows(
      'SELECT * FROM materials WHERE speciality_id = $1 ORDER BY name',
      [specialityId]
    );
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/public/hierarchy → get complete hierarchy structure (public)
router.get('/public/hierarchy', async (req, res) => {
  try {
    const levels = await getRows('SELECT * FROM levels ORDER BY name');
    const hierarchy = [];
    
    for (const level of levels) {
      const years = await getRows('SELECT * FROM years WHERE level_id = $1 ORDER BY name', [level.id]);
      const levelData = {
        ...level,
        years: []
      };
      
      for (const year of years) {
        let yearData = {
          ...year,
          specialities: [],
          materials: []
        };
        
        // If year has speciality_id, get specialities and their materials
        if (year.speciality_id) {
          const specialities = await getRows('SELECT * FROM specialities WHERE year_id = $1 ORDER BY name', [year.id]);
          
          for (const speciality of specialities) {
            const materials = await getRows('SELECT * FROM materials WHERE speciality_id = $1 ORDER BY name', [speciality.id]);
            yearData.specialities.push({
              ...speciality,
              materials
            });
          }
        }
        
        // If year has material_id, get the material directly
        if (year.material_id) {
          const material = await getRow('SELECT * FROM materials WHERE id = $1', [year.material_id]);
          if (material) {
            yearData.materials.push(material);
          }
        }
        
        levelData.years.push(yearData);
      }
      
      hierarchy.push(levelData);
    }
    
    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
    