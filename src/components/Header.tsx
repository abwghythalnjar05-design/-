import React from 'react';
import { ActiveRole, Employee, SyncState, NotificationItem, AuthUser } from '../types';
import { SyncStatusBadge } from './SyncStatusBadge';
import { NotificationCenter } from './NotificationCenter';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  Building2, 
  User, 
  ShieldCheck, 
  ChevronDown, 
  RotateCcw, 
  SlidersHorizontal,
  Printer,
  LogOut,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  currentUser: AuthUser | null;
  activeRole: ActiveRole;
  currentEmployee: Employee;
  employees: Employee[];
  syncState: SyncState;
  notifications: NotificationItem[];
  currency?: string;
  onSelectRole: (role: ActiveRole, employeeId?: string) => void;
  onOpenSettings: () => void;
  onResetDemo: () => void;
  onOpenReport: () => void;
  onMarkAllNotificationsRead: () => void;
  onNotificationClick?: (notif: NotificationItem) => void;
  onLogout: () => void;
  onOpenAndroidModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeRole,
  currentEmployee,
  employees,
  syncState,
  notifications,
  currency = 'ريال',
  onSelectRole,
  onOpenSettings,
  onResetDemo,
  onOpenReport,
  onMarkAllNotificationsRead,
  onNotificationClick,
  onLogout,
  onOpenAndroidModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const isManager = currentUser?.role === 'manager';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 border border-amber-500/40 p-1 flex items-center justify-center shadow-md shrink-0 hover:border-amber-400 transition-colors">
                <img
                  src="/app-logo.png"
                  alt="شعار النظام - المطور أبو غيث النجار"
                  className="w-full h-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-['Tajawal']">
                  حسابي
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hidden md:inline-block">
                  المطور أبو غيث النجار 2026
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block">
                  تطبيق أندرويد متكامل
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                إدارة الرواتب والعمولات والسحوبات والمصروفات • 0570936035
              </p>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button in Header */}
            <PWAInstallButton onOpenModal={onOpenAndroidModal} />

            {/* Sync Status Badge */}
            <SyncStatusBadge syncState={syncState} currency={currency} />

            {/* Notification Center */}
            <NotificationCenter
              notifications={notifications}
              onMarkAllAsRead={onMarkAllNotificationsRead}
              onNotificationClick={onNotificationClick}
            />

            {/* Quick Report Button */}
            <button
              id="header-report-btn"
              onClick={onOpenReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="طباعة تقرير مالي رسمي"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">تقرير مالي</span>
            </button>

            {/* Quick Settings - Manager Only */}
            {isManager && (
              <button
                id="header-settings-btn"
                onClick={onOpenSettings}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="إعدادات النظام"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}

            {/* Role & Account Display */}
            {isManager ? (
              // Manager Dropdown Switcher (can inspect employee views or overall team)
              <div className="relative">
                <button
                  id="role-switcher-toggle"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border bg-slate-900 text-white border-slate-900 shadow-xs cursor-pointer hover:bg-slate-800 transition"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="max-w-[120px] truncate">{activeRole === 'manager' ? 'المدير العام' : currentEmployee.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70 mr-1" />
                </button>

                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-right">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        عرض النظام بصلاحية:
                      </div>

                      {/* Manager Mode */}
                      <button
                        id="switch-to-manager"
                        onClick={() => {
                          onSelectRole('manager');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer ${
                          activeRole === 'manager'
                            ? 'bg-slate-100 text-slate-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-800 text-amber-300 flex items-center justify-center">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-semibold">لوحة المدير العام</p>
                            <p className="text-[10px] text-slate-400">إشراف وإدارة جميع الموظفين</p>
                          </div>
                        </div>
                        {activeRole === 'manager' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </button>

                      <div className="my-1.5 border-t border-slate-100" />
                      <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        معاينة حساب موظف محدد:
                      </div>

                      {/* Employees list */}
                      {employees.map((emp) => {
                        const isSelected = activeRole === 'employee' && currentEmployee.id === emp.id;
                        return (
                          <button
                            key={emp.id}
                            id={`switch-to-employee-${emp.id}`}
                            onClick={() => {
                              onSelectRole('employee', emp.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-right px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-900 font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                {emp.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{emp.name}</p>
                                <p className="text-[10px] text-slate-500">
                                  {emp.role} • {emp.basicSalary} {currency}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                          </button>
                        );
                      })}

                      <div className="my-1.5 border-t border-slate-100" />
                      <button
                        id="reset-demo-data-btn"
                        onClick={() => {
                          onResetDemo();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-right px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>إعادة تعيين البيانات الافتراضية</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Employee Mode: strictly displays current logged-in employee (cannot switch)
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold">
                <User className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="max-w-[120px] truncate">{currentUser?.name || currentEmployee.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-200/60 text-emerald-800 font-bold">موظف</span>
              </div>
            )}

            {/* Logout Button */}
            <button
              id="header-logout-btn"
              onClick={onLogout}
              className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="تسجيل الخروج ومسح الجلسة بأمان"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
