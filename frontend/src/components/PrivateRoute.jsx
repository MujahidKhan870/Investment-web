import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={spinnerContainerStyle}>
        <div style={spinnerStyle} />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const spinnerContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#0a0f1d'
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '3px solid rgba(255,255,255,0.05)',
  borderTopColor: 'hsl(190, 90%, 50%)',
  borderRadius: '50%',
  animation: 'spinner 0.8s linear infinite'
};

export default PrivateRoute;
