import React, { useState } from 'react';
import { Plus, Trash2, Copy, Eye, Settings as SettingsIcon, Download, Upload, AlertCircle } from 'lucide-react';
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

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑️' },
  { value: 'checkbox', label: 'Checkbox', icon: '✓' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'time', label: 'Time', icon: '⏰' },
  { value: 'location', label: 'Location', icon: '📍' },
  { value: 'image', label: 'Image Upload', icon: '📸' },
  { value: 'rating', label: 'Rating Scale', icon: '⭐' },
];

export const SurveyBuilder: React.FC<SurveyBuilderProps> = ({
  initialConfig,
  onSave,
  onPreview,
  readOnly = false,
}) => {
  const { showSuccess, showError } = useNotification();
  const [config, setConfig] = useState<SurveyFormConfig>(
    initialConfig || {
      sections: [{ id: '1', title: 'Section 1', fields: [] }],
      metadata: { language: 'en', allowOfflineMode: true, allowDrafts: true },
    }
  );

  const [selectedSectionId, setSelectedSectionId] = useState<string>('1');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const selectedSection = config.sections.find((s) => s.id === selectedSectionId);

  const addSection = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setConfig({
      ...config,
      sections: [
        ...config.sections,
        { id: newId, title: `Section ${config.sections.length + 1}`, fields: [] },
      ],
    });
  };

  const deleteSection = (sectionId: string) => {
    if (config.sections.length === 1) {
      showError('Cannot delete the last section');
      return;
    }
    setConfig({
      ...config,
      sections: config.sections.filter((s) => s.id !== sectionId),
    });
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(config.sections[0].id);
    }
  };

  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setConfig({
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    });
  };

  const addFieldToSection = (fieldType: string) => {
    if (!selectedSection) return;

    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type: fieldType as FormField['type'],
      label: `${fieldType} Field`,
      name: `field_${Date.now()}`,
      required: false,
      placeholder: 'Enter value...',
      options: fieldType === 'select' || fieldType === 'multiselect' ? ['Option 1', 'Option 2'] : undefined,
    };

    const updatedSections = config.sections.map((s) =>
      s.id === selectedSectionId
        ? { ...s, fields: [...s.fields, newField] }
        : s
    );

    setConfig({ ...config, sections: updatedSections });
  };

  const deleteField = (fieldId: string) => {
    const updatedSections = config.sections.map((s) =>
      s.id === selectedSectionId
        ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
        : s
    );
    setConfig({ ...config, sections: updatedSections });
    setEditingFieldId(null);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    const updatedSections = config.sections.map((s) =>
      s.id === selectedSectionId
        ? {
            ...s,
            fields: s.fields.map((f) =>
              f.id === fieldId ? { ...f, ...updates } : f
            ),
          }
        : s
    );
    setConfig({ ...config, sections: updatedSections });
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
          showSuccess('Survey imported successfully');
        } else {
          showError('Invalid survey format');
        }
      } catch (error) {
        showError('Failed to parse survey file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <style>{css}</style>
      <div className="survey-builder">
        {/* Header */}
        <div className="survey-header">
          <h2>Survey Builder</h2>
          <div className="survey-header-actions">
            {!readOnly && (
              <>
                <button className="survey-btn survey-btn--secondary" onClick={handleExport}>
                  <Download size={16} /> Export
                </button>
                <label className="survey-btn survey-btn--secondary">
                  <Upload size={16} /> Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                  />
                </label>
                <button
                  className="survey-btn survey-btn--primary"
                  onClick={() => onSave?.(config)}
                >
                  Save Survey
                </button>
              </>
            )}
            <button
              className="survey-btn survey-btn--secondary"
              onClick={onPreview}
            >
              <Eye size={16} /> Preview
            </button>
          </div>
        </div>

        <div className="survey-container">
          {/* Sidebar - Sections */}
          <div className="survey-sidebar">
            <div className="survey-sidebar-header">
              <h3>Sections</h3>
              {!readOnly && (
                <button
                  className="survey-add-btn"
                  onClick={addSection}
                  title="Add Section"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            <div className="survey-sections-list">
              {config.sections.map((section) => (
                <div
                  key={section.id}
                  className={`survey-section-item ${
                    selectedSectionId === section.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedSectionId(section.id)}
                >
                  <span className="survey-section-name">{section.title}</span>
                  {!readOnly && (
                    <button
                      className="survey-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main - Field Editor */}
          <div className="survey-main">
            {selectedSection && (
              <>
                {/* Section Settings */}
                <div className="survey-section-settings">
                  <div className="survey-input-group">
                    <label>Section Title</label>
                    <input
                      type="text"
                      value={selectedSection.title}
                      onChange={(e) =>
                        updateSection(selectedSection.id, { title: e.target.value })
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div className="survey-input-group">
                    <label>Description (optional)</label>
                    <textarea
                      value={selectedSection.description || ''}
                      onChange={(e) =>
                        updateSection(selectedSection.id, { description: e.target.value })
                      }
                      disabled={readOnly}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Fields */}
                <div className="survey-fields">
                  <h4>Fields</h4>
                  {selectedSection.fields.length === 0 ? (
                    <div className="survey-empty-state">
                      <AlertCircle size={24} />
                      <p>No fields yet. Add a field from the panel on the right.</p>
                    </div>
                  ) : (
                    selectedSection.fields.map((field) => (
                      <div
                        key={field.id}
                        className={`survey-field-card ${
                          editingFieldId === field.id ? 'editing' : ''
                        }`}
                        onClick={() => !readOnly && setEditingFieldId(field.id)}
                      >
                        <div className="survey-field-header">
                          <div>
                            <span className="survey-field-type">{field.type}</span>
                            <span className="survey-field-label">{field.label}</span>
                            {field.required && <span className="survey-required">*</span>}
                          </div>
                          {!readOnly && (
                            <button
                              className="survey-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteField(field.id);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {editingFieldId === field.id && !readOnly && (
                          <div className="survey-field-editor">
                            <div className="survey-input-group">
                              <label>Label</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) =>
                                  updateField(field.id, { label: e.target.value })
                                }
                              />
                            </div>

                            <div className="survey-input-group">
                              <label>Field Name</label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) =>
                                  updateField(field.id, { name: e.target.value })
                                }
                              />
                            </div>

                            <div className="survey-input-group">
                              <label>Placeholder</label>
                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) =>
                                  updateField(field.id, { placeholder: e.target.value })
                                }
                              />
                            </div>

                            <div className="survey-input-group">
                              <label>Hint (optional)</label>
                              <input
                                type="text"
                                value={field.hint || ''}
                                onChange={(e) =>
                                  updateField(field.id, { hint: e.target.value })
                                }
                              />
                            </div>

                            <label className="survey-checkbox">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) =>
                                  updateField(field.id, { required: e.target.checked })
                                }
                              />
                              <span>Required field</span>
                            </label>

                            {(field.type === 'select' || field.type === 'multiselect') && (
                              <div className="survey-input-group">
                                <label>Options (comma-separated)</label>
                                <textarea
                                  value={field.options?.join(', ') || ''}
                                  onChange={(e) =>
                                    updateField(field.id, {
                                      options: e.target.value.split(',').map((o) => o.trim()),
                                    })
                                  }
                                  rows={3}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Panel - Field Types */}
          {!readOnly && (
            <div className="survey-right-panel">
              <h4>Add Field</h4>
              <div className="survey-field-types">
                {FIELD_TYPES.map((type) => (
                  <button
                    key={type.value}
                    className="survey-field-type-btn"
                    onClick={() => addFieldToSection(type.value)}
                    title={type.label}
                  >
                    <span className="survey-field-icon">{type.icon}</span>
                    <span className="survey-field-name">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const css = `
  .survey-builder {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .survey-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e2ede8;
    background: #f6fbf8;
  }

  .survey-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: #205072;
    margin: 0;
  }

  .survey-header-actions {
    display: flex;
    gap: 8px;
  }

  .survey-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 6px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .survey-btn--primary {
    background: linear-gradient(135deg, #329D9C 0%, #56C596 100%);
    color: white;
  }

  .survey-btn--primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(50, 157, 156, 0.3);
  }

  .survey-btn--secondary {
    background: white;
    color: #329D9C;
    border: 1.5px solid #e2ede8;
  }

  .survey-btn--secondary:hover {
    background: #f6fbf8;
    border-color: #329D9C;
  }

  .survey-container {
    display: grid;
    grid-template-columns: 220px 1fr 200px;
    gap: 0;
    flex: 1;
    overflow: hidden;
  }

  .survey-sidebar {
    border-right: 1px solid #e2ede8;
    overflow-y: auto;
    background: #f9fbfa;
  }

  .survey-sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e2ede8;
  }

  .survey-sidebar-header h3 {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    color: #205072;
    margin: 0;
  }

  .survey-add-btn {
    background: white;
    border: 1.5px solid #e2ede8;
    border-radius: 6px;
    padding: 4px;
    cursor: pointer;
    color: #329D9C;
    transition: all 0.2s;
  }

  .survey-add-btn:hover {
    background: #e8f5f2;
    border-color: #329D9C;
  }

  .survey-sections-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
  }

  .survey-section-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 6px;
    background: white;
    border: 1px solid #e2ede8;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    font-weight: 500;
    color: #1c3a2e;
  }

  .survey-section-item:hover {
    background: #e8f5f2;
    border-color: #329D9C;
  }

  .survey-section-item.active {
    background: #e8f5f2;
    border-color: #329D9C;
    color: #205072;
    font-weight: 600;
  }

  .survey-section-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .survey-delete-btn {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
    opacity: 0;
  }

  .survey-section-item:hover .survey-delete-btn {
    opacity: 1;
  }

  .survey-delete-btn:hover {
    background: rgba(220, 38, 38, 0.1);
  }

  .survey-main {
    overflow-y: auto;
    padding: 24px;
    background: white;
  }

  .survey-section-settings {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e2ede8;
  }

  .survey-input-group {
    margin-bottom: 16px;
  }

  .survey-input-group label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #205072;
    margin-bottom: 6px;
  }

  .survey-input-group input,
  .survey-input-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1.5px solid #e2ede8;
    border-radius: 6px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    color: #1c3a2e;
    transition: all 0.2s;
  }

  .survey-input-group input:focus,
  .survey-input-group textarea:focus {
    outline: none;
    border-color: #329D9C;
    background: #f6fbf8;
  }

  .survey-input-group input:disabled,
  .survey-input-group textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .survey-fields h4 {
    font-size: 14px;
    font-weight: 600;
    color: #205072;
    margin: 0 0 16px 0;
  }

  .survey-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #7a9a8a;
    text-align: center;
  }

  .survey-empty-state p {
    font-size: 13px;
    margin-top: 12px;
  }

  .survey-field-card {
    background: #f9fbfa;
    border: 1.5px solid #e2ede8;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .survey-field-card:hover {
    border-color: #329D9C;
    background: #e8f5f2;
  }

  .survey-field-card.editing {
    border-color: #329D9C;
    background: white;
    box-shadow: 0 4px 12px rgba(50, 157, 156, 0.15);
  }

  .survey-field-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .survey-field-header > div {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    flex-wrap: wrap;
  }

  .survey-field-type {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    background: #329D9C;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .survey-field-label {
    font-size: 13px;
    font-weight: 500;
    color: #1c3a2e;
  }

  .survey-required {
    color: #dc2626;
    font-weight: 700;
  }

  .survey-field-editor {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e2ede8;
  }

  .survey-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #1c3a2e;
    cursor: pointer;
    margin-bottom: 12px;
  }

  .survey-checkbox input {
    cursor: pointer;
    width: auto;
  }

  .survey-right-panel {
    border-left: 1px solid #e2ede8;
    overflow-y: auto;
    padding: 16px;
    background: #f9fbfa;
  }

  .survey-right-panel h4 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #205072;
    margin: 0 0 12px 0;
  }

  .survey-field-types {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .survey-field-type-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px 8px;
    background: white;
    border: 1.5px solid #e2ede8;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 11px;
    font-weight: 500;
    color: #1c3a2e;
  }

  .survey-field-type-btn:hover {
    background: #e8f5f2;
    border-color: #329D9C;
  }

  .survey-field-icon {
    font-size: 18px;
  }

  .survey-field-name {
    text-align: center;
    line-height: 1.2;
  }

  @media (max-width: 1024px) {
    .survey-container {
      grid-template-columns: 150px 1fr;
    }

    .survey-right-panel {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .survey-container {
      grid-template-columns: 1fr;
    }

    .survey-sidebar {
      display: none;
    }

    .survey-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .survey-header-actions {
      width: 100%;
      flex-wrap: wrap;
    }

    .survey-btn {
      flex: 1;
      justify-content: center;
    }
  }
`;
