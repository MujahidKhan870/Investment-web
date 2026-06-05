import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, FileSpreadsheet } from 'lucide-react';
import { formatRupee } from '../utils/format';

const Wallet = () => {
  const { showToast } = useAuth();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositGateway, setDepositGateway] = useState('Razorpay Gateway');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawGateway, setWithdrawGateway] = useState('IMPS/NEFT Transfer');
  const [withdrawAccount, setWithdrawAccount] = useState('');

  const fetchWalletData = async () => {
    try {
      const wRes = await api.get('/wallet');
      setWallet(wRes.data.data.wallet);
      const tRes = await api.get('/wallet/transactions');
      setTransactions(tRes.data.data.transactions);
    } catch (err) { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWalletData(); }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    try {
      const response = await api.post('/wallet/deposit', {
        amount: Number(depositAmount),
        paymentMethod: depositGateway
      });
      showToast(response.data.message);
      setWallet(response.data.data.wallet);
      setTransactions(prev => [response.data.data.transaction, ...prev]);
      setDepositAmount('');
    } catch (error) {
      showToast(error.response?.data?.message || 'Deposit failed', 'danger');
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0 || !withdrawAccount) return;
    try {
      const response = await api.post('/wallet/withdraw', {
        amount: Number(withdrawAmount),
        paymentMethod: withdrawGateway,
        accountDetails: withdrawAccount
      });
      showToast(response.data.message);
      setWallet(response.data.data.wallet);
      setTransactions(prev => [response.data.data.transaction, ...prev]);
      setWithdrawAmount('');
      setWithdrawAccount('');
    } catch (error) {
      showToast(error.response?.data?.message || 'Withdrawal failed', 'danger');
    }
  };

  const exportReport = () => {
    window.open('/api/reports/transactions', '_blank');
    showToast('Transaction statement report downloaded');
  };

  if (loading) {
    return (
      <div className="main-content">
        <Navbar title="Wallet Ledger" />
        <div style={{ height: '140px', marginBottom: '2rem' }} className="glass-panel skeleton" />
        <div className="grid-container">
          <div style={{ height: '240px' }} className="glass-panel skeleton" />
          <div style={{ height: '240px' }} className="glass-panel skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in">
      <Navbar title="Wallet Ledger" />

      {/* Balance Banner */}
      <div className="balance-banner glass-panel" style={balanceBannerStyle}>
        <div className="banner-left" style={bannerLeftStyle}>
          <div style={logoIconStyle}>
            <WalletIcon size={26} color="var(--accent-cyan)" />
          </div>
          <div>
            <p style={bannerLabelStyle}>Current Wallet Balance</p>
            <h1 style={bannerValueStyle}>{formatRupee(wallet?.balance)}</h1>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={exportReport} style={exportBtnStyle}>
          <FileSpreadsheet size={16} color="var(--accent-emerald)" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Deposit / Withdrawal Forms */}
      <div className="grid-container" style={{ marginBottom: '2rem' }}>
        {/* Deposit Form */}
        <div className="glass-panel" style={panelFormStyle}>
          <h3 style={formTitleStyle}>
            <ArrowDownLeft size={18} color="var(--accent-emerald)" />
            <span>Fund Wallet (Simulated)</span>
          </h3>
          <p style={formHelpStyle}>Credits balance immediately to simulate checkout gateway.</p>

          <form onSubmit={handleDeposit}>
            <div className="form-group">
              <label className="form-label">Deposit Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="10000"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                min="100"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Provider</label>
              <select
                className="form-control"
                value={depositGateway}
                onChange={e => setDepositGateway(e.target.value)}
                style={selectStyle}
              >
                <option value="Razorpay Gateway">Razorpay Checkout Sandbox</option>
                <option value="UPI NetBanking">BHIM UPI Instant Checkout</option>
                <option value="Debit Card">Stripe Card Portal</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              Confirm Mock Deposit
            </button>
          </form>
        </div>

        {/* Withdrawal Form */}
        <div className="glass-panel" style={panelFormStyle}>
          <h3 style={formTitleStyle}>
            <ArrowUpRight size={18} color="var(--accent-rose)" />
            <span>Withdraw Assets</span>
          </h3>
          <p style={formHelpStyle}>Subtracts balance and sends request to admin pending approval.</p>

          <form onSubmit={handleWithdrawal}>
            <div className="form-group">
              <label className="form-label">Withdrawal Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="5000"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                max={wallet?.balance}
                min="500"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Settlement Details (Bank IFSC &amp; A/C)</label>
              <input
                type="text"
                className="form-control"
                placeholder="SBIN0001234 – A/C 3049104812"
                value={withdrawAccount}
                onChange={e => setWithdrawAccount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gateway</label>
              <select
                className="form-control"
                value={withdrawGateway}
                onChange={e => setWithdrawGateway(e.target.value)}
                style={selectStyle}
              >
                <option value="IMPS/NEFT Transfer">IMPS / NEFT Transfer</option>
                <option value="UPI Transfer">UPI Transfer</option>
              </select>
            </div>
            <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '0.75rem' }}>
              Submit Withdraw Request
            </button>
          </form>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="glass-panel">
        <h3 style={tableSectionTitle}>Transaction Ledger History</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Method</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No ledger transactions logged.
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx._id}>
                    <td style={refStyle}>{tx.transactionReference}</td>
                    <td style={{ textTransform: 'capitalize' }}>{tx.type}</td>
                    <td>{tx.paymentMethod}</td>
                    <td>{tx.description}</td>
                    <td style={amountColorStyle(tx.type)}>
                      {tx.type === 'deposit' || tx.type === 'earning' ? '+' : '-'}{formatRupee(tx.amount)}
                    </td>
                    <td><span className={`pill pill-${tx.status}`}>{tx.status}</span></td>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
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
const balanceBannerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 'clamp(1.25rem, 3vw, 2rem)',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const bannerLeftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
  flex: 1,
  minWidth: 0,
};

const logoIconStyle = {
  background: 'var(--accent-cyan-glow)',
  padding: '12px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const bannerLabelStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  fontWeight: '500',
};

const bannerValueStyle = {
  fontSize: 'clamp(1.6rem, 5vw, 2.5rem)',
  fontWeight: '800',
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  marginTop: '4px',
  wordBreak: 'break-all',
};

const exportBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
};

const panelFormStyle = {
  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
};

const formTitleStyle = {
  fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
  color: 'var(--text-primary)',
  fontWeight: '700',
  fontFamily: 'var(--font-heading)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '0.5rem',
};

const formHelpStyle = {
  fontSize: '0.78rem',
  color: 'var(--text-muted)',
  lineHeight: '1.4',
  marginBottom: '1.25rem',
};

const selectStyle = {
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2364748b' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  backgroundSize: '16px',
  paddingRight: '2rem',
};

const tableSectionTitle = {
  padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 1.5rem) 0.5rem',
  fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
  fontFamily: 'var(--font-heading)',
  fontWeight: '700',
};

const refStyle = {
  fontWeight: '600',
  fontFamily: 'monospace',
  fontSize: '0.82rem',
  color: 'var(--accent-cyan)',
  maxWidth: '130px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const amountColorStyle = (type) => {
  if (type === 'deposit' || type === 'earning') {
    return { color: 'var(--accent-emerald)', fontWeight: '600' };
  }
  return { color: 'var(--accent-rose)', fontWeight: '600' };
};

export default Wallet;
