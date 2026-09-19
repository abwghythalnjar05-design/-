import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/arabicNlp';
import { SwipeableTransactionItem } from './SwipeableTransactionItem';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  ArrowDownRight, 
  Receipt, 
  Wallet,
  Sparkles, 
  UserCheck, 
  Calendar, 
  Ban, 
  Edit, 
  Info,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal,
  Smartphone,
  Table as TableIcon
} from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  isManager: boolean;
  currency?: string;
  onEditTransaction?: (tx: Transaction) => void;
  onToggleCancelTransaction?: (txId: string) => void;
  employeeFilterId?: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isManager,
  currency = 'ريال',
  onEditTransaction,
  onToggleCancelTransaction,
  employeeFilterId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_30_days'>('all');
  const [selectedTxForDetails, setSelectedTxForDetails] = useState<Transaction | null>(null);
  const [activeSwipeTxId, setActiveSwipeTxId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    // Employee scope filter (if set)
    if (employeeFilterId && tx.employeeId !== employeeFilterId) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && tx.type !== typeFilter) {
      return false;
    }

    // Date filter
    if (dateFilter === 'this_month') {
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (!tx.date.startsWith(currentYearMonth)) {
        return false;
      }
    } else if (dateFilter === 'last_30_days') {
      const txDate = new Date(tx.date);
      const diffTime = Math.abs(new Date().getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        return false;
      }
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchEmp = tx.employeeName.toLowerCase().includes(q);
      const matchId = tx.id.toLowerCase().includes(q);
      const matchRecorder = tx.recordedBy.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchEmp && !matchId && !matchRecorder) {
        return false;
      }
    }

    return true;
  });

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'commission':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <TrendingUp className="w-3 h-3" />
            عمولة
          </span>
        );
      case 'withdrawal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <ArrowDownRight className="w-3 h-3" />
            سحبة
          </span>
        );
      case 'expense':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Receipt className="w-3 h-3" />
            مصروف
          </span>
        );
      case 'salary':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Wallet className="w-3 h-3" />
            راتب
          </span>
        );
    }
  };

  const getAmountColor = (type: TransactionType) => {
    switch (type) {
      case 'commission':
      case 'salary':
        return 'text-emerald-600';
      case 'withdrawal':
        return 'text-amber-600';
      case 'expense':
        return 'text-rose-600';
    }
  };

  const getAmountPrefix = (type: TransactionType) => {
    switch (type) {
      case 'commission':
      case 'salary':
        return '+';
      case 'withdrawal':
      case 'expense':
        return '-';
    }
  };

  const canEditTx = Boolean(onEditTransaction);
  const canDeleteTx = Boolean(onToggleCancelTransaction);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">سجل العمليات المالية</h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
                يدعم السحب السريع باللمس
              </span>
            </div>
            <p className="text-xs text-slate-500">
              إجمالي المعروض: {filtered.length} من أصل {transactions.length} عملية
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('auto')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'auto'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="تلقائي: بطاقات انزلاقية للجوال وجدول للشاشات الكبيرة"
              >
                تلقائي
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'cards'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="عرض بطاقات انزلاقية (Swipe Cards)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="عرض جدول البيانات"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search box */}
            <div className="relative w-full sm:w-64">
              <input
                id="search-transactions-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالوصف، التصنيف، أو المبلغ..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Type Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              id="filter-type-all"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              id="filter-type-commission"
              onClick={() => setTypeFilter('commission')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'commission'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              العمولات
            </button>
            <button
              id="filter-type-withdrawal"
              onClick={() => setTypeFilter('withdrawal')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'withdrawal'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              السحوبات
            </button>
            <button
              id="filter-type-expense"
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'expense'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              المصروفات
            </button>
            <button
              id="filter-type-salary"
              onClick={() => setTypeFilter('salary')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'salary'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الرواتب
            </button>
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] hidden sm:inline">التاريخ:</span>
            <select
              id="filter-date-select"
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">كل الأوقات</option>
              <option value="this_month">هذا الشهر</option>
              <option value="last_30_days">آخر 30 يوم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Container */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">لا توجد عمليات تطابق البحث</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            جرّب تغيير كلمات البحث أو تغيير محددات التصفية (نوع العملية أو التاريخ)
          </p>
        </div>
      ) : (
        <>
          {/* 1. MOBILE SWIPEABLE CARDS VIEW (Active on small screens or when viewMode === 'cards') */}
          <div className={`${viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block md:hidden'} p-3 sm:p-4 bg-slate-50/50`}>
            {/* Swipe Action Instruction Banner */}
            <div className="mb-3 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-xs">
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>اسحب العملية لليسار للتعديل أو الحذف السريع</span>
              </div>
              <span className="text-[10px] font-bold bg-white text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                سحب ⟵
              </span>
            </div>

            {/* List of Swipeable Cards */}
            <div className="space-y-2">
              {filtered.map((tx) => (
                <SwipeableTransactionItem
                  key={tx.id}
                  transaction={tx}
                  currency={currency}
                  isManager={isManager}
                  canEdit={canEditTx}
                  canDelete={canDeleteTx}
                  isOpen={activeSwipeTxId === tx.id}
                  onOpen={() => setActiveSwipeTxId(tx.id)}
                  onClose={() => {
                    if (activeSwipeTxId === tx.id) setActiveSwipeTxId(null);
                  }}
                  onEdit={onEditTransaction}
                  onDelete={onToggleCancelTransaction}
                  onViewDetails={(selected) => setSelectedTxForDetails(selected)}
                />
              ))}
            </div>
          </div>

          {/* 2. DESKTOP DETAILED TABLE VIEW (Active on md+ screens or when viewMode === 'table') */}
          <div className={`${viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'} overflow-x-auto`}>
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">رقم العملية</th>
                  <th className="py-3 px-4">الموظف</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">المبلغ ({currency})</th>
                  <th className="py-3 px-4">الوصف والتصنيف</th>
                  <th className="py-3 px-4 hidden md:table-cell">التاريخ والوقت</th>
                  <th className="py-3 px-4 hidden lg:table-cell">المسجل والمصدر</th>
                  <th className="py-3 px-4 text-center">الحالة والإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => {
                  const isCancelled = tx.status === 'cancelled';
                  return (
                    <tr
                      key={tx.id}
                      id={`tx-row-${tx.id}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCancelled ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-500 text-xs">
                        {tx.id}
                      </td>

                      {/* Employee */}
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {tx.employeeName}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getTypeBadge(tx.type)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-sm sm:text-base font-black font-mono ${
                            isCancelled ? 'line-through text-slate-400' : getAmountColor(tx.type)
                          }`}
                        >
                          {getAmountPrefix(tx.type)}
                          {new Intl.NumberFormat('ar-SA').format(tx.amount)}
                        </span>
                      </td>

                      {/* Description & Category */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate" title={tx.description}>
                          {tx.description}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {tx.category}
                          </span>
                          {tx.notes && (
                            <span className="text-slate-400 truncate max-w-[120px]" title={tx.notes}>
                              • {tx.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 hidden md:table-cell whitespace-nowrap text-slate-600 text-xs">
                        <div className="font-mono">{tx.date}</div>
                        <div className="text-[11px] text-slate-400">{tx.time}</div>
                      </td>

                      {/* Recorded By & Source */}
                      <td className="py-3 px-4 hidden lg:table-cell whitespace-nowrap text-xs">
                        <div className="text-slate-700 font-medium">{tx.recordedBy}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          {tx.source === 'nlp' ? (
                            <span className="inline-flex items-center gap-1 text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                              <Sparkles className="w-2.5 h-2.5" />
                              لغة طبيعية
                            </span>
                          ) : (
                            <span className="text-slate-400">إدخال يدوي</span>
                          )}
                        </div>
                      </td>

                      {/* Actions & Status */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedTxForDetails(tx)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="عرض تفاصيل العملية"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Edit */}
                          {canEditTx && (
                            <button
                              onClick={() => onEditTransaction?.(tx)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="تعديل العملية"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Quick Delete / Cancel */}
                          {canDeleteTx && (
                            <button
                              onClick={() => onToggleCancelTransaction?.(tx.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isCancelled
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-rose-500 hover:bg-rose-50'
                              }`}
                              title={isCancelled ? 'استرجاع العملية' : 'إلغاء العملية'}
                            >
                              {isCancelled ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {isCancelled && !canDeleteTx && (
                            <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                              ملغاة
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Details View Modal */}
      {selectedTxForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-xs">
                  {selectedTxForDetails.id}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">بطاقة تفاصيل العملية</h3>
                  <p className="text-xs text-slate-400">سجل التدقيق المالي</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxForDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">حالة العملية:</span>
                {selectedTxForDetails.status === 'active' ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                    مؤكدة وسارية
                  </span>
                ) : (
                  <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold border border-rose-200">
                    ملغاة
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">الموظف المعني:</span>
                <span className="font-bold text-slate-900">{selectedTxForDetails.employeeName}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">نوع العملية:</span>
                <div>{getTypeBadge(selectedTxForDetails.type)}</div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">المبلغ المالي:</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {new Intl.NumberFormat('ar-SA').format(selectedTxForDetails.amount)} {currency}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">الوصف:</span>
                <span className="font-medium text-slate-900 text-left max-w-[200px] truncate">
                  {selectedTxForDetails.description}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">التصنيف:</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {selectedTxForDetails.category}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">التاريخ والوقت:</span>
                <span className="font-mono text-slate-700">
                  {selectedTxForDetails.date} ({selectedTxForDetails.time})
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">سُجّلت بواسطة:</span>
                <span className="font-medium text-slate-900">{selectedTxForDetails.recordedBy}</span>
              </div>

              {selectedTxForDetails.notes && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">ملاحظات إضافية:</span>
                  <p className="bg-slate-50 p-2 rounded-lg text-slate-700 border border-slate-200">
                    {selectedTxForDetails.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {canEditTx && (
                  <button
                    onClick={() => {
                      onEditTransaction?.(selectedTxForDetails);
                      setSelectedTxForDetails(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                )}
                {canDeleteTx && (
                  <button
                    onClick={() => {
                      onToggleCancelTransaction?.(selectedTxForDetails.id);
                      setSelectedTxForDetails(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      selectedTxForDetails.status === 'cancelled'
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {selectedTxForDetails.status === 'cancelled' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>استرجاع</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span>إلغاء</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedTxForDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
