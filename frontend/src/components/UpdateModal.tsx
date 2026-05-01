/**
 * Update Modal Component
 * Displays update notifications with clean minimal design
 */

import React, { useState } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import { updateService, UpdateCheckResult } from '../services/updateService';

interface UpdateModalProps {
  isOpen: boolean;
  updateInfo: UpdateCheckResult | null;
  onClose: () => void;
  onDismiss: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  updateInfo,
  onClose,
  onDismiss,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen || !updateInfo) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      updateService.openDownloadLink(updateInfo.downloadUrl);
      await updateService.downloadAPK(updateInfo.downloadUrl);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download APK';
      setDownloadError(errorMsg);
      setIsDownloading(false);
    }
  };

  const handleDismiss = () => {
    onDismiss();
    onClose();
  };

  const canDismiss = !updateInfo.criticalUpdate && !updateInfo.isBelowMinimum;
  const isCritical = updateInfo.criticalUpdate || updateInfo.isBelowMinimum;

  return (
    <>
      <style>{`
        .um-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 52, 44, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 16px;
          backdrop-filter: blur(4px);
        }

        .um-card {
          background: #ffffff;
          border-radius: 12px;
          border: 0.5px solid #d1e8e2;
          max-width: 380px;
          width: 100%;
          overflow: hidden;
          animation: um-slide-up 0.25s ease-out;
          font-family: system-ui, -apple-system, sans-serif;
        }

        @keyframes um-slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Body */
        .um-body { padding: 28px 28px 24px; }

        /* Header row */
        .um-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .um-icon-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .um-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #e1f5ee;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .um-icon-box.critical {
          background: #fee2e2;
        }

        .um-label {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #1D9E75;
          margin: 0 0 3px;
        }

        .um-label.critical { color: #dc2626; }

        .um-title {
          font-size: 17px;
          font-weight: 500;
          color: #04342c;
          margin: 0;
          letter-spacing: -0.2px;
        }

        .um-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #7a9a8a;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .um-close-btn:hover { color: #04342c; }

        /* Version row */
        .um-versions {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: #f6fbf8;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .um-ver-label {
          font-size: 11px;
          color: #7a9a8a;
          margin: 0 0 3px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .um-ver-value {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 14px;
          font-weight: 500;
          color: #1c3a2e;
          margin: 0;
        }

        .um-ver-value.latest { color: #1D9E75; }

        .um-ver-right { text-align: right; }

        /* Release notes */
        .um-notes-label {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #1c3a2e;
          margin: 0 0 8px;
        }

        .um-notes-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .um-notes-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .um-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #9FE1CB;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .um-notes-text {
          font-size: 13px;
          color: #1c3a2e;
          margin: 0;
          line-height: 1.5;
        }

        /* Error */
        .um-error {
          margin-top: 16px;
          padding: 12px;
          background: #fef2f2;
          border: 0.5px solid #fca5a5;
          border-radius: 8px;
        }

        .um-error-title {
          font-size: 12px;
          font-weight: 500;
          color: #dc2626;
          margin: 0 0 2px;
        }

        .um-error-text {
          font-size: 12px;
          color: #b91c1c;
          margin: 0;
          line-height: 1.4;
        }

        /* Loading */
        .um-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
        }

        .um-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #9FE1CB;
          border-top-color: #1D9E75;
          border-radius: 50%;
          animation: um-spin 0.7s linear infinite;
        }

        @keyframes um-spin { to { transform: rotate(360deg); } }

        .um-loading-text {
          font-size: 12px;
          color: #7a9a8a;
        }

        /* Footer */
        .um-footer {
          padding: 16px 28px;
          border-top: 0.5px solid #e2ede8;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .um-btn-ghost {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          color: #7a9a8a;
          font-family: inherit;
          padding: 0;
          transition: color 0.15s;
        }

        .um-btn-ghost:hover:not(:disabled) { color: #1c3a2e; }
        .um-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

        .um-btn-primary {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #1D9E75;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, transform 0.1s;
        }

        .um-btn-primary:hover:not(:disabled) { background: #0F6E56; }
        .um-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .um-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="um-overlay">
        <div className="um-card">

          <div className="um-body">
            {/* Header */}
            <div className="um-header">
              <div className="um-icon-wrap">
                <div className={`um-icon-box ${isCritical ? 'critical' : ''}`}>
                  <RefreshCw
                    size={16}
                    color={isCritical ? '#dc2626' : '#1D9E75'}
                    strokeWidth={2.5}
                  />
                </div>
                <div>
                  <p className={`um-label ${isCritical ? 'critical' : ''}`}>
                    {isCritical ? 'Required update' : 'Update available'}
                  </p>
                  <p className="um-title">Version {updateInfo.latestVersion}</p>
                </div>
              </div>
              {canDismiss && (
                <button onClick={handleDismiss} className="um-close-btn" aria-label="Close">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Version pill */}
            <div className="um-versions">
              <div>
                <p className="um-ver-label">Installed</p>
                <p className="um-ver-value">{updateInfo.currentVersion}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
              <div className="um-ver-right">
                <p className="um-ver-label">Latest</p>
                <p className="um-ver-value latest">{updateInfo.latestVersion}</p>
              </div>
            </div>

            {/* Release notes */}
            <div>
              <p className="um-notes-label">What's new</p>
              <div className="um-notes-list">
                {(updateInfo.releaseNotes || 'New features and improvements included')
                  .split('\n')
                  .filter(Boolean)
                  .map((line, i) => (
                    <div key={i} className="um-notes-item">
                      <div className="um-dot" />
                      <p className="um-notes-text">{line.replace(/^[-•]\s*/, '')}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Error */}
            {downloadError && (
              <div className="um-error">
                <p className="um-error-title">Download failed</p>
                <p className="um-error-text">{downloadError}</p>
              </div>
            )}

            {/* Loading */}
            {isDownloading && (
              <div className="um-loading">
                <div className="um-spinner" />
                <span className="um-loading-text">Preparing download…</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="um-footer">
            {canDismiss ? (
              <button onClick={handleDismiss} disabled={isDownloading} className="um-btn-ghost">
                Remind me later
              </button>
            ) : (
              <span />
            )}
            <button onClick={handleDownload} disabled={isDownloading} className="um-btn-primary">
              <Download size={14} />
              {isDownloading ? 'Downloading…' : 'Download update'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};