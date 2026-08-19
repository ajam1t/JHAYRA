import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { T } from './adminUI';

// Ensure admin login is never indexed by search engines
function AdminNoIndex() {
  useEffect(() => {
    const el = document.querySelector('meta[name="robots"]');
    if (el) el.setAttribute('content', 'noindex, nofollow');
  }, []);
  return null;
}

const s = {
  page: { minHeight: '100vh', background: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fs, sans-serif)' },
  card: { background: T.surface, border: '1px solid #EAE4D8', borderRadius: '12px', padding: '2.5rem 2rem', width: '100%', maxWidth: '380px' },
  logo: { textAlign: 'center', marginBottom: '2rem' },
  logoText: { fontFamily: 'var(--fd, serif)', fontSize: '1.8rem', letterSpacing: '0.2em', color: T.gold, display: 'block' },
  logoSub: { fontSize: '0.7rem', letterSpacing: '0.25em', color: T.muted2, textTransform: 'uppercase', display: 'block', marginTop: '4px' },
  label: { display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: T.muted, marginBottom: '0.4rem', textTransform: 'uppercase' },
  input: { width: '100%', background: T.surface, border: '1px solid #E6DFD2', borderRadius: '6px', color: T.text, fontSize: '0.9rem', padding: '0.65rem 0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' },
  btn: { width: '100%', background: T.gold, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.8rem', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.08em', cursor: 'pointer', marginTop: '0.5rem' },
  err: { background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.25)', borderRadius: '6px', color: T.danger, fontSize: '0.82rem', padding: '0.6rem 0.8rem', marginBottom: '1rem' },
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
      <AdminNoIndex />
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
