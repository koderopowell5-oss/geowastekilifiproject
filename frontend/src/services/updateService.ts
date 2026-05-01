/**
 * Update Service
 * Handles checking for app updates and managing update notifications
 */

import axios from 'axios';

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  criticalUpdate: boolean;
  isBelowMinimum: boolean;
}

export interface VersionInfo {
  current: string;
  latestRelease: string;
  minRequiredVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  criticalUpdate: boolean;
  releaseDate: string;
}

class UpdateService {
  // Try multiple URL sources: env var (preferred), then fallback
  private apiBaseUrl = process.env.REACT_APP_API_URL || 
                       process.env.REACT_APP_API_BASE_URL || 
                       'http://localhost:5000/api';
  private lastCheckTime = 0;
  private checkInterval = 60 * 60 * 1000; // Check every hour
  private currentVersion = '1.0.2'; // Should match package.json version

  /**
   * Get the current app version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Check if an update is available
   * Uses caching to avoid excessive API calls
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    const now = Date.now();

    // Skip if we checked recently
    if (now - this.lastCheckTime < this.checkInterval) {
      const cached = this.getCachedUpdateInfo();
      if (cached) {
        return cached;
      }
    }

    try {
      const endpoint = `${this.apiBaseUrl}/version/check?version=${this.currentVersion}`;
      const response = await axios.get<any>(
        endpoint,
        {
          timeout: 5000, // 5 second timeout
        }
      );

      if (response.data.success && response.data.data) {
        const result: UpdateCheckResult = {
          updateAvailable: response.data.data.updateAvailable,
          currentVersion: response.data.data.currentVersion,
          latestVersion: response.data.data.latestVersion,
          downloadUrl: response.data.data.downloadUrl,
          releaseNotes: response.data.data.releaseNotes,
          criticalUpdate: response.data.data.criticalUpdate,
          isBelowMinimum: response.data.data.isBelowMinimum,
        };

        this.cacheUpdateInfo(result);
        this.lastCheckTime = now;

        return result;
      }

      // Return cached or default if API response is invalid
      return this.getCachedUpdateInfo() || this.getDefaultUpdateInfo();
    } catch (error: any) {
      // Return cached data if available
      const cached = this.getCachedUpdateInfo();
      if (cached) {
        return cached;
      }

      return this.getDefaultUpdateInfo();
    }
  }

  /**
   * Get full version information
   */
  async getVersionInfo(): Promise<VersionInfo> {
    try {
      const response = await axios.get<any>(
        `${this.apiBaseUrl}/version`,
        {
          params: {
            currentVersion: this.currentVersion,
          },
          timeout: 5000,
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return this.getDefaultVersionInfo();
    } catch (error) {
      console.error('[Update Service] Error fetching version info:', error);
      return this.getDefaultVersionInfo();
    }
  }

  /**
   * Download the APK file
   */
  async downloadAPK(downloadUrl: string): Promise<void> {
    try {
      console.log('[Update Service] Starting APK download from:', downloadUrl);

      // For web-based downloads
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'GeoWaste-Kilifi.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('[Update Service] APK download initiated');
    } catch (error) {
      console.error('[Update Service] Error downloading APK:', error);
      throw error;
    }
  }

  /**
   * Open app store or download link in browser
   */
  openDownloadLink(downloadUrl: string): void {
    try {
      // For native Android app
      if ((window as any).cordova) {
        (window as any).cordova.InAppBrowser.open(downloadUrl, '_system');
      } else {
        // For web
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('[Update Service] Error opening download link:', error);
      // Fallback
      window.open(downloadUrl, '_blank');
    }
  }

  /**
   * Cache update check result to localStorage
   */
  private cacheUpdateInfo(result: UpdateCheckResult): void {
    try {
      localStorage.setItem(
        'geowaste_update_cache',
        JSON.stringify({
          data: result,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('[Update Service] Error caching update info:', error);
    }
  }

  /**
   * Get cached update info from localStorage
   */
  private getCachedUpdateInfo(): UpdateCheckResult | null {
    try {
      const cached = localStorage.getItem('geowaste_update_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache is valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('[Update Service] Error retrieving cached update info:', error);
    }
    return null;
  }

  /**
   * Get default update info (no update available)
   */
  private getDefaultUpdateInfo(): UpdateCheckResult {
    return {
      updateAvailable: false,
      currentVersion: this.currentVersion,
      latestVersion: this.currentVersion,
      downloadUrl: '/downloads/GeoWaste-Kilifi.apk',
      releaseNotes: 'You are running the latest version',
      criticalUpdate: false,
      isBelowMinimum: false,
    };
  }

  /**
   * Get default version info
   */
  private getDefaultVersionInfo(): VersionInfo {
    return {
      current: this.currentVersion,
      latestRelease: this.currentVersion,
      minRequiredVersion: '1.0.0',
      downloadUrl: '/downloads/GeoWaste-Kilifi.apk',
      releaseNotes: 'Current version information unavailable',
      criticalUpdate: false,
      releaseDate: new Date().toISOString(),
    };
  }

  /**
   * Clear cached update info
   */
  clearCache(): void {
    try {
      localStorage.removeItem('geowaste_update_cache');
    } catch (error) {
      console.error('[Update Service] Error clearing cache:', error);
    }
  }
}

export const updateService = new UpdateService();
