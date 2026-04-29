import React, { useEffect, useState } from 'react';
import { AlertTriangle, LogOut, Menu, ChevronRight } from 'lucide-react';
import { wasteApiService } from '../services/wasteApi';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Sidebar } from './Sidebar';

interface DashboardProps {
  onStartSurvey?: () => void;
  onViewMap?: () => void;
  onViewAdmin?: () => void;
  onSettings?: () => void;
  hideHeader?: boolean;
}

interface Stats {
  total_records: number;
  total_wards: number;
  distinct_settlement_types: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onStartSurvey, onViewMap, onViewAdmin, onSettings, hideHeader = false,
}) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useNotification();
  const [error, setError] = useState<string | null>(null);
  const { user, logout, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully');
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let data: Stats;
        if (!isAdmin && (user as any)?.email) {
          const result = await wasteApiService.getWasteSitesByEnumerator((user as any).email);
          data = {
            total_records: result.total,
            total_wards: 1,
            distinct_settlement_types: new Set(result.records.map((r: any) => r.settlement_type)).size,
          };
        } else {
          data = await wasteApiService.getStatistics();
        }
        setStats(data);
        setError(null);
      } catch (err: any) {
        const errMsg = err.message || 'Failed to load statistics';
        setError(errMsg);
        showError(errMsg);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, user, showError]);

  const userName = isAdmin ? (user as any)?.username : (user as any)?.name;
  const userSub  = isAdmin ? 'Administrator' : (user as any)?.ward;

  return (
    <>
      <style>{css}</style>
      <div className="dash-root">

        {/* ── Nav ── */}
        {!hideHeader && (
          <nav className="dash-nav">
            <div className="dash-nav-inner">
              <div className="dash-brand">
                <span className="dash-brand-name">GeoWaste</span>
                <span className="dash-brand-loc">Kilifi</span>
              </div>

              {user && (
                <div className="dash-nav-right">
                  <div className="dash-user">
                    <span className="dash-user-name">{userName}</span>
                    <span className="dash-user-role">{userSub}</span>
                  </div>
                  <button onClick={handleLogout} className="dash-logout">
                    <LogOut size={14} /> Logout
                  </button>
                  <button onClick={() => setIsSidebarOpen(true)} className="dash-menu-btn">
                    <Menu size={18} />
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}

        {/* ── Body ── */}
        <main className={`dash-body ${hideHeader ? 'dash-body--no-header' : ''}`}>

          {/* Page heading */}
          <div className="dash-heading">
            <p className="dash-greeting">
              {isAdmin ? 'Admin overview' : `Welcome back`}
            </p>
            <h1 className="dash-title">
              {isAdmin ? 'Analytics & Management' : userName || 'Dashboard'}
            </h1>
            {!isAdmin && (
              <p className="dash-sub">
                Collecting data for <strong>{(user as any)?.ward || 'Kilifi'}</strong> ward
              </p>
            )}
          </div>

          {/* ── Version Banner ── */}
          <div className="dash-version-banner">
            <div className="banner-main">
              <div className="banner-info">
                <p className="banner-version-label">New Version Available</p>
                <p className="banner-version-text">Update to GeoWaste v1.0.1 for the latest features and improvements</p>
              </div>
              <button className="banner-update-btn" onClick={onSettings}>
                Download Now
              </button>
            </div>
          </div>

          <div className="dash-divider" />

          {/* ── Stats ── */}
          <section className="dash-stats">
            <StatItem
              label="Total Records"
              value={loading ? null : stats?.total_records ?? 0}
              note="survey responses"
            />
            <StatItem
              label="Wards Covered"
              value={loading ? null : stats?.total_wards ?? 0}
              note="geographic areas"
            />
            <StatItem
              label="Settlement Types"
              value={loading ? null : stats?.distinct_settlement_types ?? 0}
              note="categories mapped"
            />
          </section>

          {error && (
            <div className="dash-error">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="dash-divider" />

          {/* ── Actions ── */}
          <section>
            <p className="dash-section-label">Actions</p>
            <div className="dash-actions">
              {!isAdmin ? (
                <>
                  <ActionRow
                    title="Start New Survey"
                    description="Capture field data for waste disposal assessment"
                    onClick={onStartSurvey}
                  />
                  <ActionRow
                    title="View Map"
                    description="Visualize all collected waste site locations"
                    onClick={onViewMap}
                  />
                </>
              ) : (
                <>
                  <ActionRow
                    title="Analytics Dashboard"
                    description="View detailed charts and enumerator records"
                    onClick={onViewAdmin}
                  />
                  <ActionRow
                    title="View Map"
                    description="See all waste sites plotted geographically"
                    onClick={onViewMap}
                  />
                </>
              )}
            </div>
          </section>

          {/* ── About (enumerator only) ── */}
          {!isAdmin && (
            <>
              <div className="dash-divider" />
              <section>
                <p className="dash-section-label">About this system</p>
                <p className="dash-about-text">
                  A geospatial data collection system supporting waste disposal site suitability
                  analysis in Kilifi Municipality. Captures GPS coordinates, household data, and
                  environmental conditions across wards.
                </p>
                <div className="dash-features">
                  {['GPS Location Capture', 'Digital Questionnaire', 'Interactive Mapping', 'Real-time Analytics'].map(f => (
                    <span key={f} className="dash-feature-tag">{f}</span>
                  ))}
                </div>
              </section>
            </>
          )}

        </main>

        {/* Mobile sidebar */}
        <Sidebar isAdmin={isAdmin} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>
    </>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────

const StatItem: React.FC<{ label: string; value: number | null; note: string }> = ({ label, value, note }) => (
  <div className="stat-item">
    <p className="stat-value">
      {value === null ? <span className="stat-loading" /> : value}
    </p>
    <p className="stat-label">{label}</p>
    <p className="stat-note">{note}</p>
  </div>
);

const ActionRow: React.FC<{ title: string; description: string; onClick?: () => void }> = ({ title, description, onClick }) => (
  <button type="button" onClick={onClick} className="action-row">
    <div className="action-text">
      <span className="action-title">{title}</span>
      <span className="action-desc">{description}</span>
    </div>
    <ChevronRight size={16} className="action-arrow" />
  </button>
);

// ─── Styles ───────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --teal:   #329D9C;
    --teal-d: #205072;
    --teal-l: #56C596;
    --mint:   #7BE495;
    --foam:   #CFF4D2;
    --bg:     #f6fbf8;
    --border: #e2ede8;
    --text:   #1c3a2e;
    --muted:  #7a9a8a;
    --r:      10px;
  }

  /* ── Hide scrollbars on mobile ── */
  @media (max-width: 768px) {
    html, body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    html::-webkit-scrollbar,
    body::-webkit-scrollbar {
      display: none;
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .dash-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }

  /* ── Nav ── */
  .dash-nav {
    position: sticky; top: 0; z-index: 20;
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .dash-nav-inner {
    max-width: 640px; margin: 0 auto;
    padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .dash-brand { display: flex; align-items: baseline; gap: 6px; }
  .dash-brand-name {
    font-size: 15px; font-weight: 700;
    color: var(--teal-d); letter-spacing: -0.3px;
  }
  .dash-brand-loc {
    font-size: 12px; font-weight: 500;
    color: var(--teal); font-family: 'DM Mono', monospace;
  }

  .dash-nav-right { display: flex; align-items: center; gap: 16px; }
  .dash-user { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .dash-user-name {
    font-size: 13px; font-weight: 600; color: var(--teal-d); line-height: 1;
  }
  .dash-user-role {
    font-size: 11px; color: var(--muted); line-height: 1;
  }
  .dash-logout {
    display: flex; align-items: center; gap: 5px;
    font-size: 12.5px; font-weight: 500;
    color: var(--muted); background: none; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: color 0.15s;
  }
  .dash-logout:hover { color: #ef4444; }
  .dash-menu-btn {
    display: none;
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid var(--border); background: none;
    color: var(--muted); cursor: pointer;
    align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .dash-menu-btn:hover { border-color: var(--teal); color: var(--teal); }

  @media (max-width: 540px) {
    .dash-user { display: none; }
    .dash-logout { display: none; }
    .dash-menu-btn { display: flex; }
  }

  /* ── Body ── */
  .dash-body {
    max-width: 640px; margin: 0 auto;
    padding: 40px 24px 72px;
    display: flex; flex-direction: column; gap: 28px;
  }
  .dash-body--no-header { padding-top: 40px; }

  /* ── Heading ── */
  .dash-greeting {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal); margin-bottom: 6px;
  }
  .dash-title {
    font-size: 28px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.6px; line-height: 1.15;
    margin-bottom: 6px;
  }
  .dash-sub {
    font-size: 14px; color: var(--muted);
  }
  .dash-sub strong { color: var(--text); font-weight: 600; }

  /* ── Divider ── */
  .dash-divider { border: none; border-top: 1px solid var(--border); }

  /* ── Stats ── */
  .dash-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
  }
  .stat-item {
    padding: 4px 0;
    border-right: 1px solid var(--border);
    padding-right: 24px;
    padding-left: 0;
  }
  .stat-item:first-child { padding-left: 0; }
  .stat-item:last-child { border-right: none; padding-left: 24px; padding-right: 0; }
  .stat-item:not(:first-child):not(:last-child) { padding-left: 24px; }

  .stat-value {
    font-size: 36px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -1px;
    line-height: 1; margin-bottom: 6px;
    font-family: 'DM Mono', monospace;
  }
  .stat-loading {
    display: inline-block;
    width: 32px; height: 28px;
    background: linear-gradient(90deg, var(--foam) 25%, #e8f5ee 50%, var(--foam) 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.4s infinite;
    vertical-align: middle;
  }
  @keyframes shimmer { to { background-position: -200% 0; } }

  .stat-label {
    font-size: 13px; font-weight: 600;
    color: var(--text); margin-bottom: 2px;
  }
  .stat-note { font-size: 11.5px; color: var(--muted); }

  /* ── Error ── */
  .dash-error {
    display: flex; align-items: center; gap: 7px;
    color: #dc2626; font-size: 13px; font-weight: 500;
  }

  /* ── Section label ── */
  .dash-section-label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 12px;
  }

  /* ── Actions ── */
  .dash-actions { display: flex; flex-direction: column; }
  .action-row {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
    background: none; border-top: none; border-left: none; border-right: none;
    cursor: pointer; text-align: left; width: 100%;
    transition: opacity 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .action-row:first-child { border-top: 1px solid var(--border); }
  .action-row:hover { opacity: 0.7; }
  .action-text { display: flex; flex-direction: column; gap: 3px; flex: 1; }
  .action-title {
    font-size: 14px; font-weight: 600; color: var(--teal-d);
  }
  .action-desc { font-size: 12.5px; color: var(--muted); }
  .action-arrow { color: var(--muted); flex-shrink: 0; }

  /* ── About ── */
  .dash-about-text {
    font-size: 13.5px; color: var(--muted); line-height: 1.65;
    margin-bottom: 16px;
  }
  .dash-features { display: flex; flex-wrap: wrap; gap: 8px; }
  .dash-feature-tag {
    padding: 5px 12px;
    border-radius: 20px;
    border: 1.5px solid var(--border);
    background: white;
    font-size: 12px; font-weight: 500; color: var(--muted);
  }

  /* ── Version Banner ── */
  .dash-version-banner {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 16px;
  }
  .banner-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .banner-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .banner-version-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--teal);
    letter-spacing: 0.4px;
    text-transform: uppercase;
    margin: 0;
  }
  .banner-version-text {
    font-size: 13px;
    color: var(--text);
    margin: 0;
    line-height: 1.4;
  }
  .banner-update-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    background: var(--teal);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .banner-update-btn:hover {
    background: var(--teal-d);
  }
  .banner-update-btn:active {
    transform: scale(0.98);
  }

  @media (max-width: 540px) {
    .banner-main {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .banner-update-btn {
      width: 100%;
    }
  }
`;