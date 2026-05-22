import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  BarChart3, PieChart as PieChartIcon, Activity,
  Users, AlertCircle, FileText, ClipboardList, User, Bell, Map as MapIcon, CheckSquare
} from 'lucide-react';

// Swap Mapbox for Leaflet (Already installed in your package.json!)
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { wasteApiService } from '../services/wasteApi';
import { useAuth } from '../context/AuthContext';
import { buildFieldCatalog, getFieldLabel, SubmissionRow, SurveyFieldSchema } from '../utils/dynamicSurvey';
import { FloatingTabBar } from './FloatingTabBar';
import { LoadingScreen } from './LoadingScreen';
import { ProfileTab } from './ProfileTab';
import { EnumeratorManagement } from './EnumeratorManagementPanel';
import { EnumeratorsPage } from './EnumeratorsPage';
import { NotificationPanel } from './NotificationPanel';
import { RecordsPage } from './RecordsPage';
import { SurveysManagementPage } from './SurveysManagementPage';
import { WasteSiteRecord } from '../../../types';

// ─── Shared CSS (Restored Original Flat Design) ───────────────────────────────

const dashCss = `
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

  .dash-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }

  /* ── App header ── */
  .dash-appbar {
    position: sticky; top: 0; z-index: 30;
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .dash-appbar-inner {
    max-width: 960px; margin: 0 auto;
    padding: 14px 24px 10px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 10px;
  }
  @media (max-width: 640px) {
    .dash-appbar-inner { padding: 10px 16px; }
  }
  .dash-appbar-right { display: flex; align-items: center; gap: 10px; }
  .dash-profile-btn {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(50,157,156,0.1); border: 1px solid rgba(50,157,156,0.2);
    display: flex; align-items: center; justify-content: center;
    color: var(--teal-d); cursor: pointer; flex-shrink: 0;
    transition: all 0.15s;
  }
  .dash-profile-btn:hover { background: rgba(50,157,156,0.15); border-color: rgba(50,157,156,0.3); }

  .dash-appbar-left { display: flex; align-items: center; gap: 10px; }
  .dash-app-icon {
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .dash-app-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .dash-app-name {
    font-size: 15px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.2px; margin: 0;
  }
  .dash-app-count {
    font-size: 11px; color: var(--teal-l); font-weight: 500;
    font-family: 'DM Mono', monospace; margin: 0;
  }
  .dash-progress-rail {
    max-width: 960px; margin: 0 auto;
    height: 2px; background: var(--foam);
  }
  .dash-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--teal), var(--teal-l));
  }

  /* ── Page body ── */
  .dash-body {
    max-width: 960px; margin: 0 auto;
    padding: 36px 24px 100px;
    display: flex; flex-direction: column; gap: 36px;
  }

  /* ── Section headings ── */
  .dash-section-title {
    font-size: 24px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.5px;
    line-height: 1.2; margin: 0 0 6px 0;
  }
  .dash-section-sub {
    font-size: 14px; color: var(--muted); line-height: 1.5; margin: 0;
  }
  .dash-divider { border: none; border-top: 1px solid var(--border); margin: 0; }

  /* ── KPI row (Original Connected Cells) ── */
  .dash-kpi-row {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 0;
    border: 1px solid var(--border);
    border-radius: var(--r);
    overflow: hidden;
    background: white;
  }
  @media (min-width: 640px) { .dash-kpi-row { grid-template-columns: repeat(4, 1fr); } }
  .dash-kpi-cell {
    padding: 18px 20px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .dash-kpi-cell:nth-child(2n) { border-right: none; }
  @media (min-width: 640px) {
    .dash-kpi-cell { border-bottom: none; }
    .dash-kpi-cell:nth-child(2n) { border-right: 1px solid var(--border); }
    .dash-kpi-cell:last-child { border-right: none; }
  }
  .dash-kpi-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 8px; display: block;
  }
  .dash-kpi-value {
    font-size: 28px; font-weight: 600;
    letter-spacing: -0.5px; line-height: 1;
    font-family: 'DM Mono', monospace;
  }

  /* ── Chart sections (Original Connected Grid) ── */
  .dash-charts-grid {
    display: grid; grid-template-columns: 1fr;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: var(--r);
    overflow: hidden;
    background: white;
  }
  @media (min-width: 720px) { .dash-charts-grid { grid-template-columns: 1fr 1fr; } }

  .dash-chart-panel {
    padding: 24px;
    border-bottom: 1px solid var(--border);
    display: flex; flex-direction: column;
  }
  @media (min-width: 720px) {
    .dash-chart-panel:nth-child(2n-1) { border-right: 1px solid var(--border); }
    /* Select the last row to remove border-bottom */
    .dash-charts-grid:not(.dash-charts-grid--single) .dash-chart-panel:nth-last-child(-n+2) { border-bottom: none; }
  }
  @media (max-width: 719px) {
    .dash-chart-panel:last-child { border-bottom: none; }
  }
  
  .dash-charts-grid--single { grid-template-columns: 1fr !important; }
  .dash-charts-grid--single .dash-chart-panel { border-right: none !important; border-bottom: none !important; }

  .dash-chart-head { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
  .dash-chart-icon-wrap {
    width: 28px; height: 28px; border-radius: 7px;
    background: rgba(50,157,156,0.07);
    border: 1px solid rgba(50,157,156,0.12);
    display: flex; align-items: center; justify-content: center;
    color: var(--teal); flex-shrink: 0;
  }
  .dash-chart-title {
    font-size: 13px; font-weight: 600; color: var(--teal-d); margin: 0;
  }
  .dash-chart-sub {
    font-size: 11px; color: var(--muted); margin: 0;
  }

  /* ── Legend ── */
  .dash-legend { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
  .dash-legend-row {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }
  .dash-legend-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
  .dash-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dash-legend-name {
    font-size: 12px; font-weight: 500; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .dash-legend-val {
    font-size: 12px; font-weight: 600; color: var(--muted);
    font-family: 'DM Mono', monospace; flex-shrink: 0;
  }

  /* ── Bar progress ── */
  .dash-bar-rows { display: flex; flex-direction: column; gap: 12px; }
  .dash-bar-meta { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .dash-bar-name { font-size: 12px; font-weight: 500; color: var(--text); }
  .dash-bar-count { font-size: 12px; font-weight: 600; color: var(--muted); font-family: 'DM Mono', monospace; }
  .dash-bar-track { height: 4px; background: var(--foam); border-radius: 2px; overflow: hidden; }
  .dash-bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }

  /* ── Map Container (Leaflet Fix) ── */
  .dash-map-wrap {
    width: 100%; height: 320px; border-radius: 8px; overflow: hidden;
    border: 1px solid var(--border); background: #eef3f1; position: relative;
  }
  .dash-map-wrap .leaflet-container {
    width: 100%; height: 100%; z-index: 1; /* Keeps map below fixed headers */
  }

  /* ── Dynamic Radial Progress ── */
  .dash-radial-wrap {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    flex: 1; position: relative; min-height: 180px; margin-top: 10px;
  }
  .radial-svg { transform: rotate(-90deg); width: 140px; height: 140px; }
  .radial-bg { fill: none; stroke: var(--border); stroke-width: 10; }
  .radial-progress { 
    fill: none; stroke: url(#tealGradient); stroke-width: 10; 
    stroke-linecap: round; transition: stroke-dashoffset 1s ease-out; 
  }
  .radial-text {
    position: absolute; display: flex; flex-direction: column; align-items: center;
  }
  .radial-percent { font-size: 24px; font-weight: 600; color: var(--teal-d); line-height: 1; font-family: 'DM Mono', monospace; }
  .radial-label { font-size: 11px; color: var(--muted); font-weight: 500; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }

  /* ── Empty ── */
  .dash-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 8px; padding: 40px 0; flex: 1;
    color: var(--muted); font-size: 13px;
  }

  /* ── Loading / Error ── */
  .dash-loader {
    min-height: 100vh; background: var(--bg);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif;
  }
  .dash-error {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 18px; background: #fff5f5;
    border: 1.5px solid #fca5a5; border-radius: var(--r);
    color: #dc2626; font-size: 13px; font-weight: 500;
    max-width: 400px; margin: 0 auto;
  }
`;

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #e2ede8',
      borderRadius: 8, padding: '8px 12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#205072', margin: '0 0 2px 0' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#329D9C', fontFamily: "'DM Mono', monospace", margin: 0 }}>
        {payload[0].value} {payload[0].name === 'value' ? 'entries' : ''}
      </p>
    </div>
  );
};

