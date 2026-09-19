import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { 
  Employee, 
  Transaction, 
  AppSettings, 
  NotificationItem, 
  ActivityItem, 
  SyncQueueItem, 
  ConflictRecord 
} from '../types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SETTINGS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ACTIVITIES 
} from '../data/initialData';

const DB_NAME = 'hisabi_local_db_v3';
const DB_VERSION = 1;

interface HisabiDBSchema extends DBSchema {
  employees: {
    key: string;
    value: Employee;
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-employee': string;
      'by-type': string;
      'by-date': string;
      'by-syncStatus': string;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  notifications: {
    key: string;
    value: NotificationItem;
    indexes: {
      'by-timestamp': string;
      'by-targetUser': string;
    };
  };
  activities: {
    key: string;
    value: ActivityItem;
    indexes: {
      'by-timestamp': string;
    };
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-queuedAt': string;
    };
  };
  conflicts: {
    key: string;
    value: ConflictRecord;
    indexes: {
      'by-resolved': number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<HisabiDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<HisabiDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<HisabiDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Employees store
        if (!db.objectStoreNames.contains('employees')) {
          db.createObjectStore('employees', { keyPath: 'id' });
        }

        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-employee', 'employeeId');
          txStore.createIndex('by-type', 'type');
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-syncStatus', 'syncStatus');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // Notifications store
        if (!db.objectStoreNames.contains('notifications')) {
          const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notifStore.createIndex('by-timestamp', 'timestamp');
          notifStore.createIndex('by-targetUser', 'targetUser');
        }

        // Activity log store
        if (!db.objectStoreNames.contains('activities')) {
          const actStore = db.createObjectStore('activities', { keyPath: 'id' });
          actStore.createIndex('by-timestamp', 'timestamp');
        }

        // Sync Queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const qStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          qStore.createIndex('by-queuedAt', 'queuedAt');
        }

        // Conflicts store
        if (!db.objectStoreNames.contains('conflicts')) {
          const confStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          confStore.createIndex('by-resolved', 'resolved');
        }
      },
    });
  }
  return dbPromise;
}

// Ensure initial seed data exists in IndexedDB
export async function seedInitialDataIfEmpty(): Promise<void> {
  const db = await getDB();
  const employeeCount = await db.count('employees');
  
  if (employeeCount === 0) {
    const tx = db.transaction(['employees', 'transactions', 'settings', 'notifications', 'activities'], 'readwrite');
    for (const emp of INITIAL_EMPLOYEES) {
      await tx.objectStore('employees').put(emp);
    }
    for (const t of INITIAL_TRANSACTIONS) {
      await tx.objectStore('transactions').put(t);
    }
    await tx.objectStore('settings').put(INITIAL_SETTINGS, 'main_settings');
    for (const n of INITIAL_NOTIFICATIONS) {
      await tx.objectStore('notifications').put(n);
    }
    for (const a of INITIAL_ACTIVITIES) {
      await tx.objectStore('activities').put(a);
    }
    await tx.done;
  }
}

// Employees
export async function getLocalEmployees(): Promise<Employee[]> {
  const db = await getDB();
  const list = await db.getAll('employees');
  return list.length > 0 ? list : INITIAL_EMPLOYEES;
}

export async function saveLocalEmployees(employees: Employee[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('employees', 'readwrite');
  await tx.objectStore('employees').clear();
  for (const emp of employees) {
    await tx.objectStore('employees').put(emp);
  }
  await tx.done;
}

export async function saveLocalEmployee(emp: Employee): Promise<void> {
  const db = await getDB();
  await db.put('employees', emp);
}

// Transactions
export async function getLocalTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  const list = await db.getAll('transactions');
  if (list.length === 0) return INITIAL_TRANSACTIONS;
  // Sort descending by date, then time
  return list.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());
}

export async function saveLocalTransactions(transactions: Transaction[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('transactions', 'readwrite');
  await tx.objectStore('transactions').clear();
  for (const item of transactions) {
    await tx.objectStore('transactions').put(item);
  }
  await tx.done;
}

export async function putLocalTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', transaction);
}

export async function deleteLocalTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

