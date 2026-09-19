import React, { useState } from 'react';
import { HelpCircle, ArrowLeft, X } from 'lucide-react';
import { NLPParseResult, TransactionType } from '../types';

interface ClarificationModalProps {
  nlpResult: NLPParseResult | null;
  currency?: string;
  onProceedWithAmount: (amount: number, adjustedType?: TransactionType) => void;
  onCancel: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  nlpResult,
  currency = 'ريال',
  onProceedWithAmount,
  onCancel,
}) => {
  if (!nlpResult) return null;

  const [amountInput, setAmountInput] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>(nlpResult.type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amountInput.trim().replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      onProceedWithAmount(parsed, selectedType);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="clarification-modal"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right"
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                توضيح مبلغ العملية
              </h3>
              <p className="text-xs text-slate-500">
                لم يتم تحديد المبلغ بدقة، يرجى كتابته لتسجيل العملية
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-700">النص المدخل:</span>
            <p className="font-mono bg-white p-2 rounded-md border border-slate-200 text-slate-800">
              "{nlpResult.sourceText}"
            </p>
            {nlpResult.clarificationQuestion && (
              <p className="text-blue-700 font-medium pt-1">
                {nlpResult.clarificationQuestion}
              </p>
            )}
          </div>

          {/* Type Selector if user wants to change */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">نوع العملية:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedType('commission')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  selectedType === 'commission'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                عمولة (+)
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('withdrawal')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  selectedType === 'withdrawal'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                سحبة (-)
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('expense')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  selectedType === 'expense'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                مصروف (-)
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label htmlFor="clarify-amount-input" className="text-xs font-bold text-slate-700">
              المبلغ المطلوب ({currency}):
            </label>
            <div className="relative">
              <input
                id="clarify-amount-input"
                type="number"
                step="any"
                min="0.01"
                autoFocus
                required
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="أدخل المبلغ هنا، مثلاً: 500"
                className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currency}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              id="submit-clarified-amount-btn"
              type="submit"
              disabled={!amountInput || parseFloat(amountInput) <= 0}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <span>متابعة للتأكيد</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onCancel}
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
