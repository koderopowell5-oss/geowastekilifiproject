/**
 * Update Modal Component
 * Displays update notifications and prompts user to download/install new version
 */

import React, { useState } from 'react';
import { Download, AlertTriangle, CheckCircle, X } from 'lucide-react';
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

  if (!isOpen || !updateInfo) {
    return null;
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      // Method 1: Open in browser/system handler
      updateService.openDownloadLink(updateInfo.downloadUrl);

      // Also attempt direct download
      await updateService.downloadAPK(updateInfo.downloadUrl);

      // Keep modal open for a moment to show success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download APK';
      console.error('Download error:', error);
      setDownloadError(errorMsg);
      setIsDownloading(false);
    }
  };

  const handleDismiss = () => {
    onDismiss();
    onClose();
  };

  // For critical updates, don't show dismiss option
  const canDismiss = !updateInfo.criticalUpdate && !updateInfo.isBelowMinimum;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header with critical flag */}
        <div
          className={`px-6 py-4 flex items-center justify-between ${
            updateInfo.criticalUpdate || updateInfo.isBelowMinimum
              ? 'bg-red-50 border-b-2 border-red-200'
              : 'bg-blue-50 border-b-2 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {updateInfo.criticalUpdate || updateInfo.isBelowMinimum ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-blue-600" />
            )}
            <h2
              className={`text-lg font-bold ${
                updateInfo.criticalUpdate || updateInfo.isBelowMinimum
                  ? 'text-red-900'
                  : 'text-blue-900'
              }`}
            >
              {updateInfo.criticalUpdate || updateInfo.isBelowMinimum
                ? 'Critical Update Required'
                : 'Update Available'}
            </h2>
          </div>
          {canDismiss && (
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Version Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Version:</span>
              <span className="font-mono font-semibold text-gray-900">
                {updateInfo.currentVersion}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Latest Version:</span>
              <span className="font-mono font-semibold text-green-600">
                {updateInfo.latestVersion}
              </span>
            </div>
          </div>

          {/* Release Notes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              What's New:
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {updateInfo.releaseNotes || 'New features and improvements included'}
              </p>
            </div>
          </div>

          {/* Warning for critical/required updates */}
          {(updateInfo.criticalUpdate || updateInfo.isBelowMinimum) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-semibold">
                ⚠️ This update is required to continue using GeoWaste Kilifi.
              </p>
            </div>
          )}

          {/* Error Message */}
          {downloadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {downloadError}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Try downloading manually or contact support.
              </p>
            </div>
          )}

          {/* Download Status */}
          {isDownloading && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Preparing download...</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
          {canDismiss && (
            <button
              onClick={handleDismiss}
              disabled={isDownloading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Remind Later
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Downloading...' : 'Download Update'}
          </button>
        </div>

        {/* Info Footer */}
        <div className="px-6 py-2 bg-gray-100 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            You'll be prompted again in 24 hours if you dismiss this
          </p>
        </div>
      </div>
    </div>
  );
};
