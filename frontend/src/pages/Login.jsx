import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const { loginUser, loading } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const result = await loginUser(email, password);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel fade-in" style={formCardStyle}>

        <div style={headerStyle}>
          <h2 style={titleStyle}>Welcome Back</h2>
          <p style={subtitleStyle}>Log in to manage your investment portfolio</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={inputWrapperStyle}>
              <Mail size={16} style={iconStyle} />
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputControlStyle}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div style={labelRowStyle}>
              <label className="form-label">Password</label>
              <Link to="/forgot-password" style={forgotLinkStyle}>Forgot password?</Link>
            </div>
            <div style={inputWrapperStyle}>
              <Lock size={16} style={iconStyle} />
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputControlStyle}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={btnSubmitStyle}
            disabled={loading}
          >
            {loading ? (
              <span>Processing login...</span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Log In Account</span>
              </>
            )}
          </button>
        </form>

        <div style={footerStyle}>
          <p style={footerTextStyle}>
            Don't have an account?{' '}
            <Link to="/register" style={signUpLinkStyle}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Shared Auth Styles ──────────────────────────────────────── */
const formCardStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: 'clamp(1.5rem, 5vw, 2.5rem) clamp(1.25rem, 4vw, 2rem)',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-glow)',
};

const headerStyle = { textAlign: 'center', marginBottom: '2rem' };

const titleStyle = {
  fontSize: 'clamp(1.5rem, 5vw, 1.85rem)',
  fontWeight: '800',
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-primary)',
  marginBottom: '0.5rem',
};

const subtitleStyle = { fontSize: '0.85rem', color: 'var(--text-secondary)' };

const inputWrapperStyle = { position: 'relative', display: 'flex', alignItems: 'center' };

const iconStyle = { position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' };

const inputControlStyle = { width: '100%', paddingLeft: '38px' };

const labelRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.25rem',
};

const forgotLinkStyle = { fontSize: '0.75rem', color: 'var(--accent-cyan)', textDecoration: 'none' };

const btnSubmitStyle = { width: '100%', marginTop: '1.5rem', gap: '0.5rem' };

const footerStyle = {
  marginTop: '1.75rem',
  textAlign: 'center',
  borderTop: '1px solid var(--glass-border)',
  paddingTop: '1.25rem',
};

const footerTextStyle = { fontSize: '0.85rem', color: 'var(--text-secondary)' };

const signUpLinkStyle = { color: 'var(--accent-cyan)', fontWeight: '600', textDecoration: 'none' };

export default Login;
