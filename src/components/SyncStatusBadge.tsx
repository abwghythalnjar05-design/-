import React, { useState, useEffect } from 'react';
import { SyncState, SyncQueueItem } from '../types';
import { getSyncQueue } from '../services/db';
import { syncManager } from '../services/syncManager';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronDown,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface SyncStatusBadgeProps {
  syncState: SyncState;
  currency?: string;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ syncState, currency = 'ريال' }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [isFlushing, setIsFlushing] = useState(false);

  const loadQueue = async () => {
    const items = await getSyncQueue();
    setQueueItems(items);
  };

  useEffect(() => {
    if (showDetails) {
      loadQueue();
    }
  }, [showDetails, syncState.pendingCount]);

  const handleManualSync = async () => {
    setIsFlushing(true);
    await syncManager.flushQueue();
    await loadQueue();
    setIsFlushing(false);
  };

  const getStatusBadge = () => {
    switch (syncState.status) {
      case 'synced':
        return {
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: 'متصل ومتزامن',
          icon: <Wifi className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case 'syncing':
        return {
          dotColor: 'bg-amber-500 animate-pulse',
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'تتم المزامنة...',
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />,
        };
      case 'offline':
      default:
        return {
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          label: 'غير متصل (يعمل محلياً)',
          icon: <WifiOff className="w-3.5 h-3.5 text-rose-600" />,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Main Status Pill */}
        <button
          id="sync-status-indicator"
          type="button"
          onClick={() => setShowDetails(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bgColor} ${badge.borderColor} ${badge.textColor} hover:opacity-90 transition-all cursor-pointer shadow-2xs`}
          title="حالة المزامنة السحابية وقاعدة البيانات المحلية"
        >
          <span className={`w-2 h-2 rounded-full ${badge.dotColor}`} />
          <span className="hidden sm:inline">{badge.label}</span>
          <span className="sm:hidden">{badge.label.split(' ')[0]}</span>
        </button>

        {/* Pending Operations Badge (Section 4: "3 عمليات تنتظر المزامنة") */}
        {syncState.pendingCount > 0 && (
          <button
            id="sync-pending-badge"
            type="button"
            onClick={() => setShowDetails(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs hover:bg-amber-600 transition-colors cursor-pointer animate-pulse"
          >
            <Clock className="w-3 h-3" />
            <span>
              {syncState.pendingCount}{' '}
              {syncState.pendingCount === 1 ? 'عملية تنتظر' : 'عمليات تنتظر المزامنة'}
            </span>
          </button>
        )}
      </div>

      {/* Sync Details Modal / Drawer */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            id="sync-details-modal"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${badge.bgColor} ${badge.borderColor} border`}>
                  {badge.icon}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    مركز المزامنة وقاعدة البيانات المحلية
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    نظام Local-First التلقائي المدعوم بـ IndexedDB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Status Banner */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${badge.bgColor} ${badge.borderColor}`}>
                <div className="mt-0.5">{badge.icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-xs">
                    الحالة الحالية: <span className={badge.textColor}>{badge.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {syncState.status === 'synced' && 'كافة العمليات متطابقة بين جهازك والسيرفر السحابي.'}
                    {syncState.status === 'syncing' && 'جاري تبادل البيانات مع السيرفر وتطبيق التحديثات الأخيرة.'}
                    {syncState.status === 'offline' && 'أنت تعمل بوضع عدم الاتصال. يتم حفظ كل عملية محلياً بـ IndexedDB بأمان تام ووضعها في طابور المزامنة.'}
                  </p>
                  {syncState.lastSyncedAt && (
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      آخر مزامنة ناجحة: {new Date(syncState.lastSyncedAt).toLocaleTimeString('ar-SA')}
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Queue Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    طابور العمليات المعلقة ({queueItems.length})
                  </span>
                  <button
                    onClick={handleManualSync}
                    disabled={isFlushing || !navigator.onLine}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFlushing ? 'animate-spin' : ''}`} />
                    <span>مزامنة فورية الآن</span>
                  </button>
                </div>

                {queueItems.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-slate-500 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-slate-700 text-xs">طابور المزامنة فارغ تماماً</p>
                    <p className="text-[11px] text-slate-400">جميع العمليات محفوظة ومتزامنة مع الأجهزة الأخرى</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {queueItems.map((item) => (
                      <div 
                        key={item.id}
                        className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {item.data.description}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-bold text-amber-800">
                              {item.data.amount} {currency}
                            </span>
                            <span>•</span>
                            <span>{item.data.employeeName}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px]">
                              {new Date(item.queuedAt).toLocaleTimeString('ar-SA')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                          معلق
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                IndexedDB Local Storage Active
              </span>
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
