import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import { AlertTriangle, Loader2, X, Layers } from 'lucide-react';
import L from 'leaflet';
import { WasteSiteRecord } from '../../../types';
import { wasteApiService } from '../services/wasteApi';
import { useNotification } from '../context/NotificationContext';

// ─── Leaflet icon fix ─────────────────────────────────────────────────────────

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom SVG pin — teal, matches system palette
const makePinIcon = (color: string) => L.divIcon({
  className: '',
  iconAnchor: [12, 32],
  popupAnchor: [0, -34],
  html: `
    <svg width="24" height="34" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22S24 21 24 12C24 5.373 18.627 0 12 0z"
        fill="${color}" />
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`,
});

const ICONS: Record<string, L.DivIcon> = {
  Formal:     makePinIcon('#205072'),
  Informal:   makePinIcon('#329D9C'),
  'Peri-urban': makePinIcon('#56C596'),
  default:    makePinIcon('#7a9a8a'),
};

const getIcon = (type: string) => ICONS[type] ?? ICONS.default;

// ─── Kilifi Municipality Boundary ──────────────────────────────────────────────

const KILIFI_BOUNDARY: [number, number][] = [
  [-2.65, 39.25],
  [-2.70, 39.45],
  [-2.75, 39.60],
  [-2.80, 39.75],
  [-2.85, 39.90],
  [-2.90, 40.10],
  [-3.05, 40.20],
  [-3.25, 40.25],
  [-3.45, 40.20],
  [-3.60, 40.10],
  [-3.70, 39.95],
  [-3.75, 39.75],
  [-3.78, 39.50],
  [-3.75, 39.30],
  [-3.60, 39.20],
  [-3.40, 39.15],
  [-3.20, 39.12],
  [-3.00, 39.15],
  [-2.80, 39.20],
  [-2.65, 39.25],
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapProps {
  onMarkerClick?: (record: WasteSiteRecord) => void;
  onClose?: () => void;
  hideHeader?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatList = (val: string | string[] | undefined): string[] => {
  if (!val) return [];
  const str = Array.isArray(val) ? val.join(',') : val;
  return str.split(',').map(s => s.trim()).filter(Boolean);
};

// ─── Component ────────────────────────────────────────────────────────────────

export const WasteMap: React.FC<MapProps> = ({ onMarkerClick, onClose, hideHeader = false }) => {
  const [sites, setSites]           = useState<WasteSiteRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selected, setSelected]     = useState<WasteSiteRecord | null>(null);
  const { showError }               = useNotification();

  const mapCenterLat = parseFloat(process.env.REACT_APP_MAP_CENTER_LAT || '-3.2869');
  const mapCenterLng = parseFloat(process.env.REACT_APP_MAP_CENTER_LNG || '39.6568');
  const mapZoom      = parseInt(process.env.REACT_APP_MAP_ZOOM || '13');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { records } = await wasteApiService.getAllWasteSites(1000, 0);
        setSites(records);
        setError(null);
      } catch (err: any) {
        const msg = err.message || 'Failed to load waste sites';
        setError(msg);
        showError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [showError]);

  const handleMarker = (site: WasteSiteRecord) => {
    setSelected(site);
    onMarkerClick?.(site);
  };

  return (
    <>
      <style>{css}</style>
      <div className="wm-root">

        {/* ── Sticky header ── */}
        {!hideHeader && (
          <header className="wm-header">
            <div className="wm-header-inner">
              <div>
                <p className="wm-eyebrow">Spatial data</p>
                <h1 className="wm-title">Waste Site Map</h1>
              </div>
              <div className="wm-header-right">
                <div className="wm-legend">
                  {[
                    { label: 'Formal',      color: '#205072' },
                    { label: 'Informal',    color: '#329D9C' },
                    { label: 'Peri-urban',  color: '#56C596' },
                  ].map(item => (
                    <div key={item.label} className="wm-legend-item">
                      <div className="wm-legend-dot" style={{ background: item.color }} />
                      <span className="wm-legend-label">{item.label}</span>
                    </div>
                  ))}
                </div>
                {onClose && (
                  <button className="wm-close-btn" onClick={onClose} aria-label="Close map">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="wm-progress-rail">
              <div className="wm-progress-fill" style={{ width: '100%' }} />
            </div>
          </header>
        )}

        {/* ── Map area ── */}
        <div className="wm-map-wrap">

          {/* Loading chip */}
          {loading && (
            <div className="wm-loading-chip">
              <Loader2 size={13} className="wm-spin" />
              <span>Loading sites…</span>
            </div>
          )}

          {/* Site count chip */}
          {!loading && (
            <div className="wm-count-chip">
              <Layers size={12} />
              <span>{sites.length} sites</span>
            </div>
          )}

          <MapContainer
            center={[mapCenterLat, mapCenterLng]}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            
            {/* Kilifi Municipality Boundary */}
            <Polygon
              positions={KILIFI_BOUNDARY}
              pathOptions={{
                color: '#329D9C',
                weight: 2,
                opacity: 0.7,
                fill: true,
                fillColor: '#56C596',
                fillOpacity: 0.08,
                dashArray: '5, 5',
              }}
            />
            
            {sites.map(site => (
              <Marker
                key={site.id}
                position={[site.latitude, site.longitude]}
                icon={getIcon(site.settlement_type)}
                eventHandlers={{ click: () => handleMarker(site) }}
              >
                <Popup className="wm-popup-wrap">
                  <div className="wm-popup">
                    <p className="wm-popup-ward">{site.ward}</p>
                    <p className="wm-popup-meta">{site.settlement_type} · {site.disposal_method}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* ── Error bar ── */}
        {error && (
          <div className="wm-error-bar">
            <AlertTriangle size={13} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Detail modal ── */}
        {selected && (
          <div className="wm-overlay" onClick={() => setSelected(null)}>
            <div className="wm-modal" onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div className="wm-modal-header">
                <div className="wm-modal-header-inner">
                  <div>
                    <p className="wm-modal-eyebrow">Waste site</p>
                    <h2 className="wm-modal-title">{selected.ward}</h2>
                  </div>
                  <button className="wm-modal-close" onClick={() => setSelected(null)} aria-label="Close">
                    <X size={14} />
                  </button>
                </div>
                <div className="wm-modal-progress">
                  <div className="wm-modal-progress-fill" />
                </div>
              </div>

              {/* Modal body */}
              <div className="wm-modal-body">

                <section>
                  <h3 className="wm-modal-section-title">Location</h3>
                  <p className="wm-modal-section-sub">
                    {(+selected.latitude).toFixed(5)}°, {(+selected.longitude).toFixed(5)}°
                  </p>
                </section>

                <hr className="wm-modal-divider" />

                {/* Detail field rows */}
                <div className="wm-detail-fields">
                  {[
                    { label: 'Settlement',   value: selected.settlement_type },
                    { label: 'Disposal',     value: selected.disposal_method },
                    { label: 'Household',    value: selected.household_size },
                    { label: 'Quantity',     value: selected.waste_quantity },
                    { label: 'Collection',   value: selected.collection_frequency },
                    { label: 'Road Access',  value: selected.road_access },
                    { label: 'Flood Risk',   value: selected.flooding },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className="wm-detail-row">
                      <span className="wm-detail-label">{f.label}</span>
                      <span className="wm-detail-value">{f.value}</span>
                    </div>
                  ))}
                </div>

                {/* Waste types chips */}
                {formatList(selected.waste_types as any).length > 0 && (
                  <>
                    <hr className="wm-modal-divider" />
                    <section>
                      <h3 className="wm-modal-section-title" style={{ fontSize: 13, marginBottom: 10 }}>Waste Types</h3>
                      <div className="wm-chips">
                        {formatList(selected.waste_types as any).map(t => (
                          <span key={t} className="wm-chip wm-chip--teal">{t}</span>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {/* Impact chips */}
                {formatList(selected.impacts as any).length > 0 && (
                  <>
                    <hr className="wm-modal-divider" />
                    <section>
                      <h3 className="wm-modal-section-title" style={{ fontSize: 13, marginBottom: 10 }}>Observed Impacts</h3>
                      <div className="wm-chips">
                        {formatList(selected.impacts as any).map(t => (
                          <span key={t} className="wm-chip wm-chip--red">{t}</span>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {/* Date */}
                {selected.created_at && (
                  <p className="wm-modal-date">
                    Recorded {new Date(selected.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
  @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

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

  .wm-root {
    display: flex; flex-direction: column;
    height: 100%; min-height: 100%;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    background: var(--bg);
  }

  /* ── Header ── */
  .wm-header {
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .wm-header-inner {
    max-width: 960px; margin: 0 auto;
    padding: 14px 20px 10px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .wm-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal); margin-bottom: 3px;
  }
  .wm-title {
    font-size: 19px; font-weight: 600; color: var(--teal-d); letter-spacing: -0.3px;
  }
  .wm-header-right { display: flex; align-items: center; gap: 12px; }
  .wm-legend {
    display: none;
    align-items: center; gap: 14px;
    padding: 6px 14px; border-radius: 20px;
    background: white; border: 1px solid var(--border);
  }
  @media (min-width: 480px) { .wm-legend { display: flex; } }
  .wm-legend-item { display: flex; align-items: center; gap: 6px; }
  .wm-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .wm-legend-label { font-size: 11.5px; font-weight: 500; color: var(--text); }
  .wm-close-btn {
    width: 30px; height: 30px; border-radius: 50%;
    border: 1.5px solid var(--border); background: transparent;
    color: var(--muted); cursor: pointer; display: flex;
    align-items: center; justify-content: center; transition: all 0.15s;
  }
  .wm-close-btn:hover { border-color: #fca5a5; color: #dc2626; }
  .wm-progress-rail { max-width: 960px; margin: 0 auto; height: 2px; background: var(--foam); }
  .wm-progress-fill { height: 100%; background: linear-gradient(90deg, var(--teal), var(--teal-l)); }

  /* ── Map ── */
  .wm-map-wrap {
    flex: 1; position: relative;
    min-height: 400px;
  }
  .wm-map-wrap .leaflet-container { height: 100%; width: 100%; }

  /* Floating chips over map */
  .wm-loading-chip,
  .wm-count-chip {
    position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
    z-index: 1000;
    display: flex; align-items: center; gap: 7px;
    padding: 7px 14px; border-radius: 20px;
    background: rgba(246,251,248,0.95);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border);
    font-size: 12px; font-weight: 600; color: var(--teal-d);
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    white-space: nowrap;
  }

  /* Popup */
  .wm-popup-wrap .leaflet-popup-content-wrapper {
    border-radius: 10px !important;
    border: 1px solid var(--border) !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
    padding: 0 !important;
  }
  .wm-popup-wrap .leaflet-popup-content { margin: 0 !important; }
  .wm-popup-wrap .leaflet-popup-tip { background: white !important; }
  .wm-popup {
    padding: 10px 14px;
    font-family: 'DM Sans', sans-serif;
  }
  .wm-popup-ward {
    font-size: 13px; font-weight: 600; color: var(--teal-d);
    margin-bottom: 3px;
  }
  .wm-popup-meta { font-size: 11px; color: var(--muted); }

  /* ── Error bar ── */
  .wm-error-bar {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 20px; flex-shrink: 0;
    background: #fff5f5; border-top: 1px solid #fca5a5;
    font-size: 12.5px; font-weight: 500; color: #dc2626;
  }

  /* ── Modal overlay ── */
  .wm-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(28,58,46,0.45);
    backdrop-filter: blur(4px);
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0;
  }
  @media (min-width: 540px) {
    .wm-overlay { align-items: center; padding: 24px; }
  }

  /* ── Modal panel ── */
  .wm-modal {
    background: var(--bg);
    width: 100%; max-width: 480px;
    border-radius: 16px 16px 0 0;
    overflow: hidden;
    max-height: 88vh;
    display: flex; flex-direction: column;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.12);
  }
  @media (min-width: 540px) {
    .wm-modal { border-radius: 16px; box-shadow: 0 16px 60px rgba(0,0,0,0.15); }
  }

  /* Modal header */
  .wm-modal-header {
    background: rgba(246,251,248,0.96);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .wm-modal-header-inner {
    padding: 16px 20px 12px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .wm-modal-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal); margin-bottom: 3px;
  }
  .wm-modal-title {
    font-size: 18px; font-weight: 600; color: var(--teal-d); letter-spacing: -0.3px;
  }
  .wm-modal-close {
    width: 30px; height: 30px; border-radius: 50%;
    border: 1.5px solid var(--border); background: transparent;
    color: var(--muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0;
  }
  .wm-modal-close:hover { border-color: #fca5a5; color: #dc2626; }
  .wm-modal-progress { height: 2px; background: var(--foam); }
  .wm-modal-progress-fill { height: 100%; width: 100%; background: linear-gradient(90deg, var(--teal), var(--teal-l)); }

  /* Modal body */
  .wm-modal-body {
    flex: 1; overflow-y: auto;
    padding: 28px 20px 32px;
    display: flex; flex-direction: column; gap: 20px;
  }
  .wm-modal-section-title {
    font-size: 20px; font-weight: 600; color: var(--teal-d);
    letter-spacing: -0.4px; margin-bottom: 4px;
  }
  .wm-modal-section-sub {
    font-size: 13px; color: var(--muted);
    font-family: 'DM Mono', monospace;
  }
  .wm-modal-divider { border: none; border-top: 1px solid var(--border); }

  /* Detail field rows — same as ProfileTab pattern */
  .wm-detail-fields {
    display: flex; flex-direction: column; gap: 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .wm-detail-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 0; border-bottom: 1px solid var(--border);
  }
  .wm-detail-row:last-child { border-bottom: none; }
  .wm-detail-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; color: var(--muted);
  }
  .wm-detail-value {
    font-size: 13px; font-weight: 500; color: var(--text);
  }

  /* Chips */
  .wm-chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .wm-chip {
    padding: 5px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 500;
    border: 1.5px solid;
  }
  .wm-chip--teal {
    color: var(--teal); background: rgba(50,157,156,0.07);
    border-color: rgba(50,157,156,0.2);
  }
  .wm-chip--red {
    color: #dc2626; background: #fff5f5;
    border-color: #fca5a5;
  }

  .wm-modal-date {
    font-size: 11px; color: var(--muted);
    text-align: center;
    font-family: 'DM Mono', monospace;
  }

  /* Spinner */
  .wm-spin { animation: _spin 0.7s linear infinite; color: var(--teal); }
  @keyframes _spin { to { transform: rotate(360deg); } }
`;