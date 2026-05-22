import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, AlertCircle, Check, Loader, 
  ArrowRight, ArrowLeft, Save, Image as ImageIcon,
  FileText, Info
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../config/api';
import { wasteApiService } from '../services/wasteApi';

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

interface DynamicSurveyFormProps {
  surveyId: number;
  formConfig: SurveyFormConfig;
  onSubmit?: (data: any) => void;
  readOnly?: boolean;
}

const getAutoCompleteAttribute = (label: string, type: string) => {
  const l = label.toLowerCase();
  if (type === 'email' || l.includes('email')) return 'email';
  if (l.includes('phone') || l.includes('mobile') || l.includes('tel')) return 'tel';
  if (l === 'full name' || l === 'name') return 'name';
  if (l.includes('first name')) return 'given-name';
  if (l.includes('last name') || l.includes('surname')) return 'family-name';
  if (l.includes('address') && !l.includes('email')) return 'street-address';
  return 'on'; 
};

// ─── Signature Pad Component ──────────────────────────────────
const SignaturePad = ({ value, onChange, readOnly }: { value: string, onChange: (v: string) => void, readOnly: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !value) {
      canvas.width = canvas.offsetWidth;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f6fbf8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#205072';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (!readOnly && canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  if (value) {
    return (
      <div className="survey-signature-preview">
        <img src={value} alt="Signature" />
        {!readOnly && (
          <button type="button" onClick={() => onChange('')} className="survey-image-clear">
            Clear Signature
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="survey-signature-pad">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: 'none' }}
      />
      <div className="survey-signature-hint">Use your finger or mouse to sign above</div>
    </div>
  );
};


export const DynamicSurveyForm: React.FC<DynamicSurveyFormProps> = ({
  surveyId,
  formConfig,
  onSubmit,
  readOnly = false,
}) => {
  const { showSuccess, showError } = useNotification();
  const { currentProjectId, user } = useAuth();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locatingPosition, setLocatingPosition] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({});

  useEffect(() => {
    setCurrentSectionIndex(0);
  }, [formConfig]);

  if (!formConfig || !formConfig.sections || formConfig.sections.length === 0) {
    return <div className="survey-empty-state">No configuration available for this survey.</div>;
  }

  // FIXED: Updates form data so validation works
  const captureLocation = (fieldName: string) => {
    setLocatingPosition(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          handleFieldChange(fieldName, `${coords.latitude}, ${coords.longitude}`);
          showSuccess('Location successfully captured');
          setLocatingPosition(false);
        },
        () => {
          showError('Could not get location. Please enable location services.');
          setLocatingPosition(false);
        }
      );
    } else {
      showError('Geolocation not supported by this browser');
      setLocatingPosition(false);
    }
  };

  const validateFields = (fields: FormField[]): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.type === 'info_block') return; 
      
      const value = formData[field.name];
      const isPhone = field.label.toLowerCase().includes('phone') || field.type === 'tel';

      if (field.required && (value === undefined || value === null || value === '' || (typeof value === 'string' && !value.trim()))) {
        newErrors[field.name] = 'This field is required';
      }

      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }

      if (value && field.type === 'number' && !isPhone) {
        const num = Number(value);
        if (isNaN(num)) {
          newErrors[field.name] = 'Please enter a valid number';
        } else if (field.minValue !== undefined && num < field.minValue) {
          newErrors[field.name] = `Value must be at least ${field.minValue}`;
        } else if (field.maxValue !== undefined && num > field.maxValue) {
          newErrors[field.name] = `Value cannot exceed ${field.maxValue}`;
        }
      }
    });

    return newErrors;
  };

  const validateForm = (): boolean => {
    const fields = formConfig.sections.flatMap((section) => section.fields);
    const newErrors = validateFields(fields);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentSection = (): boolean => {
    const sectionFields = formConfig.sections[currentSectionIndex].fields;
    const newErrors = validateFields(sectionFields);
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: Uses wasteApiService instead of raw fetch
  const handleSubmit = async (submitAsDraft: boolean = false) => {
    if (!submitAsDraft && !validateForm()) {
      showError('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      await wasteApiService.submitSurveyResponse(
        surveyId,
        formData,
        location?.latitude,
        location?.longitude,
        submitAsDraft,
        currentProjectId,
        user?.email,
        user?.name
      );

      showSuccess(submitAsDraft ? 'Draft saved successfully' : 'Survey submitted successfully');
      
      if (!submitAsDraft) {
        setFormData({});
        setCurrentSectionIndex(0);
        setLocation(null);
      }
      
      onSubmit?.(formData);
    } catch (error: any) {
      showError(error.message || 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (!validateCurrentSection()) {
      showError('Please complete required fields before continuing');
      return;
    }
    if (currentSectionIndex < formConfig.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // FIXED: Uses wasteApiService for images, and correct field names for general files
  const handleFileUpload = async (fieldName: string, file: File, type: 'image' | 'file') => {
    try {
      if (type === 'image') {
        const imageUrl = await wasteApiService.uploadImage(file);
        handleFieldChange(fieldName, imageUrl);
        showSuccess('Image uploaded successfully');
      } else {
        // Fallback for document uploads using raw fetch (if backend doesn't have explicit uploadFile method)
        const formDataToSend = new FormData();
        formDataToSend.append('file', file);
        
        const response = await fetch(buildApiUrl('/upload/file'), {
          method: 'POST',
          body: formDataToSend,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'File upload failed');
        }

        const result = await response.json();
        // Handle variations in how your backend returns document URLs
        handleFieldChange(fieldName, result.data.url || result.data.file_url);
        showSuccess('File uploaded successfully');
      }
    } catch (error: any) {
      showError(error.message || `Failed to upload ${type}`);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? '';
    const error = errors[field.name];
    const hasError = !!error;

    const baseProps = {
      className: `survey-input ${hasError ? 'has-error' : ''}`,
      disabled: readOnly,
      value,
      onChange: (e: any) => handleFieldChange(field.name, e.target.value),
    };

    switch (field.type) {
      case 'info_block':
        return (
          <div className="survey-info-block">
            <Info size={20} className="survey-info-icon" />
            <div className="survey-info-content">
              {field.content || field.placeholder || 'Please read instructions carefully.'}
            </div>
          </div>
        );

      case 'slider':
        return (
          <div className="survey-slider-group">
            <input
              type="range"
              min={field.minValue || 0}
              max={field.maxValue || 100}
              value={value || field.minValue || 0}
              disabled={readOnly}
              onChange={(e) => handleFieldChange(field.name, Number(e.target.value))}
              className="survey-range-input"
            />
            <span className="survey-slider-val">{value || field.minValue || 0}</span>
          </div>
        );

      case 'text':
      case 'email':
      case 'tel':
      case 'url':
      case 'number':
      case 'date':
      case 'time': {
        const autoCompleteVal = getAutoCompleteAttribute(field.label, field.type);
        const actualInputType = (field.type === 'number' && autoCompleteVal === 'tel') ? 'tel' : field.type;

        return (
          <input
            type={actualInputType}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            min={field.minValue}
            max={field.maxValue}
            autoComplete={autoCompleteVal}
            {...baseProps}
          />
        );
      }

      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || 'Type your response here...'}
            rows={4}
            {...baseProps}
          />
        );

      case 'select':
        return (
          <div className="survey-select-wrapper">
            <select {...baseProps}>
              <option value="" disabled hidden>
                {field.placeholder || 'Choose an option...'}
              </option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multiselect':
        return (
          <div className="survey-checkbox-group">
            {field.options?.map((opt) => (
              <label key={opt} className="survey-checkbox-label">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(opt)}
                  onChange={(e) => {
                    const arr = Array.isArray(value) ? [...value] : [];
                    if (e.target.checked) arr.push(opt);
                    else arr.splice(arr.indexOf(opt), 1);
                    handleFieldChange(field.name, arr);
                  }}
                  disabled={readOnly}
                />
                <span className="survey-checkbox-custom"></span>
                <span className="survey-checkbox-text">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="survey-checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              disabled={readOnly}
            />
            <span className="survey-checkbox-custom"></span>
            <span className="survey-checkbox-text">{field.placeholder || field.label}</span>
          </label>
        );

      case 'rating':
        return (
          <div className="survey-rating-group">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`survey-rating-star ${value >= star ? 'is-active' : ''}`}
                onClick={() => handleFieldChange(field.name, star)}
                disabled={readOnly}
              >
                ★
              </button>
            ))}
          </div>
        );

      case 'signature':
        return (
          <SignaturePad 
            value={value} 
            onChange={(v) => handleFieldChange(field.name, v)} 
            readOnly={readOnly} 
          />
        );

      case 'file':
      case 'image':
        const isImage = field.type === 'image';
        return (
          <div className="survey-image-upload">
            {value ? (
              <div className="survey-file-preview">
                {isImage ? (
                  <img src={value} alt="Uploaded preview" />
                ) : (
                  <div className="survey-doc-preview">
                    <FileText size={32} color="#329D9C" />
                    <span>Document Uploaded</span>
                  </div>
                )}
                {!readOnly && (
                  <button type="button" onClick={() => handleFieldChange(field.name, '')} className="survey-image-clear">
                    Change {isImage ? 'Image' : 'File'}
                  </button>
                )}
              </div>
            ) : (
              !readOnly && (
                <label className="survey-image-dropzone">
                  {isImage ? <ImageIcon size={24} className="survey-image-icon" /> : <FileText size={24} className="survey-image-icon" />}
                  <span className="survey-image-text">Click to upload {isImage ? 'an image' : 'a file'}</span>
                  <input
                    type="file"
                    accept={isImage ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx"}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(field.name, file, field.type as 'image' | 'file');
                    }}
                    ref={(el) => {
                      if (el) fileInputRefs.current[field.name] = el;
                    }}
                  />
                </label>
              )
            )}
          </div>
        );

      case 'location':
        return (
          <div className="survey-location-group">
            {location ? (
              <div className="survey-location-success">
                <MapPin size={18} />
                <div className="survey-location-coords">
                  <strong>Location Captured</strong>
                  <span>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
                </div>
                {!readOnly && (
                  // FIXED: Now passes field.name
                  <button type="button" onClick={() => captureLocation(field.name)} className="survey-location-retry">
                    Update
                  </button>
                )}
              </div>
            ) : (
              !readOnly && (
                <button
                  type="button"
                  className="survey-location-btn"
                  // FIXED: Now passes field.name
                  onClick={() => captureLocation(field.name)}
                  disabled={locatingPosition}
                >
                  {locatingPosition ? (
                    <><Loader size={18} className="survey-spin" /> Locating...</>
                  ) : (
                    <><MapPin size={18} /> Get Current Location</>
                  )}
                </button>
              )
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const currentSection = formConfig.sections[currentSectionIndex];
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === formConfig.sections.length - 1;
  const progressPercentage = ((currentSectionIndex + 1) / formConfig.sections.length) * 100;

  return (
    <>
      <style>{css}</style>
      <div className="survey-container">
        
        {/* Progress Tracker */}
        <div className="survey-progress">
          <div className="survey-progress-header">
            <span className="survey-progress-text">
              Step {currentSectionIndex + 1} of {formConfig.sections.length}
            </span>
            <span className="survey-progress-percentage">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="survey-progress-track">
            <div 
              className="survey-progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <form className="survey-form" onSubmit={(e) => e.preventDefault()}>
          <div className="survey-section" key={currentSection.id}>
            
            <header className="survey-section-header">
              <h2 className="survey-section-title">{currentSection.title}</h2>
              {currentSection.description && (
                <p className="survey-section-desc">{currentSection.description}</p>
              )}
            </header>

            <div className="survey-fields-list">
              {currentSection.fields.map((field) => (
                <div key={field.id} className="survey-field-wrapper">
                  
                  {field.type !== 'info_block' && (
                    <div className="survey-label-group">
                      <label className="survey-label">
                        {field.label}
                        {field.required && <span className="survey-required">*</span>}
                      </label>
                      {field.hint && <span className="survey-hint">{field.hint}</span>}
                    </div>
                  )}

                  <div className="survey-input-container">
                    {renderField(field)}
                  </div>

                  {errors[field.name] && (
                    <div className="survey-error-msg">
                      <AlertCircle size={14} />
                      {errors[field.name]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="survey-actions">
            <div className="survey-actions-left">
              {!isFirstSection && (
                <button type="button" className="survey-btn survey-btn-outline" onClick={handlePrevious}>
                  <ArrowLeft size={16} /> Previous
                </button>
              )}
              {formConfig.metadata?.allowDrafts && !readOnly && (
                <button 
                  type="button" 
                  className="survey-btn survey-btn-text" 
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                >
                  <Save size={16} /> Save Draft
                </button>
              )}
            </div>

            <div className="survey-actions-right">
              {!isLastSection ? (
                <button type="button" className="survey-btn survey-btn-primary" onClick={handleNext}>
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                !readOnly && (
                  <button 
                    type="button" 
                    className="survey-btn survey-btn-success" 
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader size={16} className="survey-spin" /> Submitting...</>
                    ) : (
                      <><Check size={16} /> Submit Survey</>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

  @keyframes surveyFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes surveySpin {
    to { transform: rotate(360deg); }
  }

  .survey-container {
    max-width: 760px;
    margin: 0 auto;
    font-family: 'DM Sans', sans-serif;
    color: #1c3a2e;
    padding: 32px 20px 80px;
  }

  .survey-empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #7a9a8a;
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
  }

  /* Progress Bar */
  .survey-progress {
    margin-bottom: 48px;
  }

  .survey-progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #7a9a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .survey-progress-percentage {
    color: #329D9C;
  }

  .survey-progress-track {
    width: 100%;
    height: 4px;
    background: #e2ede8;
    border-radius: 4px;
    overflow: hidden;
  }

  .survey-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #329D9C 0%, #56C596 100%);
    border-radius: 4px;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Section Header */
  .survey-section {
    animation: surveyFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .survey-section-header {
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e2ede8;
  }

  .survey-section-title {
    font-size: 32px;
    font-weight: 700;
    color: #205072;
    margin: 0 0 12px 0;
    line-height: 1.2;
    letter-spacing: -0.5px;
  }

  .survey-section-desc {
    font-size: 16px;
    color: #7a9a8a;
    margin: 0;
    line-height: 1.6;
  }

  /* Fields Layout */
  .survey-fields-list {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .survey-field-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .survey-label-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .survey-label {
    font-size: 16px;
    font-weight: 600;
    color: #205072;
    line-height: 1.4;
  }

  .survey-required {
    color: #dc2626;
    margin-left: 4px;
    font-weight: 700;
  }

  .survey-hint {
    font-size: 14px;
    color: #7a9a8a;
    line-height: 1.5;
  }

  /* Inputs Typography & Style */
  .survey-input {
    width: 100%;
    padding: 16px 0;
    background: transparent;
    border: none;
    border-bottom: 2px solid #e2ede8;
    border-radius: 0;
    font-family: 'DM Sans', sans-serif;
    font-size: 18px;
    color: #1c3a2e;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .survey-input::placeholder {
    color: #a0baba;
    font-weight: 400;
  }

  .survey-input:focus {
    outline: none;
    border-bottom-color: #329D9C;
    box-shadow: 0 1px 0 #329D9C;
  }

  .survey-input.has-error {
    border-bottom-color: #dc2626;
  }

  .survey-input:disabled {
    opacity: 0.6;
    background: transparent;
    cursor: not-allowed;
  }

  textarea.survey-input {
    border: 2px solid #e2ede8;
    border-radius: 12px;
    padding: 16px;
    resize: vertical;
    min-height: 120px;
  }
  
  textarea.survey-input:focus {
    border-color: #329D9C;
    box-shadow: 0 0 0 3px rgba(50, 157, 156, 0.1);
  }

  /* Select */
  .survey-select-wrapper {
    position: relative;
  }

  .survey-select-wrapper::after {
    content: "▼";
    font-size: 12px;
    color: #329D9C;
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .survey-select-wrapper select {
    appearance: none;
    cursor: pointer;
    border: 2px solid #e2ede8;
    border-radius: 12px;
    padding: 16px;
    padding-right: 48px;
  }
  
  .survey-select-wrapper select:focus {
    border-color: #329D9C;
    box-shadow: 0 0 0 3px rgba(50, 157, 156, 0.1);
  }

  /* Checkboxes & Multiselect */
  .survey-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 8px;
  }

  .survey-checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    group: hover;
  }

  .survey-checkbox-label input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .survey-checkbox-custom {
    flex-shrink: 0;
    height: 24px;
    width: 24px;
    background-color: transparent;
    border: 2px solid #a0baba;
    border-radius: 6px;
    position: relative;
    transition: all 0.2s;
    margin-top: 2px;
  }

  .survey-checkbox-label:hover input ~ .survey-checkbox-custom {
    border-color: #329D9C;
  }

  .survey-checkbox-label input:checked ~ .survey-checkbox-custom {
    background-color: #329D9C;
    border-color: #329D9C;
  }

  .survey-checkbox-custom:after {
    content: "";
    position: absolute;
    display: none;
    left: 7px;
    top: 3px;
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .survey-checkbox-label input:checked ~ .survey-checkbox-custom:after {
    display: block;
  }

  .survey-checkbox-text {
    font-size: 16px;
    color: #205072;
    line-height: 1.6;
    font-weight: 400;
  }

  /* Ratings */
  .survey-rating-group {
    display: flex;
    gap: 16px;
    margin-top: 8px;
  }

  .survey-rating-star {
    background: none;
    border: none;
    font-size: 40px;
    line-height: 1;
    color: #e2ede8;
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    padding: 0;
  }

  .survey-rating-star:hover:not(:disabled) {
    transform: scale(1.1);
  }

  .survey-rating-star.is-active {
    color: #FFB020;
  }

  /* Info Block */
  .survey-info-block {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    background: #e0f2fe;
    border-left: 4px solid #0284c7;
    padding: 20px;
    border-radius: 0 12px 12px 0;
  }
  .survey-info-icon {
    color: #0284c7;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .survey-info-content {
    font-size: 16px;
    line-height: 1.6;
    color: #0369a1;
    font-weight: 500;
  }

  /* Slider */
  .survey-slider-group {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 12px 0;
  }
  .survey-range-input {
    flex: 1;
    accent-color: #329D9C;
    height: 6px;
    border-radius: 4px;
    background: #e2ede8;
    outline: none;
    -webkit-appearance: none;
  }
  .survey-range-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #329D9C;
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }
  .survey-slider-val {
    font-size: 18px;
    font-weight: 700;
    color: #205072;
    min-width: 48px;
    text-align: right;
  }

  /* Signature Pad */
  .survey-signature-pad {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .survey-signature-pad canvas {
    background: #f6fbf8;
    border: 2px dashed #a0baba;
    border-radius: 12px;
    cursor: crosshair;
    width: 100%;
    height: 150px;
  }
  .survey-signature-hint {
    font-size: 13px;
    color: #7a9a8a;
    text-align: center;
  }
  .survey-signature-preview {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .survey-signature-preview img {
    max-height: 120px;
    border: 1px solid #e2ede8;
    border-radius: 8px;
    background: white;
  }

  /* File Upload / Image */
  .survey-image-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    border: 2px dashed #a0baba;
    border-radius: 12px;
    background: #fcfdfd;
    cursor: pointer;
    transition: all 0.2s;
  }

  .survey-image-dropzone:hover {
    border-color: #329D9C;
    background: #f6fbf8;
  }

  .survey-image-dropzone input {
    display: none;
  }

  .survey-image-icon {
    color: #329D9C;
  }

  .survey-image-text {
    font-size: 15px;
    font-weight: 500;
    color: #7a9a8a;
  }

  .survey-file-preview {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .survey-file-preview img {
    max-width: 100%;
    max-height: 320px;
    border-radius: 12px;
    object-fit: contain;
  }

  .survey-doc-preview {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: #e8f5f2;
    border: 1.5px solid #329D9C;
    border-radius: 12px;
    color: #205072;
    font-weight: 600;
  }

  .survey-image-clear {
    background: transparent;
    border: none;
    color: #dc2626;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  /* Location */
  .survey-location-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 24px;
    background: #f6fbf8;
    border: 2px solid #329D9C;
    border-radius: 12px;
    color: #329D9C;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .survey-location-btn:hover:not(:disabled) {
    background: #329D9C;
    color: white;
  }

  .survey-location-success {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: #e8f5f2;
    border-radius: 12px;
    color: #1c3a2e;
  }

  .survey-location-success svg {
    color: #329D9C;
  }

  .survey-location-coords {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .survey-location-coords strong {
    font-size: 14px;
    color: #205072;
  }

  .survey-location-coords span {
    font-size: 13px;
    color: #7a9a8a;
    font-family: monospace;
    margin-top: 2px;
  }

  .survey-location-retry {
    background: none;
    border: none;
    color: #329D9C;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  /* Error Message */
  .survey-error-msg {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #dc2626;
    font-size: 14px;
    font-weight: 500;
    margin-top: 4px;
  }

  /* Action Buttons */
  .survey-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 64px;
    padding-top: 32px;
    border-top: 1px solid #e2ede8;
  }

  .survey-actions-left,
  .survey-actions-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .survey-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .survey-btn-primary {
    background: #205072;
    color: white;
    border: none;
  }

  .survey-btn-primary:hover {
    background: #153b56;
    transform: translateY(-2px);
  }

  .survey-btn-success {
    background: linear-gradient(135deg, #329D9C 0%, #56C596 100%);
    color: white;
    border: none;
  }

  .survey-btn-success:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(50, 157, 156, 0.25);
  }

  .survey-btn-outline {
    background: transparent;
    color: #205072;
    border: 2px solid #e2ede8;
  }

  .survey-btn-outline:hover {
    border-color: #205072;
  }

  .survey-btn-text {
    background: transparent;
    color: #7a9a8a;
    border: none;
    padding: 14px 16px;
  }

  .survey-btn-text:hover {
    color: #205072;
    background: #f6fbf8;
  }

  .survey-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  .survey-spin {
    animation: surveySpin 1s linear infinite;
  }

  /* Responsive styling */
  @media (max-width: 640px) {
    .survey-container {
      padding: 24px 16px 64px;
    }

    .survey-section-title {
      font-size: 26px;
    }
    
    .survey-actions {
      flex-direction: column-reverse;
      gap: 20px;
    }

    .survey-actions-left, 
    .survey-actions-right {
      width: 100%;
      flex-direction: column;
    }

    .survey-btn {
      width: 100%;
    }
  }
`;