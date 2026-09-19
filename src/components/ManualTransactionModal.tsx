import React, { useState, useEffect } from 'react';
import { Employee, Transaction, TransactionType } from '../types';
import { X, PlusCircle, Edit3, TrendingUp, ArrowDownRight, Receipt, Wallet } from 'lucide-react';

interface ManualTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: {
    type: TransactionType;
    employeeId: string;
    employeeName: string;
    amount: number;
    description: string;
    category: string;
    date: string;
    time: string;
    notes?: string;
  }) => void;
  employees: Employee[];
  currentEmployee: Employee;
  isManager: boolean;
  currency?: string;
  editTransaction?: Transaction | null;
}

export const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employees,
  currentEmployee,
  isManager,
  currency = 'ريال',
  editTransaction,
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<TransactionType>('commission');
  const [employeeId, setEmployeeId] = useState<string>(currentEmployee.id);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('عمولة مبيعات');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setEmployeeId(editTransaction.employeeId);
      setAmount(editTransaction.amount.toString());
      setCategory(editTransaction.category);
      setDescription(editTransaction.description);
      setDate(editTransaction.date);
      setTime(editTransaction.time);
      setNotes(editTransaction.notes || '');
    } else {
      setEmployeeId(currentEmployee.id);
      setAmount('');
      setDescription('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(
        new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      );
      // default category based on type
      if (type === 'commission') setCategory('عمولة مبيعات');
      else if (type === 'withdrawal') setCategory('سلفة وسحوبات شخصية');
      else if (type === 'expense') setCategory('وقود ومواصلات');
      else if (type === 'salary') setCategory('راتب أساسي');
    }
  }, [editTransaction, isOpen, currentEmployee]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (!editTransaction) {
      if (newType === 'commission') setCategory('عمولة مبيعات');
      else if (newType === 'withdrawal') setCategory('سلفة وسحوبات شخصية');
      else if (newType === 'expense') setCategory('وقود ومواصلات');
      else if (newType === 'salary') setCategory('راتب أساسي');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const selectedEmp = employees.find((e) => e.id === employeeId) || currentEmployee;

    onSave({
      type,
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.name,
      amount: parsedAmount,
      description: description.trim() || `${getCategoryLabel(type)} - ${category}`,
      category,
      date,
      time,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const getCategoryLabel = (t: TransactionType) => {
    switch (t) {
      case 'commission': return 'عمولة';
      case 'withdrawal': return 'سحبة';
      case 'expense': return 'مصروف';
      case 'salary': return 'راتب';
    }
  };

  const categoryPresets: Record<TransactionType, string[]> = {
    commission: ['عمولة مبيعات', 'بونص إنجاز مشروع', 'حافز أداء', 'مكافأة تميز', 'أخرى'],
    withdrawal: ['سلفة وسحوبات شخصية', 'سحب من الراتب', 'سلفة طارئة', 'دفعة نقدية', 'أخرى'],
    expense: ['وقود ومواصلات', 'طعام وضيافة', 'مستلزمات مكتبية', 'فواتير واتصالات', 'صيانة ومشتريات', 'أخرى'],
    salary: ['راتب أساسي', 'مستحقات نهاية شهر', 'تسوية راتب', 'أخرى'],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        id="manual-transaction-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right my-8"
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              {editTransaction ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editTransaction ? 'تعديل العملية المالية' : 'تسجيل عملية مالية جديدة'}
              </h3>
              <p className="text-xs text-slate-500">
                إدخال يدوي شامل لجميع بيانات العملية المالية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">نوع العملية *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                id="type-btn-commission"
                onClick={() => handleTypeChange('commission')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'commission'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>عمولة (+)</span>
              </button>

              <button
                type="button"
                id="type-btn-withdrawal"
                onClick={() => handleTypeChange('withdrawal')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'withdrawal'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>سحبة (-)</span>
              </button>

              <button
                type="button"
                id="type-btn-expense"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>مصروف (-)</span>
              </button>

              <button
                type="button"
                id="type-btn-salary"
                onClick={() => handleTypeChange('salary')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'salary'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>راتب (+)</span>
              </button>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="space-y-1.5">
            <label htmlFor="tx-employee-select" className="text-xs font-bold text-slate-700">
              الموظف *
            </label>
            {isManager ? (
              <select
                id="tx-employee-select"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role} - راتب {emp.basicSalary} {currency})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                disabled
                value={currentEmployee.name}
                className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-bold"
              />
            )}
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="tx-amount-input" className="text-xs font-bold text-slate-700">
                المبلغ ({currency}) *
              </label>
              <div className="relative">
                <input
                  id="tx-amount-input"
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثال: 500"
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {currency}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tx-category-input" className="text-xs font-bold text-slate-700">
                التصنيف *
              </label>
              <select
                id="tx-category-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {categoryPresets[type].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="tx-description-input" className="text-xs font-bold text-slate-700">
              الوصف / البيان *
            </label>
            <input
              id="tx-description-input"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثلاً: عمولة صفقة عميل الرياض، أو بنزين سيارة العمل..."
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="tx-date-input" className="text-xs font-bold text-slate-700">التاريخ</label>
              <input
                id="tx-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tx-time-input" className="text-xs font-bold text-slate-700">الوقت</label>
              <input
                id="tx-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label htmlFor="tx-notes-input" className="text-xs font-bold text-slate-700">
              ملاحظات اختيارية
            </label>
            <textarea
              id="tx-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل أو مستندات مرفقة أو أسباب إضافية..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              id="submit-manual-tx-btn"
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>{editTransaction ? 'حفظ التعديلات' : 'تسجيل العملية'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
