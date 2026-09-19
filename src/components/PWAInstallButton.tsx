import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { AndroidAppModal } from './AndroidAppModal';

export const PWAInstallButton: React.FC<{ className?: string; onOpenModal?: () => void }> = ({ 
  className = '',
  onOpenModal 
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // If already running as an installed standalone app
  if (isInstalled) {
    return (
      <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>تطبيق أندرويد مُثبّت</span>
      </span>
    );
  }

  // Chromium / Android flow with active prompt
  if (isInstallable) {
    return (
      <>
        <button
          id="pwa-install-btn"
          onClick={async () => {
            const success = await install();
            if (!success) {
              setShowAndroidModal(true);
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all duration-150 cursor-pointer ${className}`}
          title="تثبيت تطبيق أندرويد على هاتفك أو جهازك"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0 animate-pulse text-emerald-200" />
          <span>تثبيت تطبيق أندرويد</span>
        </button>

        <AndroidAppModal
          isOpen={showAndroidModal}
          onClose={() => setShowAndroidModal(false)}
        />
      </>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium border border-slate-700 shadow-xs transition-all duration-150 cursor-pointer ${className}`}
          title="تثبيت التطبيق على iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>تثبيت على iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-right">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">تثبيت "حسابي" على iPhone / iPad</span>
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-700 leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">اضغط على زر المشاركة في Safari</p>
                    <p className="text-slate-500 mt-0.5">أيقونة المربع ذو السهم للأعلى <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> أسفل الشاشة.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">اختر "إضافة إلى الصفحة الرئيسية"</p>
                    <p className="text-slate-500 mt-0.5">مرر الخيارات للأسفل واضغط على <PlusSquare className="w-3.5 h-3.5 inline text-emerald-600" /> Add to Home Screen.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">اضغط "إضافة" (Add)</p>
                    <p className="text-slate-500 mt-0.5">سيظهر التطبيق بأيقونة كاملة على شاشتك الرئيسية ويعمل كتطبيق أصلي وسريع بدون متصفح.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // General Android / Browser trigger (always accessible so any user can install or see instructions)
  return (
    <>
      <button
        id="pwa-install-guide-btn"
        onClick={() => {
          if (onOpenModal) onOpenModal();
          else setShowAndroidModal(true);
        }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all duration-150 cursor-pointer ${className}`}
        title="تطبيق أندرويد متكامل - اضغط لتثبيت التطبيق على جهازك"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        <span>تطبيق أندرويد</span>
      </button>

      <AndroidAppModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
      />
    </>
  );
};
