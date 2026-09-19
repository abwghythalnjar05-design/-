import React, { useState } from 'react';
import { 
  Employee, 
  FinancialSummary, 
  NLPParseResult, 
  Transaction, 
  TransactionType, 
  FilterPeriod, 
  ActivityItem 
} from '../types';
import { FinancialCards } from './FinancialCards';
import { NaturalLanguageBar } from './NaturalLanguageBar';
import { TransactionHistory } from './TransactionHistory';
import { FilterBar } from './FilterBar';
import { SmartSummaryBanner } from './SmartSummaryBanner';
import { FinancialCharts } from './FinancialCharts';
import { SmartAnalysisCard } from './SmartAnalysisCard';
import { ActivityFeed } from './ActivityFeed';
import { filterTransactionsByPeriod } from '../utils/dateFilters';
import { 
  TrendingUp, 
  ArrowDownRight, 
  Receipt, 
  Calendar,
  Sparkles,
  BarChart3,
  History,
  Info
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentEmployee: Employee;
  summary: FinancialSummary;
  transactions: Transaction[];
  activities: ActivityItem[];
  currency?: string;
  onOpenManualModal: (defaultType?: TransactionType) => void;
  onParsedNLPResult: (result: NLPParseResult) => void;
  onOpenReport: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onToggleCancelTransaction?: (txId: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentEmployee,
  summary,
  transactions,
  activities,
  currency = 'ريال',
  onOpenManualModal,
  onParsedNLPResult,
  onOpenReport,
  onEditTransaction,
  onToggleCancelTransaction,
}) => {
  // Smart Filtering (Section 10)
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('this_month');
  const [customStartDate, setCustomStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Tab view for analytics vs history
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'analysis' | 'history'>('overview');

  // Filter transactions for this employee and period
  const employeeTransactions = transactions.filter((t) => t.employeeId === currentEmployee.id);
  const filteredTransactions = filterTransactionsByPeriod(
    employeeTransactions,
    selectedPeriod,
    customStartDate,
    customEndDate
  );

  // Recalculate summary strictly based on filtered period
  const activePeriodTx = filteredTransactions.filter((t) => t.status === 'active');
  const periodCommissions = activePeriodTx
    .filter((t) => t.type === 'commission')
    .reduce((s, t) => s + t.amount, 0);
  const periodWithdrawals = activePeriodTx
    .filter((t) => t.type === 'withdrawal')
    .reduce((s, t) => s + t.amount, 0);
  const periodExpenses = activePeriodTx
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const periodIncome = currentEmployee.basicSalary + periodCommissions;
  const periodDeductions = periodWithdrawals + periodExpenses;
  const periodRemaining = periodIncome - periodDeductions;

  const dynamicSummary: FinancialSummary = {
    basicSalary: currentEmployee.basicSalary,
    totalCommissions: periodCommissions,
    totalIncome: periodIncome,
    totalWithdrawals: periodWithdrawals,
    totalExpenses: periodExpenses,
    totalDeductions: periodDeductions,
    remainingBalance: periodRemaining,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Employee Greeting & Info Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl border border-emerald-200 shadow-inner">
            {currentEmployee.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                مرحباً، {currentEmployee.name}
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {currentEmployee.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              لوحة المستحقات المالية وحسابك الشخصي المباشر (تخزين محلي + مزامنة سحابية)
            </p>
          </div>
        </div>

        {/* Quick action buttons for registering Commission, Withdrawal, Expense */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="emp-quick-add-commission"
            onClick={() => onOpenManualModal('commission')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <TrendingUp className="w-4 h-4" />
            <span>تسجيل عمولة</span>
          </button>

          <button
            id="emp-quick-add-withdrawal"
            onClick={() => onOpenManualModal('withdrawal')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>تسجيل سحبة</span>
          </button>

          <button
            id="emp-quick-add-expense"
            onClick={() => onOpenManualModal('expense')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Receipt className="w-4 h-4" />
            <span>تسجيل مصروف</span>
          </button>
        </div>
      </div>

      {/* 10. Smart Filters Bar */}
      <FilterBar
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
        }}
        selectedEmployeeId={currentEmployee.id}
        onSelectEmployeeId={() => {}}
        employees={[currentEmployee]}
        isManager={false}
      />

      {/* 12. Smart Summary Banner (Auto dynamic narrative) */}
      <SmartSummaryBanner
        filteredTransactions={filteredTransactions}
        period={selectedPeriod}
        currency={currency}
        employeeName={currentEmployee.name}
      />

      {/* 1 & 6: Financial Cards with prominent Remaining Balance (Updated by filter) */}
      <FinancialCards
        summary={dynamicSummary}
        currency={currency}
        employeeName={currentEmployee.name}
      />

      {/* 4: Natural Language Processing Bar */}
      <NaturalLanguageBar
        onParsedResult={onParsedNLPResult}
        employeeName={currentEmployee.name}
        isManager={false}
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>سجل العمليات</span>
          <span className="text-[11px] bg-white/20 px-1.5 py-0.2 rounded-full">
            {filteredTransactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'charts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>الرسوم البيانية</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'analysis'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>التحليل المالي الذكي</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>آخر النشاطات</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <TransactionHistory
            transactions={filteredTransactions}
            isManager={false}
            currency={currency}
            employeeFilterId={currentEmployee.id}
            onEditTransaction={onEditTransaction}
            onToggleCancelTransaction={onToggleCancelTransaction}
          />
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="space-y-6">
          <FinancialCharts
            transactions={filteredTransactions}
            employees={[currentEmployee]}
            currency={currency}
            isManager={false}
          />
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <SmartAnalysisCard
            transactions={filteredTransactions}
            employees={[currentEmployee]}
            currency={currency}
            selectedPeriod={selectedPeriod}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <ActivityFeed
            activities={activities.filter((a) => !a.employeeName || a.employeeName === currentEmployee.name)}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
};
