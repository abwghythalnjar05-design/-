import React, { useState, useEffect, useCallback } from 'react';
import { 
  ActiveRole, 
  AppSettings, 
  Employee, 
  NLPParseResult, 
  Transaction, 
  TransactionType, 
  SyncState, 
  NotificationItem, 
  ActivityItem, 
  ConflictRecord,
  AuthUser 
} from './types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_SETTINGS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ACTIVITIES 
} from './data/initialData';
import { calculateEmployeeSummary } from './utils/finance';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ClarificationModal } from './components/ClarificationModal';
import { ManualTransactionModal } from './components/ManualTransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { FinancialReportModal } from './components/FinancialReportModal';
import { ConflictReviewModal } from './components/ConflictReviewModal';
import { DeveloperFooter } from './components/DeveloperFooter';
import { AndroidAppModal } from './components/AndroidAppModal';
import { AndroidBottomNav } from './components/AndroidBottomNav';
import { AndroidInstallBanner } from './components/AndroidInstallBanner';
import { 
  seedInitialDataIfEmpty, 
  getLocalEmployees, 
  getLocalTransactions, 
  getLocalSettings, 
  getLocalNotifications, 
  getLocalActivities, 
  putLocalTransaction, 
  saveLocalEmployee, 
  saveLocalSettings, 
  addLocalActivity, 
  addLocalNotification, 
  markAllNotificationsAsReadLocal, 
  addToSyncQueue, 
  getConflicts, 
  resolveConflictInDB, 
  resetAllLocalDB,
  purgeLocalUserStore 
} from './services/db';
import { syncManager, getDeviceId } from './services/syncManager';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'hisabi_auth_token_v2',
  USER_ID: 'hisabi_user_id_v2',
  CACHED_USER: 'hisabi_cached_user_v2',
  ACTIVE_ROLE: 'hisabi_role_v2',
  CURRENT_EMP: 'hisabi_current_emp_v2',
};

