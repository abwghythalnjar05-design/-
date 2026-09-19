export type TransactionType = 'salary' | 'commission' | 'withdrawal' | 'expense';

export type TransactionStatus = 'active' | 'cancelled';

export type TransactionSource = 'manual' | 'nlp';

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

export interface Transaction {
  id: string; // e.g. "TX-1001"
  employeeId: string;
  employeeName: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  recordedBy: string; // Name of user who entered the transaction
  source: TransactionSource;
  notes?: string;
  status: TransactionStatus;
  cancelledAt?: string;
  cancelledBy?: string;
  
  // Concurrency & Sync metadata (Section 5 requirements)
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  createdBy: string;
  updatedBy: string;
  version: number;
  syncStatus: SyncStatus;
  deviceId: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  basicSalary: number;
  phone?: string;
  email?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'archived';
  notes?: string;
  version?: number;
  updatedAt?: string;
}

export interface FinancialSummary {
  basicSalary: number;
  totalCommissions: number;
  totalIncome: number; // basicSalary + totalCommissions
  totalWithdrawals: number;
  totalExpenses: number;
  totalDeductions: number; // totalWithdrawals + totalExpenses
  remainingBalance: number; // totalIncome - totalDeductions
}

export interface AppSettings {
  currency: string;
  companyName: string;
  managerBypassConfirmation: boolean;
  enablePushNotifications?: boolean;
}

export interface NLPParseResult {
  type: TransactionType;
  amount: number | null;
  category: string;
  description: string;
  date: string;
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
  sourceText: string;
}

export type ActiveRole = 'employee' | 'manager';

// Section 5: Conflict resolution
export interface ConflictRecord {
  id: string;
  transactionId: string;
  localVersion: Transaction;
  remoteVersion: Transaction;
  conflictTime: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: 'keep_local' | 'keep_remote' | 'merged';
}

// Section 6: Notification items
export type NotificationType = 
  | 'commission' 
  | 'withdrawal' 
  | 'expense' 
  | 'sync' 
  | 'low_balance' 
  | 'system' 
  | 'conflict'
  | 'salary';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  type: NotificationType;
  targetUser: string; // 'all' or employeeId
  read: boolean;
  linkId?: string; // e.g. transactionId
}

// Section 14: Activity items
export interface ActivityItem {
  id: string;
  actorName: string;
  actorRole: ActiveRole;
  action: 'create' | 'update' | 'cancel' | 'sync' | 'employee_add';
  transactionType?: TransactionType;
  amount?: number;
  employeeName?: string;
  employeeId?: string;
  details: string;
  timestamp: string; // ISO string
}

// Section 10: Filter periods
export type FilterPeriod = 
  | 'today' 
  | 'this_week' 
  | 'this_month' 
  | 'last_month' 
  | 'last_3_months' 
  | 'custom';

// Section 3 & 4: Sync state
export type OnlineStatus = 'synced' | 'syncing' | 'offline';

export interface SyncState {
  status: OnlineStatus;
  pendingCount: number;
  lastSyncedAt: string | null;
  errorMessage?: string;
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'cancel';
  data: Transaction;
  queuedAt: string;
  retryCount: number;
}

// User Accounts & Authentication (Multi-User Isolation)
export interface AuthUser {
  userId: string;
  username: string;
  name: string;
  role: ActiveRole;
  employeeId: string | null;
  phone?: string;
  email?: string;
}

export interface UserAccount {
  userId: string;
  username: string;
  password?: string; // Visible to Manager for manual credential sharing
  name: string;
  role: ActiveRole;
  employeeId: string | null;
  phone?: string;
  email?: string;
  createdAt?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

