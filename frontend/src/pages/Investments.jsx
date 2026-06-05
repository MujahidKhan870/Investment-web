import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, Layers, ShieldCheck, ArrowRight, X, Percent, Check, IndianRupee } from 'lucide-react';
import { formatRupee } from '../utils/format';

const Investments = () => {
  const { showToast, refreshProfile } = useAuth();

  const [plans, setPlans] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInvestData = async () => {
    try {
      const pRes = await api.get('/investments/plans');
      setPlans(pRes.data.data.plans);
      const mRes = await api.get('/investments/my-investments');
      setMyInvestments(mRes.data.data.investments);
      const wRes = await api.get('/wallet');
      setWallet(wRes.data.data.wallet);
    } catch (err) { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvestData(); }, []);

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!selectedPlan || !buyAmount || Number(buyAmount) <= 0) return;
    const amount = Number(buyAmount);

    if (amount < selectedPlan.minAmount || amount > selectedPlan.maxAmount) {
      showToast(`Amount must be between ${formatRupee(selectedPlan.minAmount)} and ${formatRupee(selectedPlan.maxAmount)}`, 'danger');
      return;
    }
    if (wallet && wallet.balance < amount) {
      showToast('Insufficient wallet balance. Deposit funds first.', 'danger');
      return;
    }
    try {
      setSubmitting(true);
      const response = await api.post('/investments/subscribe', { planId: selectedPlan._id, amount });
      showToast(response.data.message);
      setWallet(prev => ({ ...prev, balance: prev.balance - amount }));
      setSelectedPlan(null);
      setBuyAmount('');
      const mRes = await api.get('/investments/my-investments');
      setMyInvestments(mRes.data.data.investments);
      await refreshProfile();
    } catch (error) {
      showToast(error.response?.data?.message || 'Plan subscription failed', 'danger');
    } finally { setSubmitting(false); }
  };

  const getTierIcon = (name) => {
    if (name.includes('Basic'))    return <Layers    size={22} color="var(--accent-cyan)"   />;
    if (name.includes('Silver'))   return <Award     size={22} color="var(--accent-violet)" />;
    if (name.includes('Gold'))     return <ShieldCheck size={22} color="var(--accent-amber)" />;
    return <Award size={22} color="var(--accent-rose)" />;
  };

  const planIconBg = (name) => {
    if (name.includes('Silver'))   return 'var(--accent-violet-glow)';
    if (name.includes('Gold'))     return 'var(--accent-amber-glow)';
    if (name.includes('Platinum')) return 'var(--accent-rose-glow)';
    return 'var(--accent-cyan-glow)';
  };

  if (loading) {
    return (
      <div className="main-content">
        <Navbar title="Investments Portal" />
        <div className="grid-container">
          <div style={{ height: '260px' }} className="glass-panel skeleton" />
          <div style={{ height: '260px' }} className="glass-panel skeleton" />
          <div style={{ height: '260px' }} className="glass-panel skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in">
      <Navbar title="Investments Portal" />

      {/* Section header */}
      <h3 style={sectionTitleStyle}>Available Portfolios</h3>
      <p style={sectionSubtitleStyle}>Choose a curated strategy to generate daily payouts</p>

      {/* Plan Cards Grid */}
      <div className="grid-container" style={{ marginBottom: '2.5rem' }}>
        {plans.map(p => (
          <div key={p._id} className="glass-panel glass-panel-hover" style={planCardStyle}>
            <div style={planHeaderStyle}>
              <div style={{ background: planIconBg(p.name), padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getTierIcon(p.name)}
              </div>
              <span style={planNameStyle}>{p.name}</span>
            </div>

            <div style={rateRowStyle}>
              <Percent size={14} color="var(--accent-emerald)" />
              <span style={rateTextStyle}>+{p.dailyProfitPercentage}% daily returns</span>
            </div>

            <p style={planDescStyle}>{p.description}</p>

            <div className="details-grid" style={detailsGridStyle}>
              <div style={detailColStyle}>
                <span style={detailLabelStyle}>Limits</span>
                <span style={detailValStyle}>{formatRupee(p.minAmount)} – {formatRupee(p.maxAmount)}</span>
              </div>
              <div style={detailColStyle}>
                <span style={detailLabelStyle}>Term length</span>
                <span style={detailValStyle}>{p.durationDays} Days</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setSelectedPlan(p)}
              style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.85rem' }}
            >
              <span>Subscribe Plan</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="glass-panel" style={{ marginBottom: '2.5rem' }}>
        <h3 style={tableSectionTitle}>Premium Tiers Comparison</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Daily Returns</th>
                <th>Min Limit</th>
                <th>Max Limit</th>
                <th>Term</th>
                <th>Compound</th>
                <th>Principal</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: '600' }}>{p.name}</td>
                  <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>+{p.dailyProfitPercentage}% / Day</td>
                  <td>{formatRupee(p.minAmount)}</td>
                  <td>{formatRupee(p.maxAmount)}</td>
                  <td>{p.durationDays} Days</td>
                  <td><Check size={14} color="var(--accent-emerald)" /></td>
                  <td><Check size={14} color="var(--accent-emerald)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Investments Table */}
      <div className="glass-panel">
        <h3 style={tableSectionTitle}>My Investment Contracts</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Capital</th>
                <th>Daily Rate</th>
                <th>Yield Earned</th>
                <th>Expires</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myInvestments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No active investment portfolios.
                  </td>
                </tr>
              ) : (
                myInvestments.map(inv => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: '600' }}>{inv.planId?.name || 'Curated Plan'}</td>
                    <td>{formatRupee(inv.amount)}</td>
                    <td style={{ color: 'var(--accent-cyan)' }}>+{inv.dailyProfitRate}%</td>
                    <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>+{formatRupee(inv.totalProfitGenerated)}</td>
                    <td>{new Date(inv.endDate).toLocaleDateString()}</td>
                    <td><span className={`pill pill-${inv.status}`}>{inv.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Modal */}
      {selectedPlan && (
        <div style={modalOverlayStyle}>
          <div className="glass-panel fade-in modal-card" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Purchase {selectedPlan.name}</h3>
              <button style={closeBtnStyle} onClick={() => setSelectedPlan(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <p style={modalHelpStyle}>
              Wallet Balance: <strong>{formatRupee(wallet?.balance)}</strong>
            </p>

            <form onSubmit={handlePurchase}>
              <div className="form-group">
                <label className="form-label">Subscription Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={buyAmount}
                  onChange={e => setBuyAmount(e.target.value)}
                  min={selectedPlan.minAmount}
                  max={selectedPlan.maxAmount}
                  placeholder={`Min: ${formatRupee(selectedPlan.minAmount)} – Max: ${formatRupee(selectedPlan.maxAmount)}`}
                  required
                />
              </div>

              <div style={modalSummaryStyle} className="glass-panel">
                <div style={summaryRowStyle}>
                  <span>Daily Payout projection:</span>
                  <strong style={{ color: 'var(--accent-emerald)' }}>
                    +{buyAmount ? formatRupee(Number(buyAmount) * (selectedPlan.dailyProfitPercentage / 100)) : '₹0.00'}
                  </strong>
                </div>
                <div style={summaryRowStyle}>
                  <span>Total project term:</span>
                  <span>{selectedPlan.durationDays} Days</span>
                </div>
              </div>

              {/* Responsive action row */}
              <div style={modalActionsStyle} className="modal-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedPlan(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Confirming...' : 'Confirm Subscription'}
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
const sectionTitleStyle = {
  fontSize: 'clamp(1rem, 3vw, 1.25rem)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-heading)',
  fontWeight: '700',
};

const sectionSubtitleStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  marginBottom: '1.5rem',
  marginTop: '0.25rem',
};

const planCardStyle = {
  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  border: '1px solid var(--glass-border)',
};

const planHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
};

const planNameStyle = {
  fontFamily: 'var(--font-heading)',
  fontWeight: '700',
  fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
  color: 'var(--text-primary)',
};

const rateRowStyle = { display: 'flex', alignItems: 'center', gap: '6px' };
const rateTextStyle = { fontSize: '0.88rem', color: 'var(--accent-emerald)', fontWeight: '600' };

const planDescStyle = {
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
  lineHeight: '1.5',
  flex: 1,
};

const detailsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  paddingTop: '0.85rem',
  borderTop: '1px solid var(--glass-border)',
  gap: '0.5rem',
};

const detailColStyle = { display: 'flex', flexDirection: 'column', gap: '4px' };
const detailLabelStyle = { fontSize: '0.72rem', color: 'var(--text-muted)' };
const detailValStyle   = { fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-word' };

const tableSectionTitle = {
  padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 1.5rem) 0.5rem',
  fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
  fontFamily: 'var(--font-heading)',
  fontWeight: '700',
};

/* Modal */
const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(5, 5, 10, 0.75)',
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
  maxWidth: '450px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--glass-border)',
  borderRadius: '16px',
  padding: 'clamp(1.25rem, 4vw, 2rem)',
  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  gap: '0.5rem',
};

const modalTitleStyle = {
  fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-heading)',
  fontWeight: '700',
};

const closeBtnStyle = {
  background: 'none', border: 'none', color: 'var(--text-secondary)',
  cursor: 'pointer', padding: '4px', display: 'flex', outline: 'none', flexShrink: 0,
};

const modalHelpStyle = { fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' };

const modalSummaryStyle = {
  background: 'var(--glass-bg)',
  padding: '1rem',
  borderRadius: '10px',
  marginBottom: '1.5rem',
  border: '1px solid var(--glass-border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  boxShadow: 'none',
};

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

/* Actions row — becomes column on mobile via .modal-actions-row CSS class */
const modalActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '0.5rem',
};

export default Investments;
