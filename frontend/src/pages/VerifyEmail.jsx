import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api, { handleApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, Check } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { showToast } = useAuth();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const triggerVerification = async () => {
      if (!token) {
        setVerifying(false);
        setErrorMsg('Verification token is missing from the URL.');
        return;
      }

      try {
        const response = await api.post('/auth/verify-email', { token });
        setSuccess(true);
        showToast(response.data.message);
      } catch (err) {
        setErrorMsg(handleApiError(err));
        showToast(handleApiError(err), 'danger');
      } finally {
        setVerifying(false);
      }
    };

    triggerVerification();
  }, [token]);

  return (
    <div className="auth-container" style={containerStyle}>
      <div className="auth-card glass-panel fade-in" style={cardStyle}>
        {verifying ? (
          <div style={contentStyle}>
            <div style={spinnerStyle} />
            <h2 style={titleStyle}>Verifying Email</h2>
            <p style={subtitleStyle}>Please wait while we validate your activation credentials...</p>
          </div>
        ) : success ? (
          <div style={contentStyle}>
            <div style={successIconBoxStyle}>
              <Check size={32} color="#000" />
            </div>
            <h2 style={titleStyle}>Account Verified</h2>
            <p style={subtitleStyle}>Congratulations! Your email address has been successfully verified.</p>
            <Link to="/login" className="btn btn-primary" style={btnStyle}>
              Proceed to Login
            </Link>
          </div>
        ) : (
          <div style={contentStyle}>
            <div style={errorIconBoxStyle}>
              <ShieldAlert size={32} color="var(--accent-rose)" />
            </div>
            <h2 style={titleStyle}>Verification Failed</h2>
            <p style={errorTextStyle}>{errorMsg}</p>
            <Link to="/register" className="btn btn-secondary" style={btnStyle}>
              Back to Registration
            </Link>
          </div>
        )}
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

const cardStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-glow)',
  textAlign: 'center'
};

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.25rem'
};

const spinnerStyle = {
  width: '45px',
  height: '45px',
  border: '3px solid var(--glass-border)',
  borderTopColor: 'var(--accent-cyan)',
  borderRadius: '50%',
  animation: 'spinner 0.8s linear infinite',
  marginBottom: '1rem'
};

const successIconBoxStyle = {
  background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-emerald) 100%)',
  padding: '14px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)',
  marginBottom: '1rem'
};

const errorIconBoxStyle = {
  background: 'var(--accent-rose-glow)',
  padding: '14px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(244, 63, 94, 0.2)',
  marginBottom: '1rem'
};

const titleStyle = {
  fontSize: '1.75rem',
  fontWeight: '800',
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-primary)'
};

const subtitleStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
  lineHeight: '1.5'
};

const errorTextStyle = {
  fontSize: '0.9rem',
  color: 'var(--accent-rose)',
  lineHeight: '1.5'
};

const btnStyle = {
  width: '100%',
  marginTop: '1rem'
};

export default VerifyEmail;
