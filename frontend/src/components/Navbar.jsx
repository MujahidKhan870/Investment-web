import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { Bell, CheckSquare, MessageSquare, Sun, Moon, Menu } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme, toggleSidebar } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data.notifications);
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleOutside = (e) => {
      if (!e.target.closest('.bell-wrapper')) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showDropdown]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n._id === id ? { ...n, read: true } : n)));
    } catch (error) { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header style={headerStyle}>
      <div style={titleContainerStyle}>
        {/* Hamburger — only visible on mobile via CSS */}
        <button
          onClick={toggleSidebar}
          style={menuBtnStyle}
          className="sidebar-mobile-toggle"
          title="Toggle Navigation Menu"
          aria-label="Open navigation"
        >
          <Menu size={18} color="var(--text-secondary)" />
        </button>
        <h1 className="navbar-title">{title}</h1>
      </div>

      <div style={actionsStyle}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={toggleBtnStyle}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          aria-label="Toggle theme"
        >
          <div style={toggleSliderStyle(theme === 'dark')} />
          <Sun  size={12} color="var(--accent-amber)" style={sunIconStyle(theme === 'dark')} />
          <Moon size={12} color="var(--accent-cyan)"  style={moonIconStyle(theme === 'dark')} />
        </button>

        {/* Notification Bell */}
        <div style={bellWrapperStyle} className="bell-wrapper">
          <button
            style={bellBtnStyle}
            onClick={() => setShowDropdown(s => !s)}
            className="glass-panel"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell size={18} color="var(--text-secondary)" />
            {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
          </button>

          {/* Dropdown Panel */}
          {showDropdown && (
            <div
              className="glass-panel notifications-dropdown"
              style={dropdownStyle}
            >
              <div style={dropdownHeaderStyle}>
                <span style={dropdownTitleStyle}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={markAllBtnStyle}>
                    <CheckSquare size={12} />
                    <span>Clear Unread</span>
                  </button>
                )}
              </div>
              <div style={listStyle}>
                {notifications.length === 0 ? (
                  <div style={emptyStyle}>No notification alerts</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      onClick={() => !n.read && markRead(n._id)}
                      style={itemStyle(n.read)}
                    >
                      <div style={iconWrapperStyle(n.type)}>
                        <MessageSquare size={14} />
                      </div>
                      <div style={textWrapperStyle}>
                        <h4 style={n.read ? readTitleStyle : unreadTitleStyle}>{n.title}</h4>
                        <p style={messageStyle}>{n.message}</p>
                        <span style={timeStyle}>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/* ── Styles ─────────────────────────────────────────────────── */

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.75rem',
  position: 'relative',
  gap: '0.75rem',
  flexWrap: 'nowrap',
  minHeight: '44px',
};

const titleContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flex: 1,
  minWidth: 0,
};

const menuBtnStyle = {
  display: 'none',          /* shown via CSS .sidebar-mobile-toggle class */
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid var(--glass-border)',
  padding: '8px',
  borderRadius: '10px',
  cursor: 'pointer',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
  minWidth: '40px',
  minHeight: '40px',
  flexShrink: 0,
};

const actionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexShrink: 0,
};

const bellWrapperStyle = { position: 'relative' };

const bellBtnStyle = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid var(--glass-border)',
  padding: '10px',
  borderRadius: '10px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  outline: 'none',
  minWidth: '40px',
  minHeight: '40px',
};

const badgeStyle = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  background: 'var(--accent-rose)',
  color: '#000',
  fontSize: '0.65rem',
  fontWeight: '700',
  borderRadius: '50%',
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 10px var(--accent-rose)',
};

const dropdownStyle = {
  position: 'absolute',
  top: '50px',
  right: 0,
  maxHeight: '400px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--glass-border)',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-glow)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1100,
};

const dropdownHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.85rem 1rem',
  borderBottom: '1px solid var(--glass-border)',
  gap: '0.5rem',
};

const dropdownTitleStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-primary)',
};

const markAllBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--accent-cyan)',
  cursor: 'pointer',
  fontSize: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  outline: 'none',
  whiteSpace: 'nowrap',
};

const listStyle = {
  overflowY: 'auto',
  flex: 1,
};

const emptyStyle = {
  padding: '2rem',
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: '0.85rem',
};

const itemStyle = (read) => ({
  display: 'flex',
  gap: '0.75rem',
  padding: '0.85rem 1rem',
  borderBottom: '1px solid var(--glass-border)',
  cursor: 'pointer',
  background: read ? 'transparent' : 'var(--accent-cyan-glow)',
  transition: 'background 0.2s ease',
});

const iconWrapperStyle = (type) => {
  let color = 'var(--accent-cyan)';
  let bg = 'var(--accent-cyan-glow)';
  if (type === 'earning')    { color = 'var(--accent-emerald)'; bg = 'var(--accent-emerald-glow)'; }
  else if (type === 'withdrawal') { color = 'var(--accent-rose)';    bg = 'var(--accent-rose-glow)';    }
  else if (type === 'security')   { color = 'var(--accent-amber)';   bg = 'var(--accent-amber-glow)';   }
  return {
    width: '28px', height: '28px', borderRadius: '8px',
    backgroundColor: bg, color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };
};

const textWrapperStyle = {
  display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0,
};

const readTitleStyle   = { fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const unreadTitleStyle = { fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)',   overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const messageStyle     = { fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' };
const timeStyle        = { fontSize: '0.65rem', color: 'var(--text-muted)' };

/* Theme toggle pill */
const toggleBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--glass-border)',
  padding: '4px 6px',
  width: '50px',
  height: '26px',
  borderRadius: '13px',
  cursor: 'pointer',
  position: 'relative',
  outline: 'none',
  boxShadow: 'var(--shadow-glow)',
  transition: 'all 0.3s ease',
  flexShrink: 0,
};

const toggleSliderStyle = (isDark) => ({
  position: 'absolute',
  top: '2px',
  left: isDark ? '26px' : '2px',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 2,
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
});

const sunIconStyle  = (isDark) => ({ opacity: isDark ? 0.2 : 1, transition: 'opacity 0.3s ease', zIndex: 1 });
const moonIconStyle = (isDark) => ({ opacity: isDark ? 1 : 0.2, transition: 'opacity 0.3s ease', zIndex: 1 });

export default Navbar;
