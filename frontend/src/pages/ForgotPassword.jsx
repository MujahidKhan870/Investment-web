import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { handleApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const { showToast } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedToken, setSimulatedToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const response = await api.post('/auth/forgot-password', { email });
      showToast(response.data.message);
      if (response.data.simulatedToken) {
        setSimulatedToken(response.data.simulatedToken);
      }
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
            <KeyRound size={22} color="var(--accent-cyan)" />
          </div>
          <h2 style={titleStyle}>Forgot Password</h2>
          <p style={subtitleStyle}>Enter email below to retrieve credentials</p>
        </div>

        {/* Sandbox */}
        {simulatedToken && (
          <div style={sandboxStyle} className="glass-panel">
            <h4 style={sandboxTitleStyle}>Sandbox Mode Active</h4>
            <p style={sandboxTextStyle}>A simulated reset link was generated. Click below to reset credentials:</p>
            <Link 
              to={`/reset-password?token=${simulatedToken}`}
              className="btn btn-primary"
              style={sandboxBtnStyle}
            >
              Reset Password Screen
            </Link>
          </div>
        )}

        {/* Form */}
        {!simulatedToken && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={inputWrapperStyle}>
                <Mail size={16} style={iconStyle} />
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputControlStyle}
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
              {loading ? 'Sending Request...' : 'Send Recovery Link'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={footerStyle}>
          <Link to="/login" style={backLinkStyle}>
            <ArrowLeft size={14} />
            <span>Back to login page</span>
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

const sandboxStyle = {
  padding: '1.5rem',
  backgroundColor: 'rgba(6, 182, 212, 0.05)',
  border: '1px solid rgba(6, 182, 212, 0.2)',
  borderRadius: '10px',
  textAlign: 'center',
  marginBottom: '1.5rem'
};

const sandboxTitleStyle = {
  fontSize: '0.95rem',
  fontWeight: '700',
  color: 'var(--accent-cyan)',
  marginBottom: '0.5rem',
  fontFamily: 'var(--font-heading)'
};

const sandboxTextStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  marginBottom: '1rem',
  lineHeight: '1.4'
};

const sandboxBtnStyle = {
  width: '100%',
  fontSize: '0.85rem',
  padding: '0.6rem'
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

export default ForgotPassword;
