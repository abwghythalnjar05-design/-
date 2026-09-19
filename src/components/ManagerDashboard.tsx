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
import { calculateEmployeeSummary, calculateCompanySummary } from '../utils/finance';
import { formatCurrency } from '../utils/arabicNlp';
import { NaturalLanguageBar } from './NaturalLanguageBar';
import { TransactionHistory } from './TransactionHistory';
import { FilterBar } from './FilterBar';
import { SmartSummaryBanner } from './SmartSummaryBanner';
import { FinancialCharts } from './FinancialCharts';
import { SmartAnalysisCard } from './SmartAnalysisCard';
import { ActivityFeed } from './ActivityFeed';
import { filterTransactionsByPeriod } from '../utils/dateFilters';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  ArrowDownRight, 
  Receipt, 
  Scale, 
  Sparkles,
  UserPlus,
  Edit2,
  Trash2,
  Ban,
  CheckCircle,
  ExternalLink,
  Search,
  Printer,
  ChevronLeft,
  X,
  PlusCircle,
  DollarSign,
  BarChart3,
  History
} from 'lucide-react';

interface ManagerDashboardProps {
  employees: Employee[];
  transactions: Transaction[];
  activities: ActivityItem[];
  currency?: string;
  onAddEmployee: (empData: Omit<Employee, 'id'>) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onToggleEmployeeStatus: (empId: string) => void;
  onDeleteEmployee: (empId: string) => void;
  onOpenManualModal: (defaultType?: TransactionType, empId?: string) => void;
  onParsedNLPResult: (result: NLPParseResult) => void;
  onEditTransaction: (tx: Transaction) => void;
  onToggleCancelTransaction: (txId: string) => void;
  onOpenReport: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  employees,
  transactions,
  activities,
  currency = 'ريال',
  onAddEmployee,
  onUpdateEmployee,
  onToggleEmployeeStatus,
  onDeleteEmployee,
  onOpenManualModal,
  onParsedNLPResult,
  onEditTransaction,
  onToggleCancelTransaction,
  onOpenReport,
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'charts' | 'analysis' | 'all_transactions' | 'activities'>('employees');
  const [searchEmp, setSearchEmp] = useState('');
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);

  // 10. Smart Filters
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('this_month');
  const [customStartDate, setCustomStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  // Modals inside manager
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [salaryAdjustEmployee, setSalaryAdjustEmployee] = useState<Employee | null>(null);
  const [newSalaryValue, setNewSalaryValue] = useState('');

  // Apply employee filter + period filter
  let baseTransactions = transactions;
  if (selectedEmployeeId !== 'all') {
    baseTransactions = baseTransactions.filter((t) => t.employeeId === selectedEmployeeId);
  }

  const filteredTransactions = filterTransactionsByPeriod(
    baseTransactions,
    selectedPeriod,
    customStartDate,
    customEndDate
  );

  // Active employees
  const activeEmployees = employees.filter((e) => e.status !== 'archived');
  const targetEmployeesForSummary = selectedEmployeeId === 'all'
    ? activeEmployees
    : activeEmployees.filter((e) => e.id === selectedEmployeeId);

  // Dynamic company summary based on active filter
  const companyStats = calculateCompanySummary(targetEmployeesForSummary, filteredTransactions);

  // Search filter for employees table
  const filteredEmployeesTable = activeEmployees.filter((emp) => {
    if (!searchEmp.trim()) return true;
    const q = searchEmp.toLowerCase();
    return emp.name.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q);
  });

  const selectedEmployeeObj = employees.find((e) => e.id === selectedEmployeeId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 10. Smart Filter Bar */}
      <FilterBar
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
        }}
        selectedEmployeeId={selectedEmployeeId}
        onSelectEmployeeId={setSelectedEmployeeId}
        employees={activeEmployees}
        isManager={true}
      />

      {/* 12. Smart Summary Banner (Dynamic narrative from real data) */}
      <SmartSummaryBanner
        filteredTransactions={filteredTransactions}
        period={selectedPeriod}
        currency={currency}
        employeeName={selectedEmployeeObj?.name}
      />

      {/* 8. Manager Overview KPI Cards */}
      <div className="space-y-4">
        {/* Top Highlight Banner: Total Remaining Balance for all employees */}
        <div 
          id="manager-hero-summary"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 shadow-xl border border-slate-700/50"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  لوحة الإدارة المركزية (مزامنة فورية)
                </span>
                <span className="text-xs text-slate-400">
                  {selectedEmployeeId === 'all' ? 'إجمالي كشف الشركة' : `كشف الموظف: ${selectedEmployeeObj?.name}`}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-200">
                إجمالي الأرصدة المتبقية المستحقة
              </h2>
              <div className="flex items-baseline gap-2">
                <span 
                  id="manager-total-remaining"
                  className="text-4xl sm:text-5xl font-black font-mono text-white"
                >
                  {new Intl.NumberFormat('ar-SA').format(companyStats.totalRemainingBalance)}
                </span>
                <span className="text-xl font-bold text-emerald-400">
                  {currency}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                صافي المبالغ المستحقة حالياً بعد حسم كافة السحوبات والمصروفات وفق الفلترة النشطة
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="manager-add-emp-btn"
                onClick={() => setShowAddEmpModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة موظف جديد</span>
              </button>

              <button
                id="manager-print-report-btn"
                onClick={onOpenReport}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة تقرير مالي</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6 KPI Cards as specified in Section 8 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* عدد الموظفين */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">الموظفون المشمولون</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {companyStats.employeeCount}
              </span>
              <span className="text-[11px] text-slate-400 mr-1">موظف</span>
            </div>
          </div>

          {/* إجمالي الرواتب */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-700">إجمالي الرواتب</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-blue-700 font-mono">
                {new Intl.NumberFormat('ar-SA').format(companyStats.totalSalaries)}
              </span>
              <span className="text-[11px] text-slate-400 mr-1">{currency}</span>
            </div>
          </div>

          {/* إجمالي العمولات */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-700">إجمالي العمولات</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
                +{new Intl.NumberFormat('ar-SA').format(companyStats.totalCommissions)}
              </span>
              <span className="text-[11px] text-slate-400 mr-1">{currency}</span>
            </div>
          </div>

          {/* إجمالي السحوبات */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-700">إجمالي السحوبات</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-amber-700 font-mono">
                -{new Intl.NumberFormat('ar-SA').format(companyStats.totalWithdrawals)}
              </span>
              <span className="text-[11px] text-slate-400 mr-1">{currency}</span>
            </div>
          </div>

          {/* إجمالي المصروفات */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-rose-700">إجمالي المصروفات</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-rose-700 font-mono">
                -{new Intl.NumberFormat('ar-SA').format(companyStats.totalExpenses)}
              </span>
              <span className="text-[11px] text-slate-400 mr-1">{currency}</span>
            </div>
          </div>

          {/* إجمالي المستحقات (الدخل) */}
          <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-900">إجمالي المستحقات</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-indigo-900 font-mono">
                {new Intl.NumberFormat('ar-SA').format(companyStats.totalIncome)}
              </span>
              <span className="text-[10px] text-indigo-600 mr-1">رواتب + عمولات</span>
            </div>
          </div>
        </div>
      </div>

      {/* NLP Bar for Manager Quick Log */}
      <NaturalLanguageBar
        onParsedResult={onParsedNLPResult}
        isManager={true}
      />

      {/* View Switcher Tabs: Employees, Charts, Smart Analysis, Transactions, Activities */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none text-xs sm:text-sm">
        <button
          id="tab-employees-table"
          onClick={() => setActiveTab('employees')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'employees'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>جدول الموظفين</span>
          <span className="text-xs bg-white/20 px-1.5 py-0.2 rounded-full">
            {filteredEmployeesTable.length}
          </span>
        </button>

        <button
          id="tab-charts"
          onClick={() => setActiveTab('charts')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'charts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>الرسوم البيانية</span>
        </button>

        <button
          id="tab-smart-analysis"
          onClick={() => setActiveTab('analysis')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'analysis'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>التحليل المالي الذكي</span>
        </button>

        <button
          id="tab-all-transactions"
          onClick={() => setActiveTab('all_transactions')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'all_transactions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>جميع العمليات</span>
          <span className="text-xs bg-white/20 px-1.5 py-0.2 rounded-full">
            {filteredTransactions.length}
          </span>
        </button>

        <button
          id="tab-activity-log"
          onClick={() => setActiveTab('activities')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'activities'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل النشاطات</span>
          <span className="text-xs bg-white/20 px-1.5 py-0.2 rounded-full">
            {activities.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Employees Table */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                قائمة الموظفين وكشف الحسابات
              </h3>
              <p className="text-xs text-slate-500">
                اضغط على اسم الموظف لعرض كشفه وسجل عملياته وتعديل راتبه
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                id="search-employees-input"
                type="text"
                value={searchEmp}
                onChange={(e) => setSearchEmp(e.target.value)}
                placeholder="بحث باسم الموظف أو المسمى..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">الاسم والمسمى</th>
                  <th className="py-3 px-4">الراتب ({currency})</th>
                  <th className="py-3 px-4">العمولات</th>
                  <th className="py-3 px-4">السحوبات</th>
                  <th className="py-3 px-4">المصروفات</th>
                  <th className="py-3 px-4 font-bold text-slate-900">المتبقي</th>
                  <th className="py-3 px-4 text-center">الحالة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployeesTable.map((emp) => {
                  const empSummary = calculateEmployeeSummary(emp, filteredTransactions);
                  const isInactive = emp.status === 'inactive';

                  return (
                    <tr
                      key={emp.id}
                      id={`emp-row-${emp.id}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isInactive ? 'opacity-50 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* Name & Role */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedEmployeeForDetail(emp)}
                          className="flex items-center gap-2.5 text-right group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {emp.name}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              {emp.role}
                            </span>
                          </div>
                        </button>
                      </td>

                      {/* Basic Salary */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {new Intl.NumberFormat('ar-SA').format(empSummary.basicSalary)}
                      </td>

                      {/* Commissions */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 whitespace-nowrap">
                        +{new Intl.NumberFormat('ar-SA').format(empSummary.totalCommissions)}
                      </td>

                      {/* Withdrawals */}
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 whitespace-nowrap">
                        -{new Intl.NumberFormat('ar-SA').format(empSummary.totalWithdrawals)}
                      </td>

                      {/* Expenses */}
                      <td className="py-3 px-4 font-mono font-bold text-rose-600 whitespace-nowrap">
                        -{new Intl.NumberFormat('ar-SA').format(empSummary.totalExpenses)}
                      </td>

                      {/* Remaining */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg font-mono font-black text-sm bg-slate-900 text-white shadow-xs">
                          {new Intl.NumberFormat('ar-SA').format(empSummary.remainingBalance)} {currency}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {emp.status === 'active' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            نشط
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            معطل
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Details */}
                          <button
                            onClick={() => setSelectedEmployeeForDetail(emp)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="عرض تفاصيل وعمليات الموظف"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {/* Quick Add Transaction for this employee */}
                          <button
                            onClick={() => onOpenManualModal('commission', emp.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="إضافة عملية لهذا الموظف"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* Adjust Salary */}
                          <button
                            onClick={() => {
                              setSalaryAdjustEmployee(emp);
                              setNewSalaryValue(emp.basicSalary.toString());
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل الراتب الأساسي"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>

                          {/* Edit Employee Info */}
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="تعديل بيانات الموظف"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Disable / Enable */}
                          <button
                            onClick={() => onToggleEmployeeStatus(emp.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isInactive
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-500 hover:bg-amber-50'
                            }`}
                            title={isInactive ? 'تفعيل الموظف' : 'تعطيل الموظف'}
                          >
                            {isInactive ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          {/* Delete / Archive */}
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من أرشفة/حذف حساب الموظف "${emp.name}"؟`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="أرشفة / حذف الموظف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Financial Charts (Section 9) */}
      {activeTab === 'charts' && (
        <FinancialCharts
          transactions={filteredTransactions}
          employees={activeEmployees}
          currency={currency}
          isManager={true}
        />
      )}

      {/* TAB 3: Smart Financial Analysis (Section 11) */}
      {activeTab === 'analysis' && (
        <SmartAnalysisCard
          transactions={filteredTransactions}
          employees={activeEmployees}
          currency={currency}
          selectedPeriod={selectedPeriod}
        />
      )}

      {/* TAB 4: All Company Transactions */}
      {activeTab === 'all_transactions' && (
        <TransactionHistory
          transactions={filteredTransactions}
          isManager={true}
          currency={currency}
          onEditTransaction={onEditTransaction}
          onToggleCancelTransaction={onToggleCancelTransaction}
        />
      )}

      {/* TAB 5: Activity Log (Section 14) */}
      {activeTab === 'activities' && (
        <ActivityFeed
          activities={activities}
          currency={currency}
        />
      )}

      {/* DETAILED EMPLOYEE PROFILE VIEW (Section 8) */}
      {selectedEmployeeForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {selectedEmployeeForDetail.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      كشف تفصيلي: {selectedEmployeeForDetail.name}
                    </h3>
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                      {selectedEmployeeForDetail.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    الراتب الأساسي: {formatCurrency(selectedEmployeeForDetail.basicSalary, currency)} • تاريخ الانضمام: {selectedEmployeeForDetail.joinDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenManualModal('commission', selectedEmployeeForDetail.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>تسجيل عملية له</span>
                </button>
                <button
                  onClick={() => setSelectedEmployeeForDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Financial Cards of this employee + their transactions */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {(() => {
                  const empSummary = calculateEmployeeSummary(selectedEmployeeForDetail, transactions);
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs text-slate-500 block">الراتب الأساسي</span>
                        <span className="text-base font-bold text-slate-900 font-mono">
                          {formatCurrency(empSummary.basicSalary, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-700 block">إجمالي العمولات</span>
                        <span className="text-base font-bold text-emerald-600 font-mono">
                          +{formatCurrency(empSummary.totalCommissions, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-rose-700 block">إجمالي الخصومات (سحوبات + مصروفات)</span>
                        <span className="text-base font-bold text-rose-600 font-mono">
                          -{formatCurrency(empSummary.totalDeductions, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-700 font-bold block">الرصيد المتبقي الحالي</span>
                        <span className="text-lg font-black text-slate-900 font-mono">
                          {formatCurrency(empSummary.remainingBalance, currency)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <TransactionHistory
                  transactions={transactions}
                  isManager={true}
                  currency={currency}
                  onEditTransaction={onEditTransaction}
                  onToggleCancelTransaction={onToggleCancelTransaction}
                  employeeFilterId={selectedEmployeeForDetail.id}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedEmployeeForDetail(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {(showAddEmpModal || editingEmployee) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h3>
              <button
                onClick={() => {
                  setShowAddEmpModal(false);
                  setEditingEmployee(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('emp-name') as HTMLInputElement).value;
                const role = (form.elements.namedItem('emp-role') as HTMLInputElement).value;
                const basicSalary = parseFloat(
                  (form.elements.namedItem('emp-salary') as HTMLInputElement).value
                );
                const phone = (form.elements.namedItem('emp-phone') as HTMLInputElement).value;
                const email = (form.elements.namedItem('emp-email') as HTMLInputElement).value;

                if (editingEmployee) {
                  onUpdateEmployee({
                    ...editingEmployee,
                    name,
                    role,
                    basicSalary,
                    phone,
                    email,
                  });
                  setEditingEmployee(null);
                } else {
                  onAddEmployee({
                    name,
                    role,
                    basicSalary,
                    phone,
                    email,
                    joinDate: new Date().toISOString().split('T')[0],
                    status: 'active',
                  });
                  setShowAddEmpModal(false);
                }
              }}
              className="p-6 space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700">اسم الموظف *</label>
                <input
                  name="emp-name"
                  type="text"
                  required
                  defaultValue={editingEmployee?.name || ''}
                  placeholder="مثال: أحمد الغامدي"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">المسمى الوظيفي *</label>
                <input
                  name="emp-role"
                  type="text"
                  required
                  defaultValue={editingEmployee?.role || ''}
                  placeholder="مثال: مسؤول مبيعات وتسويق"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">الراتب الأساسي الشهري ({currency}) *</label>
                <input
                  name="emp-salary"
                  type="number"
                  step="any"
                  min="0"
                  required
                  defaultValue={editingEmployee?.basicSalary || 3000}
                  placeholder="مثال: 3000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">رقم الهاتف</label>
                  <input
                    name="emp-phone"
                    type="tel"
                    defaultValue={editingEmployee?.phone || ''}
                    placeholder="05xxxxxxxx"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">البريد الإلكتروني</label>
                  <input
                    name="emp-email"
                    type="email"
                    defaultValue={editingEmployee?.email || ''}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {editingEmployee ? 'حفظ التعديلات' : 'إضافة الموظف'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEmpModal(false);
                    setEditingEmployee(null);
                  }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST BASIC SALARY MODAL (Section 9: تحديد الراتب) */}
      {salaryAdjustEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                تعديل الراتب الأساسي
              </h3>
              <button
                onClick={() => setSalaryAdjustEmployee(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-500 block">الموظف:</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {salaryAdjustEmployee.name} ({salaryAdjustEmployee.role})
                </span>
                <span className="text-slate-400 block mt-1">
                  الراتب الحالي: {formatCurrency(salaryAdjustEmployee.basicSalary, currency)}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  الراتب الأساسي الجديد ({currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  autoFocus
                  value={newSalaryValue}
                  onChange={(e) => setNewSalaryValue(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseFloat(newSalaryValue);
                    if (!isNaN(parsed) && parsed >= 0) {
                      onUpdateEmployee({
                        ...salaryAdjustEmployee,
                        basicSalary: parsed,
                      });
                      setSalaryAdjustEmployee(null);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  اعتماد الراتب الجديد
                </button>
                <button
                  type="button"
                  onClick={() => setSalaryAdjustEmployee(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
