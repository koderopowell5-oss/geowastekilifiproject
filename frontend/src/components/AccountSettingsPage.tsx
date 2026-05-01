import React, { useState, useEffect } from 'react';
import {
  Settings, LogOut, Trash2, Lock, Bell, Mail, Phone, MapPin,
  AlertCircle, Check, Loader, Eye, EyeOff
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  ward: string;
  phone: string;
  role: string;
  status: string;
  profile_picture_url?: string;
  created_at: string;
  verified_at?: string;
}

export const AccountSettingsPage: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications'>('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // In a real app, fetch from /api/profile endpoint
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/profile'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      showError('Please enter your password to confirm deletion');
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/account/delete'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmPassword: deletePassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }

      showSuccess('Account deleted. You will be logged out.');
      
      // Clear storage and redirect
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      showError(error.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setDeletePassword('');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/account/change-password'), {
        method: 'POST',
        ...getFetchOptions(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      showSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showError(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <style>{css}</style>
        <div className="settings-container">
          <div className="settings-loading">
            <Loader size={32} className="spin" />
            <p>Loading settings...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <h1>Account Settings</h1>
          <p>Manage your profile, security, and preferences</p>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Settings size={18} /> General
          </button>
          <button
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} /> Security
          </button>
          <button
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} /> Notifications
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* General Tab */}
          {activeTab === 'general' && profile && (
            <div className="settings-section">
              <h2>General Settings</h2>

              <div className="settings-info-grid">
                <div className="settings-info-item">
                  <label>Email Address</label>
                  <div className="settings-info-value">
                    <Mail size={16} />
                    {profile.email}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>Full Name</label>
                  <div className="settings-info-value">
                    {profile.name}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>Ward</label>
                  <div className="settings-info-value">
                    <MapPin size={16} />
                    {profile.ward}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>Phone Number</label>
                  <div className="settings-info-value">
                    <Phone size={16} />
                    {profile.phone}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>Account Status</label>
                  <div className="settings-info-value">
                    <span className={`settings-badge settings-badge--${profile.status}`}>
                      {profile.status}
                    </span>
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>Account Created</label>
                  <div className="settings-info-value">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="settings-danger-zone">
                <div className="settings-danger-header">
                  <AlertCircle size={20} />
                  <h3>Danger Zone</h3>
                </div>
                <p>Permanently delete your account and all associated data</p>
                <button
                  className="settings-btn settings-btn--danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} /> Delete Account
                </button>

                {showDeleteConfirm && (
                  <div className="settings-delete-confirm">
                    <AlertCircle size={20} />
                    <h4>Confirm Account Deletion</h4>
                    <p>This action is permanent and cannot be undone. All your data will be permanently deleted.</p>

                    <div className="settings-input-group">
                      <label>Enter your password to confirm:</label>
                      <div className="settings-password-input">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Enter your password"
                          disabled={isDeleting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="settings-password-toggle"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="settings-confirm-actions">
                      <button
                        className="settings-btn settings-btn--secondary"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword('');
                        }}
                        disabled={isDeleting}
                      >
                        Cancel
                      </button>
                      <button
                        className="settings-btn settings-btn--danger"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader size={16} className="spin" /> Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={16} /> Delete Permanently
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>

              <div className="settings-password-form">
                <h3>Change Password</h3>
                <p>Update your password to keep your account secure</p>

                <div className="settings-input-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="settings-input-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="settings-input-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={isChangingPassword}
                  />
                </div>

                <button
                  className="settings-btn settings-btn--primary"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader size={16} className="spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Lock size={16} /> Change Password
                    </>
                  )}
                </button>
              </div>

              <div className="settings-info-card">
                <Check size={18} />
                <div>
                  <h4>Two-Factor Authentication</h4>
                  <p>Enhanced security with OTP verification is already enabled on your account.</p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Settings</h2>

              <div className="settings-notification-options">
                <div className="settings-notification-item">
                  <label className="settings-checkbox">
                    <input type="checkbox" defaultChecked disabled />
                    <span>Email Notifications</span>
                  </label>
                  <p>Receive important account notifications via email</p>
                </div>

                <div className="settings-notification-item">
                  <label className="settings-checkbox">
                    <input type="checkbox" defaultChecked disabled />
                    <span>Survey Reminders</span>
                  </label>
                  <p>Get reminded about pending surveys</p>
                </div>

                <div className="settings-notification-item">
                  <label className="settings-checkbox">
                    <input type="checkbox" defaultChecked disabled />
                    <span>Submission Confirmations</span>
                  </label>
                  <p>Receive confirmation when your surveys are submitted</p>
                </div>

                <div className="settings-notification-item">
                  <label className="settings-checkbox">
                    <input type="checkbox" defaultChecked disabled />
                    <span>Account Security Alerts</span>
                  </label>
                  <p>Critical alerts about your account security</p>
                </div>
              </div>

              <div className="settings-info-card">
                <Bell size={18} />
                <div>
                  <h4>All Notifications Enabled</h4>
                  <p>You are currently subscribed to all notification types. You cannot disable critical security notifications.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .settings-container {
    padding: 24px;
    background: #f6fbf8;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
  }

  .settings-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px 20px;
    color: #7a9a8a;
  }

  .settings-loading .spin {
    animation: spin 1s linear infinite;
  }

  .settings-header {
    margin-bottom: 32px;
  }

  .settings-header h1 {
    font-size: 28px;
    font-weight: 700;
    color: #205072;
    margin: 0 0 4px 0;
  }

  .settings-header p {
    font-size: 14px;
    color: #7a9a8a;
    margin: 0;
  }

  .settings-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 2px solid #e2ede8;
    overflow-x: auto;
  }

  .settings-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border: none;
    background: none;
    color: #7a9a8a;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }

  .settings-tab:hover {
    color: #329D9C;
  }

  .settings-tab.active {
    color: #329D9C;
    border-bottom-color: #329D9C;
  }

  .settings-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 32px;
  }

  .settings-section h2 {
    font-size: 20px;
    font-weight: 600;
    color: #205072;
    margin: 0 0 24px 0;
  }

  .settings-section h3 {
    font-size: 16px;
    font-weight: 600;
    color: #205072;
    margin: 24px 0 12px 0;
  }

  .settings-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .settings-info-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .settings-info-item label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #205072;
  }

  .settings-info-value {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #f6fbf8;
    border-radius: 8px;
    font-size: 14px;
    color: #1c3a2e;
  }

  .settings-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
  }

  .settings-badge--active {
    background: #e8f5f2;
    color: #16a34a;
  }

  .settings-badge--inactive {
    background: #f3e8ff;
    color: #7c3aed;
  }

  .settings-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .settings-input-group label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #205072;
  }

  .settings-input-group input,
  .settings-input-group textarea {
    padding: 10px 14px;
    border: 1.5px solid #e2ede8;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #1c3a2e;
    background: white;
    transition: all 0.2s;
  }

  .settings-input-group input:focus,
  .settings-input-group textarea:focus {
    outline: none;
    border-color: #329D9C;
    background: #f6fbf8;
  }

  .settings-input-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f6fbf8;
  }

  .settings-password-input {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    border: 1.5px solid #e2ede8;
    border-radius: 8px;
    padding: 0;
    overflow: hidden;
  }

  .settings-password-input input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 10px 14px;
    margin: 0;
  }

  .settings-password-input input:focus {
    outline: none;
  }

  .settings-password-toggle {
    background: none;
    border: none;
    padding: 0 14px;
    cursor: pointer;
    color: #7a9a8a;
    display: flex;
    align-items: center;
  }

  .settings-password-toggle:hover {
    color: #329D9C;
  }

  .settings-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .settings-btn--primary {
    background: linear-gradient(135deg, #329D9C 0%, #56C596 100%);
    color: white;
  }

  .settings-btn--primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(50, 157, 156, 0.3);
  }

  .settings-btn--secondary {
    background: white;
    color: #329D9C;
    border: 1.5px solid #e2ede8;
  }

  .settings-btn--secondary:hover {
    background: #f6fbf8;
    border-color: #329D9C;
  }

  .settings-btn--danger {
    background: #fee2e2;
    color: #dc2626;
    border: 1.5px solid #fca5a5;
  }

  .settings-btn--danger:hover {
    background: #fecaca;
    border-color: #dc2626;
  }

  .settings-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .settings-btn .spin {
    animation: spin 1s linear infinite;
  }

  .settings-danger-zone {
    margin-top: 40px;
    padding: 20px;
    background: #fee2e2;
    border: 2px solid #fca5a5;
    border-radius: 12px;
  }

  .settings-danger-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    color: #dc2626;
  }

  .settings-danger-header h3 {
    margin: 0;
    font-size: 16px;
  }

  .settings-danger-zone p {
    color: #991b1b;
    font-size: 14px;
    margin: 0 0 16px 0;
  }

  .settings-delete-confirm {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid #fca5a5;
  }

  .settings-delete-confirm h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #dc2626;
    margin: 12px 0 8px 0;
  }

  .settings-delete-confirm p {
    color: #991b1b;
    font-size: 13px;
    margin: 0 0 16px 0;
  }

  .settings-confirm-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  .settings-confirm-actions button {
    flex: 1;
  }

  .settings-info-card {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #f6fbf8;
    border: 1.5px solid #e2ede8;
    border-radius: 8px;
    margin-top: 24px;
    color: #329D9C;
  }

  .settings-info-card h4 {
    font-size: 14px;
    font-weight: 600;
    color: #205072;
    margin: 0 0 4px 0;
  }

  .settings-info-card p {
    font-size: 12px;
    color: #7a9a8a;
    margin: 0;
  }

  .settings-password-form {
    margin-bottom: 40px;
    padding-bottom: 40px;
    border-bottom: 1.5px solid #e2ede8;
  }

  .settings-notification-options {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
  }

  .settings-notification-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .settings-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }

  .settings-checkbox input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #329D9C;
  }

  .settings-notification-item p {
    font-size: 13px;
    color: #7a9a8a;
    margin: 0;
  }

  @media (max-width: 768px) {
    .settings-container {
      padding: 16px;
    }

    .settings-content {
      padding: 16px;
    }

    .settings-info-grid {
      grid-template-columns: 1fr;
    }

    .settings-confirm-actions {
      flex-direction: column;
    }

    .settings-tabs {
      flex-wrap: wrap;
    }
  }
`;
