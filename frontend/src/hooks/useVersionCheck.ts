/**
 * useVersionCheck Hook
 * Manages version checking and update notifications
 */

import { useState, useEffect } from 'react';
import { updateService, UpdateCheckResult } from '../services/updateService';

interface UseVersionCheckReturn {
  updateInfo: UpdateCheckResult | null;
  isChecking: boolean;
  isUpdateModalOpen: boolean;
  openUpdateModal: () => void;
  closeUpdateModal: () => void;
  dismissUpdate: () => void;
  lastCheckedTime: number | null;
}

export const useVersionCheck = (): UseVersionCheckReturn => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<number | null>(null);
  const [lastDismissTime, setLastDismissTime] = useState<number | null>(null);

  useEffect(() => {
    const checkUpdates = async () => {
      setIsChecking(true);
      try {
        const result = await updateService.checkForUpdates();
        setUpdateInfo(result);
        setLastCheckedTime(Date.now());

        // Automatically show modal for:
        // 1. Critical updates
        // 2. Updates below minimum version
        // 3. Regular updates (only if not dismissed in last 24 hours)
        if (result.updateAvailable) {
          const now = Date.now();
          const dayInMs = 24 * 60 * 60 * 1000;

          if (
            result.criticalUpdate ||
            result.isBelowMinimum ||
            !lastDismissTime ||
            now - lastDismissTime > dayInMs
          ) {
            setIsUpdateModalOpen(true);
          }
        }
      } catch (error) {
        console.error('[useVersionCheck] Error checking for updates:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Check on component mount
    checkUpdates();

    // Set up periodic checks every hour
    const interval = setInterval(checkUpdates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [lastDismissTime]);

  const dismissUpdate = () => {
    setLastDismissTime(Date.now());
    setIsUpdateModalOpen(false);
  };

  return {
    updateInfo,
    isChecking,
    isUpdateModalOpen,
    openUpdateModal: () => setIsUpdateModalOpen(true),
    closeUpdateModal: () => setIsUpdateModalOpen(false),
    dismissUpdate,
    lastCheckedTime,
  };
};
