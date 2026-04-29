import React, { useState } from 'react';
import { Download, Info, AlertCircle, CheckCircle } from 'lucide-react';

interface DownloadStatus {
  type: 'idle' | 'downloading' | 'success' | 'error';
  message: string;
}

export const GeneralSettings: React.FC = () => {
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({
    type: 'idle',
    message: ''
  });

  const handleAPKDownload = async () => {
    setDownloadStatus({
      type: 'downloading',
      message: 'Preparing download...'
    });

    try {
      // APK is hosted locally in the public/downloads folder
      const apkUrl = '/downloads/GeoWaste-Kilifi.apk';
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = apkUrl;
      link.download = 'GeoWaste-Kilifi.apk';
      
      // For local files, simple click is sufficient
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadStatus({
        type: 'success',
        message: 'APK downloaded successfully! Install it on your Android device.'
      });
      
      // Reset after 5 seconds
      setTimeout(() => {
        setDownloadStatus({ type: 'idle', message: '' });
      }, 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download APK';
      setDownloadStatus({
        type: 'error',
        message: errorMessage
      });
      
      // Reset after 5 seconds
      setTimeout(() => {
        setDownloadStatus({ type: 'idle', message: '' });
      }, 5000);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="settings-root">
        {/* Header */}
        <header className="settings-header">
          <div className="settings-header-inner">
            <div>
              <p className="settings-eyebrow">Settings</p>
              <h1 className="settings-title">App Settings</h1>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="settings-body">
          {/* App Version Section */}
          <section className="settings-section">
            <div className="version-box">
              <div className="version-info">
                <p className="version-label">Version</p>
                <p className="version-number">1.0.1</p>
              </div>
            </div>
          </section>

          {/* Download Section */}
          <section className="settings-section">
            <h2 className="settings-section-title">Mobile App</h2>
            <p className="settings-section-sub">Download the Android app</p>
            
            <button
              onClick={handleAPKDownload}
              disabled={downloadStatus.type === 'downloading'}
              className={`settings-download-btn ${downloadStatus.type}`}
            >
              <Download size={16} className="btn-icon" />
              <span>
                {downloadStatus.type === 'downloading'
                  ? 'Downloading...'
                  : 'Download APK'}
              </span>
            </button>

            {/* Status Messages */}
            {downloadStatus.type !== 'idle' && (
              <div className={`settings-status-message ${downloadStatus.type}`}>
                {downloadStatus.type === 'success' && (
                  <>
                    <CheckCircle size={14} />
                    <span>{downloadStatus.message}</span>
                  </>
                )}
                {downloadStatus.type === 'error' && (
                  <>
                    <AlertCircle size={14} />
                    <span>{downloadStatus.message}</span>
                  </>
                )}
                {downloadStatus.type === 'downloading' && (
                  <>
                    <div className="spinner" />
                    <span>{downloadStatus.message}</span>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Support Section */}
          <section className="settings-section">
            <h2 className="settings-section-title">Support</h2>
            <p className="settings-section-sub">Need help?</p>
            <div className="settings-support-box">
              <div className="support-item">
                <span className="support-label">Email</span>
                <span className="support-value">support@geowaste-kilifi.example</span>
              </div>
            </div>
          </section>
        </main>
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
    --mint:   #7BE495;
    --foam:   #CFF4D2;
    --bg:     #f6fbf8;
    --border: #e2ede8;
    --text:   #1c3a2e;
    --muted:  #7a9a8a;
    --r:      10px;
    --success: #10b981;
    --error: #ef4444;
    --warning: #f59e0b;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .settings-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }

  /* ── Header ── */
  .settings-header {
    position: sticky; top: 0; z-index: 20;
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .settings-header-inner {
    max-width: 900px; margin: 0 auto;
    padding: 16px 24px 12px;
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .settings-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal); margin-bottom: 3px;
  }
  .settings-title {
    font-size: 19px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.3px;
  }
  .settings-progress-rail {
    max-width: 900px; margin: 0 auto;
    height: 0px; background: transparent;
  }
  .settings-progress-fill {
    display: none;
  }

  /* ── Body ── */
  .settings-body {
    max-width: 900px; margin: 0 auto;
    padding: 36px 24px 80px;
    display: flex; flex-direction: column; gap: 24px;
  }

  /* ── Sections ── */
  .settings-section {
    display: flex; flex-direction: column; gap: 12px;
  }
  .settings-section-header {
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .settings-section-title {
    font-size: 16px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.2px;
    line-height: 1.3;
  }
  .settings-section-sub {
    font-size: 13px; color: var(--muted); line-height: 1.4;
  }

  .settings-divider {
    border: none; border-top: 1px solid var(--border);
    margin: 12px 0;
  }

  /* ── Version Box ── */
  .version-box {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .version-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .version-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--teal);
    letter-spacing: 0.4px;
    text-transform: uppercase;
    margin: 0;
  }
  .version-number {
    font-size: 24px;
    font-weight: 600;
    color: var(--teal-d);
    margin: 0;
    font-family: 'DM Mono', monospace;
  }

  /* ── Info Box ── */
  .settings-info-box {
    background: rgba(50,157,156,0.04);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 16px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .info-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(50,157,156,0.1);
  }
  .info-item:last-child { border-bottom: none; }
  .info-label {
    font-size: 12px; font-weight: 600; letter-spacing: 0.4px;
    text-transform: uppercase; color: var(--muted);
  }
  .info-value {
    font-size: 13px; font-weight: 500; color: var(--text);
  }

  /* ── Info Banner ── */
  .settings-info-banner {
    display: none;
  }

  /* ── Download Section ── */
  .settings-download-section {
    display: flex; flex-direction: column; gap: 12px;
  }
  .settings-download-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 24px;
    background: var(--teal);
    border: none;
    border-radius: var(--r);
    color: white;
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .settings-download-btn:hover:not(:disabled) {
    background: var(--teal-d);
  }
  .settings-download-btn:active:not(:disabled) {
    transform: scale(0.98);
  }
  .settings-download-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .btn-icon {
    width: 16px; height: 16px;
  }

  /* ── Status Messages ── */
  .settings-status-message {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    border-radius: var(--r);
    font-size: 13px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  }
  .settings-status-message.success {
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.3);
    color: #059669;
  }
  .settings-status-message.error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.3);
    color: #dc2626;
  }
  .settings-status-message.downloading {
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.3);
    color: #1d4ed8;
  }
  .settings-status-message svg {
    flex-shrink: 0;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(29,78,216,0.2);
    border-top-color: #1d4ed8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Instructions ── */
  .settings-instructions {
    display: none;
  }

  /* ── Requirements ── */
  .settings-requirements {
    display: none;
  }

  /* ── Support Box ── */
  .settings-support-box {
    background: rgba(50,157,156,0.04);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 16px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .support-item {
    display: flex; flex-direction: column; gap: 4px;
  }
  .support-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; color: var(--muted);
  }
  .support-value {
    font-size: 13px; font-weight: 500; color: var(--text);
  }

  /* ── Footer ── */
  .settings-footer {
    font-size: 11px; color: var(--muted);
    text-align: center; margin-top: 20px;
  }
`;
