import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AVATARS = ['🎮', '🔥', '⚡', '💀', '🐉', '🤖', '👾', '🦊'];

const Register = () => {
  const [form, setForm]     = useState({ username: '', email: '', password: '', avatar: '🎮' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await fetch('/api/auth/register', {
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

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: '#1e1e2a', border: '1px solid #2a2a3a',
    borderRadius: 8, color: '#e8e8f0', fontSize: 14,
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 420, padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Hesap Oluştur</h1>
          <p style={{ color: '#9090a8', fontSize: 14, marginTop: 4 }}>
            Ücretsiz kayıt ol, skoru kazan
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

        {/* Avatar seçimi */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: '#9090a8', display: 'block', marginBottom: 8 }}>Avatar seç</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {AVATARS.map(av => (
              <button
                key={av}
                type="button"
                onClick={() => setForm({ ...form, avatar: av })}
                style={{
                  width: 44, height: 44, fontSize: 22, borderRadius: 10,
                  background: form.avatar === av ? '#6c63ff22' : '#1e1e2a',
                  border: `2px solid ${form.avatar === av ? '#6c63ff' : '#2a2a3a'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: '#9090a8', display: 'block', marginBottom: 6 }}>Kullanıcı adı</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required minLength={3}
              placeholder="süper_oyuncu"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: '#9090a8', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              placeholder="ornek@email.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: '#9090a8', display: 'block', marginBottom: 6 }}>Şifre</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required minLength={6}
              placeholder="En az 6 karakter"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: 15, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9090a8' }}>
          Zaten hesabın var mı?{' '}
          <Link to="/login" style={{ color: '#6c63ff', fontWeight: 600 }}>Giriş yap</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
