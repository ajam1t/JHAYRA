import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const s = {
  page: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fs, sans-serif)' },
  card: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '2.5rem 2rem', width: '100%', maxWidth: '380px' },
  logo: { textAlign: 'center', marginBottom: '2rem' },
  logoText: { fontFamily: 'var(--fd, serif)', fontSize: '1.8rem', letterSpacing: '0.2em', color: '#c9a96e', display: 'block' },
  logoSub: { fontSize: '0.7rem', letterSpacing: '0.25em', color: '#555', textTransform: 'uppercase', display: 'block', marginTop: '4px' },
  label: { display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase' },
  input: { width: '100%', background: '#0d0d0d', border: '1px solid #252525', borderRadius: '6px', color: '#e8e0d4', fontSize: '0.9rem', padding: '0.65rem 0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' },
  btn: { width: '100%', background: '#c9a96e', color: '#0a0a0a', border: 'none', borderRadius: '6px', padding: '0.8rem', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.08em', cursor: 'pointer', marginTop: '0.5rem' },
  err: { background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.25)', borderRadius: '6px', color: '#e07070', fontSize: '0.82rem', padding: '0.6rem 0.8rem', marginBottom: '1rem' },
};

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // isAdmin check happens in AuthContext; ProtectedRoute will redirect if not admin
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <span style={s.logoText}>JHAYRA</span>
          <span style={s.logoSub}>Admin Access</span>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div style={s.err}>{error}</div>}
          <label style={s.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={s.input}
            required
            autoFocus
            placeholder="admin@jhayra.com"
          />
          <label style={s.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={s.input}
            required
            placeholder="••••••••"
          />
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
