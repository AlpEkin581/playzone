import { useEffect, useState } from 'react';
import GameCard from '../components/GameCard';

const Home = () => {
  const [games, setGames]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games')
      .then(r => r.json())
      .then(data => { setGames(data); setLoading(false); });
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      {/* Hero */}
      <div
        className="fade-in"
        style={{
          textAlign: 'center',
          marginBottom: 56,
          padding: '60px 24px',
          background: 'linear-gradient(135deg, #1e1e2a 0%, #16161e 100%)',
          borderRadius: 20,
          border: '1px solid #2a2a3a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Arka plan daireler */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, #6c63ff18 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'radial-gradient(circle, #ff4f5e18 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 900,
            letterSpacing: -2,
            marginBottom: 16,
            lineHeight: 1.1,
          }}>
            Oynamak için{' '}
            <span style={{ color: '#6c63ff' }}>bir neden</span>
            <br />daha var
          </h1>
          <p style={{ fontSize: 17, color: '#9090a8', maxWidth: 480, margin: '0 auto' }}>
            Ücretsiz tarayıcı oyunları. Kayıt ol, oyna, liderlik tablosuna gir.
          </p>
        </div>
      </div>

      {/* Oyun listesi */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Tüm Oyunlar</h2>
        <span style={{ fontSize: 13, color: '#9090a8' }}>{games.length} oyun</span>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ height: 260, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div
          className="fade-in"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}
        >
          {games.map(game => <GameCard key={game.id} game={game} />)}
        </div>
      )}
    </div>
  );
};

export default Home;
