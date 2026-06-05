import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Download, Filter, Search, TrendingUp, Calendar, ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';
import { formatRupee } from '../utils/format';

const Reports = () => {
  const { user, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'earnings'
  const [transactions, setTransactions] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch transactions
      const txRes = await api.get('/wallet/transactions');
      setTransactions(txRes.data.data.transactions);

      // Fetch analytics for earnings
      const analyticsRes = await api.get('/investments/analytics');
      setEarnings(analyticsRes.data.data.earningsHistory || []);
    } catch (err) {
      showToast('Failed to load report data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = (type) => {
    window.open(`/api/reports/${type}`, '_blank');
    showToast(`${type.replace('-', ' ').toUpperCase()} report CSV download started`);
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.transactionReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Filtered earnings
  const filteredEarnings = earnings.filter(earn => {
    const matchesSearch = 
      earn.periodDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (earn.investmentId?.amount?.toString() || '').includes(searchTerm);
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="main-content">
        <Navbar title="Platform Reports" />
        <div style={{ height: '120px', marginBottom: '2rem' }} className="glass-panel skeleton" />
        <div className="grid-container">
          <div style={{ height: '350px' }} className="glass-panel skeleton" />
          <div style={{ height: '350px' }} className="glass-panel skeleton" />
        </div>
      </div>
    );
  }

  // Calculate summary counts
  const totalTxCount = transactions.length;
  const completedTxCount = transactions.filter(t => t.status === 'completed').length;
  const pendingTxCount = transactions.filter(t => t.status === 'pending').length;
  const totalPayout = earnings.reduce((acc, curr) => acc + curr.amount, 0);

  // SVG Chart for earnings trend
  const chartPoints = [...earnings].reverse();
  const maxVal = Math.max(...chartPoints.map(h => h.amount), 1);
  const svgW = 600, svgH = 150, pad = 20;

  const points = chartPoints.map((h, i) => {
    const x = pad + (i * (svgW - pad * 2)) / Math.max(chartPoints.length - 1, 1);
    const y = svgH - pad - (h.amount * (svgH - pad * 2)) / maxVal;
    return { x, y, label: h.periodDate, amount: h.amount };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgH - pad} L ${points[0].x} ${svgH - pad} Z`
    : '';

  return (
    <div className="main-content fade-in">
      <Navbar title="Platform Reports" />

      {/* Export Controls Panel */}
      <div className="glass-panel" style={exportPanelStyle}>
        <h3 style={sectionTitleStyle}>Download Statements</h3>
        <p style={sectionSubtitleStyle}>Export clean spreadsheets containing your system records</p>
        
        <div className="modal-actions-row" style={exportButtonGrid}>
          <button className="btn btn-secondary" onClick={() => handleExport('transactions')} style={exportBtnItem}>
            <FileSpreadsheet size={16} color="var(--accent-cyan)" />
            <span>My Transactions CSV</span>
          </button>
          
          <button className="btn btn-secondary" onClick={() => handleExport('earnings')} style={exportBtnItem}>
            <FileSpreadsheet size={16} color="var(--accent-emerald)" />
            <span>My Earnings CSV</span>
          </button>

          {user?.role === 'admin' && (
            <>
              <button className="btn btn-secondary" onClick={() => handleExport('users')} style={exportAdminBtnItem}>
                <ShieldAlert size={16} color="var(--accent-amber)" />
                <span>[Admin] All Users</span>
              </button>
              <button className="btn btn-secondary" onClick={() => handleExport('investments')} style={exportAdminBtnItem}>
                <ShieldAlert size={16} color="var(--accent-amber)" />
                <span>[Admin] Investments</span>
              </button>
              <button className="btn btn-secondary" onClick={() => handleExport('audit-logs')} style={exportAdminBtnItem}>
                <ShieldAlert size={16} color="var(--accent-amber)" />
                <span>[Admin] Audit Logs</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-container" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={statCardStyle}>
          <p style={statLabelStyle}>Total Statements</p>
          <h2 style={statValueStyle}>{totalTxCount}</h2>
          <p style={statFooterStyle}>{completedTxCount} Completed, {pendingTxCount} Pending</p>
        </div>
        <div className="glass-panel" style={statCardStyle}>
          <p style={statLabelStyle}>Total Return Payouts</p>
          <h2 style={statValueStyle}>{formatRupee(totalPayout)}</h2>
          <p style={statFooterStyle}>Calculated across active subscriptions</p>
        </div>
      </div>

      {/* Chart preview */}
      {activeTab === 'earnings' && points.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={sectionTitleStyle}>Return Payout Curve</h3>
          <p style={sectionSubtitleStyle}>Visualizing recent return dividends (₹)</p>
          <div style={{ width: '100%', overflowX: 'hidden', marginTop: '1rem' }}>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', maxHeight: '180px' }}>
              <defs>
                <linearGradient id="chart-glow-reports" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-emerald)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--accent-emerald)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1={pad} y1={pad}           x2={svgW - pad} y2={pad}           stroke="rgba(255,255,255,0.03)" />
              <line x1={pad} y1={svgH / 2}      x2={svgW - pad} y2={svgH / 2}      stroke="rgba(255,255,255,0.03)" />
              <line x1={pad} y1={svgH - pad}    x2={svgW - pad} y2={svgH - pad}    stroke="rgba(255,255,255,0.05)" />
              <path d={areaD} fill="url(#chart-glow-reports)" />
              <path d={pathD} fill="none" stroke="var(--accent-emerald)" strokeWidth="2.5" />
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#000" stroke="var(--accent-emerald)" strokeWidth="2" />
                  <text x={p.x} y={p.y - 8} textAnchor="middle" fill="var(--text-secondary)" fontSize="7" fontWeight="600">
                    {formatRupee(p.amount)}
                  </text>
                  <text x={p.x} y={svgH - 5} textAnchor="middle" fill="var(--text-muted)" fontSize="6">
                    {p.label.substring(5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Main Tabbed Report Panel */}
      <div className="glass-panel" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
        {/* Navigation Tabs */}
        <div style={tabsRowStyle}>
          <button
            onClick={() => { setActiveTab('transactions'); setSearchTerm(''); }}
            style={tabBtnStyle(activeTab === 'transactions')}
          >
            Ledger Transactions ({filteredTransactions.length})
          </button>
          <button
            onClick={() => { setActiveTab('earnings'); setSearchTerm(''); }}
            style={tabBtnStyle(activeTab === 'earnings')}
          >
            Calculated Earnings ({filteredEarnings.length})
          </button>
        </div>

        {/* Filters and Search toolbar */}
        <div style={filterToolbarStyle}>
          <div style={searchWrapperStyle}>
            <Search size={16} color="var(--text-muted)" style={searchIconStyle} />
            <input
              type="text"
              className="form-control"
              placeholder={activeTab === 'transactions' ? "Search reference or details..." : "Search date (YYYY-MM-DD)..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={searchInputOverride}
            />
          </div>

          {activeTab === 'transactions' && (
            <div style={filterSelectsWrapper}>
              <div style={filterSelectGroup}>
                <Filter size={14} color="var(--text-muted)" />
                <select
                  className="form-control"
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  style={filterSelectStyle}
                >
                  <option value="all">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdraw">Withdrawal</option>
                  <option value="investment">Investment</option>
                  <option value="earning">Earning</option>
                </select>
              </div>

              <div style={filterSelectGroup}>
                <Filter size={14} color="var(--text-muted)" />
                <select
                  className="form-control"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={filterSelectStyle}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          {activeTab === 'transactions' ? (
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
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No transaction statements match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => (
                    <tr key={tx._id}>
                      <td style={refStyle}>{tx.transactionReference}</td>
                      <td style={{ textTransform: 'capitalize', fontWeight: '500' }}>{tx.type}</td>
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
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Earning Statement Day</th>
                  <th>Invested Capital</th>
                  <th>Applied Rate</th>
                  <th>Payout Dividend</th>
                  <th>Settled At</th>
                </tr>
              </thead>
              <tbody>
                {filteredEarnings.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No earning payout records match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEarnings.map(earn => (
                    <tr key={earn._id}>
                      <td style={{ fontWeight: '600' }}>{earn.periodDate}</td>
                      <td>{earn.investmentId ? formatRupee(earn.investmentId.amount) : 'N/A'}</td>
                      <td style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>+{earn.percentageApplied}%</td>
                      <td style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>+{formatRupee(earn.amount)}</td>
                      <td>{new Date(earn.calculatedAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Inline Styles ──────────────────────────────────────────── */
const exportPanelStyle = {
  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
  marginBottom: '2rem',
};

const sectionTitleStyle = {
  fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
  color: 'var(--text-primary)',
  fontWeight: '700',
  fontFamily: 'var(--font-heading)',
};

const sectionSubtitleStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
  marginTop: '0.25rem',
  marginBottom: '1.25rem',
};

const exportButtonGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  width: '100%',
};

const exportBtnItem = {
  flex: '1 1 200px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const exportAdminBtnItem = {
  ...exportBtnItem,
  background: 'rgba(245, 158, 11, 0.04)',
  borderColor: 'rgba(245, 158, 11, 0.15)',
};

const statCardStyle = {
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const statLabelStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  fontWeight: '500',
};

const statValueStyle = {
  fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
  fontWeight: '800',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-heading)',
};

const statFooterStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
};

const tabsRowStyle = {
  display: 'flex',
  borderBottom: '1px solid var(--glass-border)',
  marginBottom: '1.5rem',
  overflowX: 'auto',
  scrollbarWidth: 'none',
};

const tabBtnStyle = (isActive) => ({
  background: 'none',
  border: 'none',
  padding: '1rem 1.25rem',
  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
  fontWeight: isActive ? '600' : '400',
  borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
  cursor: 'pointer',
  fontSize: '0.92rem',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
  outline: 'none',
});

const filterToolbarStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1rem',
  marginBottom: '1.5rem',
  alignItems: 'center',
};

const searchWrapperStyle = {
  position: 'relative',
  flex: '1 1 280px',
  minWidth: 0,
};

const searchIconStyle = {
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
};

const searchInputOverride = {
  paddingLeft: '2.5rem',
  width: '100%',
};

const filterSelectsWrapper = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  flex: '0 1 auto',
};

const filterSelectGroup = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  padding: '0 0.75rem',
  minHeight: '44px',
};

const filterSelectStyle = {
  border: 'none',
  background: 'transparent',
  padding: '0',
  fontSize: '0.88rem',
  minHeight: 'auto',
  width: 'auto',
  outline: 'none',
  cursor: 'pointer',
  color: 'var(--text-primary)',
};

const refStyle = {
  fontFamily: 'monospace',
  fontSize: '0.82rem',
  color: 'var(--accent-cyan)',
  fontWeight: '600',
};

const amountColorStyle = (type) => {
  if (type === 'deposit' || type === 'earning') {
    return { color: 'var(--accent-emerald)', fontWeight: '600' };
  }
  return { color: 'var(--accent-rose)', fontWeight: '600' };
};

export default Reports;
