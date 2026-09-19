import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallBannerProps {
  onOpenModal: () => void;
}

export const AndroidInstallBanner: React.FC<AndroidInstallBannerProps> = ({ onOpenModal }) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('android_banner_dismissed') === 'true';
    if (isDismissed) setDismissed(true);
  }, []);

  // Hide if running in standalone installed mode, or user dismissed it
  if (isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('android_banner_dismissed', 'true');
  };

  return (
    <div 
      id="android-install-banner"
      className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white px-3 sm:px-4 py-2 text-xs border-b border-emerald-500/20 shadow-xs transition-all font-['Tajawal']"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <p className="truncate text-slate-200 text-[11px] sm:text-xs">
            <strong className="text-white font-bold ml-1">تطبيق أندرويد متكامل:</strong>
            ثبّت التطبيق الآن على هاتفك ليعمل بشاشة كاملة وبدون إنترنت ومزامنة لحظية.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={async () => {
              if (isInstallable) {
                const success = await install();
                if (!success) onOpenModal();
              } else {
                onOpenModal();
              }
            }}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>تثبيت الآن</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-md transition"
            title="إخفاء"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
