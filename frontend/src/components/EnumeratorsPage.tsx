import React, { useState, useEffect } from 'react';
import { Enumerator } from '../context/AuthContext';
import { WasteSiteRecord } from '../../../types';
import { wasteApiService } from '../services/wasteApi';
import { useNotification } from '../context/NotificationContext';
import {
  Mail, Phone, MapIcon, MapPin,
  ChevronLeft, ArrowRight, Calendar, Layers, Home, AlertCircle, Loader2, Trash2,
} from 'lucide-react';

interface EnumeratorsPageProps {
  sites: WasteSiteRecord[];
}

const ENUMERATORS: Enumerator[] = [
  { id: '1', name: 'John Kamau',    email: 'enumerator1@geowaste.com', ward: 'Tezo',   phone: '+254712345678' },
  { id: '2', name: 'Mary Kipchoge', email: 'enumerator2@geowaste.com', ward: 'Sokoni', phone: '+254723456789' },
  { id: '3', name: 'David Omondi', email: 'enumerator3@geowaste.com', ward: 'Tezo',   phone: '+254734567890' },
];

// ─── Utilities ──────────────────────────────────────────────────────────────

function getEnumeratorStats(enumerator: Enumerator, sites: WasteSiteRecord[]) {
  // Filter records by enumerator email
  const records = sites.filter((site) => site.enumerator_email === enumerator.email);
  return {
    totalCollections: records.length,
    wardsServed: new Set(records.map(s => s.ward)).size,
    settlementTypes: new Set(records.map(s => s.settlement_type)).size,
    recentSubmission: records.length > 0
      ? new Date(records[0].created_at || '').toLocaleDateString('en-GB')
      : 'No submissions',
    records,
  };
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Enumerator Detail Page ──────────────────────────────────────────────────

const EnumeratorDetailPage: React.FC<{
  enumerator: Enumerator;
  sites: WasteSiteRecord[];
  onBack: () => void;
  onDelete: (id: string) => Promise<void>;
}> = ({ enumerator, sites, onBack, onDelete }) => {
  const { showSuccess, showError } = useNotification();
  const [isDeleting, setIsDeleting] = useState(false);
  const stats = getEnumeratorStats(enumerator, sites);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove ${enumerator.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(enumerator.id);
      showSuccess(`${enumerator.name} has been removed successfully`);
    } catch (error: any) {
      showError(error.message || 'Failed to remove enumerator');
    } finally {
      setIsDeleting(false);
    }
  };

  const lats = stats.records.map(s => Number(s.latitude)).filter(Boolean);
  const lngs = stats.records.map(s => Number(s.longitude)).filter(Boolean);
  const centerLat = lats.length ? (Math.min(...lats) + Math.max(...lats)) / 2 : 0;
  const centerLng = lngs.length ? (Math.min(...lngs) + Math.max(...lngs)) / 2 : 0;
  const rangeKm = lats.length
    ? ((Math.max(...lats) - Math.min(...lats)) * 111).toFixed(1)
    : '0';

  return (
    <>
      <style>{css}</style>
      <div className="en-root">

        {/* ── Sticky header ── */}
        <header className="en-header">
          <div className="en-header-inner">
            <button onClick={onBack} className="en-back-btn">
              <ChevronLeft size={15} /> Back
            </button>
            <div>
              <p className="en-eyebrow">Enumerator</p>
              <h1 className="en-title">{enumerator.name}</h1>
            </div>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="en-delete-btn"
              title="Remove enumerator"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="en-progress-rail">
            <div className="en-progress-fill" style={{ width: '100%' }} />
          </div>
        </header>

        <main className="en-body">

          {/* ── Identity block ── */}
          <section>
            <h2 className="en-section-title">Profile</h2>
            <p className="en-section-sub">Contact details and assignment</p>
          </section>

          <hr className="en-divider" />

          <div className="en-identity-row">
            <div className="en-avatar-lg">{initials(enumerator.name)}</div>
            <div>
              <p className="en-name-lg">{enumerator.name}</p>
              <span className="en-ward-badge">{enumerator.ward} Ward</span>
            </div>
          </div>

          <div className="en-fields">
            <div className="en-field-row">
              <div className="en-icon-wrap"><Mail size={14} className="en-field-icon" /></div>
              <div>
                <span className="en-field-label">Email</span>
                <span className="en-field-value">{enumerator.email}</span>
              </div>
            </div>
            <div className="en-field-row">
              <div className="en-icon-wrap"><Phone size={14} className="en-field-icon" /></div>
              <div>
                <span className="en-field-label">Phone</span>
                <span className="en-field-value">{enumerator.phone}</span>
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <hr className="en-divider" />
          <section>
            <h2 className="en-section-title">Collection Summary</h2>
            <p className="en-section-sub">Aggregated data for this enumerator</p>
          </section>

          <div className="en-stat-grid">
            {[
              { label: 'Collections', value: stats.totalCollections, color: 'var(--teal-d)' },
              { label: 'Wards',       value: stats.wardsServed,      color: 'var(--teal)' },
              { label: 'Settlements', value: stats.settlementTypes,  color: 'var(--teal-l)' },
            ].map(s => (
              <div key={s.label} className="en-stat-cell">
                <span className="en-stat-num" style={{ color: s.color }}>{s.value}</span>
                <span className="en-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── Map zone ── */}
          <hr className="en-divider" />
          <section>
            <h2 className="en-section-title">Coverage Area</h2>
            <p className="en-section-sub">Spatial distribution of collection points</p>
          </section>

          <div className="en-map-zone">
            {stats.records.length === 0 ? (
              <div className="en-map-empty">
                <MapIcon size={28} className="en-map-empty-icon" />
                <p>No collection data yet</p>
              </div>
            ) : (
              <>
                <div className="en-map-visual">
                  <div className="en-map-inner">
                    <MapIcon size={32} className="en-map-icon" />
                    <p className="en-map-label">
                      {stats.records.length} point{stats.records.length !== 1 ? 's' : ''} · {enumerator.ward}
                    </p>
                    <div className="en-map-tags">
                      <span className="en-map-tag">
                        {centerLat.toFixed(4)}°, {centerLng.toFixed(4)}°
                      </span>
                      <span className="en-map-tag">~{rangeKm} km range</span>
                    </div>
                  </div>
                </div>

                <div className="en-mini-stats">
                  {[
                    { icon: <MapPin size={13} />, label: 'Total Points', val: stats.records.length },
                    { icon: <Layers size={13} />,  label: 'Settlements',  val: stats.settlementTypes },
                    { icon: <Home size={13} />,    label: 'Avg H/H',
                      val: stats.records.length
                        ? (stats.records.reduce((s, r) => {
                            const m = (r.household_size || '').match(/\d+/);
                            return s + (m ? parseInt(m[0]) : 0);
                          }, 0) / stats.records.length).toFixed(1)
                        : '—'
                    },
                    { icon: <Calendar size={13} />, label: 'Last Active', val: stats.recentSubmission },
                  ].map(m => (
                    <div key={m.label} className="en-mini-stat">
                      <div className="en-mini-stat-icon">{m.icon}</div>
                      <span className="en-mini-stat-val">{m.val}</span>
                      <span className="en-mini-stat-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Records list ── */}
          <hr className="en-divider" />
          <section>
            <h2 className="en-section-title">All Collection Points</h2>
            <p className="en-section-sub">{stats.records.length} records captured</p>
          </section>

          <div className="en-records">
            {stats.records.length === 0 && (
              <p className="en-empty-text">No records yet.</p>
            )}
            {stats.records.map((record, idx) => (
              <div key={record.id} className="en-record-row">
                <div className="en-record-num">{idx + 1}</div>
                <div className="en-record-body">
                  <p className="en-record-title">{record.ward} · {record.settlement_type}</p>
                  <p className="en-record-coords">
                    {Number(record.latitude).toFixed(5)}°, {Number(record.longitude).toFixed(5)}°
                  </p>
                </div>
                <span className="en-record-date">
                  {record.created_at ? new Date(record.created_at as string).toLocaleDateString('en-GB') : '—'}
                </span>
              </div>
            ))}
          </div>

        </main>
      </div>
    </>
  );
};

// ─── Main List Page ──────────────────────────────────────────────────────────

export const EnumeratorsPage: React.FC<EnumeratorsPageProps> = ({ sites }) => {
  const { showSuccess, showError } = useNotification();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [enumerators, setEnumerators] = useState<Enumerator[]>(ENUMERATORS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch enumerators from API
  useEffect(() => {
    const fetchEnumerators = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await wasteApiService.getAllEnumerators();
        
        // Map API response to Enumerator interface
        const mappedEnumerators: Enumerator[] = data.map((e: any) => ({
          id: e.id?.toString() || '',
          name: e.name || '',
          email: e.email || '',
          ward: e.ward || '',
          phone: e.phone || '',
        }));

        if (mappedEnumerators.length > 0) {
          setEnumerators(mappedEnumerators);
        } else {
          // Use mock data if no enumerators found
          setEnumerators(ENUMERATORS);
        }
      } catch (err: any) {
        console.error('Failed to fetch enumerators:', err.message);
        setError(err.message || 'Failed to fetch enumerators');
        // Fallback to mock data
        setEnumerators(ENUMERATORS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnumerators();
  }, []);

  const handleDeleteEnumerator = async (id: string) => {
    try {
      const idNum = parseInt(id, 10);
      await wasteApiService.deleteEnumerator(idNum);
      setEnumerators(prev => prev.filter(e => e.id !== id));
      setDetailId(null);
    } catch (error: any) {
      throw error;
    }
  };

  const selected = enumerators.find(e => e.id === detailId);
  if (selected) {
    return (
      <EnumeratorDetailPage
        enumerator={selected}
        sites={sites}
        onBack={() => setDetailId(null)}
        onDelete={handleDeleteEnumerator}
      />
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="en-root">

        {/* ── Sticky header ── */}
        <header className="en-header">
          <div className="en-header-inner">
            <div>
              <p className="en-eyebrow">Team</p>
              <h1 className="en-title">Enumerators</h1>
            </div>
          </div>
          <div className="en-progress-rail">
            <div className="en-progress-fill" style={{ width: '100%' }} />
          </div>
        </header>

        {/* ── Hero banner ── */}
        <div className="en-hero">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80&auto=format&fit=crop"
            alt="Field enumerators at work"
            className="en-hero-img"
          />
          <div className="en-hero-overlay">
            <p className="en-hero-label">GeoWaste Kilifi</p>
            <p className="en-hero-sub">{enumerators.length} active field enumerators</p>
          </div>
        </div>

        <main className="en-body">

          {/* ── Error state ── */}
          {error && (
            <div className="en-error-box">
              <AlertCircle size={16} className="en-error-icon" />
              <div>
                <p className="en-error-title">Failed to load enumerators</p>
                <p className="en-error-msg">{error}</p>
                <p className="en-error-fallback" style={{ fontSize: '11px', marginTop: '6px', opacity: 0.7 }}>
                  Showing cached data
                </p>
              </div>
            </div>
          )}

          {/* ── Loading state ── */}
          {isLoading && (
            <div className="en-loading-box">
              <Loader2 size={20} className="en-loading-spinner" />
              <p className="en-loading-text">Loading enumerators...</p>
            </div>
          )}

          {/* ── Content ── */}
          {!isLoading && (
            <>
              <section>
                <h2 className="en-section-title">Field Team</h2>
                <p className="en-section-sub">Tap an enumerator to view their collection details</p>
              </section>

              <hr className="en-divider" />

              {/* ── Enumerator cards ── */}
              <div className="en-list">
                {enumerators.map((enumerator, i) => {
                  const stats = getEnumeratorStats(enumerator, sites);
                  return (
                    <button
                      key={enumerator.id}
                      className="en-card"
                      style={{ animationDelay: `${i * 60}ms` }}
                      onClick={() => setDetailId(String(enumerator.id))}
                    >
                      <div className="en-card-left">
                        <div className="en-avatar-sm">{initials(enumerator.name)}</div>
                        <div className="en-card-meta">
                          <p className="en-card-name">{enumerator.name}</p>
                          <div className="en-card-contact">
                            <span className="en-contact-item">
                              <MapPin size={10} /> {enumerator.ward}
                            </span>
                            <span className="en-contact-item">
                              <Phone size={10} /> {enumerator.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="en-card-right">
                        <div className="en-card-stat">
                          <span className="en-card-stat-num">{stats.totalCollections}</span>
                          <span className="en-card-stat-label">sites</span>
                        </div>
                        <div className="en-card-arrow"><ArrowRight size={14} /></div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <hr className="en-divider" />

              {/* ── Summary totals ── */}
              <section>
                <h2 className="en-section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>Team Overview</h2>
              </section>

              <div className="en-overview-grid">
                {[
                  { label: 'Total Collections', value: sites.length, color: 'var(--teal-d)' },
                  { label: 'Active Wards',      value: new Set(sites.map(s => s.ward)).size, color: 'var(--teal)' },
                  { label: 'Settlement Types',  value: new Set(sites.map(s => s.settlement_type)).size, color: 'var(--teal-l)' },
                ].map(s => (
                  <div key={s.label} className="en-overview-cell">
                    <span className="en-overview-num" style={{ color: s.color }}>{s.value}</span>
                    <span className="en-overview-label">{s.label}</span>
                  </div>
                ))}
              </div>

              <p className="en-footer">GeoWaste Kilifi v1.0</p>
            </>
          )}

        </main>
      </div>
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

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

  .en-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }

  /* ── Header ── */
  .en-header {
    position: sticky; top: 0; z-index: 20;
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .en-header-inner {
    max-width: 600px; margin: 0 auto;
    padding: 16px 24px 12px;
    display: flex; align-items: center; gap: 12px;
  }
  .en-back-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 12px; border-radius: 20px;
    border: 1.5px solid var(--border);
    background: transparent;
    color: var(--muted); font-size: 12.5px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s; flex-shrink: 0;
  }
  .en-back-btn:hover { border-color: var(--teal-d); color: var(--teal-d); }
  .en-delete-btn {
    display: flex; align-items: center; justify-content: center;
    padding: 6px 8px; border-radius: 20px;
    border: 1.5px solid var(--border);
    background: transparent;
    color: var(--muted); font-size: 12.5px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s; flex-shrink: 0; margin-left: auto;
  }
  .en-delete-btn:hover { border-color: #d63031; color: #d63031; }
  .en-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .en-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal); margin-bottom: 3px;
  }
  .en-title {
    font-size: 19px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.3px;
  }
  .en-progress-rail {
    max-width: 600px; margin: 0 auto;
    height: 2px; background: var(--foam);
  }
  .en-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--teal), var(--teal-l));
  }

  /* ── Hero ── */
  .en-hero {
    position: relative; width: 100%; height: 200px; overflow: hidden;
  }
  .en-hero-img {
    width: 100%; height: 100%; object-fit: cover;
    filter: brightness(0.72) saturate(0.9);
  }
  .en-hero-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 20px 24px 18px;
    background: linear-gradient(to top, rgba(32,80,114,0.85) 0%, transparent 100%);
  }
  .en-hero-label {
    font-size: 11px; font-weight: 600; letter-spacing: 0.8px;
    text-transform: uppercase; color: var(--foam); opacity: 0.8;
    margin-bottom: 4px;
  }
  .en-hero-sub {
    font-size: 22px; font-weight: 600; color: white; letter-spacing: -0.4px;
  }

  /* ── Body ── */
  .en-body {
    max-width: 600px; margin: 0 auto;
    padding: 36px 24px 80px;
    display: flex; flex-direction: column; gap: 28px;
  }

  .en-section-title {
    font-size: 24px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.5px;
    line-height: 1.2; margin-bottom: 6px;
  }
  .en-section-sub {
    font-size: 14px; color: var(--muted); line-height: 1.5;
  }
  .en-divider { border: none; border-top: 1px solid var(--border); }

  /* ── Error state ── */
  .en-error-box {
    display: flex; gap: 12px;
    padding: 14px 16px; border-radius: var(--r);
    background: rgba(220, 38, 38, 0.04);
    border: 1px solid rgba(220, 38, 38, 0.2);
  }
  .en-error-icon { color: #dc2626; margin-top: 2px; flex-shrink: 0; }
  .en-error-title {
    font-size: 13px; font-weight: 600; color: #dc2626;
    margin-bottom: 2px;
  }
  .en-error-msg {
    font-size: 12px; color: #7a5252; line-height: 1.4;
  }
  .en-error-fallback {
    font-size: 11px; color: #7a5252;
  }

  /* ── Loading state ── */
  .en-loading-box {
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    padding: 40px 24px;
  }
  .en-loading-spinner {
    color: var(--teal); animation: spin 1s linear infinite;
  }
  .en-loading-text {
    font-size: 13px; color: var(--muted); font-weight: 500;
  }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  /* ── Enumerator card list ── */
  .en-list { display: flex; flex-direction: column; gap: 0; border-top: 1px solid var(--border); }
  @keyframes en-slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

  .en-card {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    gap: 14px; padding: 16px 0;
    border-bottom: 1px solid var(--border);
    background: none; border-left: none; border-right: none; border-top: none;
    cursor: pointer; text-align: left;
    transition: background 0.15s;
    animation: en-slide-in 0.25s ease both;
  }
  .en-card:hover { background: rgba(50,157,156,0.03); }

  .en-card-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }

  .en-avatar-sm {
    width: 42px; height: 42px; border-radius: 50%;
    background: linear-gradient(135deg, var(--teal), var(--teal-d));
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; color: white;
    flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(50,157,156,0.2);
  }

  .en-card-meta { flex: 1; min-width: 0; }
  .en-card-name {
    font-size: 14px; font-weight: 600; color: var(--text);
    margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .en-card-contact { display: flex; gap: 10px; flex-wrap: wrap; }
  .en-contact-item {
    display: flex; align-items: center; gap: 4px;
    font-size: 11.5px; color: var(--muted);
  }

  .en-card-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .en-card-stat { display: flex; flex-direction: column; align-items: flex-end; }
  .en-card-stat-num {
    font-size: 18px; font-weight: 600; color: var(--teal);
    font-family: 'DM Mono', monospace; line-height: 1;
  }
  .en-card-stat-label { font-size: 10px; color: var(--muted); font-weight: 500; }
  .en-card-arrow { color: var(--muted); opacity: 0.5; }

  /* ── Overview totals ── */
  .en-overview-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  }
  .en-overview-cell {
    display: flex; flex-direction: column; align-items: center;
    padding: 14px 8px; border-radius: var(--r);
    background: white; border: 1px solid var(--border);
    gap: 4px;
  }
  .en-overview-num {
    font-size: 26px; font-weight: 600; letter-spacing: -0.5px;
    font-family: 'DM Mono', monospace; line-height: 1;
  }
  .en-overview-label {
    font-size: 11px; color: var(--muted); font-weight: 500; text-align: center;
  }

  /* ── Detail page ── */
  .en-identity-row { display: flex; align-items: center; gap: 16px; }
  .en-avatar-lg {
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, var(--teal), var(--teal-d));
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 600; color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(50,157,156,0.28);
  }
  .en-name-lg {
    font-size: 18px; font-weight: 600; color: var(--teal-d);
    letter-spacing: -0.3px; margin-bottom: 6px;
  }
  .en-ward-badge {
    display: inline-block;
    font-size: 11px; font-weight: 600; letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--teal);
    background: rgba(50,157,156,0.08);
    border: 1px solid rgba(50,157,156,0.2);
    border-radius: 20px;
    padding: 3px 10px;
  }

  /* ── Fields (shared with ProfileTab) ── */
  .en-fields {
    display: flex; flex-direction: column; gap: 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .en-field-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 0; border-bottom: 1px solid var(--border);
  }
  .en-field-row:last-child { border-bottom: none; }
  .en-icon-wrap {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(50,157,156,0.07);
    border: 1px solid rgba(50,157,156,0.12);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .en-field-icon { color: var(--teal); }
  .en-field-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; color: var(--muted);
    display: block; margin-bottom: 2px;
  }
  .en-field-value { font-size: 14px; font-weight: 500; color: var(--text); display: block; }

  /* ── Stat grid ── */
  .en-stat-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  }
  .en-stat-cell {
    display: flex; flex-direction: column; align-items: center;
    padding: 16px 8px; border-radius: var(--r);
    background: white; border: 1px solid var(--border); gap: 5px;
  }
  .en-stat-num {
    font-size: 30px; font-weight: 600; letter-spacing: -0.5px;
    font-family: 'DM Mono', monospace; line-height: 1;
  }
  .en-stat-label { font-size: 11px; color: var(--muted); font-weight: 500; }

  /* ── Map zone ── */
  .en-map-zone { display: flex; flex-direction: column; gap: 16px; }
  .en-map-empty {
    height: 160px; border-radius: var(--r);
    background: rgba(50,157,156,0.04);
    border: 1.5px dashed var(--border);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    color: var(--muted); font-size: 13px;
  }
  .en-map-empty-icon { opacity: 0.35; }

  .en-map-visual {
    height: 180px; border-radius: var(--r);
    background: linear-gradient(135deg, rgba(50,157,156,0.08), rgba(86,197,150,0.08));
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .en-map-visual::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 60% 40%, rgba(50,157,156,0.12) 0%, transparent 70%);
  }
  .en-map-inner { text-align: center; position: relative; z-index: 1; }
  .en-map-icon { color: var(--teal); margin: 0 auto 8px; }
  .en-map-label { font-size: 14px; font-weight: 600; color: var(--teal-d); margin-bottom: 10px; }
  .en-map-tags { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  .en-map-tag {
    background: rgba(255,255,255,0.85);
    border: 1px solid var(--border);
    border-radius: 6px; padding: 4px 10px;
    font-size: 11px; font-weight: 500; color: var(--teal-d);
    font-family: 'DM Mono', monospace;
  }

  .en-mini-stats {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
  }
  .en-mini-stat {
    background: white; border: 1px solid var(--border);
    border-radius: var(--r); padding: 12px 14px;
    display: flex; flex-direction: column; gap: 3px;
  }
  .en-mini-stat-icon { color: var(--teal); margin-bottom: 2px; }
  .en-mini-stat-val { font-size: 16px; font-weight: 600; color: var(--teal-d); line-height: 1; }
  .en-mini-stat-label { font-size: 11px; color: var(--muted); font-weight: 500; }

  /* ── Records list ── */
  .en-records {
    display: flex; flex-direction: column; gap: 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .en-record-row {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 0; border-bottom: 1px solid var(--border);
  }
  .en-record-row:last-child { border-bottom: none; }
  .en-record-num {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    background: rgba(50,157,156,0.07);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: var(--teal);
    font-family: 'DM Mono', monospace;
  }
  .en-record-body { flex: 1; min-width: 0; }
  .en-record-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .en-record-coords {
    font-size: 11px; color: var(--muted);
    font-family: 'DM Mono', monospace;
  }
  .en-record-date { font-size: 11px; color: var(--muted); flex-shrink: 0; }

  .en-empty-text { font-size: 13px; color: var(--muted); padding: 12px 0; }

  /* ── Footer ── */
  .en-footer {
    text-align: center; font-size: 11px; color: var(--muted);
    font-weight: 500; letter-spacing: 0.3px;
    font-family: 'DM Mono', monospace;
  }
`;