export default function App() {
  // Authentication & Session State (Multi-User Isolation)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  });
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Active role & employee ID
  const [activeRole, setActiveRole] = useState<ActiveRole>('employee');
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string>('emp-1');

  // Local-First Data state initialized with fallback
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);

  // Sync state
  const [syncState, setSyncState] = useState<SyncState>({
    status: navigator.onLine ? 'synced' : 'offline',
    pendingCount: 0,
    lastSyncedAt: null,
  });

  // Unresolved Conflicts list
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);

  // Modals state
  const [pendingConfirmationTx, setPendingConfirmationTx] = useState<{
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
    employeeId: string;
    employeeName: string;
    notes?: string;
    source: 'manual' | 'nlp';
  } | null>(null);

  const [pendingClarificationResult, setPendingClarificationResult] = useState<NLPParseResult | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualDefaultType, setManualDefaultType] = useState<TransactionType>('commission');
  const [manualTargetEmpId, setManualTargetEmpId] = useState<string | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Check unresolved conflicts from IndexedDB
  const checkConflicts = useCallback(async () => {
    try {
      const allConflicts = await getConflicts();
      const unresolved = allConflicts.filter((c) => !c.resolved);
      setConflicts(unresolved);
    } catch (e) {
      console.warn('Could not check conflicts:', e);
    }
  }, []);

  // 1. Initial Session Check (Auth Verification on Startup)
  useEffect(() => {
    let mounted = true;

    async function checkAuthSession() {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        if (mounted) setIsAuthChecking(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const user: AuthUser = await res.json();
          if (mounted) {
            setCurrentUser(user);
            setAuthToken(token);
            setActiveRole(user.role);
            if (user.employeeId) {
              setCurrentEmployeeId(user.employeeId);
            }
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.CACHED_USER);
          if (mounted) {
            setAuthToken(null);
            setCurrentUser(null);
          }
        }
      } catch {
        // Offline recovery: load from cached session if available
        const cached = localStorage.getItem(STORAGE_KEYS.CACHED_USER);
        if (cached && mounted) {
          try {
            const user: AuthUser = JSON.parse(cached);
            setCurrentUser(user);
            setActiveRole(user.role);
            if (user.employeeId) setCurrentEmployeeId(user.employeeId);
          } catch {}
        }
      } finally {
        if (mounted) setIsAuthChecking(false);
      }
    }

    checkAuthSession();

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load Local Data & Initialize Sync when authenticated
  useEffect(() => {
    if (!currentUser || !authToken) return;
    const user = currentUser;
    const token = authToken;

    let mounted = true;

    async function initializeUserData() {
      try {
        await seedInitialDataIfEmpty();
        const [loadedEmps, loadedTx, loadedSettings, loadedNotifs, loadedActs] = await Promise.all([
          getLocalEmployees(),
          getLocalTransactions(),
          getLocalSettings(),
          getLocalNotifications(),
          getLocalActivities(),
        ]);

        if (mounted) {
          if (user.role === 'manager') {
            setEmployees(loadedEmps);
            setTransactions(loadedTx);
            setNotifications(loadedNotifs);
            setActivities(loadedActs);
          } else {
            // Strict Isolation for Employee: only see own account data
            setEmployees(loadedEmps.filter((e) => e.id === user.employeeId));
            setTransactions(loadedTx.filter((t) => t.employeeId === user.employeeId));
            setNotifications(loadedNotifs.filter((n) => n.targetUser === user.employeeId));
            setActivities(
              loadedActs.filter(
                (a) =>
                  (a.employeeId && a.employeeId === user.employeeId) ||
                  a.employeeName === user.name
              )
            );
          }
          setSettings(loadedSettings);
        }

        // Initialize sync manager with current token and role
        syncManager.init(token, user.role, user.employeeId);
        await checkConflicts();
      } catch (err) {
        console.error('Error initializing user data:', err);
      }
    }

    initializeUserData();

    // Subscribe to sync state changes
    const unsubSync = syncManager.subscribeSyncState((newState) => {
      if (mounted) {
        setSyncState(newState);
      }
    });

    // Subscribe to remote real-time broadcasts
    const unsubRemote = syncManager.subscribeRemoteData((remoteData) => {
      if (!mounted) return;
      if (remoteData.transactions) {
        if (user.role === 'manager') {
          setTransactions(remoteData.transactions);
        } else {
          setTransactions(
            remoteData.transactions.filter((t) => t.employeeId === user.employeeId)
          );
        }
      }
      if (remoteData.employees) {
        if (user.role === 'manager') {
          setEmployees(remoteData.employees);
        } else if (user.employeeId) {
          setEmployees(remoteData.employees.filter((e) => e.id === user.employeeId));
        }
      }
      if (remoteData.notifications) {
        if (user.role === 'manager') {
          setNotifications(remoteData.notifications);
        } else {
          setNotifications(
            remoteData.notifications.filter((n) => n.targetUser === user.employeeId)
          );
        }
      }
      if (remoteData.activities) {
        if (user.role === 'manager') {
          setActivities(remoteData.activities);
        } else {
          setActivities(
            remoteData.activities.filter(
              (a) =>
                (a.employeeId && a.employeeId === user.employeeId) ||
                a.employeeName === user.name
            )
          );
        }
      }
      if (remoteData.settings) {
        setSettings(remoteData.settings);
      }
      checkConflicts();
    });

    return () => {
      mounted = false;
      unsubSync();
      unsubRemote();
    };
  }, [currentUser, authToken, checkConflicts]);

  // Handle Login Success (Strict User Data Isolation)
  const handleLoginSuccess = async (user: AuthUser, token: string) => {
    const previousUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);

    // If switching between different accounts on the same device, purge sensitive local DB
    if (previousUserId && previousUserId !== user.userId) {
      await purgeLocalUserStore();
      setEmployees([]);
      setTransactions([]);
      setNotifications([]);
      setActivities([]);
    }

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_ID, user.userId);
    localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, user.role);
    if (user.employeeId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_EMP, user.employeeId);
    }

    setAuthToken(token);
    setCurrentUser(user);
    setActiveRole(user.role);
    if (user.employeeId) {
      setCurrentEmployeeId(user.employeeId);
    }

    syncManager.init(token, user.role, user.employeeId);
    await syncManager.fetchFullState();
    showToast(`أهلاً بك، ${user.name}`);
  };

  // Handle Logout (Purge Session & Wipe Local DB)
  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {}
    }

    syncManager.disconnect();
    await purgeLocalUserStore();

    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CACHED_USER);
    setAuthToken(null);
    setCurrentUser(null);
    setEmployees([]);
    setTransactions([]);
    setNotifications([]);
    setActivities([]);

    showToast('تم تسجيل الخروج ومسح بيانات الجلسة بأمان');
  };

  // Find active employee object
  const currentEmployee =
    employees.find((e) => e.id === currentEmployeeId) ||
    (currentUser?.employeeId
      ? {
          id: currentUser.employeeId,
          name: currentUser.name,
          role: 'موظف',
          basicSalary: 4000,
          joinDate: '2024-01-01',
          status: 'active' as const,
        }
      : employees[0] || INITIAL_EMPLOYEES[0]);

  // Financial summary for current employee
  const currentEmployeeSummary = calculateEmployeeSummary(currentEmployee, transactions);

  // Switch role handler (only manager can switch)
  const handleSelectRole = (role: ActiveRole, empId?: string) => {
    if (currentUser?.role !== 'manager') {
      return; // Non-managers cannot switch
    }
    setActiveRole(role);
    if (empId) {
      setCurrentEmployeeId(empId);
    }
  };

  // Reset Demo Data handler (Manager Only)
  const handleResetDemo = async () => {
    if (currentUser?.role !== 'manager') return;
    try {
      await resetAllLocalDB();
      if (navigator.onLine && authToken) {
        await fetch('/api/admin/reset-demo', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
      const [loadedEmps, loadedTx, loadedSettings, loadedNotifs, loadedActs] = await Promise.all([
        getLocalEmployees(),
        getLocalTransactions(),
        getLocalSettings(),
        getLocalNotifications(),
        getLocalActivities(),
      ]);
      setEmployees(loadedEmps);
      setTransactions(loadedTx);
      setSettings(loadedSettings);
      setNotifications(loadedNotifs);
      setActivities(loadedActs);
      setConflicts([]);
      showToast('تمت استعادة البيانات الافتراضية بنجاح.');
      await syncManager.flushQueue();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // Process saving confirmed transaction (Local-First + Sync Queue)
  const commitTransaction = async (txData: {
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
    employeeId: string;
    employeeName: string;
    notes?: string;
    source: 'manual' | 'nlp';
  }) => {
    const isManager = currentUser?.role === 'manager';

    // Strict Security Constraint: If logged in as employee, always enforce their own ID & name
    const finalEmpId = isManager ? txData.employeeId : currentUser!.employeeId!;
    const finalEmpName = isManager ? txData.employeeName : currentUser!.name;

    const newTxId = `TX-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const recordedBy = isManager ? 'المدير العام' : `${finalEmpName} (الموظف)`;

    const newTransaction: Transaction = {
      id: newTxId,
      employeeId: finalEmpId,
      employeeName: finalEmpName,
      type: txData.type,
      amount: txData.amount,
      description: txData.description,
      category: txData.category,
      date: txData.date || nowIso.split('T')[0],
      time: nowTime,
      recordedBy,
      source: txData.source,
      notes: txData.notes,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: recordedBy,
      updatedBy: recordedBy,
      version: 1,
      syncStatus: 'pending',
      deviceId: getDeviceId(),
    };

    // 1. Instant local state update
    setTransactions((prev) => [newTransaction, ...prev]);
    setPendingConfirmationTx(null);

    // 2. Persist to IndexedDB
    await putLocalTransaction(newTransaction);

    // 3. Log Activity
    const newActivity: ActivityItem = {
      id: `ACT-${Date.now()}`,
      actorName: recordedBy,
      actorRole: activeRole,
      action: 'create',
      transactionType: txData.type,
      amount: txData.amount,
      employeeName: finalEmpName,
      employeeId: finalEmpId,
      details: `${recordedBy} سجّل ${txData.description} بقيمة ${txData.amount} ${settings.currency}`,
      timestamp: nowIso,
    };
    await addLocalActivity(newActivity);
    setActivities((prev) => [newActivity, ...prev]);

    // Local Notification for this user's account only
    const userNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: `تسجيل ${txData.type === 'commission' ? 'عمولة جديدة' : txData.type === 'withdrawal' ? 'سحبة نقدية' : txData.type === 'expense' ? 'مصروف' : 'راتب'}`,
      message: `تم حفظ العملية بنجاح: ${txData.description} (${txData.amount} ${settings.currency})`,
      timestamp: nowIso,
      type: txData.type,
      targetUser: finalEmpId,
      read: false,
      linkId: newTxId,
    };
    await addLocalNotification(userNotif);
    setNotifications((prev) => [userNotif, ...prev]);

    // 4. Enqueue in sync queue
    await addToSyncQueue({
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      operation: 'create',
      data: newTransaction,
      queuedAt: nowIso,
      retryCount: 0,
    });

    // 5. Trigger Background Sync
    await syncManager.refreshPendingCount();
    syncManager.flushQueue();

    showToast(`تم حفظ العملية محلياً وجارٍ المزامنة (${newTransaction.amount} ${settings.currency})`);
  };

  // Trigger Transaction addition
  const initiateTransaction = (txData: {
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
    employeeId: string;
    employeeName: string;
    notes?: string;
    source: 'manual' | 'nlp';
  }) => {
    // Check bypass confirmation setting
    if (activeRole === 'manager' && settings.managerBypassConfirmation) {
      commitTransaction(txData);
      return;
    }

    setPendingConfirmationTx(txData);
  };

  // Handle NLP Result
  const handleParsedNLPResult = (result: NLPParseResult) => {
    if (result.clarificationNeeded || !result.amount || result.amount <= 0) {
      setPendingClarificationResult(result);
      return;
    }

    initiateTransaction({
      type: result.type,
      amount: result.amount,
      category: result.category,
      description: result.description,
      date: result.date || new Date().toISOString().split('T')[0],
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      source: 'nlp',
    });
  };

  // Proceed with Clarified Amount
  const handleProceedWithClarifiedAmount = (amount: number) => {
    if (!pendingClarificationResult) return;
    initiateTransaction({
      type: pendingClarificationResult.type,
      amount: amount,
      category: pendingClarificationResult.category,
      description: pendingClarificationResult.description,
      date: pendingClarificationResult.date || new Date().toISOString().split('T')[0],
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      source: 'nlp',
    });
    setPendingClarificationResult(null);
  };

  // Open manual modal with preselected options
  const openManualModalWithDefaults = (type?: TransactionType, empId?: string) => {
    setEditingTransaction(null);
    if (type) setManualDefaultType(type);
    if (empId) setManualTargetEmpId(empId);
    else setManualTargetEmpId(currentEmployee.id);
    setIsManualModalOpen(true);
  };

  // Save manual transaction (New or Edit)
  const handleSaveManualTransaction = async (txData: {
    type: TransactionType;
    employeeId: string;
    employeeName: string;
    amount: number;
    description: string;
    category: string;
    date: string;
    time: string;
    notes?: string;
  }) => {
    setIsManualModalOpen(false);

    if (editingTransaction) {
      const updatedTx: Transaction = {
        ...editingTransaction,
        ...txData,
        updatedAt: new Date().toISOString(),
        updatedBy: activeRole === 'manager' ? 'المدير العام' : currentEmployee.name,
        syncStatus: 'pending',
        version: editingTransaction.version + 1,
        deviceId: getDeviceId(),
      };

      setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
      setEditingTransaction(null);

      await putLocalTransaction(updatedTx);

      const updateActivity: ActivityItem = {
        id: `ACT-${Date.now()}`,
        actorName: activeRole === 'manager' ? 'المدير العام' : currentEmployee.name,
        actorRole: activeRole,
        action: 'update',
        transactionType: updatedTx.type,
        amount: updatedTx.amount,
        employeeName: updatedTx.employeeName,
        details: `تم تعديل بيانات العملية ${updatedTx.id} (${updatedTx.description})`,
        timestamp: new Date().toISOString(),
      };
      await addLocalActivity(updateActivity);
      setActivities((prev) => [updateActivity, ...prev]);

      await addToSyncQueue({
        id: `queue-${Date.now()}`,
        operation: 'update',
        data: updatedTx,
        queuedAt: new Date().toISOString(),
        retryCount: 0,
      });

      await syncManager.refreshPendingCount();
      syncManager.flushQueue();

      showToast(`تم تعديل العملية بنجاح (${updatedTx.amount} ${settings.currency})`);
    } else {
      initiateTransaction({
        ...txData,
        source: 'manual',
      });
    }
  };

  // Cancel / Restore Transaction (Swipe action or button)
  const handleToggleCancelTransaction = async (txId: string) => {
    const target = transactions.find((t) => t.id === txId);
    if (!target) return;

    const isManager = currentUser?.role === 'manager';
    // Employee can only cancel/restore their own transaction
    if (!isManager && target.employeeId !== currentUser?.employeeId) {
      showToast('لا تملك الصلاحية لتعديل أو إلغاء هذه العملية');
      return;
    }

    const actorName = isManager ? 'المدير العام' : `${currentUser?.name || target.employeeName} (الموظف)`;
    const actorRole = isManager ? 'manager' : 'employee';

    if (target.status === 'active') {
      const cancelledTx: Transaction = {
        ...target,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: actorName,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
        version: target.version + 1,
        deviceId: getDeviceId(),
      };

      setTransactions((prev) => prev.map((t) => (t.id === txId ? cancelledTx : t)));
      await putLocalTransaction(cancelledTx);

      const cancelActivity: ActivityItem = {
        id: `ACT-${Date.now()}`,
        actorName,
        actorRole,
        action: 'cancel',
        transactionType: target.type,
        amount: target.amount,
        employeeName: target.employeeName,
        details: `${actorName} ألغى العملية (${target.description}) بقيمة ${target.amount} ${settings.currency}`,
        timestamp: new Date().toISOString(),
      };
      await addLocalActivity(cancelActivity);
      setActivities((prev) => [cancelActivity, ...prev]);

      await addToSyncQueue({
        id: `queue-${Date.now()}`,
        operation: 'cancel',
        data: cancelledTx,
        queuedAt: new Date().toISOString(),
        retryCount: 0,
      });

      await syncManager.refreshPendingCount();
      syncManager.flushQueue();

      showToast(`تم إلغاء العملية ${target.id} بنجاح`);
    } else {
      // Restore cancelled transaction
      const restoredTx: Transaction = {
        ...target,
        status: 'active',
        cancelledAt: undefined,
        cancelledBy: undefined,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
        version: target.version + 1,
        deviceId: getDeviceId(),
      };

      setTransactions((prev) => prev.map((t) => (t.id === txId ? restoredTx : t)));
      await putLocalTransaction(restoredTx);

      const restoreActivity: ActivityItem = {
        id: `ACT-${Date.now()}`,
        actorName,
        actorRole,
        action: 'update',
        transactionType: target.type,
        amount: target.amount,
        employeeName: target.employeeName,
        details: `${actorName} استرجع العملية (${target.description}) بقيمة ${target.amount} ${settings.currency}`,
        timestamp: new Date().toISOString(),
      };
      await addLocalActivity(restoreActivity);
      setActivities((prev) => [restoreActivity, ...prev]);

      await addToSyncQueue({
        id: `queue-${Date.now()}`,
        operation: 'update',
        data: restoredTx,
        queuedAt: new Date().toISOString(),
        retryCount: 0,
      });

      await syncManager.refreshPendingCount();
      syncManager.flushQueue();

      showToast(`تم استرجاع العملية ${target.id} إلى الحسابات`);
    }
  };

  // Manager: Add new employee
  const handleAddEmployee = async (newEmp: Omit<Employee, 'id'>) => {
    if (currentUser?.role !== 'manager') return;
    const id = `emp-${Date.now().toString().slice(-4)}`;
    const fullEmp: Employee = {
      ...newEmp,
      id,
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    setEmployees((prev) => [...prev, fullEmp]);
    await saveLocalEmployee(fullEmp);

    if (navigator.onLine && authToken) {
      fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(fullEmp),
      }).catch(() => {});
    }

    const empActivity: ActivityItem = {
      id: `ACT-${Date.now()}`,
      actorName: 'المدير العام',
      actorRole: 'manager',
      action: 'create',
      employeeName: fullEmp.name,
      details: `تمت إضافة موظف جديد: ${fullEmp.name} (${fullEmp.role}) براتب ${fullEmp.basicSalary} ${settings.currency}`,
      timestamp: new Date().toISOString(),
    };
    await addLocalActivity(empActivity);
    setActivities((prev) => [empActivity, ...prev]);

    showToast(`تمت إضافة الموظف "${fullEmp.name}" بنجاح.`);
  };

  // Manager: Update employee
  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    if (currentUser?.role !== 'manager') return;
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
    await saveLocalEmployee(updatedEmp);

    if (navigator.onLine && authToken) {
      fetch(`/api/employees/${updatedEmp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedEmp),
      }).catch(() => {});
    }

    showToast(`تم تحديث بيانات الموظف "${updatedEmp.name}".`);
  };

  // Manager: Toggle status (active/inactive)
  const handleToggleEmployeeStatus = async (empId: string) => {
    if (currentUser?.role !== 'manager') return;
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const nextStatus: 'active' | 'inactive' = emp.status === 'active' ? 'inactive' : 'active';
    const updated: Employee = { ...emp, status: nextStatus, updatedAt: new Date().toISOString() };
    await handleUpdateEmployee(updated);
  };

  // Manager: Delete / Archive employee
  const handleDeleteEmployee = async (empId: string) => {
    if (currentUser?.role !== 'manager') return;
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const archived = { ...emp, status: 'archived' as const, updatedAt: new Date().toISOString() };
    await handleUpdateEmployee(archived);
    showToast(`تمت أرشفة الموظف "${emp.name}".`);
  };

  // Mark all notifications read
  const handleMarkAllNotificationsRead = async () => {
    await markAllNotificationsAsReadLocal();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (navigator.onLine && authToken) {
      fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
  };

  // Conflict Resolution Handler
  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'keep_local' | 'keep_remote' | 'merged'
  ) => {
    await resolveConflictInDB(conflictId, resolution);
    setConflicts((prev) => prev.filter((c) => c.id !== conflictId));

    if (navigator.onLine && authToken) {
      fetch('/api/sync/resolve-conflict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ conflictId, resolution }),
      }).catch(() => {});
    }

    showToast('تم اعتماد النسخة وحل التعارض بنجاح.');
  };

  // -------------------------------------------------------------
  // RENDER FLOW: AUTH CHECK -> LOGIN SCREEN -> MAIN APPLICATION
  // -------------------------------------------------------------

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white selection:bg-emerald-500">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">جارٍ التحقق من جلسة الأمان وتجهيز قاعدة البيانات...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Android Native Install Announcement Banner */}
      <AndroidInstallBanner onOpenModal={() => setIsAndroidModalOpen(true)} />

      {/* Dynamic Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-5 left-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 text-white text-xs sm:text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        currentUser={currentUser}
        activeRole={activeRole}
        currentEmployee={currentEmployee}
        employees={employees}
        syncState={syncState}
        notifications={notifications}
        currency={settings.currency}
        onSelectRole={handleSelectRole}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetDemo={handleResetDemo}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onNotificationClick={(n) => {
          if (n.linkId) {
            const tx = transactions.find((t) => t.id === n.linkId);
            if (tx) {
              setEditingTransaction(tx);
              setIsManualModalOpen(true);
            }
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main Container with Mobile Android Bottom Nav Safe Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-8">
        {activeRole === 'employee' ? (
          <EmployeeDashboard
            currentEmployee={currentEmployee}
            summary={currentEmployeeSummary}
            transactions={transactions}
            activities={activities}
            currency={settings.currency}
            onOpenManualModal={(type) => openManualModalWithDefaults(type)}
            onParsedNLPResult={handleParsedNLPResult}
            onOpenReport={() => setIsReportOpen(true)}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsManualModalOpen(true);
            }}
            onToggleCancelTransaction={handleToggleCancelTransaction}
          />
        ) : (
          <ManagerDashboard
            employees={employees}
            transactions={transactions}
            activities={activities}
            currency={settings.currency}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onToggleEmployeeStatus={handleToggleEmployeeStatus}
            onDeleteEmployee={handleDeleteEmployee}
            onOpenManualModal={(type, empId) => openManualModalWithDefaults(type, empId)}
            onParsedNLPResult={handleParsedNLPResult}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsManualModalOpen(true);
            }}
            onToggleCancelTransaction={handleToggleCancelTransaction}
            onOpenReport={() => setIsReportOpen(true)}
          />
        )}
      </main>

      {/* Developer Footer */}
      <DeveloperFooter />

      {/* Native Android Mobile Bottom Navigation Bar */}
      <AndroidBottomNav
        activeTab={mobileActiveTab}
        onSelectTab={(tab) => {
          setMobileActiveTab(tab);
          if (tab === 'transactions') {
            // Smooth scroll to transactions container on mobile
            const el = document.getElementById('transactions-history-card') || document.getElementById('transaction-history') || document.querySelector('table');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onOpenNewTransaction={() => openManualModalWithDefaults()}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        isManager={activeRole === 'manager'}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 5. CONFIRMATION MODAL FOR SENSITIVE TRANSACTIONS */}
      <ConfirmationModal
        pendingTx={pendingConfirmationTx}
        currency={settings.currency}
        onConfirm={() => {
          if (pendingConfirmationTx) {
            commitTransaction(pendingConfirmationTx);
          }
        }}
        onCancel={() => setPendingConfirmationTx(null)}
      />

      {/* CLARIFICATION MODAL (When Amount is Unclear) */}
      <ClarificationModal
        nlpResult={pendingClarificationResult}
        currency={settings.currency}
        onProceedWithAmount={handleProceedWithClarifiedAmount}
        onCancel={() => setPendingClarificationResult(null)}
      />

      {/* MANUAL TRANSACTION ADD / EDIT MODAL */}
      <ManualTransactionModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveManualTransaction}
        employees={employees.filter((e) => e.status !== 'archived')}
        currentEmployee={
          manualTargetEmpId
            ? employees.find((e) => e.id === manualTargetEmpId) || currentEmployee
            : currentEmployee
        }
        isManager={activeRole === 'manager'}
        currency={settings.currency}
        editTransaction={editingTransaction}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={async (newSettings) => {
          setSettings(newSettings);
          await saveLocalSettings(newSettings);
          if (navigator.onLine && authToken) {
            fetch('/api/settings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify(newSettings),
            }).catch(() => {});
          }
          showToast('تم حفظ إعدادات النظام بنجاح.');
        }}
        onResetDemo={handleResetDemo}
        isManager={activeRole === 'manager'}
        authToken={authToken}
        employees={employees}
        onEmployeesChange={(updated) => setEmployees(updated)}
      />

      {/* FINANCIAL REPORT PRINTABLE MODAL */}
      <FinancialReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        employees={activeRole === 'manager' ? employees : [currentEmployee]}
        transactions={
          activeRole === 'manager'
            ? transactions
            : transactions.filter((t) => t.employeeId === currentEmployee.id)
        }
        currency={settings.currency}
        companyName={settings.companyName}
      />

      {/* 5. CONFLICT REVIEW MODAL */}
      {conflicts.length > 0 && (
        <ConflictReviewModal
          conflicts={conflicts}
          currency={settings.currency}
          onResolve={handleResolveConflict}
        />
      )}

      {/* ANDROID APPLICATION & INSTALLATION MODAL */}
      <AndroidAppModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        onOpenManualModal={() => openManualModalWithDefaults()}
      />
    </div>
  );
}
