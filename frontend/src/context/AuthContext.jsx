import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { handleApiError } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Show premium glassmorphism alert notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data.data.user);
    } catch (error) {
      // Clean up local token if validation failed
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    // Intercept logs-out from Axios API failures
    const handleForceLogout = () => {
      setUser(null);
      showToast('Session expired. Please log in again.', 'danger');
    };

    window.addEventListener('auth-logout', handleForceLogout);
    return () => window.removeEventListener('auth-logout', handleForceLogout);
  }, []);

  const loginUser = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, data } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      setUser(data.user);
      showToast('Logged in successfully!');
      return { success: true };
    } catch (err) {
      const message = handleApiError(err);
      showToast(message, 'danger');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', { name, email, password });
      showToast(response.data.message || 'Registration successful! Verification email logged.');
      return { success: true, simulatedToken: response.data.simulatedToken };
    } catch (err) {
      const message = handleApiError(err);
      showToast(message, 'danger');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      showToast('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, toast, loginUser, registerUser, logoutUser, showToast, refreshProfile: fetchCurrentUser }}>
      {children}
      
      {/* Toast Alert Portal Component */}
      {toast && (
        <div style={toastContainerStyle} className="glass-panel fade-in">
          <div style={indicatorStyle(toast.type)} />
          <span style={textStyle}>{toast.message}</span>
          <button style={closeBtnStyle} onClick={() => setToast(null)}>&times;</button>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Dynamic Inlined Styles for Toast to avoid file dependencies
const toastContainerStyle = {
  position: 'fixed',
  top: '24px',
  right: '24px',
  display: 'flex',
  alignItems: 'center',
  padding: '1rem 1.25rem',
  gap: '0.75rem',
  zIndex: 9999,
  minWidth: '320px',
  maxWidth: '450px',
  background: 'rgba(10, 15, 29, 0.85)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  borderRadius: '12px'
};

const indicatorStyle = (type) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: type === 'success' ? 'hsl(145, 80%, 45%)' : type === 'danger' ? 'hsl(340, 80%, 55%)' : 'hsl(190, 90%, 50%)',
  boxShadow: `0 0 10px ${type === 'success' ? 'hsla(145, 80%, 45%, 0.6)' : type === 'danger' ? 'hsla(340, 80%, 55%, 0.6)' : 'hsla(190, 90%, 50%, 0.6)'}`
});

const textStyle = {
  fontSize: '0.9rem',
  fontWeight: '500',
  color: '#f3f4f6',
  flex: 1
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#6b7280',
  fontSize: '1.2rem',
  cursor: 'pointer',
  padding: '0 4px',
  outline: 'none'
};
