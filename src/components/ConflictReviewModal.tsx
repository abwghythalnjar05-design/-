import React, { useState } from 'react';
import { ConflictRecord } from '../types';
import { AlertTriangle, Check, X, ArrowLeftRight, Clock, Smartphone, Server } from 'lucide-react';

interface ConflictReviewModalProps {
  conflicts: ConflictRecord[];
  onResolve: (conflictId: string, resolution: 'keep_local' | 'keep_remote') => void;
  currency?: string;
}

export const ConflictReviewModal: React.FC<ConflictReviewModalProps> = ({
  conflicts,
  onResolve,
  currency = 'ريال',
}) => {
  const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);

  const unresolved = conflicts.filter((c) => !c.resolved);
  if (unresolved.length === 0) return null;

  const current = selectedConflict || unresolved[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        id="conflict-resolution-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden text-right"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-100 bg-amber-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                مراجعة تعارض البيانات المتزامنة ({unresolved.length})
              </h3>
              <p className="text-xs text-slate-600">
                تم تعديل هذه العملية من جهازين في نفس الوقت، يرجى اختيار النسخة المعتمدة
              </p>
            </div>
          </div>
        </div>

        {/* Body comparing the two versions */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <span className="font-bold text-slate-800">
              معرف العملية: <span className="font-mono">{current.transactionId}</span>
            </span>
            <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(current.conflictTime).toLocaleTimeString('ar-SA')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Version A: Local (from incoming push) */}
            <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  النسخة المحلية (الجهاز)
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono px-2 py-0.5 rounded-md">
                  v{current.localVersion.version}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">الوصف: </span>
                  <span className="font-bold text-slate-800">{current.localVersion.description}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">المبلغ: </span>
                  <span className="font-bold text-indigo-700 font-mono">
                    {current.localVersion.amount} {currency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">الموظف: </span>
                  <span className="font-bold text-slate-800">{current.localVersion.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">التاريخ: </span>
                  <span className="font-mono text-slate-700">{current.localVersion.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">المعدّل: </span>
                  <span className="text-slate-700">{current.localVersion.updatedBy || current.localVersion.recordedBy}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onResolve(current.id, 'keep_local')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد النسخة المحلية</span>
              </button>
            </div>

            {/* Version B: Remote (authoritative server) */}
            <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-600" />
                  نسخة السيرفر الحالية
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-md">
                  v{current.remoteVersion.version}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">الوصف: </span>
                  <span className="font-bold text-slate-800">{current.remoteVersion.description}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">المبلغ: </span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {current.remoteVersion.amount} {currency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">الموظف: </span>
                  <span className="font-bold text-slate-800">{current.remoteVersion.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">التاريخ: </span>
                  <span className="font-mono text-slate-700">{current.remoteVersion.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">المعدّل: </span>
                  <span className="text-slate-700">{current.remoteVersion.updatedBy || current.remoteVersion.recordedBy}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onResolve(current.id, 'keep_remote')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>الإبقاء على نسخة السيرفر</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            تضمن هذه الميزة عدم فقدان أي تعديلات تمت دون اتصال.
          </span>
          {unresolved.length > 1 && (
            <div className="flex items-center gap-1">
              {unresolved.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConflict(c)}
                  className={`w-6 h-6 rounded-md font-mono text-[11px] ${
                    c.id === current.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
