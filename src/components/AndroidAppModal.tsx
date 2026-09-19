import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  X, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  WifiOff, 
  Layers, 
  QrCode,
  ArrowRight,
  Share2
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManualModal?: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'chrome' | 'samsung' | 'other'>('chrome');
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTriggerInstall = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (success) {
        onClose();
      }
    } catch {
      // ignore
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto text-right font-['Tajawal']"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Android Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-5 sm:p-6 text-white relative">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    تطبيق أندرويد أصلي (WebAPK)
                  </span>
                  <span className="text-lg font-black text-white">تطبيق حسابي المالي</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  متوافق 100% مع جميع هواتف وأجهزة أندرويد اللوحية
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 p-2 flex items-center justify-center shrink-0 shadow-inner">
                <Smartphone className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>مُشفّر وآمن • بدون إعلانات • تحديثات لحظية</span>
            </div>
            {isInstalled ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                التطبيق مثبت وجاهز
              </span>
            ) : isInstallable ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                متاح للتثبيت المباشر بنقرة واحدة
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold">
                جاهز للتثبيت على هاتفك
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto smooth-scroll">
          {/* Direct Install Button if supported */}
          {isInstallable && !isInstalled && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <h4 className="text-sm font-bold text-emerald-950 mb-1">
                جهازك يدعم التثبيت الفوري الآن!
              </h4>
              <p className="text-xs text-emerald-800 mb-3">
                اضغط على الزر أدناه ليتم تثبيت التطبيق فوراً كبرنامج مستقل على شاشة جهازك.
              </p>
              <button
                onClick={handleTriggerInstall}
                disabled={installing}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0 animate-bounce" />
                <span>{installing ? 'جارٍ التثبيت على الهاتف...' : 'تثبيت تطبيق أندرويد بنقرة واحدة'}</span>
              </button>
            </div>
          )}

          {/* Core Android App Advantages */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wider flex items-center gap-1.5 justify-start">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>مميزات تطبيق أندرويد لـ "حسابي":</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex sm:flex-col items-center sm:items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">يعمل بدون إنترنت</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    تسجيل العمليات محلياً ومزامنتها فور توفر الشبكة
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex sm:flex-col items-center sm:items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">شاشة كاملة وتطبيق أصلي</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    يعمل بدون أشرطة المتصفح وبسلاسة فائقة 120Hz
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex sm:flex-col items-center sm:items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">توافق تام مع كل المقاسات</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    هواتف صغيرة، جالكسي، شاومي، تابلت، وأجهزة قابلة للطي
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Browser Installation Guide */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
              طريقة التثبيت على هواتف أندرويد بحسب المتصفح:
            </h4>

            {/* Browser Selector Tabs */}
            <div className="flex border-b border-slate-200 gap-2 mb-3">
              <button
                onClick={() => setActiveTab('chrome')}
                className={`pb-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'chrome'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                جوجل كروم (Google Chrome)
              </button>
              <button
                onClick={() => setActiveTab('samsung')}
                className={`pb-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'samsung'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                سامسونج إنترنت (Samsung)
              </button>
              <button
                onClick={() => setActiveTab('other')}
                className={`pb-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'other'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                فايرفوكس / متصفحات أخرى
              </button>
            </div>

            {/* Tab 1: Chrome */}
            {activeTab === 'chrome' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      اضغط على أيقونة النقاط الثلاث (⋮)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      موجودة في أعلى زاوية متصفح Google Chrome على هاتفك.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      اختر <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">"تثبيت التطبيق"</span> أو <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">"إضافة إلى الشاشة الرئيسية"</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      يقوم نظام أندرويد بإنشاء ملف WebAPK رسمي ويضعه في درج التطبيقات لديك.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      اضغط على "تثبيت" (Install)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      افتح التطبيق من شاشة هاتفك واستمتع بالنظام المالي كاملاً دون متصفح.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Samsung */}
            {activeTab === 'samsung' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      اضغط على زر القائمة (☰) في أسفل المتصفح
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      أو اضغط على علامة التنزيل المباشر الموجودة بجانب شريط العنوان.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      اختر "إضافة صفحة إلى" ثم "شاشة التطبيقات"
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      سيتم تثبيته تلقائياً داخل نظام أندرويد لهواتف Galaxy.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Other */}
            {activeTab === 'other' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      في Firefox أو Edge أو متصفح شاومي/أوبو:
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      اضغط على قائمة الإعدادات (⋮) واختر "تثبيت" أو "إضافة إلى الصفحة الرئيسية".
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Share to Android Phone */}
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-right">
                <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>فتح الرابط مباشرة على هاتف أندرويد</span>
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm leading-relaxed">
                  انسخ الرابط لفتحه في متصفح هاتفك المحمول أو امسح رمز الاستجابة السريعة (QR) بالكاميرا:
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'تم نسخ الرابط!' : 'نسخ رابط التطبيق'}</span>
                </button>
              </div>
            </div>

            {/* QR Code section */}
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                امسح الرمز بكاميرا هاتف أندرويد لفتح التطبيق وتثبيته فوراً:
              </span>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(currentUrl)}`}
                alt="QR Code لفتح التطبيق على أندرويد"
                className="w-16 h-16 rounded-lg border border-slate-300 p-0.5 bg-white shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            حسابي v2.4 • متوافق مع Android 8.0 فما فوق
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
