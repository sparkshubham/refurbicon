import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@refurbicon.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div className="logo" style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#0ea5e9,#0056b3)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800 }}>R</div>
          <div>
            <h1 className="brand-font" style={{ margin: 0 }}>REFURBICON</h1>
            <p style={{ margin: 0 }}>Sign in to your workspace</p>
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="form-group">
          <label>Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
          Demo: admin@refurbicon.com / admin123
        </p>
      </form>
    </div>
  );
}
