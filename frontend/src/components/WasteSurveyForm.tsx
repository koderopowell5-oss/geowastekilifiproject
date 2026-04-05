import React, { useState, useEffect } from 'react';
import { WasteSiteRecord } from '../../../types';
import { GeolocationService } from '../services/geolocation';
import { wasteApiService } from '../services/wasteApi';
import { ChevronLeft, ChevronRight, CheckCircle2, X, Loader2, AlertTriangle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { SuccessCard } from './SuccessCard';
import { FailCard } from './FailCard';

interface WasteSurveyFormProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  hideHeader?: boolean;
  draftId?: string;
  initialData?: Omit<WasteSiteRecord, 'id' | 'created_at' | 'updated_at'>;
  userEmail?: string;
}

// ─── Field components ────────────────────────────────────────────────

const SelectField: React.FC<{
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}> = ({ label, name, value, onChange, options }) => (
  <div className="field">
    <label className="field-label">{label}</label>
    <div className="select-wrap">
      <select name={name} value={value} onChange={onChange} className="field-select">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  </div>
);

const ToggleField: React.FC<{
  label: string; name: string; checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string;
}> = ({ label, name, checked, onChange, description }) => (
  <div className="field">
    <div className="toggle-row">
      <div>
        <span className="field-label" style={{ display: 'block' }}>{label}</span>
        {description && <span className="field-hint">{description}</span>}
      </div>
      <label className="toggle-switch">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only" />
        <div className={`toggle-track ${checked ? 'on' : ''}`}>
          <div className="toggle-thumb" />
        </div>
      </label>
    </div>
  </div>
);

