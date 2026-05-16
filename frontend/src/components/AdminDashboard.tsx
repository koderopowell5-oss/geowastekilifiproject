import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts';
import {
  BarChart3, PieChart as PieChartIcon, Download,
  Users, AlertCircle, FileText, Settings, ClipboardList,
} from 'lucide-react';
import { wasteApiService } from '../services/wasteApi';
import { WasteSiteRecord } from '../../../types';
import { FloatingTabBar } from './FloatingTabBar';
import { ProfileTab } from './ProfileTab';
import { EnumeratorManagement } from './EnumeratorManagementPanel';
import { RecordsPage } from './RecordsPage';
import { SurveysManagementPage } from './SurveysManagementPage';

// ─── Shared CSS ───────────────────────────────────────────────────────────────

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
  }
  .dash-appbar-left { display: flex; align-items: center; gap: 10px; }
  .dash-app-icon {
    width: 34px; height: 34px; border-radius: 9px;
    background: var(--teal-d);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .dash-app-name {
    font-size: 15px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.2px;
  }
  .dash-app-count {
    font-size: 11px; color: var(--teal-l); font-weight: 500;
    font-family: 'DM Mono', monospace;
  }
  .dash-export-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 20px;
    border: 1.5px solid var(--border);
    background: transparent; color: var(--muted);
    font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  .dash-export-btn:hover { border-color: var(--teal-d); color: var(--teal-d); }
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
  .dash-section-head { }
  .dash-section-title {
    font-size: 24px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.5px;
    line-height: 1.2; margin-bottom: 6px;
  }
  .dash-section-sub {
    font-size: 14px; color: var(--muted); line-height: 1.5;
  }
  .dash-divider { border: none; border-top: 1px solid var(--border); }

  /* ── KPI row ── */
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

  /* ── Chart sections ── */
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
  }
  @media (min-width: 720px) {
    .dash-chart-panel:nth-child(2n-1) { border-right: 1px solid var(--border); }
    .dash-chart-panel:nth-last-child(-n+2) { border-bottom: none; }
  }
  @media (max-width: 719px) {
    .dash-chart-panel:last-child { border-bottom: none; }
  }

  .dash-chart-head { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
  .dash-chart-icon-wrap {
    width: 28px; height: 28px; border-radius: 7px;
    background: rgba(50,157,156,0.07);
    border: 1px solid rgba(50,157,156,0.12);
    display: flex; align-items: center; justify-content: center;
    color: var(--teal); flex-shrink: 0;
  }
  .dash-chart-title {
    font-size: 13px; font-weight: 600; color: var(--teal-d);
  }
  .dash-chart-sub {
    font-size: 11px; color: var(--muted);
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
  .dash-bar-row {}
  .dash-bar-meta { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .dash-bar-name { font-size: 12px; font-weight: 500; color: var(--text); }
  .dash-bar-count { font-size: 12px; font-weight: 600; color: var(--muted); font-family: 'DM Mono', monospace; }
  .dash-bar-track {
    height: 4px; background: var(--foam); border-radius: 2px; overflow: hidden;
  }
  .dash-bar-fill {
    height: 100%; border-radius: 2px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Empty ── */
  .dash-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 8px; padding: 40px 0;
    color: var(--muted); font-size: 13px;
  }

  /* ── Loading / Error ── */
  .dash-loader {
    min-height: 100vh; background: var(--bg);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif;
  }
  .dash-loader-inner { text-align: center; }
  .dash-loader-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: rgba(50,157,156,0.08);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px; color: var(--teal);
  }
  .dash-loader-text { font-size: 13px; color: var(--muted); font-weight: 500; }
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
      <p style={{ fontSize: 12, fontWeight: 600, color: '#205072', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#329D9C', fontFamily: "'DM Mono', monospace" }}>
        {payload[0].value}
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

const OverviewContent: React.FC<{
  sites: WasteSiteRecord[];
  wasteByType: any[]; disposalMethods: any[];
  wardDistribution: any[]; settlementTypes: any[];
  calculateAvgHousehold: (d: WasteSiteRecord[]) => string;
}> = ({ sites, wasteByType, disposalMethods, wardDistribution, settlementTypes, calculateAvgHousehold }) => {

  const PALETTE = ['#205072', '#329D9C', '#56C596', '#7BE495', '#CFF4D2'];

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
          { label: 'Total Records',     value: sites.length,                                          color: 'var(--teal-d)' },
          { label: 'Unique Wards',      value: new Set(sites.map(s => s.ward)).size,                  color: 'var(--teal)' },
          { label: 'Settlement Types',  value: new Set(sites.map(s => s.settlement_type)).size,       color: 'var(--teal-l)' },
          { label: 'Avg Household',     value: calculateAvgHousehold(sites),                          color: 'var(--mint)' },
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

      <div className="dash-charts-grid">

        {/* Waste Types — horizontal bar */}
        <ChartPanel title="Waste Types" subtitle="Frequency across surveys" icon={<BarChart3 size={14} />}>
          {wasteByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={wasteByType} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ede8" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#7a9a8a', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#1c3a2e', fontWeight: 500, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} width={62} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(50,157,156,0.04)' }} />
                <Bar dataKey="value" radius={[0, 5, 5, 0]} fill="#329D9C" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="dash-empty"><BarChart3 size={24} style={{ opacity: 0.2 }} />No data</div>}
        </ChartPanel>

        {/* Disposal Methods — donut + legend */}
        <ChartPanel title="Disposal Methods" subtitle="Distribution by method" icon={<PieChartIcon size={14} />}>
          {disposalMethods.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={disposalMethods} cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    dataKey="value" paddingAngle={3}
                  >
                    {disposalMethods.map((_e, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-legend">
                {disposalMethods.map((item, i) => (
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

        {/* Ward Distribution — vertical bar */}
        <ChartPanel title="Ward Distribution" subtitle="Records per ward" icon={<FileText size={14} />}>
          {wardDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={wardDistribution} margin={{ left: -10, right: 0, top: 4, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ede8" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#1c3a2e', fontWeight: 500, fontFamily: 'DM Sans' }}
                  axisLine={false} tickLine={false}
                  angle={-30} textAnchor="end" height={40}
                />
                <YAxis tick={{ fontSize: 10, fill: '#7a9a8a', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(50,157,156,0.04)' }} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {wardDistribution.map((_e, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="dash-empty"><FileText size={24} style={{ opacity: 0.2 }} />No data</div>}
        </ChartPanel>

        {/* Settlement Types — inline bar rows */}
        <ChartPanel title="Settlement Types" subtitle="Breakdown by category" icon={<Users size={14} />}>
          {settlementTypes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <ResponsiveContainer width="100%" height={140}>
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius={24} outerRadius={68}
                  data={settlementTypes.map((d: any, i: number) => ({ ...d, fill: PALETTE[i % PALETTE.length] }))}
                  startAngle={90} endAngle={-270}
                >
                  <RadialBar dataKey="value" background={{ fill: '#f6fbf8' }} cornerRadius={5} />
                  <Tooltip content={<CustomTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="dash-bar-rows">
                {(() => {
                  const max = Math.max(...settlementTypes.map((s: any) => s.value));
                  return settlementTypes.map((item: any, i: number) => (
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

      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const AdminDashboard: React.FC = () => {
  const [sites, setSites] = useState<WasteSiteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('overview');

  const [wasteByType, setWasteByType]           = useState<any[]>([]);
  const [disposalMethods, setDisposalMethods]   = useState<any[]>([]);
  const [wardDistribution, setWardDistribution] = useState<any[]>([]);
  const [settlementTypes, setSettlementTypes]   = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { records } = await wasteApiService.getAllWasteSites(1000, 0);
        setSites(records);
        analyzeData(records);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const analyzeData = (data: WasteSiteRecord[]) => {
    const count = <T extends string>(arr: T[]) => {
      const m = new Map<string, number>();
      arr.forEach(v => m.set(v, (m.get(v) || 0) + 1));
      return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    };

    const types: string[] = [];
    data.forEach(s => {
      const raw = s.waste_types as string | string[] | undefined;
      const t = typeof raw === 'string' ? raw.split(',') : Array.isArray(raw) ? raw : [];
      t.forEach(x => { if (x.trim()) types.push(x.trim()); });
    });
    setWasteByType(count(types));
    setDisposalMethods(count(data.map(s => s.disposal_method || 'Unknown')));
    setWardDistribution(count(data.map(s => s.ward || 'Unknown')));
    setSettlementTypes(count(data.map(s => s.settlement_type || 'Unknown')));
  };

  const calculateAvgHousehold = (data: WasteSiteRecord[]): string => {
    const nums = data.map(s => { const m = (s.household_size || '').match(/\d+/); return m ? parseInt(m[0]) : 0; }).filter(Boolean);
    return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '—';
  };

  if (loading) return (
    <>
      <style>{dashCss}</style>
      <div className="dash-loader">
        <div className="dash-loader-inner">
          <div className="dash-loader-icon"><BarChart3 size={22} /></div>
          <p className="dash-loader-text">Loading analytics…</p>
        </div>
      </div>
    </>
  );

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

        {/* ── App bar ── */}
        <header className="dash-appbar">
          <div className="dash-appbar-inner">
            <div className="dash-appbar-left">
              <div className="dash-app-icon">
                <BarChart3 size={16} color="white" />
              </div>
              <div>
                <p className="dash-app-name">GeoWaste Admin</p>
                <p className="dash-app-count">{sites.length} records</p>
              </div>
            </div>
            <button onClick={() => window.print()} className="dash-export-btn">
              <Download size={13} /> Export
            </button>
          </div>
          <div className="dash-progress-rail">
            <div className="dash-progress-fill" style={{ width: '100%' }} />
          </div>
        </header>

        {/* ── Tab bar ── */}
        <FloatingTabBar
          tabs={[
            {
              id: 'overview',
              label: 'Overview',
              icon: <BarChart3 size={20} />,
              content: (
                <OverviewContent
                  sites={sites}
                  wasteByType={wasteByType}
                  disposalMethods={disposalMethods}
                  wardDistribution={wardDistribution}
                  settlementTypes={settlementTypes}
                  calculateAvgHousehold={calculateAvgHousehold}
                />
              ),
            },
            {
              id: 'records',
              label: 'Records',
              icon: <FileText size={20} />,
              content: (
                <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px 100px' }}>
                  <RecordsPage 
                    sites={sites}
                    onSitesChange={(updatedSites) => {
                      setSites(updatedSites);
                      analyzeData(updatedSites);
                    }}
                  />
                </div>
              ),
            },
            {
              id: 'enumerators',
              label: 'Team',
              icon: <Users size={20} />,
              content: (
                <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px 100px' }}>
                  <EnumeratorManagement />
                </div>
              ),
            },
            {
              id: 'surveys',
              label: 'Surveys',
              icon: <ClipboardList size={20} />,
              content: (
                <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px 100px' }}>
                  <SurveysManagementPage />
                </div>
              ),
            },
            {
              id: 'profile',
              label: 'Profile',
              icon: <Settings size={20} />,
              content: <ProfileTab />,
            },
          ]}
          currentTab={currentPage}
          onTabChange={setCurrentPage}
        />
      </div>
    </>
  );
};