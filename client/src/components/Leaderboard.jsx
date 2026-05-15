import { useEffect, useState } from 'react';

const RANK_COLORS = {
  SSS: '#fff', SS: '#ff00ff', S: '#ff2200',
  A: '#ff8800', B: '#4488ff', C: '#44cc44', D: '#888'
};

const Leaderboard = ({ gameId }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    fetch(`/api/scores/leaderboard/${gameId}`)
      .then(r => r.json())
      .then(data => { setScores(data); setLoading(false); });
  }, [gameId]);

  if (loading) return (
    <div style={{ color: '#9090a8', fontSize: 13, padding: 20, textAlign: 'center' }}>
      Yükleniyor...
    </div>
  );

  if (scores.length === 0) return (
    <div style={{ color: '#9090a8', fontSize: 13, padding: 20, textAlign: 'center' }}>
      Henüz skor yok. İlk sen ol!
    </div>
  );

  return (
    <div>
      {scores.map((s, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            borderBottom: i < scores.length - 1 ? '1px solid #1e1e2a' : 'none',
            background: i === 0 ? '#1e1e2a' : 'transparent',
          }}
        >
          {/* Sıra */}
          <span style={{
            fontSize: 13, fontWeight: 700, width: 24, textAlign: 'center',
            color: i === 0 ? '#f59e0b' : i === 1 ? '#9090a8' : i === 2 ? '#cd7f32' : '#555',
          }}>
            {i + 1}
          </span>

          {/* Avatar + İsim */}
          <span style={{ fontSize: 18 }}>{s.avatar}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#e8e8f0' }}>
            {s.username}
          </span>

          {/* Rank */}
          <span style={{
            fontSize: 14, fontWeight: 900,
            color: RANK_COLORS[s.rank] || '#888',
            minWidth: 36, textAlign: 'center',
            textShadow: `0 0 8px ${RANK_COLORS[s.rank] || '#888'}`,
          }}>
            {s.rank}
          </span>

          {/* Skor */}
          <span style={{ fontSize: 14, fontWeight: 700, color: '#6c63ff', minWidth: 70, textAlign: 'right' }}>
            {s.score.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
