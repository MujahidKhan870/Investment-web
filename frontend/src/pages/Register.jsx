import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus } from 'lucide-react';

const Register = () => {
  const { registerUser, loading } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [simulatedToken, setSimulatedToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    const result = await registerUser(name, email, password);
    if (result.success) setSimulatedToken(result.simulatedToken);
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel fade-in" style={formCardStyle}>

        <div style={headerStyle}>
          <h2 style={titleStyle}>Create Account</h2>
          <p style={subtitleStyle}>Invest and grow your global asset portfolio</p>
        </div>

        {/* Sandbox token helper */}
        {simulatedToken && (
          <div style={sandboxStyle} className="glass-panel">
            <h4 style={sandboxTitleStyle}>Sandbox Mode Active</h4>
            <p style={sandboxTextStyle}>
              Email service is mocked. Click the button below to simulate verification instantly:
            </p>
            <Link
              to={`/verify-email?token=${simulatedToken}`}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.85rem', display: 'flex', justifyContent: 'center' }}
            >
              Verify Email Now
            </Link>
          </div>
        )}

        {!simulatedToken && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={inputWrapperStyle}>
                <User size={16} style={iconStyle} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputControlStyle}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={inputWrapperStyle}>
                <Mail size={16} style={iconStyle} />
                <input
                  type="email"
                  className="form-control"
                  placeholder="john@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputControlStyle}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={inputWrapperStyle}>
                <Lock size={16} style={iconStyle} />
                <input
                  type="password"
                  className="form-control"
                  placeholder="•••••••• (Min 8 chars)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputControlStyle}
                  minLength={8}
                  required
                  autoComplete="new-password"
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
                <span>Generating credentials...</span>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        )}

        <div style={footerStyle}>
          <p style={footerTextStyle}>
            Already registered?{' '}
            <Link to="/login" style={signInLinkStyle}>Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const formCardStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: 'clamp(1.5rem, 5vw, 2.5rem) clamp(1.25rem, 4vw, 2rem)',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-glow)',
};

const headerStyle    = { textAlign: 'center', marginBottom: '2rem' };
const titleStyle     = { fontSize: 'clamp(1.5rem, 5vw, 1.85rem)', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '0.5rem' };
const subtitleStyle  = { fontSize: '0.85rem', color: 'var(--text-secondary)' };
const inputWrapperStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
const iconStyle      = { position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' };
const inputControlStyle = { width: '100%', paddingLeft: '38px' };
const btnSubmitStyle = { width: '100%', marginTop: '1.5rem', gap: '0.5rem' };

const sandboxStyle = {
  padding: '1.25rem',
  backgroundColor: 'rgba(6,182,212,0.05)',
  border: '1px solid rgba(6,182,212,0.2)',
  borderRadius: '10px',
  textAlign: 'center',
  marginBottom: '1.5rem',
};
const sandboxTitleStyle = { fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' };
const sandboxTextStyle  = { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' };

const footerStyle    = { marginTop: '1.75rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' };
const footerTextStyle  = { fontSize: '0.85rem', color: 'var(--text-secondary)' };
const signInLinkStyle  = { color: 'var(--accent-cyan)', fontWeight: '600', textDecoration: 'none' };

export default Register;
