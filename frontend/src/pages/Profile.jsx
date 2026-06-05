import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Key, Laptop, Trash2 } from 'lucide-react';

const Profile = () => {
  const { user, showToast, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/auth/sessions');
      setSessions(response.data.data.sessions);
    } catch (error) { /* handled */ }
    finally { setLoadingSessions(false); }
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTwoFactorEnabled(user.twoFactorEnabled);
      fetchSessions();
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      await api.patch('/users/update-me', { name, twoFactorEnabled });
      showToast('Profile configuration updated successfully');
      await refreshProfile();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile', 'danger');
    } finally { setUpdatingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'danger');
      return;
    }
    try {
      setUpdatingPassword(true);
      const response = await api.patch('/users/change-password', { currentPassword, newPassword });
      showToast(response.data.message);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update password', 'danger');
    } finally { setUpdatingPassword(false); }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      showToast('Session revoked successfully');
      setSessions(prev => prev.filter(s => s._id !== sessionId));
    } catch (error) {
      showToast('Failed to revoke session', 'danger');
    }
  };

  return (
    <div className="main-content fade-in">
      <Navbar title="Account Security" />

      {/* Profile + Password Cards — responsive 2-col → 1-col */}
      <div className="grid-container" style={layoutGridStyle}>

        {/* Profile Settings */}
        <div className="glass-panel" style={sectionCardStyle}>
          <h3 style={sectionTitleStyle}>
            <User size={18} color="var(--accent-cyan)" style={iconMarginStyle} />
            <span>Profile Configuration</span>
          </h3>

          <form onSubmit={handleUpdateProfile} style={{ marginTop: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                className="form-control"
                value={user?.email || ''}
                disabled
                style={readOnlyStyle}
              />
            </div>

            <div style={toggleRowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={toggleLabelStyle}>Two-Factor Authentication (2FA)</p>
                <p style={toggleSubLabelStyle}>Adds verification layer to withdrawals</p>
              </div>
              <label style={switchStyle}>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={e => setTwoFactorEnabled(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <span style={switchTrackStyle(twoFactorEnabled)}>
                  <span style={switchKnobStyle(twoFactorEnabled)} />
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={btnSubmitStyle}
              disabled={updatingProfile}
            >
              {updatingProfile ? 'Saving...' : 'Save Profile Settings'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="glass-panel" style={sectionCardStyle}>
          <h3 style={sectionTitleStyle}>
            <Key size={18} color="var(--accent-violet)" style={iconMarginStyle} />
            <span>Change Security Password</span>
          </h3>

          <form onSubmit={handleChangePassword} style={{ marginTop: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="•••••••• (Min 8 characters)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength="8"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                minLength="8"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-secondary"
              style={btnSubmitStyle}
              disabled={updatingPassword}
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <h3 style={tableSectionTitle}>Active Devices &amp; Login Sessions</h3>
        <p style={tableSectionSubtitle}>Monitor devices authorised to access your portfolio ledger.</p>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Browser</th>
                <th>IP Address</th>
                <th>Last Active</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingSessions ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No sessions logged.
                  </td>
                </tr>
              ) : (
                sessions.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: '600' }}>
                      <div style={deviceNameRowStyle}>
                        <Laptop size={16} color="var(--text-secondary)" />
                        <span>{s.deviceType}</span>
                      </div>
                    </td>
                    <td>{s.browser}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{s.ipAddress}</td>
                    <td>{new Date(s.lastActivity).toLocaleString()}</td>
                    <td><span className="pill pill-success">Active</span></td>
                    <td>
                      {s.refreshToken === localStorage.getItem('refreshToken') ? (
                        <span style={currentDeviceLabel}>This Device</span>
                      ) : (
                        <button
                          onClick={() => handleRevokeSession(s._id)}
                          style={revokeSessionBtnStyle}
                          title="Revoke session"
                        >
                          <Trash2 size={14} />
                          <span>Revoke</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ── Styles ─────────────────────────────────────────────────── */
const layoutGridStyle = {
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
  gap: '2rem',
};

const sectionCardStyle = { padding: 'clamp(1.25rem, 3vw, 1.75rem)' };

const sectionTitleStyle = {
  fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
  color: 'var(--text-primary)',
  fontWeight: '700',
  fontFamily: 'var(--font-heading)',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.25rem',
};

const iconMarginStyle = { marginRight: '4px', flexShrink: 0 };

const readOnlyStyle = {
  background: 'rgba(255,255,255,0.01)',
  color: 'var(--text-muted)',
  cursor: 'not-allowed',
  borderColor: 'rgba(255,255,255,0.03)',
};

const btnSubmitStyle = { width: '100%', marginTop: '1.25rem' };

const toggleRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 0',
  borderTop: '1px solid var(--glass-border)',
  borderBottom: '1px solid var(--glass-border)',
  margin: '1.25rem 0',
  gap: '1rem',
};

const toggleLabelStyle = {
  fontSize: '0.88rem',
  fontWeight: '600',
  color: 'var(--text-primary)',
};

const toggleSubLabelStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginTop: '2px',
};

const switchStyle = {
  position: 'relative',
  display: 'inline-block',
  width: '44px',
  height: '24px',
  cursor: 'pointer',
  flexShrink: 0,
};

const switchTrackStyle = (active) => ({
  position: 'absolute',
  inset: 0,
  borderRadius: '34px',
  backgroundColor: active ? 'var(--accent-cyan)' : 'var(--glass-border)',
  transition: '0.3s',
  boxShadow: active ? '0 0 10px var(--accent-cyan-glow)' : 'none',
});

const switchKnobStyle = (active) => ({
  display: 'block',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  backgroundColor: active ? 'var(--bg-secondary)' : 'var(--text-secondary)',
  position: 'absolute',
  left: '4px',
  bottom: '4px',
  transition: '0.3s',
  transform: active ? 'translateX(20px)' : 'translateX(0)',
});

const tableSectionTitle = {
  padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 1.5rem) 0.25rem',
  fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
  fontFamily: 'var(--font-heading)',
  fontWeight: '700',
};

const tableSectionSubtitle = {
  padding: '0 clamp(1rem, 3vw, 1.5rem) 1rem',
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
};

const deviceNameRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const currentDeviceLabel = {
  fontSize: '0.78rem',
  color: 'var(--accent-cyan)',
  fontWeight: '600',
};

const revokeSessionBtnStyle = {
  background: 'rgba(244,63,94,0.08)',
  border: '1px solid rgba(244,63,94,0.15)',
  color: 'var(--accent-rose)',
  padding: '4px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.75rem',
  transition: 'all 0.2s ease',
  outline: 'none',
};

export default Profile;
