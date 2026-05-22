import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Edit, Download, Upload, Eye, Globe, Lock,
  AlertCircle, Search
} from 'lucide-react';
import { LoadingIcon } from './LoadingScreen';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { SurveyBuilder, SurveyFormConfig } from './SurveyBuilder';
import { buildApiUrl, getFetchOptions } from '../config/api';

interface Survey {
  id: number;
  title: string;
  description?: string;
  version: string;
  created_by: string;
  organization?: string;
  is_public: boolean;
  is_default: boolean;
  form_config: SurveyFormConfig;
  total_submissions: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const SurveysManagementPage: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'details' | 'create'>('list');
  const { projects, currentProjectId } = useAuth();
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Partial<Survey> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [publishingSurveyId, setPublishingSurveyId] = useState<number | null>(null);

  const fetchSurveys = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/surveys'), {
        ...getFetchOptions(),
      });

      if (!response.ok) throw new Error('Failed to fetch surveys');

      const data = await response.json();
      setSurveys(data.data || []);
    } catch (error: any) {
      showError(error.message || 'Failed to load surveys');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (view === 'list') {
      fetchSurveys();
    }
  }, [view, fetchSurveys]);

  const handleCreateSurvey = (title: string) => {
    setEditingSurvey({ title, form_config: { sections: [] } });
    setSelectedSurvey(null);
    setView('create');
  };

  const handleViewSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setView('details');
  };

  const handleEditSurvey = (survey: Survey) => {
    setEditingSurvey(survey);
    setSelectedSurvey(null);
    setView('create');
  };

  const handleSaveSurvey = async (formConfig: SurveyFormConfig) => {
    if (!editingSurvey?.title) {
      showError('Survey title is required');
      return;
    }

    setIsLoading(true);
    try {
      const isUpdate = Boolean(editingSurvey?.id);
      const endpoint = isUpdate ? `/surveys/${editingSurvey.id}` : '/surveys';
      const method = isUpdate ? 'PUT' : 'POST';
      const response = await fetch(buildApiUrl(endpoint), {
        method,
        ...getFetchOptions(),
        body: JSON.stringify({
          title: editingSurvey.title,
          description: editingSurvey.description,
          formConfig,
          organization: editingSurvey.organization,
          isPublic: editingSurvey.is_public || false,
        }),
      });

      if (!response.ok) throw new Error('Failed to save survey');

      await response.json();
      showSuccess(isUpdate ? 'Survey updated successfully' : 'Survey saved successfully');
      setView('list');
      setSelectedSurvey(null);
      setEditingSurvey(null);
      fetchSurveys();
    } catch (error: any) {
      showError(error.message || 'Failed to save survey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSurvey = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/surveys/${id}`), {
        method: 'DELETE',
        ...getFetchOptions(),
      });

      if (!response.ok) throw new Error('Failed to delete survey');

      showSuccess('Survey deleted');
      setShowDeleteConfirm(null);
      fetchSurveys();
    } catch (error: any) {
      showError(error.message || 'Failed to delete survey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSurvey = async (id: number) => {
    try {
      const response = await fetch(buildApiUrl(`/surveys/${id}/export`));
      if (!response.ok) throw new Error('Export failed');

      const json = await response.text();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${id}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Survey exported');
    } catch (error: any) {
      showError(error.message || 'Export failed');
    }
  };

  const handleImportSurvey = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const response = await fetch(buildApiUrl('/surveys/import'), {
          method: 'POST',
          ...getFetchOptions(),
          body: JSON.stringify({ jsonData: json }),
        });

        if (!response.ok) throw new Error('Import failed');

        showSuccess('Survey imported successfully');
        fetchSurveys();
      } catch (error: any) {
        showError(error.message || 'Import failed');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (!selectedProjectId) {
      if (currentProjectId) {
        setSelectedProjectId(currentProjectId);
      } else if (projects.length > 0) {
        setSelectedProjectId(projects[0].project.id);
      }
    }
  }, [currentProjectId, projects, selectedProjectId]);

  const handlePublishSurvey = async (surveyId: number) => {
    if (!selectedProjectId) {
      showError('Please choose a project first');
      return;
    }

    setPublishingSurveyId(surveyId);
    try {
      const response = await fetch(
        buildApiUrl(`/projects/${selectedProjectId}/forms/${surveyId}/publish`),
        {
          method: 'POST',
          ...getFetchOptions(),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || 'Failed to publish survey');
      }

      showSuccess('Survey uploaded to project and available for enumerators');
      fetchSurveys();
    } catch (error: any) {
      showError(error.message || 'Failed to publish survey');
    } finally {
      setPublishingSurveyId(null);
    }
  };

  const filteredSurveys = surveys.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  if (view === 'details' && selectedSurvey) {
    return (
      <>
        <style>{css}</style>
        <div className="surveys-page">
          <div className="surveys-header">
            <button
              className="surveys-back-btn"
              onClick={() => {
                setView('list');
                setSelectedSurvey(null);
              }}
            >
              ← Back to surveys
            </button>
            <div>
              <h1>{selectedSurvey.title}</h1>
              <p>{selectedSurvey.description || 'No description provided.'}</p>
            </div>
            <div className="surveys-header-actions">
              {projects.length > 0 && (
                <button
                  className="surveys-btn surveys-btn--secondary"
                  onClick={() => handlePublishSurvey(selectedSurvey.id)}
                  disabled={!selectedProjectId || publishingSurveyId === selectedSurvey.id}
                >
                  <Upload size={16} /> Publish
                </button>
              )}
              <button className="surveys-btn" onClick={() => handleEditSurvey(selectedSurvey)}>
                <Edit size={16} /> Edit
              </button>
              <button className="surveys-btn" onClick={() => handleExportSurvey(selectedSurvey.id)}>
                <Download size={16} /> Export
              </button>
              <button
                className="surveys-btn surveys-btn--danger"
                onClick={() => {
                  if (window.confirm('Delete this survey? This cannot be undone.')) {
                    handleDeleteSurvey(selectedSurvey.id);
                  }
                }}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          <div className="survey-detail-meta">
            <div className="survey-detail-row">
              <strong>Version</strong>
              <span>{selectedSurvey.version}</span>
            </div>
            <div className="survey-detail-row">
              <strong>Created</strong>
              <span>{new Date(selectedSurvey.created_at).toLocaleDateString()}</span>
            </div>
            <div className="survey-detail-row">
              <strong>Updated</strong>
              <span>{new Date(selectedSurvey.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="survey-detail-row">
              <strong>Visibility</strong>
              <span>{selectedSurvey.is_public ? 'Public' : 'Private'}</span>
            </div>
            {selectedSurvey.organization && (
              <div className="survey-detail-row">
                <strong>Organization</strong>
                <span>{selectedSurvey.organization}</span>
              </div>
            )}
          </div>

          <SurveyBuilder initialConfig={selectedSurvey.form_config} readOnly />
        </div>
      </>
    );
  }

  if (view === 'create' && editingSurvey) {
    return (
      <>
        <style>{css}</style>
        <div className="surveys-page">
          <div className="surveys-header">
            <button
              className="surveys-back-btn"
              onClick={() => {
                setView('list');
                setEditingSurvey(null);
              }}
            >
              ← Back
            </button>
            <div>
              <h1>{editingSurvey.id ? 'Edit Survey' : 'Create New Survey'}</h1>
              <div className="surveys-create-header">
                <input
                  type="text"
                  placeholder="Survey Title"
                  value={editingSurvey.title || ''}
                  onChange={(e) =>
                    setEditingSurvey({ ...editingSurvey, title: e.target.value })
                  }
                  className="surveys-title-input"
                />
              </div>
            </div>
          </div>

          <SurveyBuilder
            initialConfig={editingSurvey.form_config}
            onSave={handleSaveSurvey}
          />
        </div>
      </>
    );
  }

  if (view === 'list') {
    return (
      <>
        <style>{css}</style>
        <div className="surveys-page">
          {/* Header */}
          <div className="surveys-header">
            <div>
              <h1>Survey Management</h1>
              <p>Create, manage, and import custom questionnaires</p>
            </div>
            <div className="surveys-header-actions">
              {projects.length > 0 && (
                <div className="surveys-project-picker">
                  <label htmlFor="publish-project">Publish target:</label>
                  <select
                    id="publish-project"
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    {projects.map((project) => (
                      <option key={project.project.id} value={project.project.id}>
                        {project.project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <label className="surveys-btn surveys-btn--secondary">
                <Upload size={16} /> Import Survey
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportSurvey(file);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                className="surveys-btn surveys-btn--primary"
                onClick={() => handleCreateSurvey('New Survey')}
              >
                <Plus size={16} /> New Survey
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="surveys-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search surveys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="surveys-loading">
              <LoadingIcon size={40} />
              <p>Loading surveys...</p>
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="surveys-empty">
              <AlertCircle size={48} />
              <h2>No surveys yet</h2>
              <p>Create your first survey to get started.</p>
              <button
                className="surveys-btn surveys-btn--primary"
                onClick={() => handleCreateSurvey('New Survey')}
              >
                <Plus size={16} /> Create Survey
              </button>
            </div>
          ) : (
            <div className="surveys-grid">
              {filteredSurveys.map((survey) => (
                <div key={survey.id} className="survey-card">
                  <div className="survey-card-header">
                    <div>
                      <h3>{survey.title}</h3>
                      <p className="survey-card-meta">
                        v{survey.version} • {survey.total_submissions} submissions
                      </p>
                    </div>
                    <div className="survey-card-badges">
                      {survey.is_default && (
                        <span className="survey-badge survey-badge--default">Default</span>
                      )}
                      {survey.is_public ? (
                        <span className="survey-badge survey-badge--public">
                          <Globe size={12} /> Public
                        </span>
                      ) : (
                        <span className="survey-badge survey-badge--private">
                          <Lock size={12} /> Private
                        </span>
                      )}
                    </div>
                  </div>

                  {survey.description && (
                    <p className="survey-card-description">{survey.description}</p>
                  )}

                  {survey.organization && (
                    <p className="survey-card-org">Organization: {survey.organization}</p>
                  )}

                  <div className="survey-card-footer">
                    <small>{new Date(survey.created_at).toLocaleDateString()}</small>
                            <div className="survey-card-actions">
                        <button
                          className="survey-action-btn"
                          onClick={() => handleViewSurvey(survey)}
                          title="View Survey"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="survey-action-btn"
                          onClick={() => handleExportSurvey(survey.id)}
                          title="Export Survey"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className="survey-action-btn survey-action-btn--secondary"
                          onClick={() => handlePublishSurvey(survey.id)}
                          disabled={!selectedProjectId || publishingSurveyId === survey.id}
                          title="Upload survey to selected project"
                        >
                          <Upload size={16} />
                        </button>
                        <button
                          className="survey-action-btn survey-action-btn--danger"
                          onClick={() => setShowDeleteConfirm(survey.id)}
                          title="Delete Survey"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                  </div>

                  {showDeleteConfirm === survey.id && (
                    <div className="survey-delete-confirm">
                      <p>Delete this survey? This cannot be undone.</p>
                      <div className="survey-confirm-actions">
                        <button
                          className="surveys-btn surveys-btn--secondary"
                          onClick={() => setShowDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="surveys-btn surveys-btn--danger"
                          onClick={() => handleDeleteSurvey(survey.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  return null;
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .surveys-page {
    padding: 24px;
    background: #f6fbf8;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
  }

  .surveys-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 24px;
  }

  .surveys-header h1 {
    font-size: 28px;
    font-weight: 700;
    color: #205072;
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
  }

  .surveys-header p {
    font-size: 14px;
    color: #7a9a8a;
    margin: 0;
  }

  .surveys-header-actions {
    display: flex;
    gap: 12px;
  }

  .surveys-back-btn {
    background: white;
    border: 1.5px solid #e2ede8;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: #205072;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .surveys-back-btn:hover {
    background: #f6fbf8;
    border-color: #329D9C;
    color: #329D9C;
  }

  .surveys-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .surveys-btn--primary {
    background: linear-gradient(135deg, #329D9C 0%, #56C596 100%);
    color: white;
  }

  .surveys-btn--primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(50, 157, 156, 0.25);
  }

  .surveys-btn--secondary {
    background: white;
    color: #205072;
    border: 1.5px solid #e2ede8;
  }

  .surveys-btn--secondary:hover {
    background: #f6fbf8;
    border-color: #329D9C;
    color: #329D9C;
  }

  .surveys-btn--danger {
    background: #fee2e2;
    color: #dc2626;
    border: 1.5px solid #fca5a5;
  }

  .surveys-btn--danger:hover {
    background: #fecaca;
    border-color: #dc2626;
  }

  .surveys-search {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: white;
    border: 1.5px solid #e2ede8;
    border-radius: 12px;
    margin-bottom: 24px;
    color: #7a9a8a;
    transition: border-color 0.15s;
  }

  .surveys-search:focus-within {
    border-color: #329D9C;
  }

  .surveys-search input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #1c3a2e;
  }

  .surveys-search input::placeholder {
    color: #7a9a8a;
  }

  .surveys-project-picker {
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    border: 1.5px solid #e2ede8;
    border-radius: 8px;
    padding: 8px 12px;
    color: #205072;
    font-size: 13px;
  }

  .surveys-project-picker label {
    font-weight: 600;
    color: #7a9a8a;
    white-space: nowrap;
  }

  .surveys-project-picker select {
    border: 1.5px solid #e2ede8;
    border-radius: 6px;
    padding: 6px 10px;
    background: #fff;
    color: #205072;
    min-width: 140px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  
  .surveys-project-picker select:focus {
    border-color: #329D9C;
  }

  .survey-detail-meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 28px;
    padding: 20px 24px;
    background: white;
    border: 1.5px solid #e2ede8;
    border-radius: 12px;
  }
  .survey-detail-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 13px;
    color: #205072;
  }
  .survey-detail-row strong {
    color: #7a9a8a;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
  }

  .surveys-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px 20px;
    color: #7a9a8a;
  }

  .surveys-loading .spin {
    animation: spin 1s linear infinite;
  }

  .surveys-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px 20px;
    text-align: center;
    color: #7a9a8a;
  }

  .surveys-empty h2 {
    font-size: 20px;
    color: #205072;
    margin: 0;
  }

  .surveys-empty p {
    font-size: 14px;
    margin: 0;
  }

  .surveys-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .survey-card {
    background: white;
    border: 1.5px solid #e2ede8;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s ease-in-out;
    display: flex;
    flex-direction: column;
  }

  .survey-card:hover {
    border-color: #329D9C;
    box-shadow: 0 8px 24px rgba(50, 157, 156, 0.1);
    transform: translateY(-2px);
  }

  .survey-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 12px;
  }

  .survey-card-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: #205072;
    margin: 0 0 6px 0;
    line-height: 1.3;
  }

  .survey-card-meta {
    font-size: 12px;
    color: #7a9a8a;
    margin: 0;
  }

  .survey-card-badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .survey-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .survey-badge--default {
    background: #e8f5f2;
    color: #329D9C;
  }

  .survey-badge--public {
    background: #e0f2fe;
    color: #0284c7;
  }

  .survey-badge--private {
    background: #f3e8ff;
    color: #a855f7;
  }

  .survey-card-description {
    font-size: 13px;
    color: #1c3a2e;
    margin: 8px 0;
    line-height: 1.5;
    flex: 1;
  }

  .survey-card-org {
    font-size: 11px;
    font-weight: 600;
    color: #7a9a8a;
    margin: 8px 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .survey-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #e2ede8;
    margin-top: auto;
  }

  .survey-card-footer small {
    color: #7a9a8a;
    font-size: 12px;
    font-weight: 500;
  }

  .survey-card-actions {
    display: flex;
    gap: 8px;
  }

  .survey-action-btn {
    background: #f6fbf8;
    border: 1.5px solid transparent;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #329D9C;
    transition: all 0.2s;
  }

  .survey-action-btn:hover {
    background: #e8f5f2;
    border-color: #329D9C;
  }

  .survey-action-btn--danger {
    color: #dc2626;
    background: #fef2f2;
  }

  .survey-action-btn--danger:hover {
    background: #fee2e2;
    border-color: #fca5a5;
  }

  .survey-delete-confirm {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e2ede8;
  }

  .survey-delete-confirm p {
    font-size: 13px;
    font-weight: 500;
    color: #dc2626;
    margin: 0 0 12px 0;
    text-align: center;
  }

  .survey-confirm-actions {
    display: flex;
    gap: 8px;
  }

  .survey-confirm-actions button {
    flex: 1;
    padding: 8px;
    font-size: 13px;
  }

  .surveys-create-header {
    margin-top: 12px;
  }

  .surveys-title-input {
    width: 100%;
    max-width: 400px;
    padding: 12px 16px;
    border: 1.5px solid #e2ede8;
    border-radius: 8px;
    font-size: 16px;
    font-family: 'DM Sans', sans-serif;
    color: #1c3a2e;
    transition: border-color 0.15s;
  }

  .surveys-title-input:focus {
    outline: none;
    border-color: #329D9C;
    background: #fff;
    box-shadow: 0 0 0 3px #e8f5f2;
  }

  @media (max-width: 768px) {
    .surveys-page {
      padding: 16px;
      padding-bottom: 96px; /* space for bottom nav */
    }

    .surveys-header {
      flex-direction: column;
      gap: 16px;
    }

    .surveys-header-actions {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .surveys-project-picker {
      grid-column: 1 / -1;
      width: 100%;
    }

    .surveys-project-picker select {
      flex: 1;
      min-width: 0;
    }

    .surveys-btn {
      width: 100%;
    }
    
    .surveys-btn--primary {
      grid-column: 1 / -1;
    }

    .surveys-grid {
      grid-template-columns: 1fr;
    }
    
    .survey-detail-meta {
      grid-template-columns: 1fr;
    }
  }
`;