const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// GET /api/games
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY plays DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// GET /api/games/:slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games WHERE slug = $1', [req.params.slug]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Oyun bulunamadı' });

    // Oynanma sayısını artır
    await pool.query('UPDATE games SET plays = plays + 1 WHERE slug = $1', [req.params.slug]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
