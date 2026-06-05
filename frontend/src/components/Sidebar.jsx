import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, Wallet, Briefcase, User, Shield, LogOut, X, BarChart2 } from 'lucide-react';

const Sidebar = () => {
  const { user, logoutUser } = useAuth();
  const { sidebarOpen, closeSidebar } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  const handleNavClick = (path) => {
    closeSidebar();
    navigate(path);
  };

  return (
    <>
      {/* Backdrop overlay — z-index 1050 (below sidebar 1100) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        style={sidebarStyle}
        className={`sidebar-container glass-panel ${sidebarOpen ? 'open' : ''}`}
        aria-label="Navigation sidebar"
      >
        {/* Close button — only visible on mobile */}
        <button
          className="sidebar-mobile-close"
          onClick={closeSidebar}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div style={brandStyle}>
          <div style={logoIconStyle}>
            <Shield size={20} color="var(--accent-cyan)" />
          </div>
          <span style={brandNameStyle}>Investora</span>
        </div>

        {/* Nav Links */}
        <nav style={navContainerStyle}>
          <button
            onClick={() => handleNavClick('/dashboard')}
            style={navBtnStyle(window.location.pathname === '/dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleNavClick('/wallet')}
            style={navBtnStyle(window.location.pathname === '/wallet')}
          >
            <Wallet size={18} />
            <span>Wallet Ledger</span>
          </button>

          <button
            onClick={() => handleNavClick('/investments')}
            style={navBtnStyle(window.location.pathname === '/investments')}
          >
            <Briefcase size={18} />
            <span>Investments</span>
          </button>

          <button
            onClick={() => handleNavClick('/reports')}
            style={navBtnStyle(window.location.pathname === '/reports')}
          >
            <BarChart2 size={18} />
            <span>Reports</span>
          </button>

          <button
            onClick={() => handleNavClick('/profile')}
            style={navBtnStyle(window.location.pathname === '/profile')}
          >
            <User size={18} />
            <span>Account Security</span>
          </button>

          {user.role === 'admin' && (
            <button
              onClick={() => handleNavClick('/admin')}
              style={adminNavBtnStyle(window.location.pathname === '/admin')}
            >
              <Shield size={18} color="var(--accent-amber)" />
              <span style={{ color: 'var(--accent-amber)' }}>Admin Center</span>
            </button>
          )}
        </nav>

        {/* User Footer Profile */}
        <div style={footerStyle}>
          <div style={profileInfoStyle}>
            <div style={avatarStyle}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={textWrapperStyle}>
              <p style={userNameStyle}>{user.name}</p>
              <p style={userRoleStyle}>{user.role ? user.role.toUpperCase() : 'USER'}</p>
            </div>
          </div>

          <button onClick={logoutUser} style={logoutBtnStyle} title="Log out" aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
};

const sidebarStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '260px',
  height: '100dvh',  /* Dynamic viewport height for mobile browsers */
  background: 'var(--glass-bg)',
  borderRight: '1px solid var(--glass-border)',
  display: 'flex',
  flexDirection: 'column',
  padding: '1.5rem',
  paddingTop: '1.25rem',
  zIndex: 1100,
  borderRadius: '0',
  boxShadow: 'none',
  overflowY: 'auto',
  overflowX: 'hidden',
};

const brandStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '2rem',
  marginTop: '0.5rem',
  padding: '0.5rem',
  flexShrink: 0,
};

const logoIconStyle = {
  background: 'var(--accent-cyan-glow)',
  padding: '8px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 15px rgba(6, 182, 212, 0.15)',
  flexShrink: 0,
};

const brandNameStyle = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.25rem',
  fontWeight: '800',
  letterSpacing: '-0.03em',
  background: 'linear-gradient(135deg, var(--text-primary) 40%, var(--accent-cyan) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  whiteSpace: 'nowrap',
};

const navContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
};

const navBtnStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  padding: '0.85rem 1rem',
  borderRadius: '10px',
  color: isActive ? '#fff' : 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: '0.92rem',
  fontWeight: isActive ? '600' : '400',
  background: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
  border: isActive ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid transparent',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  outline: 'none',
  width: '100%',
  textAlign: 'left',
  minHeight: '44px',
  flexShrink: 0,
});

const adminNavBtnStyle = (isActive) => ({
  ...navBtnStyle(isActive),
  background: isActive ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
  border: isActive ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid transparent',
});

const footerStyle = {
  marginTop: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: '1rem',
  borderTop: '1px solid var(--glass-border)',
  flexShrink: 0,
  gap: '0.5rem',
};

const profileInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  overflow: 'hidden',
  flex: 1,
};

const avatarStyle = {
  width: '36px',
  height: '36px',
  minWidth: '36px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
  color: '#000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '700',
  fontSize: '0.9rem',
};

const textWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  flex: 1,
};

const userNameStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--text-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const userRoleStyle = {
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
  fontWeight: '600',
  letterSpacing: '0.05em',
};

const logoutBtnStyle = {
  background: 'rgba(244, 63, 94, 0.05)',
  border: '1px solid rgba(244, 63, 94, 0.1)',
  color: 'var(--accent-rose)',
  padding: '8px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  outline: 'none',
  minWidth: '36px',
  minHeight: '36px',
  flexShrink: 0,
};

export default Sidebar;
