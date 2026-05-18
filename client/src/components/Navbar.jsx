import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: '#16161e',
      borderBottom: '1px solid #2a2a3a',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Playzone" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: '#000' }}
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1 }}>
            <span style={{ color: '#6c63ff' }}>Play</span>
            <span style={{ color: '#e8e8f0' }}>zone</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/" style={{ color: '#9090a8', fontSize: 14, padding: '6px 12px', borderRadius: 8 }}>
            Oyunlar
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 13, color: '#9090a8',
                background: '#1e1e2a', border: '1px solid #2a2a3a',
                padding: '5px 12px', borderRadius: 20,
              }}>
                {user.avatar} {user.username}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent', color: '#9090a8',
                  border: '1px solid #2a2a3a', borderRadius: 8,
                  padding: '6px 14px', fontSize: 13, cursor: 'pointer',
                }}
              >
                Çıkış
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login">
                <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }}>
                  Giriş
                </button>
              </Link>
              <Link to="/register">
                <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>
                  Kayıt Ol
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
