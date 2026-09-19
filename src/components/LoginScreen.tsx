import React, { useState } from 'react';
import { AuthUser } from '../types';
import { Lock, User, ShieldCheck, ShieldAlert, CheckCircle2, ArrowLeft, Smartphone, Phone, MessageCircle, Cpu } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

interface DemoAccount {
  name: string;
  role: 'manager' | 'employee';
  username: string;
  password: string;
  desc: string;
  employeeId: string | null;
}

const DEFAULT_ACCOUNTS: DemoAccount[] = [
  {
    name: 'المدير العام (أدمن)',
    role: 'manager',
    username: 'manager',
    password: 'admin123',
    desc: 'صلاحيات الإدارة الكاملة: الاطلاع على جميع الحسابات، العمليات، والإشعارات الشاملة',
    employeeId: null,
  },
  {
    name: 'علي',
    role: 'employee',
    username: 'ali',
    password: '1234',
    desc: 'موظف مبيعات معتمد - حساب معزول وخاص به فقط',
    employeeId: 'emp-1',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('manager');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تسجيل الدخول، تحقق من البيانات');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (acc: DemoAccount) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo and Brand */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 shadow-2xl border border-amber-500/50 mb-3.5 p-1.5 relative group">
          <div className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur-sm group-hover:bg-amber-500/40 transition duration-300" />
          <img
            src="/app-logo.png"
            alt="شعار النظام - أبو غيث النجار"
            className="w-full h-full object-contain rounded-xl relative z-10"
            referrerPolicy="no-referrer"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Tajawal']">
          حسابي <span className="text-amber-600 text-lg sm:text-xl font-normal">| النظام المالي الداخلي</span>
        </h1>
        <p className="mt-1 text-xs text-slate-600 font-medium">
          المطور أبو غيث النجار <span className="font-bold font-mono">2026</span> • للمشاريع الداخلية والأتمتة
        </p>

        {/* PWA Install Button Quick Header */}
        <div className="mt-3 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-700 mb-1">
                اسم المستخدم
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pr-9 pl-3 py-2.5 sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition"
                  placeholder="مثال: manager أو ahmed"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1">
                كلمة المرور / الرمز السري
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-9 pl-3 py-2.5 sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              id="submit-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>تسجيل الدخول إلى النظام</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Account Switcher for Testing / Auditing */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                اختبار الصلاحيات وعزل البيانات
              </span>
              <span className="text-[11px] text-slate-400">اضغط للاختيار</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEFAULT_ACCOUNTS.map((acc) => {
                const isSelected = username === acc.username;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`text-right p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{acc.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            acc.role === 'manager'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {acc.role === 'manager' ? 'مدير النظام' : 'موظف'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{acc.desc}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mr-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security Guarantee Notice */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              أمان وعزل فوري (Strict RBAC):
            </div>
            عند تسجيل دخول الموظف، يتم عزل البيانات على مستوى الخادم (Server-Side Isolation) ولا يتم نقل أو تخزين معاملات أو رواتب موظف آخر في المتصفح مطلقاً.
          </div>
        </div>

        {/* Developer Credit & Direct Contact Box */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-900 border border-amber-500/30 text-white shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 p-1 flex items-center justify-center">
                <img
                  src="/app-logo.png"
                  alt="شعار المطور"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="text-xs font-black text-amber-400 font-['Tajawal']">
                  المطور أبو غيث النجار 2026
                </div>
                <div className="text-[10px] text-slate-400">
                  للمشاريع الداخلية والأتمتة
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              للتواصل والطلب
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <a
              id="login-phone-contact"
              href="tel:0570936035"
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 hover:border-amber-500/40 transition cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span dir="ltr">0570936035</span>
            </a>

            <a
              id="login-whatsapp-contact"
              href="https://wa.me/966570936035?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D8%A8%D8%AE%D8%B5%D9%88%D8%B5%20%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%D8%B9%20%D8%A7%D9%84%D8%A3%D8%AA%D9%85%D8%AA%D8%A9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm hover:shadow-emerald-600/30 cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب للطلب</span>
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span>تطبيق ويب تقدمي (PWA)</span>
          <span>•</span>
          <span>يعمل بدون اتصال بالإنترنت</span>
          <span>•</span>
          <span>مزامنة لحظية</span>
        </div>
      </div>
    </div>
  );
};
