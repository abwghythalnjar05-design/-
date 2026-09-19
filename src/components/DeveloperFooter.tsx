import React from 'react';
import { Phone, MessageCircle, Sparkles, Cpu, ShieldCheck } from 'lucide-react';

interface DeveloperFooterProps {
  compact?: boolean;
}

export const DeveloperFooter: React.FC<DeveloperFooterProps> = ({ compact = false }) => {
  const phone = '0570936035';
  const telLink = 'tel:0570936035';
  const whatsappLink = 'https://wa.me/966570936035?text=' + encodeURIComponent('السلام عليكم، أود التواصل بخصوص مشاريع الأتمتة والأنظمة المالية');

  if (compact) {
    return (
      <div className="py-3 px-4 bg-slate-900 text-slate-300 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <img
            src="/app-logo.png"
            alt="شعار التطبيق"
            className="w-6 h-6 object-contain rounded-md shadow-xs bg-amber-950/40 p-0.5 border border-amber-500/30"
            referrerPolicy="no-referrer"
          />
          <span className="font-bold text-white">المطور: أبو غيث النجار 2026</span>
          <span className="text-slate-400 hidden sm:inline">• للمشاريع الداخلية والأتمتة</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={telLink}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono font-bold transition border border-amber-500/20"
            title="اتصال هاتفي مباشر"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span dir="ltr">{phone}</span>
          </a>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold transition border border-emerald-500/30"
            title="تواصل عبر واتساب"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>واتساب</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <footer className="mt-12 bg-linear-to-b from-slate-900 to-slate-950 text-slate-300 border-t border-amber-500/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and Developer Title */}
          <div className="flex items-center gap-4 text-right">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-amber-500 to-amber-300 opacity-30 blur-sm group-hover:opacity-60 transition duration-300" />
              <div className="relative w-14 h-14 rounded-2xl bg-slate-900 border border-amber-500/40 p-1 flex items-center justify-center shadow-xl">
                <img
                  src="/app-logo.png"
                  alt="شعار النظام - أبو غيث النجار"
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base sm:text-lg font-black text-white tracking-wide font-['Tajawal']">
                  المطور أبو غيث النجار <span className="text-amber-400 font-mono font-bold">2026</span>
                </h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Cpu className="w-3 h-3 text-amber-400" />
                  للمشاريع الداخلية والأتمتة
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تصميم وبرمجة الأنظمة الإدارية والمالية المتخصصة وحلول الأتمتة المتقدمة
              </p>
            </div>
          </div>

          {/* Contact & Ordering Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-center sm:text-right ml-2 hidden lg:block">
              <span className="block text-[11px] text-slate-400">للتواصل والطلب المباشر:</span>
              <span className="font-mono text-xs font-bold text-amber-300 tracking-wider">
                متاح 24/7 للاستشارات
              </span>
            </div>

            {/* Direct Phone Call Button */}
            <a
              id="dev-contact-phone"
              href={telLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 hover:border-amber-500/40 transition-all shadow-md group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono font-black text-amber-300" dir="ltr">
                {phone}
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">اتصال</span>
            </a>

            {/* WhatsApp Button */}
            <a
              id="dev-contact-whatsapp"
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-emerald-600/30 cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>واتساب للطلب والتواصل</span>
            </a>
          </div>
        </div>

        {/* Bottom micro bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>نظام حسابي المالي الداخلي • تشغيل محلي وسحابي مؤتمت وآمن</span>
          </div>
          <div>
            جميع الحقوق محفوظة © 2026 للمطور أبو غيث النجار
          </div>
        </div>
      </div>
    </footer>
  );
};
