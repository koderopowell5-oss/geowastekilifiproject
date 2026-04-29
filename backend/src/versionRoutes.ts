/**
 * Version Routes
 * API endpoints for version checking and app updates
 */

import { Router, Request, Response } from 'express';
import { versionService } from './versionService';
import { ApiResponse } from './types';

const router = Router();

/**
 * GET /api/version
 * Get current version information and update availability
 * Query params:
 *   - currentVersion: the version running on the client (e.g., "1.0.0")
 */
router.get('/version', (req: Request, res: Response) => {
  try {
    const { currentVersion } = req.query;
    const versionInfo = versionService.getVersionInfo();

    let updateStatus = {
      updateAvailable: false,
      isCritical: false,
      isBelowMinimum: false,
    };

    if (currentVersion && typeof currentVersion === 'string') {
      updateStatus = {
        updateAvailable: versionService.isUpdateAvailable(currentVersion),
        isCritical: versionService.isCriticalUpdate(),
        isBelowMinimum: versionService.isBelowMinimumVersion(currentVersion),
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Version information retrieved',
      data: {
        ...versionInfo,
        updateStatus,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching version info:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch version information',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/version/check
 * Simple endpoint that just checks if an update is available
 * Query params:
 *   - version: the version running on the client
 */
router.get('/version/check', (req: Request, res: Response) => {
  try {
    const { version } = req.query;

    if (!version || typeof version !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Version parameter is required',
      } as ApiResponse);
    }

    const updateAvailable = versionService.isUpdateAvailable(version);
    const isBelowMinimum = versionService.isBelowMinimumVersion(version);
    const versionInfo = versionService.getVersionInfo();

    return res.status(200).json({
      success: true,
      data: {
        currentVersion: version,
        latestVersion: versionInfo.latestRelease,
        updateAvailable,
        isBelowMinimum,
        downloadUrl: versionInfo.downloadUrl,
        releaseNotes: versionInfo.releaseNotes,
        criticalUpdate: versionInfo.criticalUpdate,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error checking version:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check version',
      error: error.message,
    } as ApiResponse);
  }
});

export default router;