const MultiSelectGroup: React.FC<{
  label: string; options: string[]; selected: string[];
  onToggle: (v: string) => void; hint?: string;
}> = ({ label, options, selected, onToggle, hint }) => (
  <div className="field">
    <label className="field-label">{label}</label>
    {hint && <span className="field-hint">{hint}</span>}
    <div className="chip-grid">
      {options.map((opt) => (
        <button
          key={opt} type="button"
          onClick={() => onToggle(opt)}
          className={`chip ${selected.includes(opt) ? 'chip--on' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const TextareaField: React.FC<{
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string; hint?: string;
}> = ({ label, name, value, onChange, placeholder, hint }) => (
  <div className="field">
    <label className="field-label">{label}</label>
    {hint && <span className="field-hint">{hint}</span>}
    <textarea name={name} value={value} onChange={onChange}
      placeholder={placeholder} rows={4} className="field-textarea" />
  </div>
);

const WeightSlider: React.FC<{
  label: string; name: string; value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, onChange }) => (
  <div className="weight-row">
    <div className="weight-top">
      <span className="weight-label">{label}</span>
      <span className="weight-val">{value}<span className="weight-max">/5</span></span>
    </div>
    <input
      type="range" name={name} value={value} onChange={onChange}
      min={1} max={5} className="weight-range"
      style={{ '--pct': `${((value - 1) / 4) * 100}%` } as React.CSSProperties}
    />
  </div>
);

// ─── Main component ──────────────────────────────────────────────────

export const WasteSurveyForm: React.FC<WasteSurveyFormProps> = ({
  onSubmitSuccess, onCancel, draftId, initialData, userEmail,
}) => {
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [animDir, setAnimDir] = useState<'fwd' | 'bck'>('fwd');
  const [animKey, setAnimKey] = useState(0);

  const [formData, setFormData] = useState<Omit<WasteSiteRecord, 'id' | 'created_at' | 'updated_at'>>(
    initialData || {
      latitude: 0, longitude: 0,
      ward: 'Tezo', settlement_type: 'Formal', household_size: '1-3',
      waste_types: [], waste_quantity: '<1kg', waste_separation: false,
      disposal_method: 'County collection', distance_to_site: '<100m',
      collection_frequency: 'Daily', road_access: 'Good', distance_to_road: '<50m',
      waste_near_home: false, distance_to_waste: '<50m', impacts: [],
      nearby_features: [], recommended_distance: '<200m', preferred_location: [],
      distance_weight: 3, water_weight: 3, road_weight: 3, slope_weight: 3, landuse_weight: 3,
      terrain: 'Flat', flooding: 'Never', policy_awareness: false,
      support_new_site: 'Yes', preferred_management: 'Recycling',
      challenges: '', suggested_location: '',
    }
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const loc = await GeolocationService.getCurrentLocation();
        setFormData(p => ({ ...p, latitude: loc.latitude, longitude: loc.longitude }));
        setError(null);
      } catch (e: any) {
        const errMsg = `GPS unavailable: ${e.message}`;
        setError(errMsg);
        showError(errMsg);
      } finally {
        setLoading(false);
      }
    })();
  }, [showError]);

  // Load draft from database when component mounts
  useEffect(() => {
    (async () => {
      if (!userEmail) return;
      try {
        const draft = await wasteApiService.getDraft(userEmail);
        if (draft && draft.draft_data) {
          // Load form data from database draft
          const draftFormData = draft.draft_data;
          setFormData(draftFormData);
          showSuccess('Draft loaded from database! ✓');
        }
      } catch (e: any) {
        console.error('Error loading draft:', e);
        // Silently fail - user can continue without loading draft
      }
    })();
  }, [userEmail, showSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') setFormData(p => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
    else if (type === 'range') setFormData(p => ({ ...p, [name]: parseInt(value) }));
    else setFormData(p => ({ ...p, [name]: value }));
  };

  const handleMultiSelect = (name: keyof typeof formData, value: string) => {
    setFormData(p => {
      const cur = Array.isArray(p[name]) ? (p[name] as string[]) : [];
      return { ...p, [name]: cur.includes(value) ? cur.filter(i => i !== value) : [...cur, value] };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError(null);
    try {
      if (!formData.latitude) throw new Error('GPS coordinates are required');
      await wasteApiService.submitWasteSite({
        ...formData,
        enumerator_email: userEmail || undefined,
      });
      setSuccess(true);
      
      // Delete draft after successful submission
      if (userEmail) {
        await wasteApiService.deleteDraft(userEmail).catch(e => console.error('Error deleting draft:', e));
      }
      
      setTimeout(() => { if (onSubmitSuccess) onSubmitSuccess(); }, 2500);
    } catch (e: any) {
      const errMsg = e.message || 'Submission failed';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      if (!userEmail) throw new Error('User email not found');
      
      // Save to database
      const draftData = {
        ...formData,
        status: 'draft',
        coordinatesPassed: !!formData.latitude && formData.latitude !== 0,
      };

      await wasteApiService.saveDraft(userEmail, draftData);
      
      // Also save to localStorage as backup
      const draftKey = `geowaste_drafts_${userEmail}`;
      const drafts = JSON.parse(localStorage.getItem(draftKey) || '[]');
      
      const draft = {
        id: draftId || `draft_${Date.now()}`,
        formData,
        createdAt: draftId ? drafts.find((d: any) => d.id === draftId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft' as const,
        ward: formData.ward,
        coordinatesPassed: !!formData.latitude && formData.latitude !== 0,
      };
      
      const existingIndex = drafts.findIndex((d: any) => d.id === draft.id);
      if (existingIndex >= 0) {
        drafts[existingIndex] = draft;
      } else {
        drafts.push(draft);
      }
      
      localStorage.setItem(draftKey, JSON.stringify(drafts));
      showSuccess('Draft saved to database! ✓');
    } catch (e: any) {
      const errMsg = e.message || 'Failed to save draft';
      setError(errMsg);
      showError(errMsg);
    } finally {
      setSavingDraft(false);
    }
  };

  const goTo = (idx: number) => {
    setAnimDir(idx > currentSection ? 'fwd' : 'bck');
    setAnimKey(k => k + 1);
    setCurrentSection(idx);
  };

  const sections = [
    { title: 'Location',      subtitle: 'Where are you surveying?' },
    { title: 'Waste Profile', subtitle: 'What waste is generated here?' },
    { title: 'Disposal',      subtitle: 'How is waste currently disposed?' },
    { title: 'Road Access',   subtitle: 'How accessible is this area?' },
    { title: 'Environment',   subtitle: 'Nearby conditions and observed impacts' },
    { title: 'Suitability',   subtitle: 'Preferences for site selection' },
    { title: 'Topography',    subtitle: 'Terrain and flood risk' },
    { title: 'Community',     subtitle: 'Attitudes and awareness' },
    { title: 'Notes',         subtitle: 'Challenges and suggestions' },
  ];

  const renderSection = () => {
    switch (currentSection) {
      case 0: return (
        <div className="fields">
          <div className={`gps-status ${loading ? 'gps--loading' : formData.latitude ? 'gps--ok' : 'gps--err'}`}>
            {loading
              ? <><Loader2 size={14} className="spin" /> Acquiring GPS location…</>
              : formData.latitude
              ? <><span className="gps-dot" /><span>Location captured &nbsp;<span className="gps-coords">{formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}</span></span></>
              : <><AlertTriangle size={14} /> {error || 'Could not get location'}</>
            }
          </div>
          <SelectField label="Ward" name="ward" value={formData.ward} onChange={handleInputChange} options={['Tezo', 'Sokoni']} />
          <SelectField label="Settlement Type" name="settlement_type" value={formData.settlement_type} onChange={handleInputChange} options={['Formal', 'Informal', 'Peri-urban']} />
          <SelectField label="Household Size" name="household_size" value={formData.household_size} onChange={handleInputChange} options={['1-3', '4-6', '7+']} />
        </div>
      );
      case 1: return (
        <div className="fields">
          <MultiSelectGroup label="Waste Types Generated" hint="Select all that apply" options={['Organic', 'Plastics', 'Glass', 'Metal', 'Hazardous', 'Liquid']} selected={formData.waste_types as string[]} onToggle={v => handleMultiSelect('waste_types', v)} />
          <SelectField label="Average Daily Quantity" name="waste_quantity" value={formData.waste_quantity} onChange={handleInputChange} options={['<1kg', '1-3kg', '3-5kg', '>5kg']} />
          <ToggleField label="Waste Separation" description="Do you sort waste before disposal?" name="waste_separation" checked={formData.waste_separation} onChange={handleInputChange} />
        </div>
      );
      case 2: return (
        <div className="fields">
          <SelectField label="Primary Disposal Method" name="disposal_method" value={formData.disposal_method} onChange={handleInputChange} options={['County collection', 'Private collector', 'Open dumping', 'Burning', 'Burying', 'Drainage disposal']} />
          <SelectField label="Distance to Disposal Site" name="distance_to_site" value={formData.distance_to_site} onChange={handleInputChange} options={['<100m', '100-500m', '500m-1km', '>1km']} />
          <SelectField label="Collection Frequency" name="collection_frequency" value={formData.collection_frequency} onChange={handleInputChange} options={['Daily', 'Weekly', 'Monthly', 'Not collected']} />
        </div>
      );
      case 3: return (
        <div className="fields">
          <SelectField label="Road Access Quality" name="road_access" value={formData.road_access} onChange={handleInputChange} options={['Good', 'Fair', 'Poor']} />
          <SelectField label="Distance to Nearest Road" name="distance_to_road" value={formData.distance_to_road} onChange={handleInputChange} options={['<50m', '50-200m', '>200m']} />
        </div>
      );
      case 4: return (
        <div className="fields">
          <ToggleField label="Waste Near Home" description="Is there uncollected waste near your residence?" name="waste_near_home" checked={formData.waste_near_home} onChange={handleInputChange} />
          <SelectField label="Distance to Nearest Waste" name="distance_to_waste" value={formData.distance_to_waste} onChange={handleInputChange} options={['<50m', '50-200m', '>200m']} />
          <MultiSelectGroup label="Observed Impacts" hint="Select all that apply" options={['Bad odour', 'Water contamination', 'Air pollution', 'Flooding', 'Disease']} selected={formData.impacts as string[]} onToggle={v => handleMultiSelect('impacts', v)} />
          <MultiSelectGroup label="Nearby Environmental Features" options={['River/stream', 'Wetland', 'Ocean/creek', 'None']} selected={formData.nearby_features as string[]} onToggle={v => handleMultiSelect('nearby_features', v)} />
        </div>
      );
      case 5: return (
        <div className="fields">
          <SelectField label="Recommended Buffer Distance" name="recommended_distance" value={formData.recommended_distance} onChange={handleInputChange} options={['<200m', '200-500m', '500m-1km', '>1km']} />
          <MultiSelectGroup label="Preferred Site Characteristics" hint="What makes a good location?" options={['Far from settlements', 'Near roads', 'Away from water', 'Unused land', 'Industrial area']} selected={formData.preferred_location as string[]} onToggle={v => handleMultiSelect('preferred_location', v)} />
          <div className="field">
            <label className="field-label">Factor Weights</label>
            <span className="field-hint">Rate importance for site selection (1 = low, 5 = critical)</span>
            <div className="weights-list">
              {[
                { label: 'Distance from Homes',    name: 'distance_weight', value: formData.distance_weight },
                { label: 'Water Bodies Proximity', name: 'water_weight',    value: formData.water_weight },
                { label: 'Road Accessibility',     name: 'road_weight',     value: formData.road_weight },
                { label: 'Slope Suitability',      name: 'slope_weight',    value: formData.slope_weight },
                { label: 'Land Use Compatibility', name: 'landuse_weight',  value: formData.landuse_weight },
              ].map(w => <WeightSlider key={w.name} {...w} onChange={handleInputChange} />)}
            </div>
          </div>
        </div>
      );
      case 6: return (
        <div className="fields">
          <SelectField label="Terrain Type" name="terrain" value={formData.terrain} onChange={handleInputChange} options={['Flat', 'Gentle slope', 'Steep slope']} />
          <SelectField label="Flood Risk" name="flooding" value={formData.flooding} onChange={handleInputChange} options={['Never', 'Occasionally', 'Frequently']} />
        </div>
      );
      case 7: return (
        <div className="fields">
          <ToggleField label="Policy Awareness" description="Are you aware of local waste management policies?" name="policy_awareness" checked={formData.policy_awareness} onChange={handleInputChange} />
          <SelectField label="Support for New Disposal Site" name="support_new_site" value={formData.support_new_site} onChange={handleInputChange} options={['Yes', 'No', 'Not sure']} />
          <SelectField label="Preferred Management Method" name="preferred_management" value={formData.preferred_management} onChange={handleInputChange} options={['Recycling', 'Composting', 'Landfill', 'Incineration']} />
        </div>
      );
      case 8: return (
        <div className="fields">
          <TextareaField label="Key Challenges" hint="What are the main waste management problems in this area?" name="challenges" value={formData.challenges} onChange={handleInputChange} placeholder="Describe the main challenges…" />
          <TextareaField label="Suggested Location" hint="Where would you recommend placing a disposal site?" name="suggested_location" value={formData.suggested_location} onChange={handleInputChange} placeholder="Describe or name a location…" />
        </div>
      );
      default: return null;
    }
  };

  if (success) return (
    <>
      <style>{css}</style>
      <div className="root">
        <header className="header">
          <div className="header-inner">
            <div>
              <p className="header-step">Submission Complete</p>
              <h1 className="header-title">Survey Recorded</h1>
            </div>
          </div>
        </header>
        <main className="body" style={{ paddingTop: '48px', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <SuccessCard 
            title="Survey Recorded"
            message="Waste site recorded successfully! The data has been saved and will help inform waste management planning."
            onClose={() => {
              setSuccess(false);
              if (onSubmitSuccess) onSubmitSuccess();
            }}
          />
        </main>
      </div>
    </>
  );

  const pct = ((currentSection + 1) / sections.length) * 100;

  return (
    <>
      <style>{css}</style>
      <div className="root">

        {/* Header */}
        <header className="header">
          <div className="header-inner">
            <div>
              <p className="header-step">Step {currentSection + 1} of {sections.length}</p>
              <h1 className="header-title">{sections[currentSection].title}</h1>
            </div>
            <button onClick={onCancel} className="close-btn" aria-label="Close"><X size={15} /></button>
          </div>
          <div className="progress-rail"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        </header>

        {/* Step tabs */}
        <nav className="step-nav">
          {sections.map((s, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`step-tab ${i === currentSection ? 'step-tab--active' : i < currentSection ? 'step-tab--done' : ''}`}>
              {i < currentSection ? <CheckCircle2 size={11} /> : <span className="step-num">{i + 1}</span>}
              {s.title}
            </button>
          ))}
        </nav>

        {/* Body */}
        <main className="body">

          <div className="section-head">
            <h2 className="section-title">{sections[currentSection].title}</h2>
            <p className="section-sub">{sections[currentSection].subtitle}</p>
          </div>

          <hr className="divider" />

          {error && currentSection !== 0 && (
            <FailCard 
              title="Error"
              message={error}
              onClose={() => setError(null)}
            />
          )}

          <div key={animKey} className={`anim anim--${animDir}`}>
            {renderSection()}
          </div>

          {/* Navigation */}
          <div className="nav">
            <button type="button" disabled={currentSection === 0}
              onClick={() => goTo(currentSection - 1)} className="btn btn--ghost">
              <ChevronLeft size={15} /> Back
            </button>

            <div className="pip-row">
              {sections.map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`pip ${i === currentSection ? 'pip--active' : i < currentSection ? 'pip--done' : ''}`} />
              ))}
            </div>

            {currentSection === sections.length - 1
              ? <div className="btn-group">
                  <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="btn btn--secondary">
                    {savingDraft ? <Loader2 size={14} className="spin" /> : null}
                    {savingDraft ? 'Saving…' : 'Save draft'}
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={submitting || loading} className="btn btn--primary">
                    {submitting ? <Loader2 size={14} className="spin" /> : null}
                    {submitting ? 'Submitting…' : 'Submit survey'}
                  </button>
                </div>
              : <button type="button" onClick={() => goTo(currentSection + 1)} className="btn btn--primary">
                  Next <ChevronRight size={15} />
                </button>
            }
          </div>

        </main>
      </div>
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────

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

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }

  /* ── Header ── */
  .header {
    position: sticky; top: 0; z-index: 20;
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .header-inner {
    max-width: 600px; margin: 0 auto;
    padding: 16px 24px 12px;
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .header-step {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal); margin-bottom: 3px;
  }
  .header-title {
    font-size: 19px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.3px;
  }
  .close-btn {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1px solid var(--border); background: transparent;
    color: var(--muted); cursor: pointer; display: flex;
    align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0; margin-top: 2px;
  }
  .close-btn:hover { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }

  .progress-rail {
    max-width: 600px; margin: 0 auto;
    height: 2px; background: var(--foam);
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--teal), var(--teal-l));
    transition: width 0.35s ease;
  }

  /* ── Step nav ── */
  .step-nav {
    max-width: 600px; margin: 0 auto;
    display: flex; overflow-x: auto;
    scrollbar-width: none; padding: 0 24px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
  }
  .step-nav::-webkit-scrollbar { display: none; }
  .step-tab {
    display: flex; align-items: center; gap: 5px;
    padding: 10px 12px; flex-shrink: 0;
    font-size: 12px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    color: var(--muted); background: none;
    border: none; border-bottom: 2px solid transparent;
    cursor: pointer; white-space: nowrap;
    transition: all 0.15s; margin-bottom: -1px;
  }
  .step-tab:hover { color: var(--teal-d); }
  .step-tab--active { color: var(--teal); border-bottom-color: var(--teal); font-weight: 600; }
  .step-tab--done   { color: var(--teal-l); }
  .step-num { font-size: 10px; font-family: 'DM Mono', monospace; opacity: 0.45; }

  /* ── Body ── */
  .body {
    max-width: 600px; margin: 0 auto;
    padding: 36px 24px 60px;
    display: flex; flex-direction: column; gap: 28px;
  }

  .section-head { }
  .section-title {
    font-size: 24px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.5px;
    line-height: 1.2; margin-bottom: 6px;
  }
  .section-sub {
    font-size: 14px; color: var(--muted); line-height: 1.5;
  }

  .divider { border: none; border-top: 1px solid var(--border); }

  /* ── Animations ── */
  @keyframes fwd { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
  @keyframes bck { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
  .anim--fwd { animation: fwd 0.2s ease both; }
  .anim--bck { animation: bck 0.2s ease both; }

  /* ── Fields ── */
  .fields { display: flex; flex-direction: column; gap: 24px; }
  .field  { display: flex; flex-direction: column; gap: 8px; }

  .field-label {
    font-size: 13px; font-weight: 600;
    color: var(--text);
  }
  .field-hint {
    font-size: 12.5px; color: var(--muted);
    line-height: 1.45; display: block; margin-top: -3px;
  }

  /* ── Select ── */
  .select-wrap { position: relative; }
  .field-select {
    width: 100%; padding: 10px 36px 10px 13px;
    border: 1.5px solid var(--border); border-radius: var(--r);
    background: white; color: var(--text);
    font-size: 14px; font-family: 'DM Sans', sans-serif; font-weight: 400;
    appearance: none; outline: none; cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a9a8a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }
  .field-select:focus {
    border-color: var(--teal);
    box-shadow: 0 0 0 3px rgba(50,157,156,0.1);
  }

  /* ── Toggle ── */
  .toggle-row {
    display: flex; align-items: center;
    justify-content: space-between; gap: 16px;
  }
  .toggle-switch { cursor: pointer; flex-shrink: 0; }
  .toggle-track {
    width: 42px; height: 23px; border-radius: 12px;
    background: #cdd8d2; position: relative;
    transition: background 0.2s;
  }
  .toggle-track.on { background: var(--teal); }
  .toggle-thumb {
    position: absolute; top: 3px; left: 3px;
    width: 17px; height: 17px; border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.18);
    transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
  }
  .toggle-track.on .toggle-thumb { transform: translateX(19px); }

  /* ── Chips ── */
  .chip-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
  .chip {
    padding: 7px 15px; border-radius: 20px;
    border: 1.5px solid var(--border);
    background: white; color: var(--muted);
    font-size: 13px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.14s;
  }
  .chip:hover { border-color: var(--teal); color: var(--teal-d); }
  .chip--on { background: var(--teal); border-color: var(--teal); color: white; }

  /* ── Textarea ── */
  .field-textarea {
    width: 100%; padding: 11px 13px;
    border: 1.5px solid var(--border); border-radius: var(--r);
    background: white; color: var(--text);
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    line-height: 1.6; resize: none; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .field-textarea::placeholder { color: #b4ccc0; }
  .field-textarea:focus {
    border-color: var(--teal);
    box-shadow: 0 0 0 3px rgba(50,157,156,0.1);
  }

  /* ── Weight sliders ── */
  .weights-list { display: flex; flex-direction: column; gap: 20px; margin-top: 12px; }
  .weight-row   { display: flex; flex-direction: column; gap: 8px; }
  .weight-top   { display: flex; justify-content: space-between; align-items: baseline; }
  .weight-label { font-size: 13px; color: var(--text); font-weight: 500; }
  .weight-val   { font-size: 12px; font-family: 'DM Mono', monospace; color: var(--teal); }
  .weight-max   { color: var(--muted); }
  .weight-range {
    width: 100%; height: 3px;
    -webkit-appearance: none; appearance: none;
    outline: none; border-radius: 2px; cursor: pointer;
    background: linear-gradient(to right,
      var(--teal) 0%, var(--teal) var(--pct, 50%),
      var(--foam) var(--pct, 50%), var(--foam) 100%);
  }
  .weight-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px; border-radius: 50%;
    background: white; border: 2px solid var(--teal);
    box-shadow: 0 1px 4px rgba(50,157,156,0.25); cursor: pointer;
  }

  /* ── GPS inline status ── */
  .gps-status {
    display: flex; align-items: center; gap: 8px;
    font-size: 12.5px; font-weight: 500;
    padding-bottom: 10px; border-bottom: 1px solid var(--border);
  }
  .gps--loading { color: var(--muted); }
  .gps--ok      { color: var(--teal); }
  .gps--err     { color: #ef4444; }
  .gps-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    background: var(--teal-l);
    box-shadow: 0 0 0 3px rgba(86,197,150,0.2);
  }
  .gps-coords {
    font-family: 'DM Mono', monospace; font-size: 11px;
    color: var(--muted); font-weight: 400;
  }

  /* ── Error ── */
  .error-msg {
    display: flex; align-items: center; gap: 7px;
    color: #dc2626; font-size: 13px; font-weight: 500;
  }

  /* ── Navigation ── */
  .nav {
    display: flex; align-items: center; gap: 12px;
    padding-top: 8px; border-top: 1px solid var(--border);
  }
  .pip-row { display: flex; gap: 4px; flex: 1; justify-content: center; }
  .pip {
    width: 5px; height: 5px; border-radius: 3px;
    background: #d4ddd8; border: none; padding: 0;
    cursor: pointer; transition: all 0.2s;
  }
  .pip--active { width: 18px; background: var(--teal); }
  .pip--done   { background: var(--mint); }

  .btn {
    display: flex; align-items: center; gap: 5px;
    padding: 9px 18px; border-radius: var(--r);
    font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; white-space: nowrap; transition: all 0.15s;
  }
  .btn--ghost {
    background: none; border: 1.5px solid var(--border); color: var(--muted);
  }
  .btn--ghost:hover:not(:disabled) { border-color: var(--teal-d); color: var(--teal-d); }
  .btn--ghost:disabled { opacity: 0.3; cursor: not-allowed; }
  .btn--primary {
    background: var(--teal); border: 1.5px solid var(--teal); color: white;
  }
  .btn--primary:hover:not(:disabled) { background: var(--teal-d); border-color: var(--teal-d); }
  .btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn--secondary {
    background: var(--foam); border: 1.5px solid var(--foam); color: var(--text);
  }
  .btn--secondary:hover:not(:disabled) { background: var(--mint); border-color: var(--mint); color: white; }
  .btn--secondary:disabled { opacity: 0.5; cursor: not-allowed; }
  
  .btn-group {
    display: flex; gap: 10px; align-items: center;
  }
  @media (max-width: 640px) {
    .btn-group { flex-direction: column-reverse; }
    .btn { width: 100%; justify-content: center; }
  }

  /* ── Success ── */
  .success-screen {
    min-height: 100vh; background: var(--bg);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    font-family: 'DM Sans', sans-serif;
  }
  @keyframes pop { from { opacity:0; transform: scale(0.75); } to { opacity:1; transform: scale(1); } }
  .success-icon  { color: var(--teal); animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  .success-title { font-size: 20px; font-weight: 600; color: var(--teal-d); letter-spacing: -0.3px; }
  .success-sub   { font-size: 13px; color: var(--muted); }

  /* ── Utils ── */
  .spin { animation: _spin 0.7s linear infinite; }
  @keyframes _spin { to { transform: rotate(360deg); } }
  .sr-only { position: absolute; width: 1px; height: 1px; clip: rect(0,0,0,0); overflow: hidden; }
`;