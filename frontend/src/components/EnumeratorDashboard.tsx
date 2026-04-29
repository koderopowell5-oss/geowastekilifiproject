import React, { useState } from 'react';
import { Home, MapPin, Edit3, Settings, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Dashboard } from './Dashboard';
import { WasteSurveyForm } from './WasteSurveyForm';
import { WasteMap } from './WasteMap';
import { ProfileTab } from './ProfileTab';
import { FloatingTabBar } from './FloatingTabBar';
import { CollectionsPage } from './CollectionsPage';

// ─── Shared image banner ──────────────────────────────────────────────────────

const PageBanner: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <div style={{
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 24px 0',
    maxWidth: 480,
    margin: '0 auto',
  }}>
    <img
      src={src}
      alt={alt}
      style={{
        width: '100%',
        maxWidth: 320,
        height: 'auto',
        maxHeight: 200,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const EnumeratorDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [editingDraftId, setEditingDraftId] = useState<string | undefined>();
  const [editingDraftData, setEditingDraftData] = useState<any>();
  const [showCollections, setShowCollections] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { showSuccess } = useNotification();

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully ✓');
  };

  const handleGoToSettings = () => {
    setCurrentPage('profile');
    setShowSettings(true);
  };

  const handleEditDraft = (draftId: string, formData: Record<string, any>) => {
    setEditingDraftId(draftId);
    setEditingDraftData(formData);
    setShowCollections(false);
  };

  const handleStartNew = () => {
    setEditingDraftId(undefined);
    setEditingDraftData(undefined);
    setShowCollections(false);
  };

  const handleSurveySuccess = () => {
    setEditingDraftId(undefined);
    setEditingDraftData(undefined);
    setCurrentPage('home');
  };

  if (isAdmin) return null;

  return (
    <>
      <style>{css}</style>
      <div className="enum-root">

        {/* ── App bar ── */}
        <header className="enum-appbar">
          <div className="enum-appbar-inner">
            <div className="enum-appbar-left">
              <div className="enum-app-icon">
                <MapPin size={16} color="white" />
              </div>
              <div>
                <p className="enum-app-name">GeoWaste Kilifi</p>
                <p className="enum-app-sub">Field Collection</p>
              </div>
            </div>

            <div className="enum-appbar-right">
              <div className="enum-user-chip">
                <div className="enum-user-avatar">
                  <User size={12} color="white" />
                </div>
                <div className="enum-user-meta">
                  <p className="enum-user-name">{(user as any)?.name || 'Enumerator'}</p>
                  <p className="enum-user-ward">{(user as any)?.ward || 'Ward'}</p>
                </div>
              </div>
              <button className="enum-logout-btn" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </div>
          <div className="enum-progress-rail">
            <div className="enum-progress-fill" />
          </div>
        </header>

        {/* ── Tabs ── */}
        <FloatingTabBar
          tabs={[
            {
              id: 'home',
              label: 'Home',
              icon: <Home size={20} />,
              content: (
                <div className="enum-page">
                  <PageBanner src="images/home.svg" alt="Home" />
                  <div className="enum-page-content">
                    <Dashboard hideHeader={true} onSettings={handleGoToSettings} />
                  </div>
                </div>
              ),
            },
            {
              id: 'survey',
              label: 'Survey',
              icon: <Edit3 size={20} />,
              content: showCollections ? (
                <CollectionsPage onEditDraft={handleEditDraft} onStartNew={handleStartNew} />
              ) : (
                <div className="enum-page">
                  <PageBanner src="images/survey.svg" alt="Survey" />
                  <div className="enum-page-content">
                    <WasteSurveyForm
                      hideHeader={true}
                      draftId={editingDraftId}
                      initialData={editingDraftData}
                      userEmail={(user as any)?.email}
                      onSubmitSuccess={handleSurveySuccess}
                    />
                    <div className="enum-collections-cta">
                      <hr className="enum-divider" />
                      <button className="enum-cta-btn" onClick={() => setShowCollections(true)}>
                        View My Collections
                      </button>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              id: 'map',
              label: 'Map',
              icon: <MapPin size={20} />,
              content: (
                <div className="enum-page">
                  <PageBanner src="images/map.svg" alt="Map" />
                  <div className="enum-map-wrap">
                    <WasteMap hideHeader={true} />
                  </div>
                </div>
              ),
            },
            {
              id: 'profile',
              label: 'Profile',
              icon: <Settings size={20} />,
              content: (
                <div className="enum-page">
                  <PageBanner src="images/profile.svg" alt="Profile" />
                  <ProfileTab showSettings={showSettings} onSettingsClose={() => setShowSettings(false)} />
                </div>
              ),
            },
          ]}
          currentTab={currentPage}
          onTabChange={setCurrentPage}
        />
      </div>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --teal:   #329D9C;
    --teal-d: #205072;
    --teal-l: #56C596;
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

  .enum-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }

  /* ── App bar ── */
  .enum-appbar {
    position: sticky; top: 0; z-index: 30;
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .enum-appbar-inner {
    max-width: 960px; margin: 0 auto;
    padding: 12px 20px 10px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px;
  }
  .enum-appbar-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .enum-app-icon {
    width: 34px; height: 34px; border-radius: 9px;
    background: var(--teal);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .enum-app-name {
    font-size: 14px; font-weight: 600; color: var(--teal-d);
    letter-spacing: -0.2px; line-height: 1.2;
  }
  .enum-app-sub {
    font-size: 11px; color: var(--teal-l); font-weight: 500;
  }

  .enum-appbar-right {
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  }
  .enum-user-chip {
    display: none;
    align-items: center; gap: 8px;
    padding: 6px 10px; border-radius: 20px;
    background: white; border: 1px solid var(--border);
  }
  @media (min-width: 480px) { .enum-user-chip { display: flex; } }
  .enum-user-avatar {
    width: 24px; height: 24px; border-radius: 50%;
    background: var(--teal);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .enum-user-meta { display: none; }
  @media (min-width: 640px) { .enum-user-meta { display: block; } }
  .enum-user-name {
    font-size: 12px; font-weight: 600; color: var(--teal-d);
    white-space: nowrap; line-height: 1.2;
  }
  .enum-user-ward { font-size: 10px; color: var(--teal-l); font-weight: 500; }

  .enum-logout-btn {
    display: none;
    padding: 6px 14px; border-radius: 20px;
    border: 1.5px solid var(--border);
    background: transparent; color: var(--muted);
    font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  @media (min-width: 480px) { .enum-logout-btn { display: block; } }
  .enum-logout-btn:hover { border-color: #fca5a5; color: #dc2626; }

  .enum-progress-rail {
    max-width: 960px; margin: 0 auto;
    height: 2px; background: var(--foam);
  }
  .enum-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--teal), var(--teal-l));
    width: 100%;
  }

  /* ── Page layout ── */
  .enum-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .enum-page-content {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  /* ── Map ── */
  .enum-map-wrap {
    width: 100%;
    max-width: 960px;
    margin: 16px auto 0;
    padding: 0 16px 100px;
    height: calc(100vh - 280px);
    min-height: 400px;
  }

  /* ── Collections CTA ── */
  .enum-collections-cta {
    max-width: 600px; margin: 0 auto;
    padding: 0 24px 80px;
  }
  .enum-divider { border: none; border-top: 1px solid var(--border); margin-bottom: 24px; }
  .enum-cta-btn {
    display: flex; align-items: center; justify-content: center;
    width: 100%; padding: 11px 18px;
    border-radius: var(--r);
    border: 1.5px solid var(--border);
    background: transparent; color: var(--text);
    font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  .enum-cta-btn:hover { border-color: var(--teal); color: var(--teal); }
`;