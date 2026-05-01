import React, { useState, useRef, useEffect } from 'react';
import { Upload, MapPin, AlertCircle, Check, Loader } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { buildApiUrl } from '../config/api';

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

interface DynamicSurveyFormProps {
  surveyId: number;
  formConfig: SurveyFormConfig;
  onSubmit?: (data: any) => void;
  readOnly?: boolean;
}

export const DynamicSurveyForm: React.FC<DynamicSurveyFormProps> = ({
  surveyId,
  formConfig,
  onSubmit,
  readOnly = false,
}) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locatingPosition, setLocatingPosition] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({});

  // Get user's current location
  const captureLocation = () => {
    setLocatingPosition(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          showSuccess('Location captured');
          setLocatingPosition(false);
        },
        () => {
          showError('Could not get location. Please enable location services.');
          setLocatingPosition(false);
        }
      );
    } else {
      showError('Geolocation not supported');
      setLocatingPosition(false);
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    formConfig.sections.forEach((section) => {
      section.fields.forEach((field) => {
        const value = formData[field.name];

        if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
          newErrors[field.name] = `${field.label} is required`;
        }

        if (value && field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[field.name] = 'Invalid email format';
          }
        }

        if (value && field.type === 'number') {
          const num = Number(value);
          if (isNaN(num)) {
            newErrors[field.name] = 'Must be a number';
          } else if (field.minValue !== undefined && num < field.minValue) {
            newErrors[field.name] = `Minimum value is ${field.minValue}`;
          } else if (field.maxValue !== undefined && num > field.maxValue) {
            newErrors[field.name] = `Maximum value is ${field.maxValue}`;
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (submitAsDraft: boolean = false) => {
    if (!submitAsDraft && !validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(buildApiUrl(`/surveys/${surveyId}/submit`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          responseData: formData,
          latitude: location?.latitude,
          longitude: location?.longitude,
          isDraft: submitAsDraft,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit survey');

      showSuccess(submitAsDraft ? 'Survey saved as draft' : 'Survey submitted successfully');
      setFormData({});
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
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const response = await fetch(buildApiUrl('/upload-image'), {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      handleFieldChange(fieldName, result.data.url);
      showSuccess('Image uploaded');
    } catch (error: any) {
      showError(error.message || 'Image upload failed');
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? '';
    const error = errors[field.name];

    const fieldProps = {
      className: `form-field-input ${error ? 'error' : ''}`,
      disabled: readOnly,
      value,
      onChange: (e: any) => handleFieldChange(field.name, e.target.value),
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            {...fieldProps}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            placeholder={field.placeholder}
            {...fieldProps}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            min={field.minValue}
            max={field.maxValue}
            {...fieldProps}
          />
        );

      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            rows={4}
            {...fieldProps}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            {...fieldProps}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            {...fieldProps}
          />
        );

      case 'select':
        return (
          <select {...fieldProps}>
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="form-multiselect">
            {field.options?.map((opt) => (
              <label key={opt} className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(opt)}
                  onChange={(e) => {
                    const arr = Array.isArray(value) ? [...value] : [];
                    if (e.target.checked) {
                      arr.push(opt);
                    } else {
                      arr.splice(arr.indexOf(opt), 1);
                    }
                    handleFieldChange(field.name, arr);
                  }}
                  disabled={readOnly}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="form-checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              disabled={readOnly}
            />
            <span>{field.placeholder || field.label}</span>
          </label>
        );

      case 'rating':
        return (
          <div className="form-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`form-rating-star ${value >= star ? 'active' : ''}`}
                onClick={() => handleFieldChange(field.name, star)}
                disabled={readOnly}
                type="button"
              >
                ⭐
              </button>
            ))}
          </div>
        );

      case 'image':
        return (
          <div className="form-image-upload">
            {value && (
              <div className="form-image-preview">
                <img src={value} alt="Preview" />
              </div>
            )}
            {!readOnly && (
              <label className="form-image-label">
                <Upload size={16} /> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(field.name, file);
                  }}
                  style={{ display: 'none' }}
                  ref={(el) => {
                    if (el) fileInputRefs.current[field.name] = el;
                  }}
                  disabled={readOnly}
                />
              </label>
            )}
          </div>
        );

      case 'location':
        return (
          <div className="form-location">
            {location ? (
              <div className="form-location-display">
                <MapPin size={16} />
                <span>
                  Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    className="form-location-btn"
                    onClick={captureLocation}
                  >
                    Update
                  </button>
                )}
              </div>
            ) : (
              !readOnly && (
                <button
                  type="button"
                  className="form-location-btn form-location-btn--primary"
                  onClick={captureLocation}
                  disabled={locatingPosition}
                >
                  {locatingPosition ? (
                    <>
                      <Loader size={14} className="spin" /> Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin size={16} /> Capture Location
                    </>
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

  return (
    <>
      <style>{css}</style>
      <form className="dynamic-form">
        {formConfig.sections.map((section, sectionIndex) => (
          <div key={section.id} className="form-section">
            <div className="form-section-header">
              <h2>{section.title}</h2>
              {section.description && <p>{section.description}</p>}
            </div>

            <div className="form-fields">
              {section.fields.map((field) => (
                <div key={field.id} className="form-field">
                  <label className="form-label">
                    {field.label}
                    {field.required && <span className="form-required">*</span>}
                  </label>
                  {field.hint && <p className="form-hint">{field.hint}</p>}

                  {renderField(field)}

                  {errors[field.name] && (
                    <div className="form-error">
                      <AlertCircle size={14} />
                      {errors[field.name]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Form Actions */}
        <div className="form-actions">
          <div className="form-actions-left">
            {formConfig.metadata?.allowDrafts && !readOnly && (
              <button
                type="button"
                className="form-btn form-btn--secondary"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
              >
                Save as Draft
              </button>
            )}
          </div>

          <div className="form-actions-right">
            {!readOnly && (
              <button
                type="button"
                className="form-btn form-btn--primary"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Submit Survey
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .dynamic-form {
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding: 24px;
    background: white;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-section-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: #205072;
    margin: 0;
  }

  .form-section-header p {
    font-size: 14px;
    color: #7a9a8a;
    margin: 4px 0 0 0;
  }

  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 14px;
    font-weight: 600;
    color: #205072;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .form-required {
    color: #dc2626;
    font-weight: 700;
  }

  .form-hint {
    font-size: 12px;
    color: #7a9a8a;
    margin: 0;
  }

  .form-field-input,
  .dynamic-form select,
  .dynamic-form textarea {
    padding: 12px 14px;
    border: 1.5px solid #e2ede8;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #1c3a2e;
    background: white;
    transition: all 0.2s;
  }

  .form-field-input:focus,
  .dynamic-form select:focus,
  .dynamic-form textarea:focus {
    outline: none;
    border-color: #329D9C;
    background: #f6fbf8;
  }

  .form-field-input.error {
    border-color: #dc2626;
    background: #fee2e2;
  }

  .form-field-input:disabled,
  .dynamic-form select:disabled,
  .dynamic-form textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f6fbf8;
  }

  .form-error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #dc2626;
    padding: 8px;
    background: #fee2e2;
    border-radius: 6px;
  }

  .form-multiselect {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .form-checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #1c3a2e;
    cursor: pointer;
  }

  .form-checkbox-label input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #329D9C;
  }

  .form-checkbox-label input:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-rating {
    display: flex;
    gap: 8px;
  }

  .form-rating-star {
    background: none;
    border: none;
    font-size: 32px;
    cursor: pointer;
    opacity: 0.3;
    transition: opacity 0.2s;
  }

  .form-rating-star:hover,
  .form-rating-star.active {
    opacity: 1;
  }

  .form-rating-star:disabled {
    cursor: not-allowed;
  }

  .form-image-upload {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .form-image-preview {
    display: flex;
    justify-content: center;
    max-width: 300px;
  }

  .form-image-preview img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    border: 1.5px solid #e2ede8;
  }

  .form-image-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: #f6fbf8;
    border: 2px dashed #329D9C;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: #329D9C;
    transition: all 0.2s;
  }

  .form-image-label:hover {
    background: #e8f5f2;
  }

  .form-location {
    display: flex;
    gap: 10px;
  }

  .form-location-display {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    background: #e8f5f2;
    border: 1.5px solid #329D9C;
    border-radius: 8px;
    font-size: 13px;
    color: #205072;
    font-weight: 500;
    flex: 1;
  }

  .form-location-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 16px;
    background: white;
    border: 1.5px solid #329D9C;
    border-radius: 8px;
    color: #329D9C;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .form-location-btn:hover {
    background: #f6fbf8;
  }

  .form-location-btn--primary {
    background: linear-gradient(135deg, #329D9C 0%, #56C596 100%);
    border: none;
    color: white;
  }

  .form-location-btn--primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(50, 157, 156, 0.3);
  }

  .form-location-btn .spin {
    animation: spin 1s linear infinite;
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding-top: 20px;
    border-top: 1.5px solid #e2ede8;
  }

  .form-actions-left {
    display: flex;
    gap: 8px;
  }

  .form-actions-right {
    display: flex;
    gap: 8px;
  }

  .form-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 20px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .form-btn--primary {
    background: linear-gradient(135deg, #329D9C 0%, #56C596 100%);
    color: white;
  }

  .form-btn--primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(50, 157, 156, 0.3);
  }

  .form-btn--primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .form-btn--secondary {
    background: white;
    color: #329D9C;
    border: 1.5px solid #e2ede8;
  }

  .form-btn--secondary:hover {
    background: #f6fbf8;
    border-color: #329D9C;
  }

  .form-btn .spin {
    animation: spin 1s linear infinite;
  }

  @media (max-width: 768px) {
    .dynamic-form {
      gap: 24px;
      padding: 16px;
    }

    .form-section-header h2 {
      font-size: 18px;
    }

    .form-actions {
      flex-direction: column;
    }

    .form-btn {
      width: 100%;
    }
  }
`;