// ─── Chart panel wrapper ──────────────────────────────────────────────────────

const ChartPanel: React.FC<{
  title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode;
}> = ({ title, subtitle, icon, children }) => (
  <div className="dash-chart-panel">
    <div className="dash-chart-head">
      <div className="dash-chart-icon-wrap">{icon}</div>
      <div>
        <p className="dash-chart-title">{title}</p>
        <p className="dash-chart-sub">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

// ─── Overview tab content ─────────────────────────────────────────────────────

interface FieldCount { name: string; value: number; }

const OverviewContent: React.FC<{
  submissions: SubmissionRow[];
  sharedFormCount: number;
  uniqueEnumerators: number;
  avgAnsweredFields: string;
  catalogLength: number;
  formSubmissionCounts: FieldCount[];
  topFields: FieldCount[];
  topFieldName: string;
  topFieldDistribution: FieldCount[];
  enumeratorActivity: FieldCount[];
  trendField?: string;
  trendSeries?: { date: string; value: number }[];
}> = ({ submissions, sharedFormCount, uniqueEnumerators, avgAnsweredFields, catalogLength, formSubmissionCounts, topFields, topFieldName, topFieldDistribution, enumeratorActivity, trendField, trendSeries }) => {

  const PALETTE = ['#205072', '#329D9C', '#56C596', '#7BE495', '#CFF4D2', '#e2ede8'];

  // Calculate Radial Completeness
  const completionRate = catalogLength > 0 ? Math.min(Math.round((Number(avgAnsweredFields) / catalogLength) * 100), 100) : 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  // Extract map markers cleanly
  const mapMarkers = useMemo(() => submissions.filter(s => s.latitude && s.longitude).map(s => ({
    id: s.id, lat: Number(s.latitude), lng: Number(s.longitude)
  })), [submissions]);

  return (
    <div className="dash-body">

      {/* ── KPI section ── */}
      <section className="dash-section-head">
        <h2 className="dash-section-title">Overview</h2>
        <p className="dash-section-sub">Summary of all collected waste survey data</p>
      </section>

      <hr className="dash-divider" />

      <div className="dash-kpi-row">
        {[
          { label: 'Total Submissions', value: submissions.length, color: 'var(--teal-d)' },
          { label: 'Shared Forms',      value: sharedFormCount,    color: 'var(--teal)' },
          { label: 'Active Enumerators', value: uniqueEnumerators,  color: 'var(--teal-l)' },
          { label: 'Avg Questions',     value: avgAnsweredFields,  color: 'var(--mint)' },
        ].map(k => (
          <div key={k.label} className="dash-kpi-cell">
            <span className="dash-kpi-label">{k.label}</span>
            <span className="dash-kpi-value" style={{ color: k.color }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* ── Charts section ── */}
      <section className="dash-section-head">
        <h2 className="dash-section-title">Analytics</h2>
        <p className="dash-section-sub">Frequency and distribution across survey dimensions</p>
      </section>

      <hr className="dash-divider" />

      {/* First Grid Block: Standard Charts */}
      <div className="dash-charts-grid">

        {/* 1. Form Submissions */}
        <ChartPanel title="Submissions by Form" subtitle="How each shared survey performs" icon={<BarChart3 size={14} />}>
          {formSubmissionCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={formSubmissionCounts} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ede8" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#1c3a2e', fontWeight: 500, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(50,157,156,0.04)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#329D9C" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="dash-empty"><BarChart3 size={24} style={{ opacity: 0.2 }} />No data</div>}
        </ChartPanel>

        {/* 2. Trend Area Chart */}
        <ChartPanel title={trendField ? `Trend — ${trendField}` : 'Trend'} subtitle="Daily average values" icon={<Activity size={14} />}>
          {trendSeries && trendSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendSeries} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#329D9C" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#329D9C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f1ed" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7a9a8a' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: '#7a9a8a', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#329D9C" strokeWidth={2} fill="url(#tealGradient)" activeDot={{ r: 4, fill: '#205072' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="dash-empty"><Activity size={24} style={{ opacity: 0.2 }} />No trend data</div>}
        </ChartPanel>

        {/* 3. Top responses (Pie) */}
        <ChartPanel title={`Top responses for ${topFieldName || 'survey field'}`} subtitle="Most common survey answers" icon={<PieChartIcon size={14} />}>
          {topFieldDistribution.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={topFieldDistribution} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {topFieldDistribution.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-legend">
                {topFieldDistribution.map((item, i) => (
                  <div key={i} className="dash-legend-row">
                    <div className="dash-legend-left">
                      <div className="dash-legend-dot" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="dash-legend-name">{item.name}</span>
                    </div>
                    <span className="dash-legend-val">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="dash-empty"><PieChartIcon size={24} style={{ opacity: 0.2 }} />No data</div>}
        </ChartPanel>

        {/* 4. Most answered fields (Horizontal to avoid slanted labels) */}
        <ChartPanel title="Most answered fields" subtitle="Survey questions with the most responses" icon={<FileText size={14} />}>
          {topFields.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topFields} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ede8" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#1c3a2e', fontWeight: 500, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(50,157,156,0.04)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                  {topFields.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="dash-empty"><FileText size={24} style={{ opacity: 0.2 }} />No data</div>}
        </ChartPanel>

        {/* 5. Enumerator Activity (HTML Bars) */}
        <ChartPanel title="Enumerator activity" subtitle="Submissions added by team members" icon={<Users size={14} />}>
          {enumeratorActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="dash-bar-rows">
                {(() => {
                  const max = Math.max(...enumeratorActivity.map((s) => s.value));
                  return enumeratorActivity.map((item, i) => (
                    <div key={i} className="dash-bar-row">
                      <div className="dash-bar-meta">
                        <span className="dash-bar-name">{item.name}</span>
                        <span className="dash-bar-count">{item.value}</span>
                      </div>
                      <div className="dash-bar-track">
                        <div
                          className="dash-bar-fill"
                          style={{ width: `${(item.value / max) * 100}%`, background: PALETTE[i % PALETTE.length] }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : <div className="dash-empty"><Users size={24} style={{ opacity: 0.2 }} />No data</div>}
        </ChartPanel>

        {/* 6. Data Completeness Radial */}
        <ChartPanel title="Data Completeness" subtitle="Avg fields filled per survey" icon={<CheckSquare size={14} />}>
          <div className="dash-radial-wrap">
            <svg className="radial-svg" viewBox="0 0 140 140">
              <defs>
                <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#56C596" />
                  <stop offset="100%" stopColor="#329D9C" />
                </linearGradient>
              </defs>
              <circle className="radial-bg" cx="70" cy="70" r={radius} />
              <circle 
                className="radial-progress" 
                cx="70" cy="70" r={radius} 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
              />
            </svg>
            <div className="radial-text">
              <span className="radial-percent">{completionRate}%</span>
              <span className="radial-label">Completed</span>
            </div>
          </div>
        </ChartPanel>
      </div>

      {/* Second Grid Block: Full Width Leaflet Map */}
      <div className="dash-charts-grid dash-charts-grid--single" style={{ marginTop: 24 }}>
        <ChartPanel title="Geospatial Distribution" subtitle="Live map monitoring of collected coordinates" icon={<MapIcon size={14} />}>
          <div className="dash-map-wrap">
            {mapMarkers.length > 0 ? (
              <MapContainer 
                center={[mapMarkers[0].lat, mapMarkers[0].lng]} 
                zoom={11} 
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/attributions">CartoDB</a>'
                />
                {mapMarkers.map((marker, i) => (
                  <CircleMarker 
                    key={i} 
                    center={[marker.lat, marker.lng]} 
                    radius={6} 
                    pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#329D9C', fillOpacity: 1 }} 
                  />
                ))}
              </MapContainer>
            ) : (
              <div className="dash-empty"><MapIcon size={24} style={{ opacity: 0.2 }} />No geospatial data collected yet</div>
            )}
          </div>
        </ChartPanel>
      </div>

    </div>
  );
};

// ─── Main Admin Component ──────────────────────────────────────────────────────

export const AdminDashboard: React.FC = () => {
  const { currentProjectId } = useAuth();
  const [records, setRecords] = useState<SubmissionRow[]>([]);
  const [fieldSchemas, setFieldSchemas] = useState<SurveyFieldSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('overview');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  // States for Analytics
  const [sharedFormCount, setSharedFormCount] = useState(0);
  const [uniqueEnumerators, setUniqueEnumerators] = useState(0);
  const [avgAnsweredFields, setAvgAnsweredFields] = useState('0');
  const [formSubmissionCounts, setFormSubmissionCounts] = useState<FieldCount[]>([]);
  const [topFields, setTopFields] = useState<FieldCount[]>([]);
  const [topFieldName, setTopFieldName] = useState('');
  const [topFieldDistribution, setTopFieldDistribution] = useState<FieldCount[]>([]);
  const [enumeratorActivity, setEnumeratorActivity] = useState<FieldCount[]>([]);
  const [trendField, setTrendField] = useState<string | undefined>(undefined);
  const [trendSeries, setTrendSeries] = useState<{ date: string; value: number }[]>([]);

  const wasteSiteRecords = useMemo(() => records.map((record) => ({
    ...record, ...record.response_data, latitude: record.latitude, longitude: record.longitude,
  })) as unknown as WasteSiteRecord[], [records]);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        if (!currentProjectId) {
          setError('No project selected. Please select a project from the project switcher.');
          setRecords([]); return;
        }

        const forms = await wasteApiService.getSharedForms(currentProjectId);
        if (!forms || forms.length === 0) {
          setError('No forms shared with this project yet. Create and share a form to see data.');
          setRecords([]); return;
        }

        const catalog = buildFieldCatalog(forms);
        setFieldSchemas(catalog);

        const submissionsByForm = await Promise.all(
          forms.map((f: any) => wasteApiService.getSurveySubmissions(f.id, undefined, currentProjectId))
        );
        const mergedSubmissions = submissionsByForm.flat().filter((s: any) => String(s.project_id) === String(currentProjectId));

        if (mergedSubmissions.length === 0) {
          setError('No survey submissions found for this project.');
          setRecords([]); return;
        }

        const mappedRecords: SubmissionRow[] = mergedSubmissions.map((s: any) => ({
          ...s,
          survey_title: forms.find((f: any) => Number(f.id) === Number(s.survey_id))?.title || `Survey ${s.survey_id}`,
          response_data: s.response_data || {},
        }));

        setRecords(mappedRecords);
        analyzeData(forms, mergedSubmissions, catalog);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentProjectId]);

  const analyzeData = (forms: any[], submissions: any[], catalog: SurveyFieldSchema[]) => {
    setSharedFormCount(forms.length);

    // Form Submission Counts
    const formCountsMap = new Map<string, number>();
    submissions.forEach(s => {
      const title = forms.find(f => Number(f.id) === Number(s.survey_id))?.title || `Survey ${s.survey_id}`;
      formCountsMap.set(title, (formCountsMap.get(title) || 0) + 1);
    });
    
    // Type-safe mapping
    const formSubmissionCountsList: FieldCount[] = [];
    formCountsMap.forEach((value, name) => {
      formSubmissionCountsList.push({ name, value });
    });
    formSubmissionCountsList.sort((a, b) => b.value - a.value);
    setFormSubmissionCounts(formSubmissionCountsList);

    const enumeratorEmailSet = new Set<string>();
    const enumeratorCounts = new Map<string, number>();
    let totalAnswered = 0;
    const fieldValueMap = new Map<string, Map<string, number>>();
    const fieldCountMap = new Map<string, number>();

    submissions.forEach((submission) => {
      const enumerator = submission.enumerator_email || 'Unknown';
      enumeratorEmailSet.add(enumerator);
      enumeratorCounts.set(enumerator, (enumeratorCounts.get(enumerator) || 0) + 1);

      const data = submission.response_data || {};
      const answeredKeys = Object.keys(data).filter(key => data[key] !== null && data[key] !== '' && data[key] !== undefined);
      totalAnswered += answeredKeys.length;

      answeredKeys.forEach((key) => {
        fieldCountMap.set(key, (fieldCountMap.get(key) || 0) + 1);
        let value = data[key];
        if (Array.isArray(value)) value = value.join(', ');
        const normalized = `${value}`.trim() || 'Unknown';

        if (!fieldValueMap.has(key)) fieldValueMap.set(key, new Map());
        const valuesForField = fieldValueMap.get(key)!;
        valuesForField.set(normalized, (valuesForField.get(normalized) || 0) + 1);
      });
    });

    setUniqueEnumerators(enumeratorEmailSet.size);
    setAvgAnsweredFields(submissions.length ? (totalAnswered / submissions.length).toFixed(1) : '0');

    const enumeratorActivityList: FieldCount[] = [];
    enumeratorCounts.forEach((value, name) => {
      enumeratorActivityList.push({ name, value });
    });
    enumeratorActivityList.sort((a, b) => b.value - a.value);
    setEnumeratorActivity(enumeratorActivityList);

    const topFieldsComputed: { key: string; name: string; value: number }[] = [];
    fieldCountMap.forEach((value, key) => {
      topFieldsComputed.push({ key, name: getFieldLabel(key, undefined, catalog), value });
    });
    topFieldsComputed.sort((a, b) => b.value - a.value);
    const top5Fields = topFieldsComputed.slice(0, 5);
    setTopFields(top5Fields.map(item => ({ name: item.name, value: item.value })));

    const activeFieldKey = top5Fields[0]?.key || '';
    setTopFieldName(top5Fields[0]?.name || '');

    const activeMap = activeFieldKey ? fieldValueMap.get(activeFieldKey) : null;
    const distributionList: FieldCount[] = [];
    if (activeMap) {
      activeMap.forEach((value, name) => {
        distributionList.push({ name, value });
      });
      distributionList.sort((a, b) => b.value - a.value);
    }
    setTopFieldDistribution(distributionList.slice(0, 6));

    const numericFieldKeys = catalog.filter(f => ['number', 'slider'].includes(f.type)).map(f => f.name);
    const chosenFieldKey = numericFieldKeys.find(key => submissions.some(s => s.response_data?.[key] && !isNaN(Number(s.response_data[key])))) || activeFieldKey;

    setTrendField(chosenFieldKey ? getFieldLabel(chosenFieldKey, undefined, catalog) : undefined);

    if (chosenFieldKey) {
      const dateMap = new Map<string, { sum: number; count: number }>();
      submissions.forEach((s: any) => {
        const raw = s.response_data?.[chosenFieldKey];
        const num = Number(raw);
        const dateKey = s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        const current = dateMap.get(dateKey) || { sum: 0, count: 0 };
        if (!isNaN(num)) { current.sum += num; current.count += 1; }
        dateMap.set(dateKey, current);
      });
      
      const trendSeriesList: { date: string; value: number }[] = [];
      dateMap.forEach((data, date) => {
        trendSeriesList.push({ date, value: data.count ? +(data.sum / data.count).toFixed(2) : 0 });
      });
      trendSeriesList.sort((a, b) => a.date.localeCompare(b.date));
      setTrendSeries(trendSeriesList);
    } else {
      setTrendSeries([]);
    }
  };

  if (loading) return <LoadingScreen />;

  if (error) return (
    <>
      <style>{dashCss}</style>
      <div className="dash-loader">
        <div className="dash-error"><AlertCircle size={16} />{error}</div>
      </div>
    </>
  );

  return (
    <>
      <style>{dashCss}</style>
      <div className="dash-root">
        
        <header className="dash-appbar">
          <div className="dash-appbar-inner">
            <div className="dash-appbar-left">
              <div className="dash-app-icon">
                <img src="/images/Asset%201.svg" alt="GeoKollect logo" className="dash-app-logo" />
              </div>
              <div>
                <p className="dash-app-name">GeoKollect Admin</p>
                <p className="dash-app-count">{records.length} records</p>
              </div>
            </div>
            <div className="dash-appbar-right">
              <button
                className="dash-profile-btn"
                onClick={() => setNotificationPanelOpen(true)}
                title="Notifications"
                style={{ marginRight: 6 }}
              >
                <Bell size={16} />
              </button>
              <button
                className="dash-profile-btn"
                onClick={() => setCurrentPage('profile')}
                title="Profile"
              >
                <User size={16} />
              </button>
            </div>
          </div>
          <div className="dash-progress-rail">
            <div className="dash-progress-fill" style={{ width: '100%' }} />
          </div>
        </header>

        <NotificationPanel isOpen={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} />

        <FloatingTabBar
          tabs={[
            {
              id: 'overview', label: 'Overview', icon: <BarChart3 size={20} />,
              content: (
                <OverviewContent
                  submissions={records}
                  sharedFormCount={sharedFormCount}
                  uniqueEnumerators={uniqueEnumerators}
                  avgAnsweredFields={avgAnsweredFields}
                  catalogLength={fieldSchemas.length}
                  formSubmissionCounts={formSubmissionCounts}
                  topFields={topFields}
                  topFieldName={topFieldName}
                  topFieldDistribution={topFieldDistribution}
                  enumeratorActivity={enumeratorActivity}
                  trendField={trendField}
                  trendSeries={trendSeries}
                />
              ),
            },
            {
              id: 'records', label: 'Records', icon: <FileText size={20} />,
              content: <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px 100px' }}><RecordsPage records={records} fieldSchemas={fieldSchemas} dynamicFields={topFields} /></div>,
            },
            {
              id: 'enumerators', label: 'Team', icon: <Users size={20} />,
              content: <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px 100px' }}><EnumeratorManagement /><hr className="dash-divider" style={{ margin: '32px 0' }} /><EnumeratorsPage sites={wasteSiteRecords} /></div>,
            },
            {
              id: 'surveys', label: 'Surveys', icon: <ClipboardList size={20} />,
              content: <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px 100px' }}><SurveysManagementPage /></div>,
            },
            {
              id: 'profile', label: 'Profile', icon: <User size={20} />, visible: false,
              content: <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px 100px' }}><ProfileTab /></div>,
            },
          ]}
          currentTab={currentPage}
          onTabChange={setCurrentPage}
        />
      </div>
    </>
  );
};