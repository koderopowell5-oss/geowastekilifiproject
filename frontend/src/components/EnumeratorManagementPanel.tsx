import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Trash2, Key, ChevronRight, Mail, Phone, AlertCircle, Loader2,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { buildApiUrl } from '../config/api';

interface Enumerator {
  id: number;
  name: string;
  email: string;
  phone?: string;
  ward?: string;
  account_type: 'admin' | 'enumerator';
  created_at?: string;
}

interface EnumeratorManagementProps {
  onCreateSuccess?: () => void;
}

export const EnumeratorManagement: React.FC<EnumeratorManagementProps> = ({ onCreateSuccess }) => {
  const { showSuccess, showError } = useNotification();
  const [enumerators, setEnumerators] = useState<Enumerator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEnumerator, setSelectedEnumerator] = useState<Enumerator | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    ward: '',
  });

  const [resetData, setResetData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const fetchEnumerators = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(buildApiUrl('/admin/enumerators'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch enumerators');
      }

      const result = await response.json();
      setEnumerators(result.data || []);
    } catch (error: any) {
      showError(error.message || 'Failed to load enumerators');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnumerators();
    // Only fetch on mount - don't add fetchEnumerators to deps to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(buildApiUrl('/admin/enumerators'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to create enumerator');
      }

      showSuccess(`Enumerator ${formData.name} created successfully`);
      setFormData({ name: '', email: '', password: '', phone: '', ward: '' });
      setShowCreateForm(false);
      fetchEnumerators();
      onCreateSuccess?.();
    } catch (error: any) {
      showError(error.message || 'Failed to create enumerator');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetData.newPassword || resetData.newPassword !== resetData.confirmPassword) {
      showError('Passwords do not match or are empty');
      return;
    }

    if (!selectedEnumerator) return;

    try {
      setIsCreating(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        buildApiUrl(`/admin/enumerators/${selectedEnumerator.id}/reset-password`),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: resetData.newPassword }),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to reset password');
      }

      showSuccess('Password reset successfully');
      setResetData({ newPassword: '', confirmPassword: '' });
      setShowResetForm(false);
      setSelectedEnumerator(null);
    } catch (error: any) {
      showError(error.message || 'Failed to reset password');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (enumerator: Enumerator) => {
    if (!window.confirm(`Are you sure you want to deactivate ${enumerator.name}?`)) {
      return;
    }

    try {
      setIsCreating(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(buildApiUrl(`/admin/enumerators/${enumerator.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to deactivate enumerator');
      }

      showSuccess(`${enumerator.name} has been deactivated`);
      fetchEnumerators();
    } catch (error: any) {
      showError(error.message || 'Failed to deactivate enumerator');
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
      margin-bottom: 16px;
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

    .enum-form-input:disabled {
      background: #f0f0f0;
      cursor: not-allowed;
      opacity: 0.6;
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

    .enum-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .enum-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--r);
      transition: all 0.15s;
    }

    .enum-item:hover {
      border-color: var(--teal);
      box-shadow: 0 2px 8px rgba(50,157,156,0.08);
    }

    .enum-item-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: rgba(50,157,156,0.07);
      border: 1px solid rgba(50,157,156,0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--teal);
      flex-shrink: 0;
    }

    .enum-item-info {
      flex: 1;
      min-width: 0;
    }

    .enum-item-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }

    .enum-item-email {
      font-size: 11px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
    }

    .enum-item-actions {
      display: flex;
      gap: 6px;
    }

    .enum-item-btn {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: white;
      color: var(--text);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .enum-item-btn:hover:not(:disabled) {
      border-color: var(--teal);
      color: var(--teal);
    }

    .enum-item-btn--danger {
      color: #dc2626;
      border-color: rgba(220,38,38,0.3);
    }

    .enum-item-btn--danger:hover:not(:disabled) {
      border-color: #dc2626;
      background: rgba(220,38,38,0.05);
    }

    .enum-empty {
      text-align: center;
      padding: 32px 16px;
      color: var(--muted);
      font-size: 13px;
    }

    .enum-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: var(--muted);
    }

    .enum-loading svg {
      animation: spin 1s linear infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  if (isLoading) {
    return (
      <>
        <style>{css}</style>
        <div className="enum-loading">
          <Loader2 size={16} />
          Loading enumerators...
        </div>
      </>
    );
  }

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

        {showResetForm && selectedEnumerator && (
          <form onSubmit={handleResetPassword} className="enum-form">
            <div className="enum-form-group">
              <label className="enum-form-label">
                Reset Password for {selectedEnumerator.name}
              </label>
            </div>
            <div className="enum-form-group">
              <label className="enum-form-label">New Password *</label>
              <input
                type="password"
                className="enum-form-input"
                placeholder="••••••••••••"
                value={resetData.newPassword}
                onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                disabled={isCreating}
              />
            </div>
            <div className="enum-form-group">
              <label className="enum-form-label">Confirm Password *</label>
              <input
                type="password"
                className="enum-form-input"
                placeholder="••••••••••••"
                value={resetData.confirmPassword}
                onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                disabled={isCreating}
              />
            </div>
            <div className="enum-form-actions">
              <button
                type="button"
                className="enum-form-btn"
                onClick={() => {
                  setShowResetForm(false);
                  setSelectedEnumerator(null);
                  setResetData({ newPassword: '', confirmPassword: '' });
                }}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button type="submit" className="enum-form-btn enum-form-btn--primary" disabled={isCreating}>
                {isCreating ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        <div className="enum-list">
          {enumerators.length === 0 ? (
            <div className="enum-empty">
              No enumerators yet. Create one to get started.
            </div>
          ) : (
            enumerators.map((enumerator) => (
              <div key={enumerator.id} className="enum-item">
                <div className="enum-item-icon">
                  <Users size={16} />
                </div>
                <div className="enum-item-info">
                  <div className="enum-item-name">{enumerator.name}</div>
                  <div className="enum-item-email">
                    <Mail size={10} />
                    {enumerator.email}
                  </div>
                </div>
                <div className="enum-item-actions">
                  <button
                    className="enum-item-btn"
                    onClick={() => {
                      setSelectedEnumerator(enumerator);
                      setShowResetForm(true);
                    }}
                    disabled={isCreating}
                    title="Reset password"
                  >
                    <Key size={12} />
                  </button>
                  <button
                    className="enum-item-btn enum-item-btn--danger"
                    onClick={() => handleDelete(enumerator)}
                    disabled={isCreating}
                    title="Deactivate enumerator"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
