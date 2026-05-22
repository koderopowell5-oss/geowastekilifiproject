import React, { useState, useEffect, useCallback } from 'react';
import { Home, MapPin, Edit3, Settings, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Dashboard } from './Dashboard';
import { WasteMap } from './WasteMap';
import { ProfileTab } from './ProfileTab';
import { FloatingTabBar } from './FloatingTabBar';
import { CollectionsPage } from './CollectionsPage';
import { NotificationPanel } from './NotificationPanel';
import { DynamicSurveyForm, SurveyFormConfig } from './DynamicSurveyForm';
import { wasteApiService } from '../services/wasteApi';

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
  const [showCollections, setShowCollections] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [sharedForms, setSharedForms] = useState<Array<{ id: number; title: string; description?: string; form_config: SurveyFormConfig; shared_at?: string }>>([]);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [loadingForms, setLoadingForms] = useState(false);
  const { user, logout, isAdmin, projects, currentProjectId, switchProject } = useAuth();
  const activeProject = projects?.find((project) => project.project.id === currentProjectId);
  const { showSuccess, showError } = useNotification();

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully ✓');
  };

  const handleGoToSettings = () => {
    setCurrentPage('profile');
    setShowSettings(true);
  };

  const handleEditDraft = (_draftId: string, _formData: Record<string, any>) => {
    setShowCollections(false);
  };

  const handleStartNew = () => {
    setShowCollections(false);
  };

  const handleSurveySuccess = () => {
    setCurrentPage('home');
    showSuccess('Survey submitted successfully');
  };

  // Fixed fetch method to prevent dependency loops
  const fetchSharedForms = useCallback(async (projectId: string) => {
    setLoadingForms(true);
    try {
      const forms = await wasteApiService.getSharedForms(projectId);
      setSharedForms(forms);
      
      // Use functional state update to avoid adding selectedFormId to dependencies
      setSelectedFormId((prevSelectedId) => {
        if (!prevSelectedId && forms.length > 0) {
          return forms[0].id;
        } else if (prevSelectedId && !forms.some((form) => form.id === prevSelectedId) && forms.length > 0) {
          return forms[0].id;
        }
        return prevSelectedId;
      });

    } catch (error: any) {
      showError(error.message || 'Unable to load surveys for this project');
      setSharedForms([]);
      setSelectedFormId(null);
    } finally {
      setLoadingForms(false);
    }
  }, [showError]); // selectedFormId removed from dependencies

  // Only triggers on component mount or when currentProjectId changes
  useEffect(() => {
    if (currentProjectId) {
      fetchSharedForms(currentProjectId);
    }
  }, [currentProjectId, fetchSharedForms]);

  const handleProjectChange = async (projectId: string) => {
    try {
      await switchProject(projectId);
      await fetchSharedForms(projectId);
    } catch (error: any) {
      showError(error.message || 'Failed to switch project');
    }
  };

  const selectedSurvey = sharedForms.find((form) => form.id === selectedFormId) || null;

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
                <img
                  src="/images/Asset%201.svg"
                  alt="GeoKollect logo"
                  className="enum-app-logo"
                />
              </div>
              <div>
                <p className="enum-app-name">GeoKollect</p>
                <p className="enum-app-sub">Geospatial Data System</p>
              </div>
            </div>

            <div className="enum-appbar-right">
              <button
                className="enum-notif-btn"
                onClick={() => setNotificationPanelOpen(true)}
                aria-label="Open notifications"
              >
                <Bell size={18} color="#329D9C" strokeWidth={1.8} />
              </button>
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

        {/* ── Notification Panel ── */}
        <NotificationPanel isOpen={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} />

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
                    <div className="enum-project-selector">
                      <div>
                        <strong>Active project:</strong>{' '}
                        {activeProject?.project.name || 'None'}
                        {activeProject?.project.admin?.name ? (
                          <div style={{ marginTop: 4, fontSize: '0.9rem', color: '#666' }}>
                            Admin: {activeProject.project.admin.name}
                          </div>
                        ) : null}
                      </div>
                      {projects?.length > 1 && (
                        <select
                          value={currentProjectId || ''}
                          onChange={(event) => handleProjectChange(event.target.value)}
                        >
                          {projects.map((project) => (
                            <option key={project.project.id} value={project.project.id}>
                              {project.project.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {loadingForms ? (
                      <div className="enum-survey-loading">
                        <div className="spinner" />
                        <p>Loading assigned questionnaires…</p>
                      </div>
                    ) : sharedForms.length === 0 ? (
                      <div className="enum-survey-empty">
                        <p>No questionnaires have been shared with this project yet.</p>
                        <p>Check back once your admin has assigned a form.</p>
                      </div>
                    ) : (
                      <div className="enum-survey-view">
                        <aside className="enum-survey-sidebar">
                          <h2>Assigned questionnaires</h2>
                          <div className="enum-survey-list">
                            {sharedForms.map((form) => (
                              <button
                                key={form.id}
                                type="button"
                                className={`enum-survey-item${selectedFormId === form.id ? ' active' : ''}`}
                                onClick={() => setSelectedFormId(form.id)}
                              >
                                <span>{form.title}</span>
                                <small>{form.description || 'No description provided'}</small>
                              </button>
                            ))}
                          </div>
                        </aside>

                        <section className="enum-survey-main">
                          {selectedSurvey ? (
                            <>
                              <div className="enum-survey-details">
                                <h2>{selectedSurvey.title}</h2>
                                {selectedSurvey.description && <p>{selectedSurvey.description}</p>}
                              </div>
                              <DynamicSurveyForm
                                surveyId={selectedSurvey.id}
                                formConfig={selectedSurvey.form_config}
                                onSubmit={handleSurveySuccess}
                              />
                              <div className="enum-collections-cta">
                                <hr className="enum-divider" />
                                <button className="enum-cta-btn" onClick={() => setShowCollections(true)}>
                                  View My Collections
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="enum-survey-empty">
                              <p>Select a questionnaire to begin collecting data.</p>
                            </div>
                          )}
                        </section>
                      </div>
                    )}
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

  .enum-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    overflow-x: hidden;
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
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .enum-app-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
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

  /* ── Notification Bell Button ── */
  .enum-notif-btn {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px;
    border-radius: 8px;
    border: none;
    background: rgba(50, 157, 156, 0.08);
    color: var(--teal);
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    flex-shrink: 0;
  }
  .enum-notif-btn:hover {
    background: rgba(50, 157, 156, 0.15);
  }
  .enum-notif-btn:active {
    transform: scale(0.95);
  }

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
    max-width: 900px;
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
    max-width: 900px; margin: 0 auto;
    padding: 0 0 80px;
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

  .enum-project-selector {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding: 18px 24px;
    border-radius: var(--r);
    background: #ffffff;
    border: 1px solid var(--border);
  }

  .enum-project-selector select {
    padding: 10px 12px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: white;
    font-family: 'DM Sans', sans-serif;
    max-width: 100%;
  }

  .enum-survey-loading,
  .enum-survey-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 24px;
    border-radius: var(--r);
    border: 1.5px dashed var(--border);
    background: #ffffff;
    color: var(--muted);
  }

  /* BASE GRID (Overridden by mobile media query below) */
  .enum-survey-view {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
    width: 100%;
    align-items: flex-start;
  }

  .enum-survey-sidebar {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
    border-radius: var(--r);
    background: #ffffff;
    border: 1.5px solid var(--border);
    position: sticky;
    top: 80px;
  }

  .enum-survey-sidebar h2 {
    margin: 0;
    font-size: 16px;
    color: var(--teal-d);
  }

  .enum-survey-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .enum-survey-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 16px;
    text-align: left;
    border-radius: var(--r);
    border: 1px solid transparent;
    background: #f9faf9;
    color: var(--text);
    cursor: pointer;
  }

  .enum-survey-item:hover,
  .enum-survey-item.active {
    border-color: var(--teal);
    background: #f2faf7;
  }

  .enum-survey-item small {
    color: var(--muted);
    font-size: 12px;
  }

  .enum-survey-main {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    min-width: 0; /* Important: Prevents flex children from bursting out */
  }

  .enum-survey-details {
    padding: 20px;
    border-radius: var(--r);
    background: #ffffff;
    border: 1.5px solid var(--border);
  }

  .enum-survey-details h2 {
    margin: 0 0 8px;
    color: var(--teal-d);
  }

  .enum-survey-details p {
    margin: 0;
    color: var(--muted);
    line-height: 1.6;
  }

  .spinner {
    width: 30px;
    height: 30px;
    border: 4px solid #d8ede7;
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* ── Mobile Layout Fixes (Must remain at the bottom) ── */
  @media (max-width: 768px) {
    html, body {
      scrollbar-width: none;
      -ms-overflow-style: none;
      overflow-x: hidden;
    }
    
    html::-webkit-scrollbar,
    body::-webkit-scrollbar {
      display: none;
    }

    .enum-page-content {
      padding: 0 16px;
    }

    /* Change grid to vertical column */
    .enum-survey-view {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .enum-survey-sidebar {
      width: 100%;
      position: relative;
      top: 0;
    }

    .enum-survey-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .enum-project-selector {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .enum-project-selector select {
      width: 100%;
    }
  }
`;