import React, { useState } from 'react';
import {
  Plus, Trash2, Copy, Eye, Download, Upload, AlignLeft,
  Mail, Hash, ChevronDown, CheckSquare, Check, AlignJustify,
  Calendar, Clock, MapPin, Image, Star, GripVertical, Info,
  ClipboardList, X, Save, ArrowRight, List, User, Phone, 
  Link as LinkIcon, PenTool, FileText, SlidersHorizontal, TextQuote
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'textarea' | 'date' | 'time' | 'location' | 'image' | 'rating' | 'signature' | 'file' | 'slider' | 'info_block';
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  content?: string;
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

// ─── Comprehensive Field Groups ─────────────
const FIELD_GROUPS = [
  {
    label: 'Contact Info',
    fields: [
      { id: 'full_name', type: 'text', label: 'Full Name', Icon: User, placeholder: 'e.g. John Doe' },
      { id: 'phone', type: 'tel', label: 'Phone Number', Icon: Phone, placeholder: 'e.g. 0712 345 678' },
      { id: 'email', type: 'email', label: 'Email Address', Icon: Mail, placeholder: 'e.g. name@example.com' },
    ],
  },
  {
    label: 'Text & Numbers',
    fields: [
      { id: 'text', type: 'text', label: 'Short Answer', Icon: AlignLeft, placeholder: 'Short text...' },
      { id: 'textarea', type: 'textarea', label: 'Paragraph', Icon: AlignJustify, placeholder: 'Detailed answer...' },
      { id: 'number', type: 'number', label: 'Number', Icon: Hash, placeholder: '0' },
      { id: 'url', type: 'url', label: 'Website Link', Icon: LinkIcon, placeholder: 'https://...' },
    ],
  },
  {
    label: 'Choice & Rating',
    fields: [
      { id: 'select', type: 'select', label: 'Dropdown', Icon: ChevronDown },
      { id: 'multiselect', type: 'multiselect', label: 'Multi-select', Icon: List },
      { id: 'checkbox', type: 'checkbox', label: 'Checkbox', Icon: CheckSquare },
      { id: 'rating', type: 'rating', label: 'Star Rating', Icon: Star },
    ],
  },
  {
    label: 'Media, Files & Location',
    fields: [
      { id: 'image', type: 'image', label: 'Camera / Image', Icon: Image },
      { id: 'file', type: 'file', label: 'Document Upload', Icon: FileText },
      { id: 'signature', type: 'signature', label: 'E-Signature', Icon: PenTool },
      { id: 'location', type: 'location', label: 'GPS Location', Icon: MapPin },
    ],
  },
  {
    label: 'Advanced & Layout',
    fields: [
      { id: 'slider', type: 'slider', label: 'Range Slider', Icon: SlidersHorizontal },
      { id: 'date', type: 'date', label: 'Date', Icon: Calendar },
      { id: 'time', type: 'time', label: 'Time', Icon: Clock },
      { id: 'info_block', type: 'info_block', label: 'Instructions Block', Icon: TextQuote, placeholder: 'Read this carefully...' },
    ],
  },
];

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  text: AlignLeft,
  email: Mail,
  tel: Phone,
  url: LinkIcon,
  number: Hash,
  textarea: AlignJustify,
  select: ChevronDown,
  multiselect: List,
  checkbox: CheckSquare,
  rating: Star,
  date: Calendar,
  time: Clock,
  image: Image,
  file: FileText,
  signature: PenTool,
  location: MapPin,
  slider: SlidersHorizontal,
  info_block: TextQuote
};

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
  const [isFieldPanelOpen, setIsFieldPanelOpen] = useState(false);

  const selectedSection = config.sections.find((s) => s.id === selectedSectionId);
  const totalFields = config.sections.reduce((a, s) => a + s.fields.length, 0);

  const toggleFieldPanel = () => {
    setIsFieldPanelOpen((prev) => !prev);
  };

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

  const addFieldToSection = (fieldId: string) => {
    if (!selectedSection) return;
    const fieldDef = FIELD_GROUPS.flatMap((g) => g.fields).find((f) => f.id === fieldId);
    if (!fieldDef) return;

    const baseType = fieldDef.type as FormField['type'];
    const newField: FormField = {
      id: uid(),
      type: baseType,
      label: fieldDef.label,
      name: `field_${Date.now()}`,
      required: baseType !== 'info_block', 
      placeholder: fieldDef.placeholder || '',
      content: baseType === 'info_block' ? 'Please read these instructions before proceeding.' : undefined,
      hint: '',
      minValue: baseType === 'slider' ? 0 : undefined,
      maxValue: baseType === 'slider' ? 10 : undefined,
      options:
        baseType === 'select' || baseType === 'multiselect' || baseType === 'checkbox'
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
    if (window.innerWidth <= 1024) setIsFieldPanelOpen(false); // Close panel on mobile after adding
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

  const filteredGroups = FIELD_GROUPS.map((g) => ({
    ...g,
    fields: g.fields.filter(
      (f) =>
        !fieldSearch ||
        f.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
        f.type.includes(fieldSearch.toLowerCase())
    ),
  })).filter((g) => g.fields.length > 0);

  return (
    <>
      <style>{css}</style>
      <div className="sb-root">

        <div className="sb-topbar">
          <div className="sb-topbar-left">
            <div className="sb-logo">
              <ClipboardList size={16} color="#fff" />
            </div>
            <span className="sb-topbar-title">Survey builder</span>
          </div>
          <div className="sb-topbar-right">
            {!readOnly && (
              <button className="sb-btn sb-panel-toggle" onClick={toggleFieldPanel}>
                <Plus size={14} /> Fields
              </button>
            )}
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

          <div className="sb-main">
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
                        const FieldIcon = TYPE_ICON_MAP[field.type] || AlignLeft;
                        const isOpen = editingFieldId === field.id;
                        
                        const isInfoBlock = field.type === 'info_block';
                        const needsOptions = ['select', 'multiselect', 'checkbox'].includes(field.type);
                        const needsRange = ['number', 'slider'].includes(field.type); 

                        return (
                          <div
                            key={field.id}
                            className={`sb-field-card${isOpen ? ' open' : ''}`}
                          >
                            <div
                              className="sb-field-row"
                              onClick={() => !readOnly && setEditingFieldId(isOpen ? null : field.id)}
                            >
                              <span className="sb-field-drag">
                                <GripVertical size={14} />
                              </span>
                              <span className="sb-field-type-badge">
                                <FieldIcon size={11} />
                                {field.type}
                              </span>
                              <span className="sb-field-name">{field.label}</span>
                              {field.required && !isInfoBlock && <span className="sb-field-req">Required</span>}
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

                            {isOpen && !readOnly && (
                              <div className="sb-field-editor">
                                
                                {isInfoBlock ? (
                                  <div className="sb-fg" style={{ marginBottom: 12 }}>
                                    <label>Instruction Text (Information Block)</label>
                                    <textarea
                                      rows={4}
                                      value={field.content || ''}
                                      placeholder="Type your instructions or disclaimer here..."
                                      onChange={(e) => updateField(field.id, { content: e.target.value })}
                                    />
                                  </div>
                                ) : (
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
                                      <label>Field Data ID</label>
                                      <input
                                        type="text"
                                        value={field.name}
                                        placeholder="field_name"
                                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                                      />
                                    </div>
                                    {field.type !== 'signature' && field.type !== 'file' && (
                                      <div className="sb-fg">
                                        <label>Placeholder</label>
                                        <input
                                          type="text"
                                          value={field.placeholder || ''}
                                          placeholder="Placeholder text"
                                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                        />
                                      </div>
                                    )}
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
                                )}

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
                                      <label>Min value {field.type === 'slider' && '(e.g. 0)'}</label>
                                      <input
                                        type="number"
                                        value={field.minValue ?? ''}
                                        placeholder="0"
                                        onChange={(e) => updateField(field.id, { minValue: Number(e.target.value) })}
                                      />
                                    </div>
                                    <div className="sb-fg">
                                      <label>Max value {field.type === 'slider' && '(e.g. 10)'}</label>
                                      <input
                                        type="number"
                                        value={field.maxValue ?? ''}
                                        placeholder="10"
                                        onChange={(e) => updateField(field.id, { maxValue: Number(e.target.value) })}
                                      />
                                    </div>
                                  </div>
                                )}

                                {!isInfoBlock && (
                                  <label className="sb-toggle-row">
                                    <div
                                      className={`sb-toggle${field.required ? ' on' : ''}`}
                                      onClick={() => updateField(field.id, { required: !field.required })}
                                    />
                                    <span className="sb-toggle-label">Required field</span>
                                  </label>
                                )}
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

          {!readOnly && (
            <div className={`sb-panel${isFieldPanelOpen ? ' open' : ''}`}>
              <div className="sb-panel-head">
                <span className="sb-sidebar-label">Add field</span>
                <button className="sb-icon-btn sb-panel-close" onClick={() => setIsFieldPanelOpen(false)} title="Close field panel">
                  <X size={14} />
                </button>
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
                    {group.fields.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        className="sb-field-btn"
                        onClick={() => addFieldToSection(id)}
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
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --teal:   #329D9C;
    --teal-d: #205072;
    --teal-l: #56C596;
    --foam:   #e8f5f2;
    --bg:     #f6fbf8;
    --border: #e2ede8;
    --text:   #1c3a2e;
    --muted:  #7a9a8a;
    --white:  #ffffff;
    --r:      12px;
    --sb-sidebar-w: 240px;
    --sb-panel-w:   260px;
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

  .sb-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 8px;
    border: 1.5px solid var(--border);
    background: var(--white);
    font-size: 12.5px; font-weight: 500;
    cursor: pointer; color: var(--teal-d);
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .sb-panel-toggle { display: none; }
  .sb-btn:hover { background: var(--bg); border-color: var(--teal); color: var(--teal); }
  .sb-btn--primary {
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-l) 100%);
    border-color: transparent; 
    color: #fff;
  }
  .sb-btn--primary:hover { 
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(50, 157, 156, 0.25);
    color: #fff; 
  }
  .sb-btn--primary:active { transform: scale(0.98); }

  .sb-workspace {
    display: grid;
    grid-template-columns: var(--sb-sidebar-w) 1fr var(--sb-panel-w);
    flex: 1;
    overflow: hidden;
  }

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
  .sb-icon-btn:hover { border-color: var(--teal); color: var(--teal); background: var(--foam); }
  .sb-icon-btn--danger:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

  .sb-sections-list { flex: 1; overflow-y: auto; padding: 0; }
  .sb-section-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer; transition: opacity 0.15s;
    background: var(--white);
  }
  .sb-section-item:first-child { border-top: 1px solid var(--border); }
  .sb-section-item:hover { opacity: 0.8; }
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

  .sb-main {
    flex: 1; overflow-y: auto;
    padding: 24px 24px 48px;
    display: flex; flex-direction: column; gap: 24px;
    background: var(--bg);
  }

  .sb-onboard {
    display: flex; align-items: flex-start; gap: 16px;
    background: var(--white);
    border: 1.5px solid var(--border);
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
  .sb-onboard-close:hover { color: var(--teal-d); }

  .sb-section-heading { display: flex; flex-direction: column; gap: 4px; }
  .sb-section-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal);
  }

  .sb-section-card {
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--r);
    overflow: hidden;
  }
  .sb-section-card-head {
    padding: 20px;
    border-bottom: 1px solid var(--border);
  }
  .sb-section-card-label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
  }
  .sb-section-title-input {
    width: 100%; font-size: 22px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.4px;
    border: none; background: none; outline: none;
    font-family: 'DM Sans', sans-serif; margin-bottom: 6px;
  }
  .sb-section-title-input::placeholder { color: var(--muted); font-weight: 500; }
  .sb-section-desc-input {
    width: 100%; font-size: 14px; color: var(--muted);
    border: none; background: none; outline: none; resize: none;
    font-family: 'DM Sans', sans-serif; line-height: 1.6;
  }
  .sb-section-desc-input::placeholder { color: var(--muted); opacity: 0.6; }

  .sb-fields-area { display: flex; flex-direction: column; }

  .sb-fields-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 60px 24px; gap: 10px; text-align: center;
  }
  .sb-fields-empty-icon {
    width: 48px; height: 48px; border-radius: 12px; background: var(--bg);
    border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
    color: var(--muted);
  }
  .sb-fields-empty-title { font-size: 16px; font-weight: 600; color: var(--teal-d); }
  .sb-fields-empty-desc { font-size: 14px; color: var(--muted); max-width: 260px; line-height: 1.6; }
  .sb-fields-empty-hint {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 500; color: var(--teal); margin-top: 4px;
  }

  .sb-field-card {
    border-bottom: 1px solid var(--border);
    background: var(--white); overflow: hidden;
    transition: background 0.15s;
  }
  .sb-field-card:last-child { border-bottom: none; }
  .sb-field-card:hover { background: var(--bg); }
  .sb-field-card.open { background: var(--white); }

  .sb-field-row {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px; cursor: pointer;
  }
  .sb-field-drag { color: var(--muted); cursor: grab; flex-shrink: 0; }
  .sb-field-type-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 600;
    background: var(--foam); color: var(--teal-d);
    white-space: nowrap;
  }
  .sb-field-name { font-size: 14px; font-weight: 600; color: var(--teal-d); flex: 1; }
  .sb-field-req { font-size: 12px; color: #ef4444; font-weight: 500; white-space: nowrap; }
  .sb-field-actions { display: flex; align-items: center; gap: 6px; }

  .sb-field-editor {
    padding: 20px;
    border-top: 1px solid var(--border);
    background: var(--bg);
    display: flex; flex-direction: column; gap: 16px;
  }
  .sb-editor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .sb-fg { display: flex; flex-direction: column; gap: 6px; }
  .sb-fg label {
    font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; color: var(--teal-d);
  }
  .sb-fg input, .sb-fg textarea, .sb-fg select {
    width: 100%; padding: 10px 14px;
    border-radius: 8px; border: 1.5px solid var(--border);
    background: var(--white); font-size: 14px; color: var(--text);
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .sb-fg input:focus, .sb-fg textarea:focus { 
    border-color: var(--teal); 
    box-shadow: 0 0 0 3px var(--foam); 
  }
  .sb-fg textarea { resize: vertical; min-height: 80px; }

  .sb-toggle-row { display: flex; align-items: center; gap: 10px; cursor: pointer; margin-top: 4px; }
  .sb-toggle {
    width: 36px; height: 20px; border-radius: 10px;
    background: var(--border); position: relative; cursor: pointer;
    border: none; transition: background 0.2s; flex-shrink: 0;
  }
  .sb-toggle.on { background: var(--teal); }
  .sb-toggle::after {
    content: ''; position: absolute;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff; top: 2px; left: 2px; transition: left 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .sb-toggle.on::after { left: 18px; }
  .sb-toggle-label { font-size: 13px; font-weight: 500; color: var(--teal-d); }

  .sb-panel {
    border-left: 1px solid var(--border);
    background: var(--white);
    display: flex; flex-direction: column; overflow: hidden;
  }
  .sb-panel-head {
    position: relative;
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }
  .sb-panel-search {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: 8px;
    border: 1.5px solid var(--border); background: var(--bg);
    margin-top: 12px; transition: border-color 0.15s;
  }
  .sb-panel-search:focus-within { border-color: var(--teal); }
  .sb-panel-search input {
    border: none; background: none; outline: none;
    font-size: 13px; font-family: 'DM Sans', sans-serif; width: 100%; color: var(--text);
    min-width: 0;
  }
  .sb-panel-search input::placeholder { color: var(--muted); }
  .sb-panel-body { flex: 1; overflow-y: auto; padding: 0; }
  .sb-panel-group { margin-bottom: 0; }
  .sb-panel-close {
    display: none;
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    background: var(--white);
    color: var(--muted);
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .sb-panel-close:hover { border-color: var(--teal); color: var(--teal); background: var(--foam); }
  .sb-panel-group-label {
    font-size: 11px; font-weight: 600; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--muted);
    padding: 14px 16px 8px;
  }

  .sb-field-btn {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    border-top: none; border-left: none; border-right: none;
    background: var(--white); cursor: pointer;
    font-size: 13px; color: var(--text);
    font-family: 'DM Sans', sans-serif;
    width: 100%; text-align: left;
    transition: background 0.15s;
  }
  .sb-field-btn:hover { background: var(--bg); }
  .sb-fb-icon {
    width: 28px; height: 28px; border-radius: 8px;
    background: var(--white); border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: var(--teal-d);
  }
  .sb-field-btn:hover .sb-fb-icon { border-color: var(--teal); color: var(--teal); background: var(--foam); }
  .sb-fb-label { flex: 1; font-weight: 500; font-size: 13px; color: var(--teal-d); }

  .sb-statusbar {
    height: 36px; background: var(--white);
    border-top: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 24px; gap: 20px; flex-shrink: 0;
  }
  .sb-status-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 500; color: var(--muted);
  }
  .sb-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--teal-l); }

  @media (max-width: 1024px) {
    .sb-workspace { grid-template-columns: var(--sb-sidebar-w) 1fr; }
    .sb-panel { 
      display: none; 
      position: absolute; 
      top: 0; right: 0; 
      width: 100%; max-width: 320px; 
      height: 100vh; max-height: 100vh; 
      z-index: 30; 
      box-shadow: -8px 0 32px rgba(0,0,0,0.1); 
    }
    .sb-panel.open { display: flex; }
    .sb-panel-toggle { display: inline-flex; }
    .sb-panel-close { display: flex; }
  }
  
  @media (max-width: 768px) {
    .sb-workspace { grid-template-columns: 1fr; }
    .sb-sidebar { display: none; }
    
    .sb-topbar { 
      padding: 16px; 
      flex-direction: column; 
      align-items: stretch;
      gap: 16px; 
    }
    .sb-topbar-left { justify-content: flex-start; }
    
    .sb-topbar-right { 
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      width: 100%;
    }
    
    .sb-btn { width: 100%; justify-content: center; }
    .sb-btn--primary { grid-column: 1 / -1; }
    
    .sb-editor-grid { grid-template-columns: 1fr; gap: 12px; }
    .sb-main { padding: 16px 16px 100px; gap: 16px; } 
    .sb-statusbar { display: none; }
    
    .sb-section-title-input { font-size: 20px; }
    .sb-fields-empty { padding: 40px 20px; }
    
    .sb-field-row { padding: 12px 16px; gap: 10px; }
    .sb-field-actions { opacity: 1; }
  }
`;