// Settings
export async function getLocalSettings(): Promise<AppSettings> {
  const db = await getDB();
  const s = await db.get('settings', 'main_settings');
  return s || INITIAL_SETTINGS;
}

export async function saveLocalSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'main_settings');
}

// Notifications
export async function getLocalNotifications(): Promise<NotificationItem[]> {
  const db = await getDB();
  const list = await db.getAll('notifications');
  if (list.length === 0) return INITIAL_NOTIFICATIONS;
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function saveLocalNotifications(notifications: NotificationItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('notifications', 'readwrite');
  await tx.objectStore('notifications').clear();
  for (const n of notifications) {
    await tx.objectStore('notifications').put(n);
  }
  await tx.done;
}

export async function addLocalNotification(notif: NotificationItem): Promise<void> {
  const db = await getDB();
  await db.put('notifications', notif);
}

export async function markAllNotificationsAsReadLocal(): Promise<void> {
  const db = await getDB();
  const all = await db.getAll('notifications');
  const tx = db.transaction('notifications', 'readwrite');
  for (const n of all) {
    if (!n.read) {
      await tx.objectStore('notifications').put({ ...n, read: true });
    }
  }
  await tx.done;
}

// Activities
export async function getLocalActivities(): Promise<ActivityItem[]> {
  const db = await getDB();
  const list = await db.getAll('activities');
  if (list.length === 0) return INITIAL_ACTIVITIES;
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function saveLocalActivities(activities: ActivityItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('activities', 'readwrite');
  await tx.objectStore('activities').clear();
  for (const a of activities) {
    await tx.objectStore('activities').put(a);
  }
  await tx.done;
}

export async function addLocalActivity(act: ActivityItem): Promise<void> {
  const db = await getDB();
  await db.put('activities', act);
}

// Sync Queue (Offline operations queue)
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const items = await db.getAll('sync_queue');
  return items.sort((a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime());
}

export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  await db.put('sync_queue', item);
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('sync_queue');
}

// Conflicts Store
export async function getConflicts(): Promise<ConflictRecord[]> {
  const db = await getDB();
  const list = await db.getAll('conflicts');
  return list.sort((a, b) => new Date(b.conflictTime).getTime() - new Date(a.conflictTime).getTime());
}

export async function addConflict(conflict: ConflictRecord): Promise<void> {
  const db = await getDB();
  await db.put('conflicts', conflict);
}

export async function resolveConflictInDB(conflictId: string, resolution: 'keep_local' | 'keep_remote' | 'merged'): Promise<void> {
  const db = await getDB();
  const c = await db.get('conflicts', conflictId);
  if (c) {
    c.resolved = true;
    c.resolvedAt = new Date().toISOString();
    c.resolution = resolution;
    await db.put('conflicts', c);
  }
}

// Clear all local data (for reset demo)
export async function purgeLocalUserStore(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['employees', 'transactions', 'notifications', 'activities', 'sync_queue', 'conflicts'], 'readwrite');
  await tx.objectStore('employees').clear();
  await tx.objectStore('transactions').clear();
  await tx.objectStore('notifications').clear();
  await tx.objectStore('activities').clear();
  await tx.objectStore('sync_queue').clear();
  await tx.objectStore('conflicts').clear();
  await tx.done;
}

export async function resetAllLocalDB(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['employees', 'transactions', 'settings', 'notifications', 'activities', 'sync_queue', 'conflicts'], 'readwrite');
  await tx.objectStore('employees').clear();
  await tx.objectStore('transactions').clear();
  await tx.objectStore('settings').clear();
  await tx.objectStore('notifications').clear();
  await tx.objectStore('activities').clear();
  await tx.objectStore('sync_queue').clear();
  await tx.objectStore('conflicts').clear();

  for (const emp of INITIAL_EMPLOYEES) {
    await tx.objectStore('employees').put(emp);
  }
  for (const t of INITIAL_TRANSACTIONS) {
    await tx.objectStore('transactions').put(t);
  }
  await tx.objectStore('settings').put(INITIAL_SETTINGS, 'main_settings');
  for (const n of INITIAL_NOTIFICATIONS) {
    await tx.objectStore('notifications').put(n);
  }
  for (const a of INITIAL_ACTIVITIES) {
    await tx.objectStore('activities').put(a);
  }
  await tx.done;
}
