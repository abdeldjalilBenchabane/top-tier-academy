import express from 'express';
import pool from '../db.js';
const router = express.Router();

// GET /api/levels → liste tous les niveaux (ex: Lycée, Université)
router.get('/levels', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM levels ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/levels/:levelId/years → liste les années associées à un niveau
router.get('/levels/:levelId/years', async (req, res) => {
  const { levelId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM years WHERE level_id = $1 ORDER BY name',
      [levelId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/years/:yearId/specialities → liste les spécialités d'une année
router.get('/years/:yearId/specialities', async (req, res) => {
  const { yearId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM specialities WHERE year_id = $1 ORDER BY name',
      [yearId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching specialities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/specialities/:specialityId/materials → liste les matières d'une spécialité
router.get('/specialities/:specialityId/materials', async (req, res) => {
  const { specialityId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM materials WHERE speciality_id = $1 ORDER BY name',
      [specialityId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
    