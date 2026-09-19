import { 
  SyncState, 
  SyncQueueItem, 
  Transaction, 
  Employee, 
  NotificationItem, 
  ActivityItem, 
  AppSettings, 
  ActiveRole 
} from '../types';
import { 
  getSyncQueue, 
  removeFromSyncQueue, 
  saveLocalTransactions, 
  saveLocalEmployees, 
  saveLocalNotifications, 
  saveLocalActivities,
  saveLocalSettings,
  addLocalNotification,
  addLocalActivity,
  addConflict
} from './db';

// Persistent unique device ID
export function getDeviceId(): string {
  let id = localStorage.getItem('hisabi_device_id');
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('hisabi_device_id', id);
  }
  return id;
}

type SyncListener = (state: SyncState) => void;
type RemoteDataListener = (data: {
  transactions?: Transaction[];
  employees?: Employee[];
  notifications?: NotificationItem[];
  activities?: ActivityItem[];
  settings?: AppSettings;
}) => void;

class SyncManager {
  private syncState: SyncState = {
    status: navigator.onLine ? 'synced' : 'offline',
    pendingCount: 0,
    lastSyncedAt: null,
  };

  private syncListeners: Set<SyncListener> = new Set();
  private remoteDataListeners: Set<RemoteDataListener> = new Set();
  private sseSource: EventSource | null = null;
  private isSyncing = false;
  private authToken: string | null = null;
  private currentRole: ActiveRole = 'employee';
  private currentEmployeeId: string | null = 'emp-1';
  private pingTimer: any = null;

  constructor() {
    // Listen to browser network changes
    window.addEventListener('online', () => {
      this.updateStatus('syncing');
      if (this.authToken) {
        this.flushQueue();
        this.connectSSE();
      }
    });

    window.addEventListener('offline', () => {
      this.updateStatus('offline');
      if (this.sseSource) {
        this.sseSource.close();
        this.sseSource = null;
      }
    });

    // Background interval to check pending queue & heartbeat
    this.pingTimer = setInterval(() => {
      if (navigator.onLine && this.authToken) {
        this.flushQueue();
      }
    }, 15000);
  }

  public init(token: string, role: ActiveRole, employeeId: string | null) {
    this.authToken = token;
    this.currentRole = role;
    this.currentEmployeeId = employeeId;
    this.refreshPendingCount();
    if (navigator.onLine) {
      this.connectSSE();
      this.flushQueue();
      this.fetchFullState();
    }
  }

