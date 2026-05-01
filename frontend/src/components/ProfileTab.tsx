import React, { useState } from 'react';
import { LogOut, User, Settings, Phone, Mail, MapPin, Shield, ArrowLeft, Upload, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { GeneralSettings } from './GeneralSettings';
import { buildApiUrl } from '../config/api';

interface ProfileTabProps {
  onLogout?: () => void;
  showSettings?: boolean;
  onSettingsClose?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onLogout, showSettings: initialShowSettings, onSettingsClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [showGeneralSettings, setShowGeneralSettings] = useState(initialShowSettings || false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const handleLogout = () => {
    showSuccess('You have been logged out');
    logout();
    onLogout?.();
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      showError('Please upload a JPG, PNG, WebP, or GIF image');
      return;
    }

    setIsUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(buildApiUrl('/profile/picture'), {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      showSuccess('Profile picture updated successfully');
      // Refresh the page to show new picture
      window.location.reload();
    } catch (error: any) {
      showError(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  if (showGeneralSettings) {
    return (
      <div>
        {/* Back nav — flows in document, never overlaps */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 20px',
          borderBottom: '1px solid #e2ede8',
          background: '#f6fbf8'
        }}>
          <button
            onClick={() => {
              setShowGeneralSettings(false);
              onSettingsClose?.();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#205072',
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
        <GeneralSettings />
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="profile-root">

        {/* Header */}
        <header className="profile-header">
          <div className="profile-header-inner">
            <div>
              <p className="profile-eyebrow">Account</p>
              <h1 className="profile-title">Profile</h1>
            </div>
          </div>
          <div className="profile-progress-rail">
            <div className="profile-progress-fill" style={{ width: '100%' }} />
          </div>
        </header>

        {/* Body */}
        <main className="profile-body">

          {/* Avatar + Name */}
          {user && (
            <>
              <section className="profile-section-head">
                <h2 className="profile-section-title">Account Information</h2>
                <p className="profile-section-sub">Your personal details and access level</p>
              </section>

              <hr className="profile-divider" />

              {/* Avatar row */}
              <div className="profile-avatar-row">
                <div style={{ position: 'relative' }}>
                  <div className="profile-avatar">
                    {(user as any).profile_picture_url ? (
                      <img 
                        src={(user as any).profile_picture_url} 
                        alt="Profile" 
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <User size={22} className="profile-avatar-icon" />
                    )}
                  </div>
                  <label 
                    htmlFor="profile-picture-input"
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#329D9C',
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isUploadingPicture ? 'not-allowed' : 'pointer',
                      opacity: isUploadingPicture ? 0.7 : 1
                    }}
                  >
                    {isUploadingPicture ? (
                      <Loader size={12} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Upload size={12} color="white" />
                    )}
                  </label>
                  <input
                    id="profile-picture-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleProfilePictureUpload}
                    disabled={isUploadingPicture}
                    style={{ display: 'none' }}
                  />
                </div>
                <div>
                  <p className="profile-name">
                    {isAdmin ? (user as any).username : (user as any).name}
                  </p>
                  <span className="profile-role-badge">
                    {isAdmin ? 'Administrator' : 'Enumerator'}
                  </span>
                </div>
              </div>

              {/* Detail rows */}
              <div className="profile-fields">
                {isAdmin ? (
                  <div className="profile-field-row">
                    <div className="profile-field-icon-wrap">
                      <Shield size={14} className="profile-field-icon" />
                    </div>
                    <div>
                      <span className="profile-field-label">Access Level</span>
                      <span className="profile-field-value">Full System Access</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="profile-field-row">
                      <div className="profile-field-icon-wrap">
                        <Mail size={14} className="profile-field-icon" />
                      </div>
                      <div>
                        <span className="profile-field-label">Email</span>
                        <span className="profile-field-value">{(user as any).email}</span>
                      </div>
                    </div>
                    <div className="profile-field-row">
                      <div className="profile-field-icon-wrap">
                        <MapPin size={14} className="profile-field-icon" />
                      </div>
                      <div>
                        <span className="profile-field-label">Ward</span>
                        <span className="profile-field-value">{(user as any).ward}</span>
                      </div>
                    </div>
                    <div className="profile-field-row">
                      <div className="profile-field-icon-wrap">
                        <Phone size={14} className="profile-field-icon" />
                      </div>
                      <div>
                        <span className="profile-field-label">Phone</span>
                        <span className="profile-field-value">{(user as any).phone}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <hr className="profile-divider" />

          {/* Settings section */}
          <section>
            <h3 className="profile-section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>Settings</h3>
            <button onClick={() => setShowGeneralSettings(true)} className="profile-settings-row">
              <div className="profile-field-icon-wrap">
                <Settings size={14} className="profile-field-icon" />
              </div>
              <span className="profile-settings-label">General Settings</span>
              <span className="profile-settings-arrow">›</span>
            </button>
          </section>

          <hr className="profile-divider" />

          {/* Logout */}
          <button onClick={handleLogout} className="profile-logout-btn">
            <LogOut size={15} />
            Sign Out
          </button>

          {/* Footer */}
          <p className="profile-footer">GeoWaste Kilifi v1.0</p>

        </main>
      </div>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

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

  .profile-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }

  /* ── Header ── */
  .profile-header {
    position: sticky; top: 0; z-index: 20;
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .profile-header-inner {
    max-width: 900px; margin: 0 auto;
    padding: 16px 24px 12px;
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  
  @media (max-width: 480px) {
    .profile-header-inner {
      padding: 12px 12px 8px;
    }
  }
  .profile-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal); margin-bottom: 3px;
  }
  .profile-title {
    font-size: 19px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.3px;
  }
  .profile-progress-rail {
    max-width: 900px; margin: 0 auto;
    height: 2px; background: var(--foam);
  }
  .profile-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--teal), var(--teal-l));
    transition: width 0.35s ease;
  }
  
  @media (max-width: 480px) {
    .profile-progress-rail {
      height: 1.5px;
    }
  }

  /* ── Body ── */
  .profile-body {
    width: 100%;
    padding: 24px 20px 60px;
    display: flex; flex-direction: column; gap: 24px;
    max-width: 100%;
    margin: 0 auto;
  }
  
  @media (min-width: 768px) {
    .profile-body {
      padding: 24px 32px 60px;
      max-width: 900px;
      margin: 0 auto;
    }
  }
  
  @media (max-width: 480px) {
    .profile-body {
      padding: 16px 12px 60px;
      gap: 16px;
    }
    
    .profile-section-title {
      font-size: 20px;
    }
    
    .profile-avatar-row {
      gap: 12px;
    }
    
    .profile-avatar {
      width: 48px;
      height: 48px;
    }
    
    .profile-name {
      font-size: 15px;
    }
  }

  /* ── Section head ── */
  .profile-section-head { }
  .profile-section-title {
    font-size: 24px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.5px;
    line-height: 1.2; margin-bottom: 6px;
  }
  .profile-section-sub {
    font-size: 14px; color: var(--muted); line-height: 1.5;
  }

  .profile-divider {
    border: none; border-top: 1px solid var(--border);
  }

  /* ── Avatar row ── */
  .profile-avatar-row {
    display: flex; align-items: center; gap: 16px;
  }
  .profile-avatar {
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--teal);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(50,157,156,0.25);
  }
  .profile-avatar-icon { color: white; }
  .profile-name {
    font-size: 17px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.2px;
    margin-bottom: 5px;
  }
  .profile-role-badge {
    display: inline-block;
    font-size: 11px; font-weight: 600; letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--teal);
    background: rgba(50,157,156,0.08);
    border: 1px solid rgba(50,157,156,0.2);
    border-radius: 20px;
    padding: 3px 10px;
  }

  /* ── Detail fields ── */
  .profile-fields {
    display: flex; flex-direction: column; gap: 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .profile-field-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
  }
  .profile-field-row:last-child { border-bottom: none; }
  .profile-field-icon-wrap {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(50,157,156,0.07);
    border: 1px solid rgba(50,157,156,0.12);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .profile-field-icon { color: var(--teal); }
  .profile-field-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; color: var(--muted);
    display: block; margin-bottom: 2px;
  }
  .profile-field-value {
    font-size: 14px; font-weight: 500; color: var(--text);
    display: block;
  }

  /* ── Settings row ── */
  .profile-settings-row {
    width: 100%; display: flex; align-items: center; gap: 14px;
    background: none; border: none; cursor: pointer;
    padding: 14px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    text-align: left;
    transition: opacity 0.15s;
  }
  .profile-settings-row:hover { opacity: 0.7; }
  .profile-settings-label {
    font-size: 14px; font-weight: 500; color: var(--text);
    flex: 1;
  }
  .profile-settings-arrow {
    font-size: 18px; color: var(--muted); line-height: 1;
  }

  /* ── Logout ── */
  .profile-logout-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 11px 18px;
    border-radius: var(--r);
    border: 1.5px solid #fca5a5;
    background: #fff5f5;
    color: #dc2626;
    font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.15s;
  }
  .profile-logout-btn:hover {
    background: #fee2e2;
    border-color: #f87171;
  }

  /* ── Footer ── */
  .profile-footer {
    text-align: center;
    font-size: 11px; color: var(--muted);
    font-weight: 500; letter-spacing: 0.3px;
    font-family: 'DM Mono', monospace;
  }
`;