import React from 'react';
import { ActivityItem } from '../types';
import { 
  History, 
  TrendingUp, 
  ArrowDownRight, 
  Receipt, 
  Wallet, 
  UserCheck, 
  Clock,
  ShieldCheck,
  User
} from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
  currency?: string;
  limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  currency = 'ريال',
  limit = 8,
}) => {
  const displayActivities = activities.slice(0, limit);

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

  const getActivityIcon = (act: ActivityItem) => {
    if (act.transactionType === 'commission') {
      return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    }
    if (act.transactionType === 'withdrawal') {
      return <ArrowDownRight className="w-4 h-4 text-amber-600" />;
    }
    if (act.transactionType === 'expense') {
      return <Receipt className="w-4 h-4 text-rose-600" />;
    }
    if (act.transactionType === 'salary') {
      return <Wallet className="w-4 h-4 text-blue-600" />;
    }
    return <UserCheck className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">سجل آخر النشاطات</h3>
            <p className="text-xs text-slate-500">
              تتبع زمني فوري لمن قام بالعمليات ومقدارها وتوقيتها
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {displayActivities.length} نشاط
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {displayActivities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            لا توجد نشاطات مسجلة حتى الآن
          </div>
        ) : (
          displayActivities.map((act) => (
            <div
              key={act.id}
              className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  {getActivityIcon(act)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      {act.actorRole === 'manager' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      {act.actorName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium mt-1 leading-relaxed text-xs">
                    {act.details}
                  </p>
                </div>
              </div>

              {act.amount !== undefined && (
                <div className="font-mono font-bold text-slate-900 shrink-0 text-left">
                  {new Intl.NumberFormat('ar-SA').format(act.amount)} {currency}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
