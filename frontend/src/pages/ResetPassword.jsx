import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api, { handleApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { showToast } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'danger');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/reset-password', { token, password });
      showToast(response.data.message);
      navigate('/login');
    } catch (err) {
      showToast(handleApiError(err), 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={containerStyle}>
      <div className="auth-card glass-panel fade-in" style={formCardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={iconBoxStyle}>
            <ShieldCheck size={22} color="var(--accent-cyan)" />
          </div>
          <h2 style={titleStyle}>Reset Password</h2>
          <p style={subtitleStyle}>Enter your new password below</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={inputWrapperStyle}>
              <Lock size={16} style={iconStyle} />
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputControlStyle}
                min={8}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={inputWrapperStyle}>
              <Lock size={16} style={iconStyle} />
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputControlStyle}
                min={8}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={btnSubmitStyle}
            disabled={loading}
          >
            {loading ? 'Updating Credentials...' : 'Save New Password'}
          </button>
        </form>

        {/* Footer */}
        <div style={footerStyle}>
          <Link to="/login" style={backLinkStyle}>
            <ArrowLeft size={14} />
            <span>Cancel and return</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  padding: '1.5rem',
  backgroundColor: 'var(--bg-primary)'
};

const formCardStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: 'clamp(1.5rem, 5vw, 2.5rem) clamp(1rem, 4vw, 2rem)',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-glow)'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const iconBoxStyle = {
  background: 'var(--accent-cyan-glow)',
  padding: '12px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1rem',
  boxShadow: '0 0 15px rgba(6, 182, 212, 0.1)'
};

const titleStyle = {
  fontSize: '1.65rem',
  fontWeight: '800',
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-primary)',
  marginBottom: '0.5rem'
};

const subtitleStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)'
};

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const iconStyle = {
  position: 'absolute',
  left: '12px',
  color: 'var(--text-muted)'
};

const inputControlStyle = {
  width: '100%',
  paddingLeft: '36px'
};

const btnSubmitStyle = {
  width: '100%',
  marginTop: '1.5rem'
};

const footerStyle = {
  marginTop: '2rem',
  textAlign: 'center',
  borderTop: '1px solid var(--glass-border)',
  paddingTop: '1.25rem'
};

const backLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'color 0.2s ease'
};

export default ResetPassword;
