import React, { useState } from 'react';
import { Sparkles, ArrowLeft, Lightbulb, Loader2 } from 'lucide-react';
import { parseTransactionWithAI } from '../utils/arabicNlp';
import { NLPParseResult } from '../types';

interface NaturalLanguageBarProps {
  onParsedResult: (result: NLPParseResult) => void;
  employeeName?: string;
  isManager?: boolean;
}

export const NaturalLanguageBar: React.FC<NaturalLanguageBarProps> = ({
  onParsedResult,
  employeeName,
  isManager = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'عمولة 500',
    'لي عمولة 700',
    'حصلت على عمولة 1200',
    'أضف لي 300 عمولة',
    'سحبت 500',
    'أخذت 500 من الراتب',
    'لي سحب 300',
    'صرف 70 بنزين',
    'دفعت 120 مطعم',
    'مصروف 50 قهوة',
  ];

  const handleProcess = async (textToProcess?: string) => {
    const text = (textToProcess || inputText).trim();
    if (!text) return;

    setLoading(true);
    try {
      const result = await parseTransactionWithAI(text);
      onParsedResult(result);
      setInputText('');
    } catch (error) {
      console.error('NLP Parse error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleProcess();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              تسجيل سريع باللغة الطبيعية
            </h3>
            <p className="text-xs text-slate-500">
              اكتب باللغة العربية البسيطة وسيتعرف النظام تلقائياً على نوع العملية والمبلغ والتصنيف
            </p>
          </div>
        </div>

        {employeeName && !isManager && (
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 hidden sm:inline-block">
            التسجيل لحساب: {employeeName}
          </span>
        )}
      </div>

      {/* Main input */}
      <div className="relative flex items-center">
        <input
          id="nlp-transaction-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="اكتب عمليتك هنا... مثلاً: عمولة 500 أو سحبت 300 أو صرف 70 بنزين أو دفعت 120 مطعم"
          className="w-full pl-24 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
        />

        <button
          id="nlp-submit-btn"
          type="button"
          onClick={() => handleProcess()}
          disabled={!inputText.trim() || loading}
          className="absolute left-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>معالجة...</span>
            </>
          ) : (
            <>
              <span>تسجيل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Quick Prompts Chips */}
      <div className="pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>أمثلة سريعة للتجربة الفورية (اضغط للتجربة):</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleProcess(prompt)}
              className="text-xs font-medium px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 rounded-lg text-slate-600 transition-all text-right"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
