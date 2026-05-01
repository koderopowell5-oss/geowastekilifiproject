import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Eye,
  Download,
  Upload,
  AlignLeft,
  Mail,
  Hash,
  ChevronDown,
  CheckSquare,
  Check,
  AlignJustify,
  Calendar,
  Clock,
  MapPin,
  Image,
  Star,
  GripVertical,
  Info,
  ClipboardList,
  X,
  Save,
  ArrowRight,
  List,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'textarea' | 'date' | 'time' | 'location' | 'image' | 'rating';
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface SurveyFormConfig {
  sections: FormSection[];
  metadata?: {
    language?: string;
    allowOfflineMode?: boolean;
    allowDrafts?: boolean;
  };
}

interface SurveyBuilderProps {
  initialConfig?: SurveyFormConfig;
  onSave?: (config: SurveyFormConfig) => void;
  onPreview?: () => void;
  readOnly?: boolean;
}

const FIELD_GROUPS = [
  {
    label: 'Text',
    fields: [
      { value: 'text', label: 'Short text', Icon: AlignLeft },
      { value: 'textarea', label: 'Long text', Icon: AlignJustify },
      { value: 'email', label: 'Email', Icon: Mail },
      { value: 'number', label: 'Number', Icon: Hash },
    ],
  },
  {
    label: 'Choice',
    fields: [
      { value: 'select', label: 'Dropdown', Icon: ChevronDown },
      { value: 'multiselect', label: 'Multi-select', Icon: List },
      { value: 'checkbox', label: 'Checkbox', Icon: CheckSquare },
      { value: 'rating', label: 'Rating scale', Icon: Star },
    ],
  },
  {
    label: 'Date & time',
    fields: [
      { value: 'date', label: 'Date', Icon: Calendar },
      { value: 'time', label: 'Time', Icon: Clock },
    ],
  },
  {
    label: 'Media & other',
    fields: [
      { value: 'image', label: 'Image upload', Icon: Image },
      { value: 'location', label: 'Location', Icon: MapPin },
    ],
  },
];

