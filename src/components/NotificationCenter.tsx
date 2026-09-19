import React, { useState } from 'react';
import { NotificationItem, NotificationType } from '../types';
import { syncManager } from '../services/syncManager';
import { 
  Bell, 
  CheckCheck, 
  X, 
  TrendingUp, 
  ArrowDownRight, 
  Receipt, 
  Wifi, 
  AlertTriangle, 
  Info,
  Clock,
  ExternalLink,
  BellRing
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onNotificationClick?: (notif: NotificationItem) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAllAsRead,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    return true;
  });

  const handleEnablePush = async () => {
    const granted = await syncManager.requestNotificationPermission();
    setPushPermissionStatus(granted ? 'granted' : 'denied');
  };

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case 'commission':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'withdrawal':
        return <ArrowDownRight className="w-4 h-4 text-amber-600" />;
      case 'expense':
        return <Receipt className="w-4 h-4 text-rose-600" />;
      case 'sync':
        return <Wifi className="w-4 h-4 text-blue-600" />;
      case 'low_balance':
      case 'conflict':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'system':
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        title="مركز الإشعارات المالية"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Drawer / Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            id="notification-center-drawer"
            className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-right animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">مركز الإشعارات</h3>
                  <p className="text-[10px] text-slate-400">
                    {unreadCount} إشعار غير مقروء
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    id="mark-all-read-btn"
                    onClick={onMarkAllAsRead}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-colors"
                    title="تمييز الكل كمقروء"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>تمييز الكل كمقروء</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Push Notifications Prompt (Section 7) */}
            {pushPermissionStatus === 'default' && (
              <div className="p-3 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-900">
                  <BellRing className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span className="text-[11px] font-medium leading-tight">
                    هل تريد تفعيل إشعارات المتصفح للعمليات الفورية؟
                  </span>
                </div>
                <button
                  onClick={handleEnablePush}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shrink-0 shadow-2xs transition-colors"
                >
                  تفعيل
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                الكل ({notifications.length})
              </button>
              <button
                onClick={() => setFilterType('unread')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  filterType === 'unread'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                غير المقروءة ({unreadCount})
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCheck className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                  <p className="font-semibold text-slate-600">لا توجد إشعارات حالياً</p>
                  <p className="text-[11px] mt-0.5">ستظهر هنا تحديثات العمليات والمزامنة فور حدوثها</p>
                </div>
              ) : (
                filtered.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (onNotificationClick) onNotificationClick(notif);
                    }}
                    className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
                      !notif.read ? 'bg-indigo-50/20' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${!notif.read ? 'text-slate-900 font-black' : 'text-slate-700'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {formatRelativeTime(notif.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400">
                إشعارات تطبيق حسابي — التحديث المالي الفوري
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
