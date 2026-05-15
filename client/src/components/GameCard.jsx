import { Link } from 'react-router-dom';

const GameCard = ({ game }) => {
  return (
    <Link to={`/game/${game.slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{
          overflow: 'hidden',
          transition: 'transform 0.2s, border-color 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = '#6c63ff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = '#2a2a3a';
        }}
      >
        {/* Thumbnail */}
        <div style={{
          height: 160,
          background: 'linear-gradient(135deg, #1e1e2a 0%, #12121a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 64,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {game.thumbnail}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 60,
            background: 'linear-gradient(to top, #16161e, transparent)',
          }} />
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e8e8f0' }}>{game.title}</h3>
            {game.genre && (
              <span className="tag tag-fps">{game.genre}</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#9090a8', lineHeight: 1.5, marginBottom: 12 }}>
            {game.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6c63ff' }}>▶</span>
            <span style={{ fontSize: 12, color: '#9090a8' }}>{game.plays?.toLocaleString() || 0} oynanma</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
