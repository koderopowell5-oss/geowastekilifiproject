import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { wasteApiService } from '../services/wasteApi';
import { useNotification } from '../context/NotificationContext';
import { WasteSiteRecord } from '../../../types';
import {
  FileText, CheckCircle2, Clock, Trash2, Pencil,
  Loader2, AlertTriangle, Plus, SlidersHorizontal,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftForm {
  id: string;
  formData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'submitted';
  ward: string;
  coordinatesPassed?: boolean;
}

interface CollectionsPageProps {
  onEditDraft?: (draftId: string, formData: Record<string, any>) => void;
  onStartNew?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const CollectionsPage: React.FC<CollectionsPageProps> = ({ onEditDraft, onStartNew }) => {
  const [drafts, setDrafts] = useState<DraftForm[]>([]);
  const [submittedCollections, setSubmittedCollections] = useState<WasteSiteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'draft' | 'submitted' | 'all'>('all');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { showError, showSuccess } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const userEmail = (user as any)?.email;
        if (!userEmail) { 
          setError('User email not found'); 
          setLoading(false); 
          return; 
        }

        // Fetch submitted collections from API
        try {
          const result = await wasteApiService.getWasteSitesByEnumerator(userEmail);
          setSubmittedCollections(result.records || []);
        } catch (e: any) {
          console.error('Error fetching submitted collections:', e);
          setSubmittedCollections([]);
        }

        // Fetch drafts from localStorage
        const stored = localStorage.getItem(`geowaste_drafts_${userEmail}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDrafts(Array.isArray(parsed) ? parsed : []);
        }
        
        setError(null);
      } catch (err: any) {
        const errMsg = err.message || 'Failed to load collections';
        setError(errMsg);
        showError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [user, showError]);

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this survey?')) return;
    try {
      const userEmail = (user as any)?.email;
      const updated = drafts.filter(d => d.id !== id);
      localStorage.setItem(`geowaste_drafts_${userEmail}`, JSON.stringify(updated));
      setDrafts(updated);
      showSuccess('Survey deleted');
    } catch {
      showError('Failed to delete survey');
    }
  };

  const handleSubmit = async (draft: DraftForm) => {
    setSubmitting(draft.id);
    try {
      const userEmail = (user as any)?.email;
      await wasteApiService.submitWasteSite({
        ...(draft.formData as Omit<WasteSiteRecord, 'id' | 'created_at' | 'updated_at'>),
        enumerator_email: userEmail || undefined,
      });
      const updated = drafts.map(d => d.id === draft.id ? { ...d, status: 'submitted' as const } : d);
      localStorage.setItem(`geowaste_drafts_${userEmail}`, JSON.stringify(updated));
      setDrafts(updated);
      showSuccess('Survey submitted successfully');
    } catch (err: any) {
      showError(err.message || 'Submission failed');
    } finally {
      setSubmitting(null);
    }
  };

  const counts = {
    draft:     drafts.filter(d => d.status === 'draft').length,
    submitted: submittedCollections.length, // Use API submitted collections count
    all:       drafts.length + submittedCollections.length,
  };

  const filtered = (() => {
    const draftItems = drafts.map(d => ({ ...d, _type: 'draft' as const, _id: d.id }));
    const submittedItems = submittedCollections.map((s, idx) => ({ 
      id: s.id?.toString() || String(idx),
      _type: 'submitted' as const,
      _id: s.id?.toString() || String(idx),
      title: `${s.ward} · ${s.settlement_type}`,
      createdAt: s.created_at || new Date().toISOString(),
      _data: s,
    }));
    
    const allItems = [...draftItems, ...submittedItems];
    
    if (filter === 'draft') return allItems.filter((i: any) => i._type === 'draft');
    if (filter === 'submitted') return allItems.filter((i: any) => i._type === 'submitted');
    return allItems;
  })();

  return (
    <>
      <style>{css}</style>
      <div className="col-root">

        {/* ── Sticky header ── */}
        <header className="col-header">
          <div className="col-header-inner">
            <div>
              <p className="col-eyebrow">My Work</p>
              <h1 className="col-title">Collections</h1>
            </div>
            <button className="col-new-btn" onClick={onStartNew}>
              <Plus size={14} /> New Survey
            </button>
          </div>
          <div className="col-progress-rail">
            <div className="col-progress-fill" style={{ width: '100%' }} />
          </div>
        </header>

        {/* ── Body ── */}
        <main className="col-body">

          {/* Section head */}
          <section className="col-section-head">
            <h2 className="col-section-title">Surveys</h2>
            <p className="col-section-sub">Manage your saved drafts and submitted forms</p>
          </section>

          <hr className="col-divider" />

          {/* Filter pills */}
          <div className="col-filter-row">
            <SlidersHorizontal size={13} className="col-filter-icon" />
            {(['draft', 'submitted', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`col-filter-pill ${filter === tab ? 'col-filter-pill--on' : ''}`}
              >
                {tab === 'draft' ? 'Drafts' : tab === 'submitted' ? 'Submitted' : 'All'}
                <span className="col-filter-count">{counts[tab]}</span>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="col-error"><AlertTriangle size={14} />{error}</div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="col-loading">
              <Loader2 size={20} className="col-spin" />
              <p>Loading collections…</p>
            </div>
          ) : filtered.length === 0 ? (

            /* Empty state */
            <div className="col-empty">
              <FileText size={28} className="col-empty-icon" />
              <p className="col-empty-text">
                {filter === 'draft'
                  ? 'No draft surveys yet'
                  : filter === 'submitted'
                  ? 'No submitted surveys yet'
                  : 'No surveys yet'}
              </p>
              <p className="col-empty-sub">
                {filter === 'draft'
                  ? 'Start a new survey to create your first draft.'
                  : 'Surveys will appear here once you submit them.'}
              </p>
              {filter !== 'submitted' && (
                <button className="col-start-btn" onClick={onStartNew}>
                  <Plus size={14} /> Start New Survey
                </button>
              )}
            </div>

          ) : (

            /* Survey list */
            <div className="col-list">
              {filtered.map((item: any, i) => {
                const isSubmitting = submitting === item._id;
                const isDraft = item._type === 'draft';
                const ward = isDraft ? item.ward : item._data?.ward || '—';
                const date = new Date(isDraft ? item.createdAt : item._data?.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                
                return (
                  <div key={item._id} className="col-item" style={{ animationDelay: `${i * 50}ms` }}>

                    {/* Left: status icon */}
                    <div className={`col-item-icon ${isDraft ? 'col-item-icon--draft' : 'col-item-icon--done'}`}>
                      {isDraft
                        ? <Clock size={14} />
                        : <CheckCircle2 size={14} />
                      }
                    </div>

                    {/* Middle: meta */}
                    <div className="col-item-body">
                      <p className="col-item-id">Survey #{item._id.toString().slice(0, 8).toUpperCase()}</p>
                      <p className="col-item-meta">
                        {ward} · {date}
                      </p>
                    </div>

                    {/* Right: actions */}
                    <div className="col-item-actions">
                      {isDraft && (
                        <>
                          <button
                            className="col-action-btn col-action-btn--edit"
                            onClick={() => onEditDraft?.(item.id, item.formData)}
                            title="Edit draft"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="col-action-btn col-action-btn--submit"
                            onClick={() => handleSubmit(item)}
                            disabled={isSubmitting}
                            title="Submit"
                          >
                            {isSubmitting
                              ? <Loader2 size={13} className="col-spin" />
                              : <CheckCircle2 size={13} />
                            }
                          </button>
                          <button
                            className="col-action-btn col-action-btn--delete"
                            onClick={() => handleDelete(item.id)}
                            disabled={isSubmitting}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="col-footer">GeoWaste Kilifi v1.0</p>
        </main>
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

  .col-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }

  /* ── Header ── */
  .col-header {
    position: sticky; top: 0; z-index: 20;
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .col-header-inner {
    max-width: 600px; margin: 0 auto;
    padding: 16px 24px 12px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .col-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal); margin-bottom: 3px;
  }
  .col-title {
    font-size: 19px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.3px;
  }
  .col-new-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 20px;
    border: 1.5px solid var(--teal);
    background: var(--teal); color: white;
    font-size: 12.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  .col-new-btn:hover { background: var(--teal-d); border-color: var(--teal-d); }
  .col-progress-rail {
    max-width: 600px; margin: 0 auto;
    height: 2px; background: var(--foam);
  }
  .col-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--teal), var(--teal-l));
  }

  /* ── Body ── */
  .col-body {
    max-width: 600px; margin: 0 auto;
    padding: 36px 24px 80px;
    display: flex; flex-direction: column; gap: 28px;
  }

  .col-section-head {}
  .col-section-title {
    font-size: 24px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.5px;
    line-height: 1.2; margin-bottom: 6px;
  }
  .col-section-sub {
    font-size: 14px; color: var(--muted); line-height: 1.5;
  }
  .col-divider { border: none; border-top: 1px solid var(--border); }

  /* ── Filter row ── */
  .col-filter-row {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .col-filter-icon { color: var(--muted); flex-shrink: 0; }
  .col-filter-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 20px;
    border: 1.5px solid var(--border);
    background: transparent; color: var(--muted);
    font-size: 12.5px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  .col-filter-pill:hover { border-color: var(--teal); color: var(--teal-d); }
  .col-filter-pill--on {
    background: var(--teal); border-color: var(--teal); color: white;
  }
  .col-filter-count {
    font-size: 11px; font-weight: 600;
    font-family: 'DM Mono', monospace;
    opacity: 0.75;
  }
  .col-filter-pill--on .col-filter-count { opacity: 0.85; }

  /* ── Error ── */
  .col-error {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 500; color: #dc2626;
  }

  /* ── Loading ── */
  .col-loading {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; padding: 48px 0;
    font-size: 13px; color: var(--muted);
  }

  /* ── Empty ── */
  .col-empty {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 8px; padding: 56px 0; text-align: center;
  }
  .col-empty-icon { color: var(--muted); opacity: 0.3; margin-bottom: 4px; }
  .col-empty-text { font-size: 16px; font-weight: 600; color: var(--teal-d); }
  .col-empty-sub { font-size: 13px; color: var(--muted); max-width: 280px; line-height: 1.5; }
  .col-start-btn {
    display: flex; align-items: center; gap: 7px;
    margin-top: 8px;
    padding: 9px 20px; border-radius: var(--r);
    border: 1.5px solid var(--teal);
    background: var(--teal); color: white;
    font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  .col-start-btn:hover { background: var(--teal-d); border-color: var(--teal-d); }

  /* ── Survey list ── */
  .col-list {
    display: flex; flex-direction: column; gap: 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  @keyframes col-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

  .col-item {
    display: flex; align-items: center; gap: 14px;
    padding: 15px 0; border-bottom: 1px solid var(--border);
    animation: col-in 0.22s ease both;
  }
  .col-item:last-child { border-bottom: none; }

  /* Status icon */
  .col-item-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .col-item-icon--draft {
    background: rgba(50,157,156,0.07);
    border: 1px solid rgba(50,157,156,0.15);
    color: var(--teal);
  }
  .col-item-icon--done {
    background: rgba(86,197,150,0.1);
    border: 1px solid rgba(86,197,150,0.2);
    color: var(--teal-l);
  }

  /* Meta */
  .col-item-body { flex: 1; min-width: 0; }
  .col-item-id {
    font-size: 13px; font-weight: 600; color: var(--text);
    font-family: 'DM Mono', monospace; margin-bottom: 3px;
  }
  .col-item-meta { font-size: 12px; color: var(--muted); }

  /* Actions */
  .col-item-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .col-action-btn {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1.5px solid var(--border);
    background: transparent;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
    color: var(--muted);
  }
  .col-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .col-action-btn--edit:hover { border-color: var(--teal); color: var(--teal); background: rgba(50,157,156,0.05); }
  .col-action-btn--submit:hover { border-color: var(--teal-l); color: var(--teal-l); background: rgba(86,197,150,0.07); }
  .col-action-btn--delete:hover { border-color: #fca5a5; color: #dc2626; background: #fff5f5; }

  /* ── Footer ── */
  .col-footer {
    text-align: center; font-size: 11px; color: var(--muted);
    font-weight: 500; letter-spacing: 0.3px;
    font-family: 'DM Mono', monospace;
  }

  /* ── Spinner ── */
  .col-spin { animation: _spin 0.7s linear infinite; }
  @keyframes _spin { to { transform: rotate(360deg); } }
`;

export default CollectionsPage;