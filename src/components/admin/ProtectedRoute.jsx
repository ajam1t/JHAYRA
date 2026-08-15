import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a' }}>
        <div style={{ color: '#c9a96e', fontFamily: 'var(--fs)', letterSpacing: '0.1em' }}>Verifying access…</div>
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}
