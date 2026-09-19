import { AppSettings, Employee, Transaction, NotificationItem, ActivityItem } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'علي',
    role: 'موظف مبيعات وتطوير أعمال',
    basicSalary: 3000,
    phone: '0501234567',
    email: 'ali@hisabi.com',
    joinDate: '2026-01-01',
    status: 'active',
    notes: 'حساب موظف معتمد',
    version: 1,
    updatedAt: new Date().toISOString(),
  },
];

// Clean state for production start - completely zeroed out
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_SETTINGS: AppSettings = {
  currency: 'ريال',
  companyName: 'مؤسسة حسابي للحلول المالية والأتمتة',
  managerBypassConfirmation: true,
  enablePushNotifications: true,
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_ACTIVITIES: ActivityItem[] = [];
