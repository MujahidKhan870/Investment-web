import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Wallet, ArrowUpRight, TrendingUp, Calendar, ArrowDownRight } from 'lucide-react';
import { formatRupee } from '../utils/format';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/investments/analytics');
      setData(response.data.data);
    } catch (error) {
      // error handled in interceptors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) {
    return (
      <div className="main-content">
        <Navbar title="Dashboard Overview" />
        <div className="grid-container">
          <div className="glass-panel skeleton skeleton-card" />
          <div className="glass-panel skeleton skeleton-card" />
          <div className="glass-panel skeleton skeleton-card" />
          <div className="glass-panel skeleton skeleton-card" />
        </div>
        <div style={{ height: '260px', marginBottom: '2rem' }} className="glass-panel skeleton" />
      </div>
    );
  }

  const summary = data?.summary || {
    walletBalance: 0, totalEarnings: 0, dailyEarnings: 0,
    monthlyEarnings: 0, activeInvestmentsCount: 0, totalInvestedCapital: 0
  };

  const history = data?.earningsHistory || [];

  // SVG Chart
  const chartPoints = history.slice().reverse();
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
      <Navbar title="Dashboard Overview" />

      {/* Stats Cards */}
      <div className="grid-container">
        <div style={cardStyle('var(--accent-cyan-glow)')} className="glass-panel glass-panel-hover">
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Wallet Balance</span>
            <div style={iconBoxStyle('var(--accent-cyan)', 'var(--accent-cyan-glow)')}>
              <Wallet size={18} />
            </div>
          </div>
          <h2 style={cardValueStyle}>{formatRupee(summary.walletBalance)}</h2>
          <p style={cardFooterStyle}>Available assets in ledger</p>
        </div>

        <div style={cardStyle('var(--accent-violet-glow)')} className="glass-panel glass-panel-hover">
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Invested Capital</span>
            <div style={iconBoxStyle('var(--accent-violet)', 'var(--accent-violet-glow)')}>
              <TrendingUp size={18} />
            </div>
          </div>
          <h2 style={cardValueStyle}>{formatRupee(summary.totalInvestedCapital)}</h2>
          <p style={cardFooterStyle}>{summary.activeInvestmentsCount} Active portfolios</p>
        </div>

        <div style={cardStyle('var(--accent-emerald-glow)')} className="glass-panel glass-panel-hover">
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Daily Earnings</span>
            <div style={iconBoxStyle('var(--accent-emerald)', 'var(--accent-emerald-glow)')}>
              <IndianRupee size={18} />
            </div>
          </div>
          <h2 style={cardValueStyle}>{formatRupee(summary.dailyEarnings)}</h2>
          <p style={cardFooterStyle}>Last calculated payout</p>
        </div>

        <div style={cardStyle('var(--accent-amber-glow)')} className="glass-panel glass-panel-hover">
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Total Returns</span>
            <div style={iconBoxStyle('var(--accent-amber)', 'var(--accent-amber-glow)')}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <h2 style={cardValueStyle}>{formatRupee(summary.totalEarnings)}</h2>
          <p style={cardFooterStyle}>All time platform payouts</p>
        </div>
      </div>

      {/* SVG Chart Section */}
      <div style={chartSectionStyle} className="glass-panel">
        <h3 style={sectionTitleStyle}>Daily Returns Analytics</h3>
        <p style={sectionSubtitleStyle}>Visualizing earning values history trends (₹)</p>
        <div style={{ width: '100%', overflowX: 'hidden' }}>
          {points.length === 0 ? (
            <div style={chartEmptyStyle}>
              No earning records available to plot. Subscribe to a plan to start receiving profits.
            </div>
          ) : (
            <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', maxHeight: '200px', display: 'block' }}>
              <defs>
                <linearGradient id="chart-glow-db" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--accent-cyan)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1={pad} y1={pad}           x2={svgW - pad} y2={pad}           stroke="rgba(255,255,255,0.03)" />
              <line x1={pad} y1={svgH / 2}      x2={svgW - pad} y2={svgH / 2}      stroke="rgba(255,255,255,0.03)" />
              <line x1={pad} y1={svgH - pad}    x2={svgW - pad} y2={svgH - pad}    stroke="rgba(255,255,255,0.05)" />
              <path d={areaD} fill="url(#chart-glow-db)" />
              <path d={pathD} fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" />
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#000" stroke="var(--accent-cyan)" strokeWidth="2" />
                  <text x={p.x} y={p.y - 10} textAnchor="middle" fill="var(--text-secondary)" fontSize="7" fontWeight="600">
                    {formatRupee(p.amount)}
                  </text>
                  <text x={p.x} y={svgH - 5} textAnchor="middle" fill="var(--text-muted)" fontSize="6">
                    {p.label.substring(5)}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>

      {/* Double Column */}
      <div className="dashboard-double-col">
        {/* Earnings History Table */}
        <div className="glass-panel dashboard-col-left" style={{ padding: '1.5rem' }}>
          <h3 style={sectionTitleStyle}>Recent Return Statements</h3>
          <div className="table-responsive" style={{ marginTop: '1rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Earning Day</th>
                  <th>Plan Amount</th>
                  <th>Rate</th>
                  <th>Payout</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No statements found.
                    </td>
                  </tr>
                ) : (
                  history.map(h => (
                    <tr key={h._id}>
                      <td style={{ fontWeight: '600' }}>{h.periodDate}</td>
                      <td>{h.investmentId ? formatRupee(h.investmentId.amount) : 'N/A'}</td>
                      <td style={{ color: 'var(--accent-cyan)' }}>+{h.percentageApplied}%</td>
                      <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>+{formatRupee(h.amount)}</td>
                      <td>{new Date(h.calculatedAt).toLocaleTimeString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aura Guide Panel */}
        <div className="glass-panel dashboard-col-right">
          <h3 style={sectionTitleStyle}>Aura Guide</h3>
          <p style={quickHelpText}>To begin generating returns:</p>
          <ol style={quickList}>
            <li>Visit the <strong>Wallet Ledger</strong> page and click "Deposit simulated funds" to credit your wallet instantly.</li>
            <li>Go to the <strong>Investments</strong> tab and subscribe to a Plan (Basic, Silver, Gold, Platinum).</li>
            <li>Earnings calculation cron runs automatically, or trigger it manually in the Admin Center.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

/* ── Styles ─────────────────────────────────────────────────── */
const cardStyle = (glowColor) => ({
  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  border: '1px solid var(--glass-border)',
});

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '0.5rem',
};

const cardTitleStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  fontWeight: '500',
};

const iconBoxStyle = (color, bg) => ({
  padding: '8px',
  borderRadius: '8px',
  color,
  backgroundColor: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const cardValueStyle = {
  fontSize: 'clamp(1.4rem, 4vw, 2rem)',
  fontWeight: '800',
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  wordBreak: 'break-all',
};

const cardFooterStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
};

const chartSectionStyle = {
  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
  marginBottom: '2rem',
  overflow: 'hidden',
};

const sectionTitleStyle = {
  fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-heading)',
  fontWeight: '700',
};

const sectionSubtitleStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
  marginBottom: '1.25rem',
  marginTop: '0.25rem',
};

const chartEmptyStyle = {
  padding: '3rem 1.5rem',
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: '0.85rem',
};

const quickHelpText = {
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  margin: '0.75rem 0',
};

const quickList = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  paddingLeft: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  lineHeight: '1.5',
};

export default Dashboard;
