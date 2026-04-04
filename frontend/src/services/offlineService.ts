/**
 * Offline Service
 * Handles local caching with IndexedDB and detects online/offline status
 */

const DB_NAME = 'GeoWasteKilifi';
const DB_VERSION = 1;
const STORES = {
  WASTE_SITES: 'wasteSites',
  USER_DRAFTS: 'userDrafts',
  PENDING_SUBMISSIONS: 'pendingSubmissions',
};

interface OfflineData {
  id?: string;
  data: any;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export class OfflineService {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.initDatabase();
    this.setupOnlineDetection();
  }

  /**
   * Initialize IndexedDB
   */
  private initDatabase(): void {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
    };

    request.onsuccess = () => {
      this.db = request.result;
      console.log('✓ IndexedDB initialized');
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.WASTE_SITES)) {
        const wasteStore = db.createObjectStore(STORES.WASTE_SITES, { keyPath: 'id', autoIncrement: true });
        wasteStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        wasteStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USER_DRAFTS)) {
        const draftsStore = db.createObjectStore(STORES.USER_DRAFTS, { keyPath: 'id' });
        draftsStore.createIndex('userEmail', 'userEmail', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_SUBMISSIONS)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_SUBMISSIONS, { keyPath: 'id', autoIncrement: true });
        pendingStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('✓ Back online');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('✗ Now offline');
    });
  }

  /**
   * Check if application is online
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Save waste site data locally
   */
  public async saveWasteSite(data: any): Promise<string> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.WASTE_SITES], 'readwrite');
      const store = transaction.objectStore(STORES.WASTE_SITES);

      const offlineData: OfflineData = {
        data,
        timestamp: Date.now(),
        syncStatus: 'pending',
      };

      const request = store.add(offlineData);

      request.onsuccess = () => {
        resolve(request.result.toString());
      };

      request.onerror = () => {
        reject(new Error('Failed to save waste site'));
      };
    });
  }

  /**
   * Get all pending waste site submissions
   */
  public async getPendingWasteSites(): Promise<OfflineData[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.WASTE_SITES], 'readonly');
      const store = transaction.objectStore(STORES.WASTE_SITES);
      const index = store.index('syncStatus');

      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve pending waste sites'));
      };
    });
  }

  /**
   * Update waste site sync status
   */
  public async updateSyncStatus(id: number, status: 'pending' | 'synced' | 'failed'): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.WASTE_SITES], 'readwrite');
      const store = transaction.objectStore(STORES.WASTE_SITES);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.syncStatus = status;
          const updateRequest = store.put(data);

          updateRequest.onsuccess = () => {
            resolve();
          };

          updateRequest.onerror = () => {
            reject(new Error('Failed to update sync status'));
          };
        } else {
          reject(new Error('Data not found'));
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to retrieve data'));
      };
    });
  }

  /**
   * Save user draft locally
   */
  public async saveDraft(userEmail: string, draftId: string, formData: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.USER_DRAFTS], 'readwrite');
      const store = transaction.objectStore(STORES.USER_DRAFTS);

      const draft = {
        id: draftId,
        userEmail,
        formData,
        timestamp: Date.now(),
      };

      const request = store.put(draft);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save draft'));
      };
    });
  }

  /**
   * Get user drafts from local storage
   */
  public async getUserDrafts(userEmail: string): Promise<any[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.USER_DRAFTS], 'readonly');
      const store = transaction.objectStore(STORES.USER_DRAFTS);
      const index = store.index('userEmail');

      const request = index.getAll(userEmail);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve drafts'));
      };
    });
  }

  /**
   * Delete a draft
   */
  public async deleteDraft(draftId: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.USER_DRAFTS], 'readwrite');
      const store = transaction.objectStore(STORES.USER_DRAFTS);

      const request = store.delete(draftId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete draft'));
      };
    });
  }

  /**
   * Sync pending data when online
   */
  public async syncPendingData(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    try {
      const pendingItems = await this.getPendingWasteSites();
      let synced = 0;
      let failed = 0;

      for (const item of pendingItems) {
        try {
          // Attempt to sync - this would be handled by the component
          // For now, just mark as synced
          if (item.id) {
            await this.updateSyncStatus(Number(item.id), 'synced');
            synced++;
          }
        } catch (err) {
          if (item.id) {
            await this.updateSyncStatus(Number(item.id), 'failed');
          }
          failed++;
        }
      }

      return { synced, failed };
    } catch (err) {
      console.error('Error syncing pending data:', err);
      return { synced: 0, failed: 0 };
    }
  }

  /**
   * Clear all data from a specific store
   */
  public async clearStore(storeName: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear ${storeName}`));
      };
    });
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