  public disconnect() {
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }
    this.authToken = null;
    this.currentEmployeeId = null;
    this.syncState = {
      status: 'offline',
      pendingCount: 0,
      lastSyncedAt: null,
    };
    this.notifySyncState();
  }

  public subscribeSyncState(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    listener(this.syncState);
    return () => this.syncListeners.delete(listener);
  }

  public subscribeRemoteData(listener: RemoteDataListener): () => void {
    this.remoteDataListeners.add(listener);
    return () => this.remoteDataListeners.delete(listener);
  }

  private notifySyncState() {
    this.syncListeners.forEach((l) => l({ ...this.syncState }));
  }

  private notifyRemoteData(data: any) {
    this.remoteDataListeners.forEach((l) => l(data));
  }

  private updateStatus(status: SyncState['status'], error?: string) {
    this.syncState.status = status;
    if (error) this.syncState.errorMessage = error;
    else delete this.syncState.errorMessage;
    this.notifySyncState();
  }

  public async refreshPendingCount(): Promise<number> {
    const queue = await getSyncQueue();
    this.syncState.pendingCount = queue.length;
    this.notifySyncState();
    return queue.length;
  }

  // Connect to SSE stream for token-authenticated real-time broadcasts
  private connectSSE() {
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }

    if (!this.authToken) return;

    try {
      const url = `/api/sync/stream?token=${encodeURIComponent(this.authToken)}`;
      this.sseSource = new EventSource(url);

      this.sseSource.addEventListener('connected', () => {
        if (this.syncState.pendingCount === 0) {
          this.updateStatus('synced');
        }
      });

      this.sseSource.addEventListener('sync_update', async (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.updatedTransactions) {
            await saveLocalTransactions(payload.updatedTransactions);
          }
          if (payload.newActivities && payload.newActivities.length > 0) {
            for (const act of payload.newActivities) {
              await addLocalActivity(act);
            }
          }
          if (payload.newNotifications && payload.newNotifications.length > 0) {
            for (const notif of payload.newNotifications) {
              await addLocalNotification(notif);
              this.showWebPushNotification(notif.title, notif.message);
            }
          }

          this.notifyRemoteData({
            transactions: payload.updatedTransactions,
            activities: payload.newActivities,
            notifications: payload.newNotifications,
          });
        } catch (err) {
          console.error('Error handling SSE sync_update:', err);
        }
      });

      this.sseSource.addEventListener('employees_update', async (e: MessageEvent) => {
        try {
          const emps = JSON.parse(e.data);
          if (this.currentRole === 'manager') {
            await saveLocalEmployees(emps);
            this.notifyRemoteData({ employees: emps });
          }
        } catch (err) {
          console.error('Error handling SSE employees_update:', err);
        }
      });

      this.sseSource.addEventListener('settings_update', async (e: MessageEvent) => {
        try {
          const s = JSON.parse(e.data);
          await saveLocalSettings(s);
          this.notifyRemoteData({ settings: s });
        } catch (err) {
          console.error('Error handling SSE settings_update:', err);
        }
      });

      this.sseSource.onerror = () => {
        if (navigator.onLine) {
          this.updateStatus('syncing');
        } else {
          this.updateStatus('offline');
        }
      };
    } catch (err) {
      console.warn('SSE connection failed:', err);
    }
  }

  // Push pending operations from IndexedDB to server with Bearer auth
  public async flushQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine || !this.authToken) return;
    this.isSyncing = true;

    try {
      const queue = await getSyncQueue();
      if (queue.length === 0) {
        this.syncState.pendingCount = 0;
        this.updateStatus('synced');
        this.isSyncing = false;
        return;
      }

      this.updateStatus('syncing');

      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({ operations: queue }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const resData = await response.json();

      // Remove processed items from local queue
      if (resData.processedIds && Array.isArray(resData.processedIds)) {
        for (const id of resData.processedIds) {
          await removeFromSyncQueue(id);
        }
      }

      // Record any conflicts if detected
      if (resData.conflicts && Array.isArray(resData.conflicts)) {
        for (const conf of resData.conflicts) {
          await addConflict(conf);
        }
      }

      const remainingQueue = await getSyncQueue();
      this.syncState.pendingCount = remainingQueue.length;
      this.syncState.lastSyncedAt = new Date().toISOString();
      this.updateStatus(remainingQueue.length === 0 ? 'synced' : 'syncing');

      // Also pull full authoritative state after push
      await this.fetchFullState();
    } catch (err: any) {
      console.warn('Sync flush error:', err);
      this.updateStatus(navigator.onLine ? 'syncing' : 'offline', err?.message);
    } finally {
      this.isSyncing = false;
    }
  }

  // Pull authoritative state from server with Bearer auth
  public async fetchFullState(): Promise<void> {
    if (!navigator.onLine || !this.authToken) return;

    try {
      const res = await fetch('/api/sync/state', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.transactions) {
        await saveLocalTransactions(data.transactions);
      }
      if (data.employees) {
        await saveLocalEmployees(data.employees);
      }
      if (data.notifications) {
        await saveLocalNotifications(data.notifications);
      }
      if (data.activities) {
        await saveLocalActivities(data.activities);
      }
      if (data.settings) {
        await saveLocalSettings(data.settings);
      }

      this.notifyRemoteData(data);
      this.syncState.lastSyncedAt = new Date().toISOString();
      if (this.syncState.pendingCount === 0) {
        this.updateStatus('synced');
      }
    } catch (err) {
      console.warn('Failed to fetch full state:', err);
    }
  }

  // Browser Push Notifications
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  public showWebPushNotification(title: string, body: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        dir: 'rtl',
        lang: 'ar',
      });
    } catch (err) {
      console.warn('Could not trigger Web Notification:', err);
    }
  }
}

export const syncManager = new SyncManager();
