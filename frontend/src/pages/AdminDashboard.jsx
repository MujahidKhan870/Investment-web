import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, FileSpreadsheet, Play, Check, X,
  Award, FileText, ShieldAlert
} from 'lucide-react';
import { formatRupee } from '../utils/format';

const AdminDashboard = () => {
  const { showToast } = useAuth();

  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [plans, setPlans] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '', minAmount: '', maxAmount: '',
    dailyProfitPercentage: '', durationDays: '', description: ''
  });

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [sRes, uRes, wRes, pRes, aRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/withdrawals'),
        api.get('/investments/plans'),
        api.get('/admin/audit-logs'),
      ]);
      setStats(sRes.data.data);
      setUsers(uRes.data.data.users);
      setWithdrawals(wRes.data.data.withdrawals);
      setPlans(pRes.data.data.plans);
      setAudits(aRes.data.data.logs);
    } catch (err) { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAdminData(); }, []);

  const handleTriggerEarnings = async () => {
    try {
      setCalculating(true);
      const response = await api.post('/admin/trigger-earnings');
      const { processedCount, totalPayout } = response.data.data;
      showToast(`Processed ${processedCount} contracts. Paid ${formatRupee(totalPayout)}`);
      fetchAdminData();
    } catch (error) {
      showToast('Earnings generation failed', 'danger');
    } finally { setCalculating(false); }
  };

  const handleUserStatusUpdate = async (userId, newStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      showToast(`User status updated to ${newStatus}`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: newStatus } : u));
    } catch (error) { showToast('Failed to update status', 'danger'); }
  };

  const handlePromoteUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/promote`);
      showToast('User promoted to administrator');
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) { showToast('Failed to promote user', 'danger'); }
  };

  const handleProcessWithdrawal = async (txId, action) => {
    try {
      await api.patch(`/admin/withdrawals/${txId}`, { action });
      showToast(`Withdrawal ${action}d successfully`);
      setWithdrawals(prev => prev.map(w =>
        w._id === txId ? { ...w, status: action === 'approve' ? 'completed' : 'rejected' } : w
      ));
      fetchAdminData();
    } catch (error) { showToast('Action failed', 'danger'); }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (selectedPlan) {
        const response = await api.patch(`/admin/plans/${selectedPlan._id}`, planForm);
        showToast('Investment Plan updated');
        setPlans(prev => prev.map(p => p._id === selectedPlan._id ? response.data.data.plan : p));
      } else {
        const response = await api.post('/admin/plans', planForm);
        showToast('New Plan created');
        setPlans(prev => [...prev, response.data.data.plan]);
      }
      setShowPlanModal(false);
      setSelectedPlan(null);
      setPlanForm({ name: '', minAmount: '', maxAmount: '', dailyProfitPercentage: '', durationDays: '', description: '' });
    } catch (error) { showToast('Failed to save plan', 'danger'); }
  };

  const handleEditPlanClick = (plan) => {
    setSelectedPlan(plan);
    setPlanForm({
      name: plan.name, minAmount: plan.minAmount, maxAmount: plan.maxAmount,
      dailyProfitPercentage: plan.dailyProfitPercentage,
      durationDays: plan.durationDays, description: plan.description
    });
    setShowPlanModal(true);
  };

  const handleTogglePlanActive = async (plan) => {
    try {
      const response = await api.patch(`/admin/plans/${plan._id}`, { active: !plan.active });
      showToast(`Plan ${!plan.active ? 'activated' : 'deactivated'}`);
      setPlans(prev => prev.map(p => p._id === plan._id ? response.data.data.plan : p));
    } catch (error) { showToast('Action failed', 'danger'); }
  };

  const exportReport = (endpoint, name) => {
    window.open(`/api/reports/${endpoint}`, '_blank');
    showToast(`Report downloaded: ${name}`);
  };

  const TABS = [
    { id: 'analytics',   label: 'Overview Stats' },
    { id: 'users',       label: 'Manage Users' },
    { id: 'withdrawals', label: `Withdrawals (${withdrawals.filter(w => w.status === 'pending').length})` },
    { id: 'plans',       label: 'Plans Manager' },
    { id: 'audits',      label: 'Audits & Exports' },
  ];

  if (loading) {
    return (
      <div className="main-content">
        <Navbar title="Admin Center" />
        <div style={{ height: '56px', marginBottom: '1.5rem' }} className="glass-panel skeleton" />
        <div className="grid-container">
          <div className="glass-panel skeleton skeleton-card" />
          <div className="glass-panel skeleton skeleton-card" />
          <div className="glass-panel skeleton skeleton-card" />
          <div className="glass-panel skeleton skeleton-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in">
      <Navbar title="Admin Center" />

      {/* Tab Bar — horizontally scrollable on mobile */}
      <div className="glass-panel admin-tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={tabBtnStyle(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 1. Overview Analytics ─────────────────────────── */}
      {activeTab === 'analytics' && stats && (
        <div className="fade-in">
          <div className="grid-container">
            <div className="glass-panel" style={miniCardStyle}>
              <span style={miniCardLabelStyle}>Total Users</span>
              <h2 style={miniCardValueStyle}>{stats.totalUsers}</h2>
              <p style={miniCardFooterStyle}>{stats.activeUsers} Verified &amp; Active</p>
            </div>
            <div className="glass-panel" style={miniCardStyle}>
              <span style={miniCardLabelStyle}>Active Subscriptions</span>
              <h2 style={miniCardValueStyle}>{stats.activeInvestmentsCount}</h2>
              <p style={miniCardFooterStyle}>Volume: {formatRupee(stats.totalInvestedCapital)}</p>
            </div>
            <div className="glass-panel" style={miniCardStyle}>
              <span style={miniCardLabelStyle}>Total Return Payouts</span>
              <h2 style={miniCardValueStyle}>{formatRupee(stats.totalPayouts)}</h2>
              <p style={miniCardFooterStyle}>All time ledger interest</p>
            </div>
            <div className="glass-panel" style={miniCardStyle}>
              <span style={miniCardLabelStyle}>Wallet Reserves (Net)</span>
              <h2 style={miniCardValueStyle}>{formatRupee(stats.platformReserves)}</h2>
              <p style={miniCardFooterStyle}>Net deposit assets</p>
            </div>
          </div>

          <div className="glass-panel" style={debugSectionStyle}>
            <h3 style={sectionTitleStyle}>Developer Sandbox Operations</h3>
            <p style={sectionSubtitleStyle}>Trigger daily returns to test wallet interest mechanics:</p>
            <button
              className="btn btn-primary"
              onClick={handleTriggerEarnings}
              disabled={calculating}
            >
              <Play size={14} fill="#000" />
              <span>{calculating ? 'Running Return Engine...' : 'Trigger Daily Return Calculations'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Manage Users ───────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="glass-panel fade-in">
          <h3 style={tableTitleStyle}>Platform User Directory</h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Registered</th>
                  <th>Balance</th>
                  <th>Earnings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <p style={{ fontWeight: '600' }}>{u.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</p>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: '600' }}>{formatRupee(u.balance)}</td>
                    <td style={{ color: 'var(--accent-emerald)' }}>+{formatRupee(u.totalEarnings)}</td>
                    <td>
                      <span className={`pill pill-${u.status === 'Active' ? 'success' : u.status === 'Pending Verification' ? 'pending' : 'danger'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div style={actionRowStyle}>
                        {u.status !== 'Active' && (
                          <button onClick={() => handleUserStatusUpdate(u._id, 'Active')} style={actionBtnStyle('var(--accent-emerald-glow)', 'var(--accent-emerald)')}>
                            Activate
                          </button>
                        )}
                        {u.status !== 'Suspended' && (
                          <button onClick={() => handleUserStatusUpdate(u._id, 'Suspended')} style={actionBtnStyle('var(--accent-amber-glow)', 'var(--accent-amber)')}>
                            Suspend
                          </button>
                        )}
                        {u.status !== 'Blocked' && (
                          <button onClick={() => handleUserStatusUpdate(u._id, 'Blocked')} style={actionBtnStyle('var(--accent-rose-glow)', 'var(--accent-rose)')}>
                            Block
                          </button>
                        )}
                        <button onClick={() => handlePromoteUser(u._id)} style={actionBtnStyle('rgba(255,255,255,0.05)', '#fff')}>
                          Make Admin
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3. Withdrawals ────────────────────────────────── */}
      {activeTab === 'withdrawals' && (
        <div className="glass-panel fade-in">
          <h3 style={tableTitleStyle}>Withdrawal Payout Approvals</h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Account</th>
                  <th>Gateway</th>
                  <th>Date</th>
                  <th>State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No withdrawal records.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map(w => (
                    <tr key={w._id}>
                      <td>
                        <p style={{ fontWeight: '600' }}>{w.userId?.name || 'Deleted User'}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.userId?.email || ''}</p>
                      </td>
                      <td style={{ color: 'var(--accent-rose)', fontWeight: '600' }}>-{formatRupee(w.amount)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {w.description.replace('Withdrawal request to account: ', '')}
                      </td>
                      <td>{w.paymentMethod}</td>
                      <td>{new Date(w.createdAt).toLocaleString()}</td>
                      <td><span className={`pill pill-${w.status}`}>{w.status}</span></td>
                      <td>
                        {w.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button onClick={() => handleProcessWithdrawal(w._id, 'approve')} style={approveBtnStyle}>
                              <Check size={14} /><span>Approve</span>
                            </button>
                            <button onClick={() => handleProcessWithdrawal(w._id, 'reject')} style={rejectBtnStyle}>
                              <X size={14} /><span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. Plans Manager ──────────────────────────────── */}
      {activeTab === 'plans' && (
        <div className="fade-in">
          <div className="plan-mgr-header" style={planMgrHeaderStyle}>
            <h3 style={sectionTitleStyle}>Product Packages Catalog</h3>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedPlan(null);
                setPlanForm({ name: '', minAmount: '', maxAmount: '', dailyProfitPercentage: '', durationDays: '', description: '' });
                setShowPlanModal(true);
              }}
            >
              Add New Plan
            </button>
          </div>

          <div className="grid-container" style={{ marginTop: '1rem' }}>
            {plans.map(p => (
              <div key={p._id} className="glass-panel" style={planCardStyle(p.active)}>
                <h4 style={planTitleStyle}>{p.name}</h4>
                <p style={{ color: 'var(--accent-emerald)', fontWeight: '600', fontSize: '0.85rem' }}>
                  +{p.dailyProfitPercentage}% Yield / Day
                </p>
                <p style={pDetailText}>Term: {p.durationDays} Days</p>
                <p style={pDetailText}>Limits: {formatRupee(p.minAmount)} – {formatRupee(p.maxAmount)}</p>
                <div style={planCardActions}>
                  <button className="btn btn-secondary" onClick={() => handleEditPlanClick(p)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem' }}>
                    Edit Plan
                  </button>
                  <button onClick={() => handleTogglePlanActive(p)} style={togglePlanActiveBtn(p.active)}>
                    {p.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Audits & Exports ───────────────────────────── */}
      {activeTab === 'audits' && (
        <div className="fade-in admin-double-panel">
          {/* Export Links */}
          <div className="glass-panel admin-panel-left" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
            <h3 style={sectionTitleStyle}>Export Platform Data</h3>
            <p style={sectionSubtitleStyle}>Download administrative audit reports (CSV format)</p>
            <div style={exportsGridStyle}>
              {[
                { endpoint: 'users',       name: 'Users Register',        icon: <Users size={20} color="var(--accent-cyan)" /> },
                { endpoint: 'investments', name: 'Investment Contracts',   icon: <Award size={20} color="var(--accent-violet)" /> },
                { endpoint: 'transactions',name: 'Cash Flow Ledger',       icon: <FileSpreadsheet size={20} color="var(--accent-rose)" /> },
                { endpoint: 'earnings',    name: 'Returns Payouts',        icon: <Play size={18} color="var(--accent-emerald)" fill="var(--accent-emerald-glow)" /> },
                { endpoint: 'audit-logs',  name: 'Admin Audit Trail',      icon: <FileText size={20} color="var(--accent-amber)" /> },
              ].map(({ endpoint, name, icon }) => (
                <button
                  key={endpoint}
                  onClick={() => exportReport(endpoint, name)}
                  style={exportLinkStyle}
                  className="glass-panel glass-panel-hover"
                >
                  {icon}
                  <span>Export {name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="glass-panel admin-panel-right" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
            <h3 style={sectionTitleStyle}>Admin Security Audit Trail</h3>
            <div className="table-responsive" style={{ marginTop: '1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map(a => (
                    <tr key={a._id}>
                      <td>
                        <p style={{ fontWeight: '600' }}>{a.actionBy?.name || 'System'}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.actionBy?.email || ''}</p>
                      </td>
                      <td style={auditActionTypeStyle}>{a.actionType}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{a.ipAddress}</td>
                      <td>{new Date(a.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div style={modalOverlayStyle}>
          <div className="glass-panel fade-in modal-card" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>
                {selectedPlan ? `Edit ${selectedPlan.name}` : 'Create Investment Plan'}
              </h3>
              <button style={closeBtnStyle} onClick={() => setShowPlanModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan}>
              <div className="form-group">
                <label className="form-label">Plan Name</label>
                <input
                  type="text" className="form-control" value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Platinum Elite Plan" required
                />
              </div>

              <div className="grid-2-col">
                <div className="form-group">
                  <label className="form-label">Minimum Limit (₹)</label>
                  <input type="number" className="form-control" value={planForm.minAmount}
                    onChange={e => setPlanForm({ ...planForm, minAmount: e.target.value })} placeholder="1000" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Maximum Limit (₹)</label>
                  <input type="number" className="form-control" value={planForm.maxAmount}
                    onChange={e => setPlanForm({ ...planForm, maxAmount: e.target.value })} placeholder="100000" required />
                </div>
              </div>

              <div className="grid-2-col">
                <div className="form-group">
                  <label className="form-label">Daily Yield (%)</label>
                  <input type="number" step="0.01" className="form-control" value={planForm.dailyProfitPercentage}
                    onChange={e => setPlanForm({ ...planForm, dailyProfitPercentage: e.target.value })} placeholder="2.5" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Contract Days</label>
                  <input type="number" className="form-control" value={planForm.durationDays}
                    onChange={e => setPlanForm({ ...planForm, durationDays: e.target.value })} placeholder="90" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Plan Description</label>
                <textarea
                  className="form-control" value={planForm.description}
                  onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Curated portfolio strategy yielding maximum payouts..."
                  style={{ minHeight: '80px', resize: 'vertical' }} required
                />
              </div>

              <div style={modalActionsStyle} className="modal-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {selectedPlan ? 'Save Changes' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Styles ─────────────────────────────────────────────────── */
const tabBtnStyle = (isActive) => ({
  background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
  border: isActive ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
  color: isActive ? '#fff' : 'var(--text-secondary)',
  padding: '0.65rem 1rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: isActive ? '600' : '400',
  fontSize: '0.85rem',
  transition: 'all 0.2s ease',
  outline: 'none',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  minHeight: '40px',
});

const miniCardStyle = {
  padding: 'clamp(1rem, 3vw, 1.25rem)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const miniCardLabelStyle = { fontSize: '0.78rem', color: 'var(--text-secondary)' };
const miniCardValueStyle  = {
  fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
  fontWeight: '800',
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-primary)',
  wordBreak: 'break-all',
};
const miniCardFooterStyle = { fontSize: '0.7rem', color: 'var(--text-muted)' };

const debugSectionStyle = {
  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
  background: 'var(--accent-cyan-glow)',
  border: '1px solid var(--glass-border)',
  borderRadius: '12px',
  marginTop: '2rem',
};

const sectionTitleStyle = {
  fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-heading)',
  fontWeight: '700',
};

const sectionSubtitleStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  marginTop: '0.25rem',
  marginBottom: '1.25rem',
};

const tableTitleStyle = {
  padding: 'clamp(1rem, 3vw, 1.25rem) clamp(1rem, 3vw, 1.25rem) 0.25rem',
  fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
  fontFamily: 'var(--font-heading)',
  fontWeight: '700',
};

const actionRowStyle = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
};

const actionBtnStyle = (bg, color) => ({
  background: bg, color,
  border: 'none',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.72rem',
  cursor: 'pointer',
  fontWeight: '600',
  outline: 'none',
  whiteSpace: 'nowrap',
});

const approveBtnStyle = {
  background: 'rgba(16,185,129,0.1)',
  border: '1px solid rgba(16,185,129,0.2)',
  color: 'var(--accent-emerald)',
  padding: '4px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.75rem',
  fontWeight: '600',
  outline: 'none',
  whiteSpace: 'nowrap',
};

const rejectBtnStyle = {
  background: 'rgba(244,63,94,0.1)',
  border: '1px solid rgba(244,63,94,0.2)',
  color: 'var(--accent-rose)',
  padding: '4px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.75rem',
  fontWeight: '600',
  outline: 'none',
  whiteSpace: 'nowrap',
};

const planMgrHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  flexWrap: 'wrap',
  gap: '0.75rem',
};

const planCardStyle = (active) => ({
  padding: 'clamp(1.25rem, 3vw, 1.5rem)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  opacity: active ? 1 : 0.6,
  border: active ? '1px solid var(--glass-border)' : '1px dashed var(--glass-border)',
});

const planTitleStyle = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1rem',
  color: 'var(--text-primary)',
  fontWeight: '700',
};

const pDetailText = { fontSize: '0.8rem', color: 'var(--text-secondary)' };

const planCardActions = {
  display: 'flex',
  gap: '8px',
  marginTop: '1rem',
  flexWrap: 'wrap',
};

const togglePlanActiveBtn = (active) => ({
  background: active ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
  border: active ? '1px solid rgba(244,63,94,0.2)' : '1px solid rgba(16,185,129,0.2)',
  color: active ? 'var(--accent-rose)' : 'var(--accent-emerald)',
  padding: '4px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: '600',
  flex: 1,
  outline: 'none',
  minHeight: '34px',
});

const exportsGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
  marginTop: '1rem',
};

const exportLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  padding: '0.875rem 1rem',
  width: '100%',
  textAlign: 'left',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid var(--glass-border)',
  borderRadius: '10px',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  fontWeight: '600',
  fontSize: '0.88rem',
  transition: 'all 0.2s ease',
  outline: 'none',
};

const auditActionTypeStyle = {
  fontWeight: '600',
  fontSize: '0.78rem',
  color: 'var(--accent-cyan)',
};

/* Modal */
const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(5,5,10,0.75)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10000,
  padding: '1rem',
  overflowY: 'auto',
};

const modalCardStyle = {
  width: '100%',
  maxWidth: '480px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--glass-border)',
  borderRadius: '16px',
  padding: 'clamp(1.25rem, 4vw, 2rem)',
  boxShadow: 'var(--shadow-glow)',
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  gap: '0.5rem',
};

const modalTitleStyle = {
  fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-heading)',
  fontWeight: '700',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  outline: 'none',
  flexShrink: 0,
};

const modalActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1.5rem',
};

export default AdminDashboard;