const FIELD_ICON_MAP: Record<string, React.ElementType> = {};
FIELD_GROUPS.forEach((g) => g.fields.forEach((f) => { FIELD_ICON_MAP[f.value] = f.Icon; }));

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const SurveyBuilder: React.FC<SurveyBuilderProps> = ({
  initialConfig,
  onSave,
  onPreview,
  readOnly = false,
}) => {
  const { showSuccess, showError } = useNotification();

  const [config, setConfig] = useState<SurveyFormConfig>(() => {
    if (initialConfig && initialConfig.sections?.length) return initialConfig;
    return {
      sections: [{ id: uid(), title: 'Section 1', description: '', fields: [] }],
      metadata: { language: 'en', allowOfflineMode: true, allowDrafts: true },
    };
  });

  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    () => (initialConfig?.sections?.[0]?.id) ?? config.sections[0].id
  );
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [showOnboard, setShowOnboard] = useState(true);
  const [fieldSearch, setFieldSearch] = useState('');

  const selectedSection = config.sections.find((s) => s.id === selectedSectionId);
  const totalFields = config.sections.reduce((a, s) => a + s.fields.length, 0);

  // ── Section helpers ────────────────────────────────────────────────────────

  const addSection = () => {
    const newId = uid();
    setConfig((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: newId, title: `Section ${prev.sections.length + 1}`, description: '', fields: [] },
      ],
    }));
    setSelectedSectionId(newId);
    setEditingFieldId(null);
  };

  const deleteSection = (sectionId: string) => {
    if (config.sections.length === 1) {
      showError('Cannot delete the last section');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
    if (selectedSectionId === sectionId) {
      const fallback = config.sections.find((s) => s.id !== sectionId);
      if (fallback) setSelectedSectionId(fallback.id);
    }
  };

  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    }));
  };

  // ── Field helpers ──────────────────────────────────────────────────────────

  const addFieldToSection = (fieldType: string) => {
    if (!selectedSection) return;
    const fieldDef = FIELD_GROUPS.flatMap((g) => g.fields).find((f) => f.value === fieldType);
    const newField: FormField = {
      id: uid(),
      type: fieldType as FormField['type'],
      label: fieldDef?.label ?? fieldType,
      name: `field_${Date.now()}`,
      required: false,
      placeholder: '',
      hint: '',
      options:
        fieldType === 'select' || fieldType === 'multiselect' || fieldType === 'checkbox'
          ? ['Option 1', 'Option 2', 'Option 3']
          : undefined,
    };
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === selectedSectionId ? { ...s, fields: [...s.fields, newField] } : s
      ),
    }));
    setEditingFieldId(newField.id);
  };

  const duplicateField = (fieldId: string) => {
    if (!selectedSection) return;
    const orig = selectedSection.fields.find((f) => f.id === fieldId);
    if (!orig) return;
    const copy: FormField = { ...orig, id: uid(), name: orig.name + '_copy' };
    const idx = selectedSection.fields.indexOf(orig);
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== selectedSectionId) return s;
        const fields = [...s.fields];
        fields.splice(idx + 1, 0, copy);
        return { ...s, fields };
      }),
    }));
  };

  const deleteField = (fieldId: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === selectedSectionId
          ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          : s
      ),
    }));
    if (editingFieldId === fieldId) setEditingFieldId(null);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === selectedSectionId
          ? { ...s, fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)) }
          : s
      ),
    }));
  };

  // ── Export / Import ────────────────────────────────────────────────────────

  const handleExport = () => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Survey exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.sections && Array.isArray(imported.sections)) {
          setConfig(imported);
          setSelectedSectionId(imported.sections[0]?.id ?? '');
          showSuccess('Survey imported successfully');
        } else {
          showError('Invalid survey format');
        }
      } catch {
        showError('Failed to parse survey file');
      }
    };
    reader.readAsText(file);
  };

  // ── Filtered field panel ───────────────────────────────────────────────────

  const filteredGroups = FIELD_GROUPS.map((g) => ({
    ...g,
    fields: g.fields.filter(
      (f) =>
        !fieldSearch ||
        f.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
        f.value.includes(fieldSearch.toLowerCase())
    ),
  })).filter((g) => g.fields.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{css}</style>
      <div className="sb-root">

        {/* ── Top bar ── */}
        <div className="sb-topbar">
          <div className="sb-topbar-left">
            <div className="sb-logo">
              <ClipboardList size={16} color="#fff" />
            </div>
            <span className="sb-topbar-title">Survey builder</span>
          </div>
          <div className="sb-topbar-right">
            {!readOnly && (
              <>
                <button className="sb-btn" onClick={handleExport}>
                  <Download size={14} /> Export
                </button>
                <label className="sb-btn">
                  <Upload size={14} /> Import
                  <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                </label>
              </>
            )}
            <button className="sb-btn" onClick={onPreview}>
              <Eye size={14} /> Preview
            </button>
            {!readOnly && (
              <button className="sb-btn sb-btn--primary" onClick={() => onSave?.(config)}>
                <Save size={14} /> Save
              </button>
            )}
          </div>
        </div>

        <div className="sb-workspace">

          {/* ── Sidebar ── */}
          <div className="sb-sidebar">
            <div className="sb-sidebar-head">
              <span className="sb-sidebar-label">Sections</span>
              {!readOnly && (
                <button className="sb-icon-btn" onClick={addSection} title="Add section">
                  <Plus size={13} />
                </button>
              )}
            </div>

            <div className="sb-sections-list">
              {config.sections.map((section) => (
                <div
                  key={section.id}
                  className={`sb-section-item${selectedSectionId === section.id ? ' active' : ''}`}
                  onClick={() => { setSelectedSectionId(section.id); setEditingFieldId(null); }}
                >
                  <span className="sb-section-dot" />
                  <span className="sb-section-name">{section.title || 'Untitled section'}</span>
                  <span className="sb-section-count">{section.fields.length}</span>
                  {!readOnly && (
                    <button
                      className="sb-section-del"
                      onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!readOnly && (
              <button className="sb-add-section-btn" onClick={addSection}>
                <Plus size={13} /> Add section
              </button>
            )}
          </div>

          {/* ── Main ── */}
          <div className="sb-main">

            {/* Onboarding banner */}
            {showOnboard && (
              <div className="sb-onboard">
                <div className="sb-onboard-icon">
                  <Info size={18} color="#fff" />
                </div>
                <div className="sb-onboard-body">
                  <div className="sb-onboard-title">Welcome to the survey builder</div>
                  <div className="sb-onboard-desc">
                    Build forms for data collection, research, or feedback in minutes.
                  </div>
                  <div className="sb-onboard-steps">
                    {[
                      'Name your section below',
                      'Add fields from the right panel',
                      'Click a field to configure it',
                      'Save or export when done',
                    ].map((step, i) => (
                      <div key={i} className="sb-onboard-step">
                        <span className="sb-step-num">{i + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
                <button className="sb-onboard-close" onClick={() => setShowOnboard(false)}>
                  <X size={14} />
                </button>
              </div>
            )}

            {selectedSection && (
              <>
                {/* Section meta */}
                <div className="sb-section-card">
                  <div className="sb-section-card-head">
                    <p className="sb-section-card-label">Section title</p>
                    <input
                      className="sb-section-title-input"
                      value={selectedSection.title}
                      placeholder="Untitled section"
                      disabled={readOnly}
                      onChange={(e) => updateSection(selectedSection.id, { title: e.target.value })}
                    />
                    <textarea
                      className="sb-section-desc-input"
                      value={selectedSection.description || ''}
                      placeholder="Optional description…"
                      rows={2}
                      disabled={readOnly}
                      onChange={(e) => updateSection(selectedSection.id, { description: e.target.value })}
                    />
                  </div>

                  {/* Fields list */}
                  <div className="sb-fields-area">
                    {selectedSection.fields.length === 0 ? (
                      <div className="sb-fields-empty">
                        <div className="sb-fields-empty-icon">
                          <Plus size={20} strokeWidth={1.5} color="var(--sb-muted)" />
                        </div>
                        <div className="sb-fields-empty-title">No fields yet</div>
                        <div className="sb-fields-empty-desc">
                          Pick a field type from the panel on the right to get started.
                        </div>
                        <div className="sb-fields-empty-hint">
                          <ArrowRight size={13} /> Choose from text, choice, date, and more
                        </div>
                      </div>
                    ) : (
                      selectedSection.fields.map((field) => {
                        const FieldIcon = FIELD_ICON_MAP[field.type];
                        const isOpen = editingFieldId === field.id;
                        const needsOptions =
                          field.type === 'select' ||
                          field.type === 'multiselect' ||
                          field.type === 'checkbox';
                        const needsRange = field.type === 'number' || field.type === 'rating';

                        return (
                          <div
                            key={field.id}
                            className={`sb-field-card${isOpen ? ' open' : ''}`}
                          >
                            {/* Field row */}
                            <div
                              className="sb-field-row"
                              onClick={() => !readOnly && setEditingFieldId(isOpen ? null : field.id)}
                            >
                              <span className="sb-field-drag">
                                <GripVertical size={14} />
                              </span>
                              <span className="sb-field-type-badge">
                                {FieldIcon && <FieldIcon size={11} />}
                                {field.type}
                              </span>
                              <span className="sb-field-name">{field.label}</span>
                              {field.required && <span className="sb-field-req">Required</span>}
                              {!readOnly && (
                                <div className="sb-field-actions">
                                  <button
                                    className="sb-icon-btn"
                                    title="Duplicate"
                                    onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }}
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <button
                                    className="sb-icon-btn sb-icon-btn--danger"
                                    title="Delete"
                                    onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Inline editor */}
                            {isOpen && !readOnly && (
                              <div className="sb-field-editor">
                                <div className="sb-editor-grid">
                                  <div className="sb-fg">
                                    <label>Label</label>
                                    <input
                                      type="text"
                                      value={field.label}
                                      placeholder="Field label"
                                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                                    />
                                  </div>
                                  <div className="sb-fg">
                                    <label>Field name</label>
                                    <input
                                      type="text"
                                      value={field.name}
                                      placeholder="field_name"
                                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                                    />
                                  </div>
                                  <div className="sb-fg">
                                    <label>Placeholder</label>
                                    <input
                                      type="text"
                                      value={field.placeholder || ''}
                                      placeholder="Placeholder text"
                                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                    />
                                  </div>
                                  <div className="sb-fg">
                                    <label>Helper hint</label>
                                    <input
                                      type="text"
                                      value={field.hint || ''}
                                      placeholder="Optional hint for users"
                                      onChange={(e) => updateField(field.id, { hint: e.target.value })}
                                    />
                                  </div>
                                </div>

                                {needsOptions && (
                                  <div className="sb-fg">
                                    <label>Options (one per line)</label>
                                    <textarea
                                      rows={4}
                                      value={(field.options || []).join('\n')}
                                      onChange={(e) =>
                                        updateField(field.id, {
                                          options: e.target.value.split('\n').map((o) => o.trim()).filter(Boolean),
                                        })
                                      }
                                    />
                                  </div>
                                )}

                                {needsRange && (
                                  <div className="sb-editor-grid">
                                    <div className="sb-fg">
                                      <label>Min value</label>
                                      <input
                                        type="number"
                                        value={field.minValue ?? ''}
                                        placeholder="0"
                                        onChange={(e) => updateField(field.id, { minValue: Number(e.target.value) })}
                                      />
                                    </div>
                                    <div className="sb-fg">
                                      <label>Max value</label>
                                      <input
                                        type="number"
                                        value={field.maxValue ?? ''}
                                        placeholder="10"
                                        onChange={(e) => updateField(field.id, { maxValue: Number(e.target.value) })}
                                      />
                                    </div>
                                  </div>
                                )}

                                <label className="sb-toggle-row">
                                  <div
                                    className={`sb-toggle${field.required ? ' on' : ''}`}
                                    onClick={() => updateField(field.id, { required: !field.required })}
                                  />
                                  <span className="sb-toggle-label">Required field</span>
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Right panel ── */}
          {!readOnly && (
            <div className="sb-panel">
              <div className="sb-panel-head">
                <span className="sb-sidebar-label">Add field</span>
                <div className="sb-panel-search">
                  <AlignLeft size={13} color="var(--sb-muted)" />
                  <input
                    type="text"
                    value={fieldSearch}
                    placeholder="Search…"
                    onChange={(e) => setFieldSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="sb-panel-body">
                {filteredGroups.map((group) => (
                  <div key={group.label} className="sb-panel-group">
                    <div className="sb-panel-group-label">{group.label}</div>
                    {group.fields.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        className="sb-field-btn"
                        onClick={() => addFieldToSection(value)}
                      >
                        <span className="sb-fb-icon">
                          <Icon size={13} />
                        </span>
                        <span className="sb-fb-label">{label}</span>
                        <Plus size={12} color="var(--sb-muted)" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Status bar ── */}
        <div className="sb-statusbar">
          <div className="sb-status-item">
            <span className="sb-status-dot" />
            Ready
          </div>
          <div className="sb-status-item">
            <ClipboardList size={12} />
            {config.sections.length} section{config.sections.length !== 1 ? 's' : ''}
          </div>
          <div className="sb-status-item">
            <Check size={12} />
            {totalFields} field{totalFields !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </>
  );
};

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
    --white:  #ffffff;
    --r:      10px;
    --sb-sidebar-w: 220px;
    --sb-panel-w:   210px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .sb-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    font-size: 13px;
  }

  /* ── Topbar — mirrors dash-nav ── */
  .sb-topbar {
    position: sticky; top: 0; z-index: 20;
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px;
    flex-shrink: 0;
  }
  .sb-topbar-left { display: flex; align-items: center; gap: 10px; }
  .sb-logo {
    width: 28px; height: 28px;
    background: var(--teal);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
  }
  .sb-topbar-title {
    font-size: 15px; font-weight: 700;
    color: var(--teal-d); letter-spacing: -0.3px;
  }
  .sb-topbar-right { display: flex; align-items: center; gap: 8px; }

  /* Buttons — match dash-logout / banner-update-btn */
  .sb-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 14px; border-radius: 8px;
    border: 1.5px solid var(--border);
    background: var(--white);
    font-size: 12.5px; font-weight: 500;
    cursor: pointer; color: var(--muted);
    font-family: 'DM Sans', sans-serif;
    transition: color 0.15s, border-color 0.15s;
  }
  .sb-btn:hover { color: var(--teal); border-color: var(--teal); }
  .sb-btn--primary {
    background: var(--teal); border-color: var(--teal); color: #fff;
  }
  .sb-btn--primary:hover { background: var(--teal-d); border-color: var(--teal-d); color: #fff; }
  .sb-btn--primary:active { transform: scale(0.98); }

  /* ── Workspace ── */
  .sb-workspace {
    display: grid;
    grid-template-columns: var(--sb-sidebar-w) 1fr var(--sb-panel-w);
    flex: 1;
    overflow: hidden;
  }

  /* ── Sidebar ── */
  .sb-sidebar {
    border-right: 1px solid var(--border);
    background: var(--bg);
    display: flex; flex-direction: column; overflow: hidden;
  }
  .sb-sidebar-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }
  .sb-sidebar-label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--muted);
  }
  .sb-icon-btn {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px; border: 1.5px solid var(--border);
    background: var(--white); cursor: pointer; color: var(--muted);
    transition: all 0.15s;
  }
  .sb-icon-btn:hover { border-color: var(--teal); color: var(--teal); }
  .sb-icon-btn--danger:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

  /* Section list — mirrors action-row feel */
  .sb-sections-list { flex: 1; overflow-y: auto; padding: 0; }
  .sb-section-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer; transition: opacity 0.15s;
    background: var(--white);
  }
  .sb-section-item:first-child { border-top: 1px solid var(--border); }
  .sb-section-item:hover { opacity: 0.7; }
  .sb-section-item.active { background: var(--bg); }
  .sb-section-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--border); flex-shrink: 0;
  }
  .sb-section-item.active .sb-section-dot { background: var(--teal); }
  .sb-section-name {
    font-size: 14px; font-weight: 600; color: var(--teal-d);
    flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .sb-section-count { font-size: 11.5px; color: var(--muted); flex-shrink: 0; }
  .sb-section-del {
    width: 20px; height: 20px; display: none; align-items: center; justify-content: center;
    border-radius: 4px; border: none; background: none; cursor: pointer; color: var(--muted);
  }
  .sb-section-del:hover { color: #ef4444; }
  .sb-section-item:hover .sb-section-del { display: flex; }

  .sb-add-section-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px; margin: 0;
    border: none; border-top: 1px dashed var(--border);
    background: none; cursor: pointer; font-size: 12.5px;
    color: var(--muted); font-family: 'DM Sans', sans-serif;
    width: 100%; transition: color 0.15s;
  }
  .sb-add-section-btn:hover { color: var(--teal); }

  /* ── Main ── */
  .sb-main {
    flex: 1; overflow-y: auto;
    padding: 28px 24px 48px;
    display: flex; flex-direction: column; gap: 24px;
    background: var(--bg);
  }

  /* Onboarding — mirrors dash-version-banner */
  .sb-onboard {
    display: flex; align-items: flex-start; gap: 16px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 16px;
  }
  .sb-onboard-icon {
    width: 36px; height: 36px; background: var(--teal); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sb-onboard-body { flex: 1; }
  .sb-onboard-title {
    font-size: 12px; font-weight: 600; color: var(--teal);
    letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 4px;
  }
  .sb-onboard-desc { font-size: 13px; color: var(--text); line-height: 1.5; margin-bottom: 12px; }
  .sb-onboard-steps { display: flex; flex-wrap: wrap; gap: 8px; }
  .sb-onboard-step { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--muted); }
  .sb-step-num {
    width: 18px; height: 18px; border-radius: 50%; background: var(--teal); color: #fff;
    font-size: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sb-onboard-close {
    background: none; border: none; cursor: pointer; color: var(--muted); padding: 0; flex-shrink: 0;
    transition: color 0.15s;
  }
  .sb-onboard-close:hover { color: var(--text); }

  /* Section heading — mirrors dash-heading */
  .sb-section-heading { display: flex; flex-direction: column; gap: 4px; }
  .sb-section-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal);
  }

  /* Section card — mirrors dash-version-banner white card */
  .sb-section-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r);
    overflow: hidden;
  }
  .sb-section-card-head {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .sb-section-card-label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
  }
  .sb-section-title-input {
    width: 100%; font-size: 20px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.4px;
    border: none; background: none; outline: none;
    font-family: 'DM Sans', sans-serif; margin-bottom: 4px;
  }
  .sb-section-title-input::placeholder { color: var(--muted); font-weight: 400; font-size: 18px; }
  .sb-section-desc-input {
    width: 100%; font-size: 13.5px; color: var(--muted);
    border: none; background: none; outline: none; resize: none;
    font-family: 'DM Sans', sans-serif; line-height: 1.6;
  }
  .sb-section-desc-input::placeholder { color: var(--border); }

  /* Fields — mirrors dash-actions list */
  .sb-fields-area { display: flex; flex-direction: column; }

  /* Empty state */
  .sb-fields-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 48px 24px; gap: 8px; text-align: center;
  }
  .sb-fields-empty-icon {
    width: 48px; height: 48px; border-radius: 12px; background: var(--bg);
    border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
    color: var(--muted);
  }
  .sb-fields-empty-title { font-size: 14px; font-weight: 600; color: var(--teal-d); }
  .sb-fields-empty-desc { font-size: 13px; color: var(--muted); max-width: 240px; line-height: 1.6; }
  .sb-fields-empty-hint {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: var(--teal); margin-top: 4px;
  }

  /* Field card — mirrors action-row */
  .sb-field-card {
    border-bottom: 1px solid var(--border);
    background: var(--white); overflow: hidden;
    transition: opacity 0.15s;
  }
  .sb-field-card:last-child { border-bottom: none; }
  .sb-field-card:hover { opacity: 0.85; }
  .sb-field-card.open { opacity: 1; }

  .sb-field-row {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 20px; cursor: pointer;
  }
  .sb-field-drag { color: var(--muted); cursor: grab; flex-shrink: 0; }
  .sb-field-type-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 500;
    background: var(--bg); color: var(--muted);
    border: 1.5px solid var(--border);
    white-space: nowrap;
  }
  .sb-field-name { font-size: 14px; font-weight: 600; color: var(--teal-d); flex: 1; }
  .sb-field-req { font-size: 12px; color: #ef4444; font-weight: 500; white-space: nowrap; }
  .sb-field-actions { display: flex; align-items: center; gap: 4px; }

  /* Field editor */
  .sb-field-editor {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg);
    display: flex; flex-direction: column; gap: 12px;
  }
  .sb-editor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .sb-fg { display: flex; flex-direction: column; gap: 5px; }
  .sb-fg label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.5px;
    text-transform: uppercase; color: var(--muted);
  }
  .sb-fg input, .sb-fg textarea, .sb-fg select {
    width: 100%; padding: 9px 12px;
    border-radius: 8px; border: 1.5px solid var(--border);
    background: var(--white); font-size: 13px; color: var(--text);
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: border-color 0.15s;
  }
  .sb-fg input:focus, .sb-fg textarea:focus { border-color: var(--teal); background: var(--bg); }
  .sb-fg textarea { resize: vertical; min-height: 72px; }

  /* Toggle */
  .sb-toggle-row { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .sb-toggle {
    width: 34px; height: 20px; border-radius: 10px;
    background: var(--border); position: relative; cursor: pointer;
    border: none; transition: background 0.15s; flex-shrink: 0;
  }
  .sb-toggle.on { background: var(--teal); }
  .sb-toggle::after {
    content: ''; position: absolute;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff; top: 2px; left: 2px; transition: left 0.15s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .sb-toggle.on::after { left: 16px; }
  .sb-toggle-label { font-size: 13px; color: var(--text); }

  /* ── Right panel ── */
  .sb-panel {
    border-left: 1px solid var(--border);
    background: var(--white);
    display: flex; flex-direction: column; overflow: hidden;
  }
  .sb-panel-head {
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }
  .sb-panel-search {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 10px; border-radius: 8px;
    border: 1.5px solid var(--border); background: var(--bg);
    margin-top: 10px; transition: border-color 0.15s;
  }
  .sb-panel-search:focus-within { border-color: var(--teal); }
  .sb-panel-search input {
    border: none; background: none; outline: none;
    font-size: 13px; font-family: 'DM Sans', sans-serif; width: 100%; color: var(--text);
  }
  .sb-panel-search input::placeholder { color: var(--muted); }
  .sb-panel-body { flex: 1; overflow-y: auto; padding: 0; }
  .sb-panel-group { margin-bottom: 0; }
  .sb-panel-group-label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--muted);
    padding: 12px 16px 6px;
  }

  /* Field buttons — mirrors action-row */
  .sb-field-btn {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 16px;
    border-bottom: 1px solid var(--border);
    border-top: none; border-left: none; border-right: none;
    background: var(--white); cursor: pointer;
    font-size: 13px; color: var(--text);
    font-family: 'DM Sans', sans-serif;
    width: 100%; text-align: left;
    transition: opacity 0.15s;
  }
  .sb-field-btn:hover { opacity: 0.7; }
  .sb-fb-icon {
    width: 28px; height: 28px; border-radius: 8px;
    background: var(--bg); border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: var(--muted);
  }
  .sb-fb-label { flex: 1; font-weight: 500; font-size: 13px; color: var(--teal-d); }

  /* ── Status bar ── */
  .sb-statusbar {
    height: 32px; background: var(--white);
    border-top: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 24px; gap: 20px; flex-shrink: 0;
  }
  .sb-status-item {
    display: flex; align-items: center; gap: 5px;
    font-size: 11.5px; color: var(--muted);
  }
  .sb-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--teal-l); }

  /* ── Feature tags — mirrors dash-feature-tag ── */
  .sb-tag {
    padding: 5px 12px; border-radius: 20px;
    border: 1.5px solid var(--border); background: var(--white);
    font-size: 12px; font-weight: 500; color: var(--muted);
  }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .sb-workspace { grid-template-columns: var(--sb-sidebar-w) 1fr; }
    .sb-panel { display: none; }
  }
  @media (max-width: 768px) {
    .sb-workspace { grid-template-columns: 1fr; }
    .sb-sidebar { display: none; }
    .sb-topbar { flex-wrap: wrap; padding: 12px; gap: 10px; }
    .sb-topbar-right { flex-wrap: wrap; }
    .sb-btn { flex: 1; justify-content: center; }
    .sb-editor-grid { grid-template-columns: 1fr; }
    .sb-main { padding: 20px 16px 48px; }
  }
`;