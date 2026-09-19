import React from 'react';
import { FilterPeriod, Transaction } from '../types';
import { Sparkles, TrendingUp, ArrowDownRight, Receipt, Wallet } from 'lucide-react';

interface SmartSummaryBannerProps {
  filteredTransactions: Transaction[];
  period: FilterPeriod;
  currency?: string;
  employeeName?: string; // If filtered to a specific employee
}

export const SmartSummaryBanner: React.FC<SmartSummaryBannerProps> = ({
  filteredTransactions,
  period,
  currency = 'ريال',
  employeeName,
}) => {
  // Compute totals for active transactions in this filter
  const activeTx = filteredTransactions.filter((t) => t.status === 'active');
  
  const totalCommissions = activeTx
    .filter((t) => t.type === 'commission')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = activeTx
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = activeTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSalaries = activeTx
    .filter((t) => t.type === 'salary')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatNumber = (val: number) => new Intl.NumberFormat('ar-SA').format(val);

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'اليوم';
      case 'this_week': return 'هذا الأسبوع';
      case 'this_month': return 'هذا الشهر';
      case 'last_month': return 'الشهر السابق';
      case 'last_3_months': return 'آخر 3 أشهر';
      case 'custom': return 'الفترة المحددة';
    }
  };

  // Generate dynamic Arabic summary narrative based strictly on actual data (Section 12)
  const generateNarrative = () => {
    if (activeTx.length === 0) {
      return `خلال ${getPeriodLabel()} لم يتم تسجيل أي عمليات مالية حتى الآن.`;
    }

    const parts: string[] = [];
    if (totalCommissions > 0) {
      parts.push(`${formatNumber(totalCommissions)} ${currency} عمولات`);
    }
    if (totalWithdrawals > 0) {
      parts.push(`${formatNumber(totalWithdrawals)} ${currency} سحوبات`);
    }
    if (totalExpenses > 0) {
      parts.push(`${formatNumber(totalExpenses)} ${currency} مصروفات`);
    }
    if (totalSalaries > 0) {
      parts.push(`${formatNumber(totalSalaries)} ${currency} رواتب`);
    }

    const targetPrefix = employeeName ? `لصالح ${employeeName}` : '';
    const summaryBody = parts.length > 0 ? parts.join(' و') : 'عمليات مالية معتمدة';
    return `خلال ${getPeriodLabel()} ${targetPrefix} تم تسجيل ${summaryBody}.`;
  };

  return (
    <div 
      id="smart-summary-banner"
      className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-700/50"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                الملخص الذكي اللحظي
              </span>
              <span className="text-xs text-slate-400">
                {getPeriodLabel()}
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-100 mt-1 leading-relaxed">
              {generateNarrative()}
            </p>
          </div>
        </div>

        {/* Quick KPI pills */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/40">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs">
            <span className="text-slate-400 block text-[10px]">العمليات</span>
            <span className="font-mono font-bold text-emerald-300">{activeTx.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs">
            <span className="text-slate-400 block text-[10px]">العمولات</span>
            <span className="font-mono font-bold text-emerald-300">+{formatNumber(totalCommissions)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs">
            <span className="text-slate-400 block text-[10px]">المصروفات</span>
            <span className="font-mono font-bold text-rose-300">-{formatNumber(totalExpenses)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
