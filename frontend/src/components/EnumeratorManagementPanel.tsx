import React, { useState } from 'react';
import { Users, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { wasteApiService } from '../services/wasteApi';

interface EnumeratorManagementProps {
  onCreateSuccess?: () => void;
}

export const EnumeratorManagement: React.FC<EnumeratorManagementProps> = ({ onCreateSuccess }) => {
  const { showSuccess, showError } = useNotification();
  const { currentProjectId } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    ward: '',
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      const payload = {
        ...formData,
        project_id: currentProjectId,
      };
      const result = await wasteApiService.createAdminEnumerator(payload);

      if (result?.credentials) {
        setGeneratedCredentials({
          email: result.credentials.email,
          password: result.credentials.password,
        });
        setShowCredentials(true);
      }

      showSuccess(`Enumerator ${formData.name} created successfully`);
      setFormData({ name: '', email: '', password: '', phone: '', ward: '' });
      setShowCreateForm(false);
      onCreateSuccess?.();
    } catch (error: any) {
      showError(error.message || 'Failed to create enumerator');
    } finally {
      setIsCreating(false);
    }
  };

  const css = `
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

    .enum-mgmt {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .enum-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .enum-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 600;
      color: var(--teal-d);
    }

    .enum-create-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--r);
      border: 1.5px solid var(--teal);
      background: var(--teal);
      color: white;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .enum-create-btn:hover:not(:disabled) {
      background: var(--teal-d);
      border-color: var(--teal-d);
    }

    .enum-create-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .enum-form {
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--r);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .enum-form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .enum-form-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted);
    }

    .enum-form-input {
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      transition: border-color 0.15s;
    }

    .enum-form-input:focus {
      border-color: var(--teal);
    }

    .enum-form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .enum-form-btn {
      padding: 8px 14px;
      border-radius: 6px;
      border: 1.5px solid var(--border);
      background: white;
      color: var(--text);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .enum-form-btn:hover:not(:disabled) {
      border-color: var(--teal);
      color: var(--teal);
    }

    .enum-form-btn--primary {
      border-color: var(--teal);
      background: var(--teal);
      color: white;
    }

    .enum-form-btn--primary:hover:not(:disabled) {
      background: var(--teal-d);
      border-color: var(--teal-d);
    }

    .enum-form-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .enum-credentials-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .enum-credentials-content {
      background: white;
      border-radius: var(--r);
      padding: 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .enum-credentials-note {
      margin: 0;
      padding: 12px;
      background: #fff9e6;
      border-left: 3px solid #ffb800;
      border-radius: 4px;
      font-size: 12px;
      color: #664d00;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .enum-credentials-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .enum-credentials-value {
      display: flex;
      gap: 8px;
    }

    .enum-credentials-input {
      flex: 1;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
      font-family: 'Courier New', monospace;
      background: #f9f9f9;
      cursor: text;
      user-select: all;
    }

    .enum-credentials-copy {
      padding: 8px 12px;
      border: 1px solid var(--teal);
      background: var(--teal);
      color: white;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .enum-credentials-copy:hover {
      background: var(--teal-d);
      border-color: var(--teal-d);
    }

    .enum-credentials-actions {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-top: 8px;
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="enum-mgmt">
        <div className="enum-header">
          <h3 className="enum-title">
            <Users size={16} />
            Enumerators
          </h3>
          <button
            className="enum-create-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={isCreating}
          >
            <Plus size={14} />
            Create Enumerator
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateSubmit} className="enum-form">
            <div className="enum-form-group">
              <label className="enum-form-label">Name *</label>
              <input
                type="text"
                className="enum-form-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isCreating}
              />
            </div>
            <div className="enum-form-group">
              <label className="enum-form-label">Email *</label>
              <input
                type="email"
                className="enum-form-input"
                placeholder="enumerator@geowaste.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isCreating}
              />
            </div>
            <div className="enum-form-group">
              <label className="enum-form-label">Password *</label>
              <input
                type="password"
                className="enum-form-input"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isCreating}
              />
            </div>
            <div className="enum-form-group">
              <label className="enum-form-label">Phone</label>
              <input
                type="tel"
                className="enum-form-input"
                placeholder="+254712345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isCreating}
              />
            </div>
            <div className="enum-form-group">
              <label className="enum-form-label">Ward</label>
              <input
                type="text"
                className="enum-form-input"
                placeholder="Ward name"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                disabled={isCreating}
              />
            </div>
            <div className="enum-form-actions">
              <button
                type="button"
                className="enum-form-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', email: '', password: '', phone: '', ward: '' });
                }}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button type="submit" className="enum-form-btn enum-form-btn--primary" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 size={12} />
                    Creating…
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </form>
        )}

        {showCredentials && generatedCredentials && (
          <div className="enum-credentials-modal">
            <div className="enum-credentials-content">
              <h4>Enumerator Credentials Generated</h4>
              <p className="enum-credentials-note">
                <AlertCircle size={14} />
                Share these credentials securely with the enumerator. They will need them to log in.
              </p>

              <div className="enum-credentials-field">
                <label>Email</label>
                <div className="enum-credentials-value">
                  <input
                    type="text"
                    value={generatedCredentials.email}
                    readOnly
                    className="enum-credentials-input"
                  />
                  <button
                    type="button"
                    className="enum-credentials-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCredentials.email);
                      showSuccess('Email copied to clipboard');
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="enum-credentials-field">
                <label>Password</label>
                <div className="enum-credentials-value">
                  <input
                    type="text"
                    value={generatedCredentials.password}
                    readOnly
                    className="enum-credentials-input"
                  />
                  <button
                    type="button"
                    className="enum-credentials-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCredentials.password);
                      showSuccess('Password copied to clipboard');
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="enum-credentials-actions">
                <button
                  type="button"
                  className="enum-form-btn enum-form-btn--primary"
                  onClick={() => {
                    setShowCredentials(false);
                    setGeneratedCredentials(null);
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

