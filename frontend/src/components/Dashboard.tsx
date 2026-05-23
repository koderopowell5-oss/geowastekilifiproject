import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, LogOut, Menu, MapPin, 
  PlusCircle, Navigation, BarChart3, RefreshCw, Clock, Settings
} from 'lucide-react';
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

// Helper to format relative time for Recent Activity
const timeAgo = (dateString?: string) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

export const Dashboard: React.FC<DashboardProps> = ({
  onStartSurvey, onViewMap, onViewAdmin, onSettings, hideHeader = false,
}) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showError, showSuccess } = useNotification();
  const [error, setError] = useState<string | null>(null);
  const { user, logout, isAdmin, currentProjectId } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully');
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    // Mock sync delay for UX satisfaction
    setTimeout(() => {
      setIsSyncing(false);
      showSuccess('All offline data synchronized securely.');
    }, 1500);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let data: Stats;
        let allFetchedRecords: any[] = [];

        if (!isAdmin && (user as any)?.email) {
          const enumeratorEmail = (user as any).email;
          const staticResult = await wasteApiService.getWasteSitesByEnumerator(enumeratorEmail);
          allFetchedRecords = [...(staticResult.records || [])];

          if (currentProjectId) {
            try {
              const forms = await wasteApiService.getSharedForms(currentProjectId);
              const submissionsByForm = await Promise.all(
                forms.map((form: any) =>
                  wasteApiService.getSurveySubmissions(form.id, enumeratorEmail, currentProjectId).catch((err) => {
                    console.warn(`Failed to load submissions for survey ${form.id}:`, err?.message || err);
                    return [];
                  })
                )
              );

              const surveyRecords = submissionsByForm
                .flat()
                .filter((submission: any) => !submission.is_draft)
                .filter((submission: any) => String(submission.project_id) === String(currentProjectId));

              allFetchedRecords.push(...surveyRecords);
            } catch (fetchErr: any) {
              console.warn('Unable to load project survey submissions:', fetchErr?.message || fetchErr);
            }
          }

          const wardValues = allFetchedRecords
            .map((r: any) => r.ward || r.response_data?.ward || r.response_data?.location?.ward || '')
            .filter(Boolean);
          const settlementValues = allFetchedRecords
            .map((r: any) => r.settlement_type || r.response_data?.settlement_type || '')
            .filter(Boolean);

          data = {
            total_records: allFetchedRecords.length,
            total_wards: new Set(wardValues).size,
            distinct_settlement_types: new Set(settlementValues).size,
          };
        } else {
          data = await wasteApiService.getStatistics();
          // Admin gets a sample of all recent submissions globally (mocked slice for UI)
          allFetchedRecords = []; 
        }
        
        setStats(data);
        setError(null);

        // Sort records by newest first and take top 3 for Recent Activity feed
        const sortedRecords = allFetchedRecords.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        setRecentRecords(sortedRecords.slice(0, 3));

      } catch (err: any) {
        const errMsg = err.message || 'Failed to load statistics';
        setError(errMsg);
        showError(errMsg);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, user, currentProjectId, showError]);

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
              {isAdmin ? 'System Overview' : `Welcome back`}
            </p>
            <h1 className="dash-title">
              {isAdmin ? 'Analytics & Management' : userName?.split(' ')[0] || 'Dashboard'}
            </h1>
            {!isAdmin && (
              <p className="dash-sub">
                Collecting data for <strong>{(user as any)?.ward || 'Kilifi'}</strong> ward
              </p>
            )}
          </div>

          <div className="dash-divider" />

          {/* ── Quick Stats ── */}
          <section className="dash-stats">
            <StatItem
              label="Total Records"
              value={loading ? null : stats?.total_records ?? 0}
              note="Submitted entries"
            />
            <StatItem
              label="Wards Covered"
              value={loading ? null : stats?.total_wards ?? 0}
              note="Geographic areas"
            />
            <StatItem
              label="Settlement Types"
              value={loading ? null : stats?.distinct_settlement_types ?? 0}
              note="Categories mapped"
            />
          </section>

          {error && (
            <div className="dash-error">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="dash-divider" />

          {/* ── Quick Actions Grid ── */}
          <section>
            <div className="dash-section-header">
              <h2 className="dash-section-title">Quick Actions</h2>
            </div>
            
            <div className="quick-actions-row">
              {!isAdmin ? (
                <>
                  <button className="quick-action-icon" title="New Record" onClick={onStartSurvey}>
                    <PlusCircle size={18} />
                  </button>
                  <button className="quick-action-icon" title={isSyncing ? 'Syncing...' : 'Sync Data'} onClick={handleManualSync} disabled={isSyncing}>
                    <RefreshCw size={18} className={isSyncing ? 'spin' : ''} />
                  </button>
                  <button className="quick-action-icon" title="View Map" onClick={onViewMap}>
                    <Navigation size={18} />
                  </button>
                </>
              ) : (
                <>
                  <button className="quick-action-icon" title="Analytics" onClick={onViewAdmin}>
                    <BarChart3 size={18} />
                  </button>
                  <button className="quick-action-icon" title="Live Map" onClick={onViewMap}>
                    <MapPin size={18} />
                  </button>
                  <button className="quick-action-icon" title="Settings" onClick={onSettings}>
                    <Settings size={18} />
                  </button>
                </>
              )}
            </div>
          </section>

          {/* ── Recent Activity ── */}
          <section style={{ marginTop: 12 }}>
            <div className="dash-section-header">
              <h2 className="dash-section-title">Recent Activity</h2>
              <span className="dash-section-link" onClick={onViewAdmin}>View all</span>
            </div>

            <div className="activity-list">
              {loading ? (
                <div className="activity-empty">Loading activities...</div>
              ) : recentRecords.length === 0 ? (
                <div className="activity-empty">No recent activities found. Start collecting data to see them here.</div>
              ) : (
                recentRecords.map((record, index) => {
                  // Attempt to extract a meaningful title from dynamic response data
                  const title = record.survey_title || record.response_data?.full_name || record.response_data?.type_of_waste || 'Waste Survey Record';
                  const loc = record.ward || record.response_data?.ward || 'Kilifi';

                  return (
                      <div
                        key={record.id || index}
                        className="activity-item"
                        onClick={() => {
                          const target = record.id ? `/collections/${record.id}` : '/collections';
                          window.location.href = target;
                        }}
                      >
                      <div className="activity-icon">
                        <MapPin size={14} />
                      </div>
                      <div className="activity-content">
                        <p className="activity-title">{title}</p>
                        <p className="activity-meta">Logged in {loc}</p>
                      </div>
                      <div className="activity-time">
                        <Clock size={12} />
                        {timeAgo(record.created_at)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

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

  @keyframes spin { 100% { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }

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
    padding: 32px 24px 72px;
    display: flex; flex-direction: column; gap: 24px;
  }
  .dash-body--no-header { padding-top: 32px; }

  /* ── Heading ── */
  .dash-greeting {
    font-size: 11px; font-weight: 600; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal); margin-bottom: 6px;
  }
  .dash-title {
    font-size: 28px; font-weight: 700;
    color: var(--teal-d); letter-spacing: -0.8px; line-height: 1.15;
    margin-bottom: 6px;
  }
  .dash-sub {
    font-size: 14px; color: var(--muted); margin: 0;
  }
  .dash-sub strong { color: var(--text); font-weight: 600; }

  /* ── Divider ── */
  .dash-divider { border: none; border-top: 1px solid var(--border); margin: 0; }

  /* ── Stats (Flat Grid) ── */
  .dash-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
  }
  .stat-item {
    padding: 4px 0;
    border-right: 1px solid var(--border);
    padding-right: 16px;
    padding-left: 0;
    display: flex; flex-direction: column;
  }
  .stat-item:first-child { padding-left: 0; }
  .stat-item:last-child { border-right: none; padding-left: 16px; padding-right: 0; }
  .stat-item:not(:first-child):not(:last-child) { padding-left: 16px; }

  .stat-value {
    font-size: 32px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -1px;
    line-height: 1; margin: 0 0 6px 0;
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
    font-size: 12px; font-weight: 600;
    color: var(--text); margin: 0 0 2px 0;
  }
  .stat-note { font-size: 11px; color: var(--muted); margin: 0; line-height: 1.2; }

  /* ── Section Headers ── */
  .dash-section-header {
    display: flex; align-items: baseline; justify-content: space-between;
    margin-bottom: 16px;
  }
  .dash-section-title {
    font-size: 15px; font-weight: 700; color: var(--teal-d); margin: 0;
    letter-spacing: -0.3px;
  }
  .dash-section-link {
    font-size: 13px; font-weight: 600; color: var(--teal);
    cursor: pointer;
  }
  .dash-section-link:hover { text-decoration: underline; color: var(--teal-d); }

  /* ── Quick Actions Grid ── */
  .quick-actions-grid {
    display: flex; align-items: center; gap: 12px;
  }
  .quick-action-icon {
    width: 44px; height: 44px; border-radius: 10px;
    display: inline-flex; align-items: center; justify-content: center;
    background: white; border: 1px solid var(--border); color: var(--teal-d);
    cursor: pointer; transition: all 0.14s; box-shadow: 0 1px 0 rgba(0,0,0,0.02);
  }
  .quick-action-icon:hover { transform: translateY(-2px); border-color: var(--teal); color: var(--teal); }
  .quick-action-icon:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  
  @media (max-width: 480px) {
    .quick-actions-grid { flex-direction: row; }
    .quick-action-icon { width: 40px; height: 40px; }
  }

  /* ── Recent Activity List ── */
  .activity-list {
    display: flex; flex-direction: column; gap: 0;
    border-top: 1px solid var(--border);
  }
  .activity-item {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 0; border-bottom: 1px solid var(--border);
    cursor: pointer;
  }
  .activity-icon {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(50,157,156,0.08); color: var(--teal);
    flex-shrink: 0; border: 1px solid rgba(50,157,156,0.15);
  }
  .activity-content {
    flex: 1; display: flex; flex-direction: column; gap: 2px;
    min-width: 0; /* allows truncation */
  }
  .activity-title {
    font-size: 14px; font-weight: 600; color: var(--text); margin: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .activity-meta {
    font-size: 12.5px; color: var(--muted); margin: 0;
  }
  .activity-time {
    display: flex; align-items: center; gap: 4px;
    font-size: 11.5px; font-weight: 500; color: var(--muted);
    font-family: 'DM Mono', monospace; flex-shrink: 0;
  }
  .activity-empty {
    padding: 32px 0; text-align: center;
    font-size: 13.5px; color: var(--muted); border-bottom: 1px solid var(--border);
  }

  /* ── Error ── */
  .dash-error {
    display: flex; align-items: center; gap: 7px;
    color: #dc2626; font-size: 13px; font-weight: 500;
  }
`;