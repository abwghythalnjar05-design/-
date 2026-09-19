import React from 'react';
import { TransactionType } from '../types';
import { formatCurrency } from '../utils/arabicNlp';
import { 
  AlertCircle, 
  Check, 
  X, 
  TrendingUp, 
  ArrowDownRight, 
  Receipt, 
  Wallet,
  Calendar,
  User,
  Tag,
  FileText
} from 'lucide-react';

interface PendingTransaction {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  employeeId: string;
  employeeName: string;
  notes?: string;
  source: 'manual' | 'nlp';
}

interface ConfirmationModalProps {
  pendingTx: PendingTransaction | null;
  currency?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  pendingTx,
  currency = 'ريال',
  onConfirm,
  onCancel,
}) => {
  if (!pendingTx) return null;

  const getTypeDetails = (type: TransactionType) => {
    switch (type) {
      case 'commission':
        return {
          label: 'عمولة',
          icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          badgeText: 'دخل إضافي (+)',
        };
      case 'withdrawal':
        return {
          label: 'سحبة',
          icon: <ArrowDownRight className="w-5 h-5 text-amber-600" />,
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
          badgeText: 'سحب من المستحقات (-)',
        };
      case 'expense':
        return {
          label: 'مصروف',
          icon: <Receipt className="w-5 h-5 text-rose-600" />,
          bgColor: 'bg-rose-50',
          textColor: 'text-rose-700',
          borderColor: 'border-rose-200',
          badgeText: 'خصم مصروف (-)',
        };
      case 'salary':
        return {
          label: 'راتب أساسي',
          icon: <Wallet className="w-5 h-5 text-blue-600" />,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          badgeText: 'راتب شهري (+)',
        };
    }
  };

  const typeInfo = getTypeDetails(pendingTx.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="transaction-confirmation-modal"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right"
      >
        {/* Header alert */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              تأكيد العملية المالية
            </h3>
            <p className="text-xs text-slate-500">
              يرجى مراجعة تفاصيل العملية بعناية قبل الاعتماد
            </p>
          </div>
        </div>

        {/* Content Body: Exact phrase requested: "سيتم تسجيل: عمولة — 700 ريال. هل تريد التسجيل؟" */}
        <div className="p-6 space-y-4">
          <div className="text-center py-4 px-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <span className="text-xs text-slate-500 font-medium">سيتم تسجيل:</span>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-xl sm:text-2xl font-black ${typeInfo.textColor}`}>
                {typeInfo.label}
              </span>
              <span className="text-slate-400 font-bold text-lg">—</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {new Intl.NumberFormat('ar-SA').format(pendingTx.amount)} {currency}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700 pt-1">
              هل تريد التسجيل؟
            </p>
          </div>

          {/* Details breakdown */}
          <div className="space-y-2 text-xs bg-white rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                الموظف
              </span>
              <span className="font-bold text-slate-800">{pendingTx.employeeName}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                التصنيف
              </span>
              <span className="font-medium text-slate-800">{pendingTx.category}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                الوصف
              </span>
              <span className="font-medium text-slate-800 text-left max-w-[200px] truncate" title={pendingTx.description}>
                {pendingTx.description}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                التاريخ
              </span>
              <span className="font-mono text-slate-800">{pendingTx.date}</span>
            </div>
          </div>
        </div>

        {/* Buttons: تأكيد & إلغاء */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <button
            id="confirm-transaction-btn"
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>تأكيد</span>
          </button>

          <button
            id="cancel-transaction-btn"
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>إلغاء</span>
          </button>
        </div>
      </div>
    </div>
  );
};
