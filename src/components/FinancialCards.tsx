import React from 'react';
import { FinancialSummary } from '../types';
import { formatCurrency } from '../utils/arabicNlp';
import { 
  Wallet, 
  TrendingUp, 
  ArrowDownRight, 
  Receipt, 
  PiggyBank, 
  Scale,
  Sparkles
} from 'lucide-react';

interface FinancialCardsProps {
  summary: FinancialSummary;
  currency?: string;
  employeeName?: string;
}

export const FinancialCards: React.FC<FinancialCardsProps> = ({
  summary,
  currency = 'ريال',
  employeeName,
}) => {
  return (
    <div className="space-y-4">
      {/* 🌟 PROMINENT HERO CARD: الرصيد المتبقي (المتبقي هو العنصر الأبرز في الواجهة) */}
      <div 
        id="hero-remaining-balance-card"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50"
      >
        {/* Subtle geometric pattern */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                صافي المستحق النهائي
              </span>
              {employeeName && (
                <span className="text-xs text-slate-400">
                  لحساب: <strong className="text-slate-200">{employeeName}</strong>
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-200">
              الرصيد المتبقي
            </h2>

            <div className="flex items-baseline gap-2">
              <span 
                id="stat-remaining-balance"
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-mono"
              >
                {new Intl.NumberFormat('ar-SA').format(summary.remainingBalance)}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-400">
                {currency}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 pt-1">
              المعادلة المالية المعتمدة: إجمالي الدخل ({formatCurrency(summary.totalIncome, currency)}) - إجمالي الخصومات ({formatCurrency(summary.totalDeductions, currency)})
            </p>
          </div>

          {/* Quick formula badge summary */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 text-right min-w-[240px]">
            <div className="space-y-0.5">
              <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                إجمالي الدخل
              </span>
              <p className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                +{new Intl.NumberFormat('ar-SA').format(summary.totalIncome)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-rose-300 font-medium flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" />
                إجمالي الخصومات
              </span>
              <p className="text-base sm:text-lg font-bold text-rose-400 font-mono">
                -{new Intl.NumberFormat('ar-SA').format(summary.totalDeductions)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 6 detailed breakdown cards matching the specification */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. الراتب الأساسي */}
        <div 
          id="stat-card-basic-salary"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">الراتب الأساسي</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              {new Intl.NumberFormat('ar-SA').format(summary.basicSalary)}
            </div>
            <span className="text-[11px] text-slate-400">{currency} شهري</span>
          </div>
        </div>

        {/* 2. العمولات */}
        <div 
          id="stat-card-commissions"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700">العمولات</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
              +{new Intl.NumberFormat('ar-SA').format(summary.totalCommissions)}
            </div>
            <span className="text-[11px] text-emerald-600/70">{currency} إضافي</span>
          </div>
        </div>

        {/* 3. إجمالي الدخل */}
        <div 
          id="stat-card-total-income"
          className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900">إجمالي الدخل</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-emerald-800 font-mono">
              {new Intl.NumberFormat('ar-SA').format(summary.totalIncome)}
            </div>
            <span className="text-[10px] text-emerald-700">الراتب + العمولات</span>
          </div>
        </div>

        {/* 4. السحوبات */}
        <div 
          id="stat-card-withdrawals"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-amber-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700">السحوبات</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-amber-600 font-mono">
              -{new Intl.NumberFormat('ar-SA').format(summary.totalWithdrawals)}
            </div>
            <span className="text-[11px] text-amber-600/70">{currency} سلف شخصية</span>
          </div>
        </div>

        {/* 5. المصروفات */}
        <div 
          id="stat-card-expenses"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-rose-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700">المصروفات</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-rose-600 font-mono">
              -{new Intl.NumberFormat('ar-SA').format(summary.totalExpenses)}
            </div>
            <span className="text-[11px] text-rose-600/70">{currency} مصروفات عمل</span>
          </div>
        </div>

        {/* 6. إجمالي الخصومات */}
        <div 
          id="stat-card-total-deductions"
          className="bg-rose-50/50 rounded-xl p-4 border border-rose-200 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-900">إجمالي الخصومات</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-rose-800 font-mono">
              {new Intl.NumberFormat('ar-SA').format(summary.totalDeductions)}
            </div>
            <span className="text-[10px] text-rose-700">السحوبات + المصروفات</span>
          </div>
        </div>
      </div>
    </div>
  );
};
