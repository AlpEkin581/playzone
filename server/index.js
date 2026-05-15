require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const authRoutes   = require('./routes/auth');
const gamesRoutes  = require('./routes/games');
const scoresRoutes = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth',   authRoutes);
app.use('/api/games',  gamesRoutes);
app.use('/api/scores', scoresRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.listen(PORT, async () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
  await initDB();
});
