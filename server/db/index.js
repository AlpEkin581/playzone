const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id        SERIAL PRIMARY KEY,
        username  VARCHAR(50)  UNIQUE NOT NULL,
        email     VARCHAR(100) UNIQUE NOT NULL,
        password  VARCHAR(255) NOT NULL,
        avatar    VARCHAR(10)  DEFAULT '🎮',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS games (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(100) NOT NULL,
        slug        VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        genre       VARCHAR(50),
        thumbnail   VARCHAR(255),
        plays       INTEGER DEFAULT 0,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scores (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        game_id    INTEGER REFERENCES games(id) ON DELETE CASCADE,
        score      INTEGER NOT NULL,
        rank       VARCHAR(5),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token      TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO games (title, slug, description, genre, thumbnail)
      VALUES (
        'Hellblast',
        'hellblast',
        'Ultra-hızlı birinci şahıs nişancı oyunu. Düşmanları öldür, rank kazan, hayatta kal.',
        'FPS',
        '🔫'
      )
      ON CONFLICT (slug) DO NOTHING;
    `);
    console.log('✅ Veritabanı tabloları hazır');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
