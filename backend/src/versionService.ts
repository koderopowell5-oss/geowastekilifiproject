/**
 * Version Service
 * Manages app versioning and update information
 */

export interface VersionInfo {
  current: string;
  latestRelease: string;
  minRequiredVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  criticalUpdate: boolean;
  releaseDate: string;
}

class VersionServiceClass {
  // Current app version (update this when releasing new versions)
  private currentVersion = '1.0.1';
  private latestReleaseVersion = '1.0.1';
  private minRequiredVersion = '1.0.0';
  
  // APK download URL - adjust based on your deployment
  private downloadUrl = process.env.APK_DOWNLOAD_URL || 'https://geowaste-kilifi.onrender.com/downloads/GeoWaste-Kilifi.apk';

  /**
   * Get current version information
   */
  getVersionInfo(): VersionInfo {
    return {
      current: this.currentVersion,
      latestRelease: this.latestReleaseVersion,
      minRequiredVersion: this.minRequiredVersion,
      downloadUrl: this.downloadUrl,
      releaseNotes: this.getReleaseNotes(),
      criticalUpdate: this.isCriticalUpdate(),
      releaseDate: this.getLatestReleaseDate(),
    };
  }

  /**
   * Check if an update is available for the given version
   */
  isUpdateAvailable(currentVersion: string): boolean {
    return this.compareVersions(currentVersion, this.latestReleaseVersion) < 0;
  }

  /**
   * Check if the current version meets minimum requirements
   */
  isBelowMinimumVersion(currentVersion: string): boolean {
    return this.compareVersions(currentVersion, this.minRequiredVersion) < 0;
  }

  /**
   * Check if this is a critical security update
   */
  isCriticalUpdate(): boolean {
    // Mark as critical when there are security fixes or breaking changes
    // This could be set based on version tags or release type
    return false; // Update based on your release process
  }

  /**
   * Compare two semantic versions
   * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }

  /**
   * Get release notes for current version
   */
  private getReleaseNotes(): string {
    const releaseNotesMap: { [key: string]: string } = {
      '1.0.1': '- Bug fixes and performance improvements\n- Enhanced map rendering',
      '1.0.0': '- Initial release\n- Waste site data collection\n- Real-time dashboard',
    };

    return releaseNotesMap[this.latestReleaseVersion] || 'See release notes for updates';
  }

  /**
   * Get the release date of the latest version
   */
  private getLatestReleaseDate(): string {
    const releaseDateMap: { [key: string]: string } = {
      '1.0.1': new Date(2026, 4, 29).toISOString(), // Update with actual release date
      '1.0.0': new Date(2026, 0, 1).toISOString(),
    };

    return releaseDateMap[this.latestReleaseVersion] || new Date().toISOString();
  }

  /**
   * Update version information (called during deployment)
   * This should be called when a new version is released
   */
  setLatestVersion(version: string, downloadUrl?: string): void {
    this.latestReleaseVersion = version;
    if (downloadUrl) {
      this.downloadUrl = downloadUrl;
    }
  }

  /**
   * Update minimum required version (for forcing critical updates)
   */
  setMinimumRequiredVersion(version: string): void {
    this.minRequiredVersion = version;
  }
}

export const versionService = new VersionServiceClass();
