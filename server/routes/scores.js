const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const getRank = (score) => {
  if (score >= 25000) return 'SSS';
  if (score >= 12000) return 'SS';
  if (score >= 6000)  return 'S';
  if (score >= 3000)  return 'A';
  if (score >= 1500)  return 'B';
  if (score >= 500)   return 'C';
  return 'D';
};

// POST /api/scores  (auth gerekli)
router.post('/', authMiddleware, async (req, res) => {
  const { game_id, score } = req.body;

  if (!game_id || score === undefined) {
    return res.status(400).json({ error: 'game_id ve score gerekli' });
  }

  try {
    const rank = getRank(score);
    const result = await pool.query(
      'INSERT INTO scores (user_id, game_id, score, rank) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, game_id, score, rank]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// GET /api/scores/leaderboard/:game_id
router.get('/leaderboard/:game_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.score, s.rank, s.created_at, u.username, u.avatar
       FROM scores s
       JOIN users u ON s.user_id = u.id
       WHERE s.game_id = $1
       ORDER BY s.score DESC
       LIMIT 20`,
      [req.params.game_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// GET /api/scores/my/:game_id  (auth gerekli)
router.get('/my/:game_id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT score, rank, created_at FROM scores
       WHERE user_id = $1 AND game_id = $2
       ORDER BY score DESC LIMIT 10`,
      [req.user.id, req.params.game_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
