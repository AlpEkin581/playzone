import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const Login = () => {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error); return; }

      login(data.token, data.user);
      navigate('/');
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 400, padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎮</div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Giriş Yap</h1>
          <p style={{ color: '#9090a8', fontSize: 14, marginTop: 4 }}>
            Hesabına giriş yap ve oynamaya devam et
          </p>
        </div>

        {error && (
          <div style={{
            background: '#ff4f5e18', border: '1px solid #ff4f5e44',
            borderRadius: 8, padding: '10px 14px',
            color: '#ff4f5e', fontSize: 13, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: '#9090a8', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              placeholder="ornek@email.com"
              style={{
                width: '100%', padding: '10px 14px',
                background: '#1e1e2a', border: '1px solid #2a2a3a',
                borderRadius: 8, color: '#e8e8f0', fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: '#9090a8', display: 'block', marginBottom: 6 }}>Şifre</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px',
                background: '#1e1e2a', border: '1px solid #2a2a3a',
                borderRadius: 8, color: '#e8e8f0', fontSize: 14,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: 15, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9090a8' }}>
          Hesabın yok mu?{' '}
          <Link to="/register" style={{ color: '#6c63ff', fontWeight: 600 }}>Kayıt ol</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
