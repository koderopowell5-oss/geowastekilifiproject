import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { buildApiUrl, getFetchOptions } from '../config/api';

interface AppSettingsState {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notificationFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
  autoSync: boolean;
  syncWifiOnly: boolean;
  offlineModeEnabled: boolean;
  dataRetention: '30' | '60' | '90' | '180' | 'unlimited';
  photoQuality: 'low' | 'medium' | 'high';
  gpsAccuracy: 'strict' | 'normal' | 'flexible';
  appLock: boolean;
}

export const GeneralSettings: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [appSettings, setAppSettings] = useState<AppSettingsState>({
    language: 'en',
    theme: 'system',
    notificationFrequency: 'immediate',
    autoSync: true,
    syncWifiOnly: false,
    offlineModeEnabled: true,
    dataRetention: '90',
    photoQuality: 'medium',
    gpsAccuracy: 'normal',
    appLock: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('generalSettings');
    if (savedSettings) {
      // Merge with defaults to ensure new settings keys exist for returning users
      setAppSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, []);

  const handleSettingChange = (key: keyof AppSettingsState, value: any) => {
    const updated = { ...appSettings, [key]: value };
    setAppSettings(updated);
    localStorage.setItem('generalSettings', JSON.stringify(updated));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(buildApiUrl('/settings/general'), {
        method: 'POST',
        ...getFetchOptions(),
        body: JSON.stringify(appSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      showSuccess('Settings saved successfully.');
    } catch (error: any) {
      showError(error.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Clear all cached data? This temporarily disables offline mode until your next sync.')) {
      return;
    }

    try {
      localStorage.removeItem('generalSettings');
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      showSuccess('Cache cleared successfully.');
    } catch (error: any) {
      showError('Failed to clear cache.');
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="set-root">
        
        {/* Header */}
        <header className="set-header">
          <div className="set-header-inner">
            <h1 className="set-title">App Settings</h1>
            <p className="set-subtitle">Manage your preferences, data usage, and device storage.</p>
          </div>
        </header>

        {/* Body */}
        <main className="set-body">
          
          {/* Appearance & Localization */}
          <section className="set-section">
            <h2 className="set-section-title">Appearance & Language</h2>
            
            <div className="set-row">
              <div className="set-info">
                <span className="set-label">Language</span>
                <span className="set-desc">Choose your preferred app language.</span>
              </div>
              <select
                value={appSettings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="set-select"
              >
                <option value="en">English</option>
                <option value="sw">Swahili</option>
              </select>
            </div>

            <div className="set-row">
              <div className="set-info">
                <span className="set-label">Theme</span>
                <span className="set-desc">Dark mode saves battery in the field.</span>
              </div>
              <select
                value={appSettings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="set-select"
              >
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </section>

          {/* Field Collection Settings */}
          <section className="set-section">
            <h2 className="set-section-title">Field Collection</h2>
            
            <div className="set-row">
              <div className="set-info">
                <span className="set-label">Photo Quality</span>
                <span className="set-desc">Lower quality saves mobile data and storage.</span>
              </div>
              <select
                value={appSettings.photoQuality}
                onChange={(e) => handleSettingChange('photoQuality', e.target.value)}
                className="set-select"
              >
                <option value="low">Low (Saves Data)</option>
                <option value="medium">Standard</option>
                <option value="high">High (Large Files)</option>
              </select>
            </div>

            <div className="set-row">
              <div className="set-info">
                <span className="set-label">GPS Accuracy</span>
                <span className="set-desc">How strict the map is when saving a location.</span>
              </div>
              <select
                value={appSettings.gpsAccuracy}
                onChange={(e) => handleSettingChange('gpsAccuracy', e.target.value)}
                className="set-select"
              >
                <option value="strict">Strict (Within 5m)</option>
                <option value="normal">Normal (Within 15m)</option>
                <option value="flexible">Flexible (Approximate)</option>
              </select>
            </div>
          </section>

          {/* Sync & Offline */}
          <section className="set-section">
            <h2 className="set-section-title">Sync & Data</h2>
            
            <label className="set-row cursor-pointer">
              <div className="set-info">
                <span className="set-label">Auto-Sync</span>
                <span className="set-desc">Automatically upload records when online.</span>
              </div>
              <input
                type="checkbox"
                checked={appSettings.autoSync}
                onChange={(e) => handleSettingChange('autoSync', e.target.checked)}
                className="set-toggle"
              />
            </label>

            <label className="set-row cursor-pointer">
              <div className="set-info">
                <span className="set-label">Sync Over Wi-Fi Only</span>
                <span className="set-desc">Pause uploads when using mobile data.</span>
              </div>
              <input
                type="checkbox"
                checked={appSettings.syncWifiOnly}
                onChange={(e) => handleSettingChange('syncWifiOnly', e.target.checked)}
                className="set-toggle"
              />
            </label>

            <label className="set-row cursor-pointer">
              <div className="set-info">
                <span className="set-label">Offline Mode</span>
                <span className="set-desc">Allow collecting data without an internet connection.</span>
              </div>
              <input
                type="checkbox"
                checked={appSettings.offlineModeEnabled}
                onChange={(e) => handleSettingChange('offlineModeEnabled', e.target.checked)}
                className="set-toggle"
              />
            </label>

            <div className="set-row">
              <div className="set-info">
                <span className="set-label">Keep Records For</span>
                <span className="set-desc">How long to store synced records on this phone.</span>
              </div>
              <select
                value={appSettings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                className="set-select"
              >
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
                <option value="unlimited">Forever</option>
              </select>
            </div>
          </section>

          {/* Security & Notifications */}
          <section className="set-section">
            <h2 className="set-section-title">Security & Alerts</h2>
            
            <label className="set-row cursor-pointer">
              <div className="set-info">
                <span className="set-label">Require App Lock</span>
                <span className="set-desc">Require PIN or fingerprint to open the app.</span>
              </div>
              <input
                type="checkbox"
                checked={appSettings.appLock}
                onChange={(e) => handleSettingChange('appLock', e.target.checked)}
                className="set-toggle"
              />
            </label>

            <div className="set-row">
              <div className="set-info">
                <span className="set-label">Notifications</span>
                <span className="set-desc">How often you receive update alerts.</span>
              </div>
              <select
                value={appSettings.notificationFrequency}
                onChange={(e) => handleSettingChange('notificationFrequency', e.target.value as any)}
                className="set-select"
              >
                <option value="immediate">Immediately</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
                <option value="never">Never</option>
              </select>
            </div>
          </section>

          {/* Admin Links */}
          {isAdmin && (
            <section className="set-section">
              <h2 className="set-section-title">Admin Controls</h2>
              <div className="set-admin-links">
                <a href="/admin/users" className="set-link">Manage Users</a>
                <a href="/admin/reports" className="set-link">View Reports</a>
                <a href="/admin/security" className="set-link">Admin Security</a>
              </div>
            </section>
          )}

          {/* Storage & Support */}
          <section className="set-section">
            <h2 className="set-section-title">Device Storage</h2>
            <div className="set-row">
              <div className="set-info">
                <span className="set-label">Clear Cache</span>
                <span className="set-desc">Free up space (Approx. 5.2 MB used).</span>
              </div>
              <button onClick={handleClearCache} className="set-btn-outline">
                Clear space
              </button>
            </div>
          </section>

          <section className="set-section">
            <h2 className="set-section-title">Support</h2>
            <div className="set-row">
              <div className="set-info">
                <span className="set-label">Email Support</span>
                <span className="set-desc">support@geowaste-kilifi.com</span>
              </div>
              <a href="/help" className="set-link">Read guide</a>
            </div>
          </section>

          {/* Actions */}
          <div className="set-actions">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="set-btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </main>

        {/* Minimal Footer */}
        <footer className="set-footer">
          App Version {process.env.REACT_APP_VERSION || '1.0.2'}
        </footer>

      </div>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --teal:   #329D9C;
    --teal-d: #205072;
    --bg:     #f6fbf8;
    --border: #e2ede8;
    --text:   #1c3a2e;
    --muted:  #7a9a8a;
  }

  * { box-sizing: border-box; }

  .set-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .set-header {
    background: white;
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 10;
  }
  .set-header-inner {
    max-width: 720px; margin: 0 auto;
    padding: 24px 20px;
  }
  .set-title {
    font-size: 22px; font-weight: 600; color: var(--teal-d);
    margin: 0 0 4px 0; letter-spacing: -0.4px;
  }
  .set-subtitle {
    font-size: 14px; color: var(--muted); margin: 0;
  }

  /* Body */
  .set-body {
    flex: 1;
    width: 100%; max-width: 720px;
    margin: 0 auto;
    padding: 32px 20px 60px;
    display: flex; flex-direction: column; gap: 40px;
  }

  /* Hide scrollbars in Capacitor app */
  @supports (scrollbar-width: none) {
    .set-root {
      scrollbar-width: none;
    }
    .set-root::-webkit-scrollbar {
      display: none;
    }
  }

  /* Sections */
  .set-section {
    display: flex; flex-direction: column; gap: 0;
  }
  .set-section-title {
    font-size: 13px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.6px; color: var(--teal-d);
    margin: 0 0 16px 0;
    padding-bottom: 8px; border-bottom: 1px solid var(--border);
  }

  /* Rows & Typography */
  .set-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #f0f4f2;
    gap: 20px;
  }
  .set-row:last-child {
    border-bottom: none;
  }
  .cursor-pointer {
    cursor: pointer;
  }
  .set-info {
    display: flex; flex-direction: column; gap: 2px; flex: 1;
  }
  .set-label {
    font-size: 15px; font-weight: 500; color: var(--text);
  }
  .set-desc {
    font-size: 13px; color: var(--muted); line-height: 1.4;
  }

  /* Form Elements */
  .set-select {
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: white;
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    color: var(--text); cursor: pointer; min-width: 150px;
    outline: none; transition: border-color 0.2s;
  }
  .set-select:focus, .set-select:hover { border-color: var(--teal); }

  /* Custom Toggle (Flat) */
  .set-toggle {
    appearance: none;
    width: 44px; height: 24px;
    background: #e2ede8; border-radius: 12px;
    position: relative; cursor: pointer;
    transition: background 0.2s; flex-shrink: 0;
    margin: 0; outline: none;
  }
  .set-toggle::after {
    content: ''; position: absolute;
    top: 2px; left: 2px;
    width: 20px; height: 20px;
    background: white; border-radius: 50%;
    transition: transform 0.2s;
  }
  .set-toggle:checked { background: var(--teal); }
  .set-toggle:checked::after { transform: translateX(20px); }

  /* Buttons & Links */
  .set-btn-outline {
    background: transparent; border: 1px solid var(--border);
    border-radius: 6px; padding: 8px 16px;
    font-size: 13px; font-weight: 600; color: #dc2626;
    cursor: pointer; transition: background 0.2s;
    font-family: inherit; white-space: nowrap;
  }
  .set-btn-outline:hover { background: #fef2f2; border-color: #fca5a5; }

  .set-btn-primary {
    background: var(--teal-d); border: none; border-radius: 6px;
    padding: 14px 24px; font-size: 15px; font-weight: 600;
    color: white; cursor: pointer; transition: background 0.2s;
    font-family: inherit; width: 100%; max-width: 200px;
  }
  .set-btn-primary:hover:not(:disabled) { background: #153b56; }
  .set-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .set-link {
    font-size: 14px; font-weight: 500; color: var(--teal);
    text-decoration: none; transition: color 0.2s;
    white-space: nowrap;
  }
  .set-link:hover { color: var(--teal-d); text-decoration: underline; }

  .set-admin-links {
    display: flex; flex-wrap: wrap; gap: 16px; padding: 12px 0;
  }

  .set-actions {
    margin-top: 16px;
    display: flex; justify-content: flex-end;
  }

  /* Footer */
  .set-footer {
    padding: 24px 20px; text-align: center;
    font-size: 11px; color: #a0baba;
    letter-spacing: 0.5px; text-transform: uppercase;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .set-row { flex-direction: column; align-items: flex-start; gap: 12px; }
    .set-toggle { align-self: flex-end; margin-top: -36px; }
    .set-btn-outline { width: 100%; margin-top: 4px; }
    .set-btn-primary { max-width: 100%; }
    .set-select { width: 100%; }
  }
`;