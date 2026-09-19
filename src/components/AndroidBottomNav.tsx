import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Plus, 
  FileText, 
  Smartphone,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidBottomNavProps {
  activeTab: 'dashboard' | 'transactions';
  onSelectTab: (tab: 'dashboard' | 'transactions') => void;
  onOpenNewTransaction: () => void;
  onOpenReport: () => void;
  onOpenAndroidModal: () => void;
  isManager?: boolean;
  onOpenSettings?: () => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTransaction,
  onOpenReport,
  onOpenAndroidModal,
  isManager,
  onOpenSettings,
}) => {
  const { isInstalled } = usePWAInstall();

  return (
    <nav 
      aria-label="شريط تنقل أندرويد"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-bottom shadow-lg transition-transform duration-200 font-['Tajawal']"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-lg mx-auto relative">
        {/* 1. Dashboard Tab */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'dashboard'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">الرئيسية</span>
        </button>

        {/* 2. Transactions Tab */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'transactions'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">العمليات</span>
        </button>

        {/* 3. Center Elevated Action Button (FAB) */}
        <div className="flex flex-col items-center justify-center flex-1 -mt-5">
          <button
            onClick={onOpenNewTransaction}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 active:scale-95 transition-transform cursor-pointer border-2 border-white"
            title="تسجيل عملية مالية جديدة"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
          <span className="text-[10px] font-bold text-emerald-800 mt-1">إضافة</span>
        </div>

        {/* 4. Financial Report Tab */}
        <button
          onClick={onOpenReport}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <FileText className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5">التقرير</span>
        </button>

        {/* 5. Android App or Settings Tab */}
        <button
          onClick={onOpenAndroidModal}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 transition-colors relative"
          title="تطبيق أندرويد"
        >
          <div className="relative">
            <Smartphone className="w-5 h-5 stroke-[1.8] text-slate-700" />
            {isInstalled ? (
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 absolute -top-0.5 -right-0.5 bg-white rounded-full" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 ring-2 ring-white animate-ping" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 text-emerald-700 font-semibold">تطبيق أندرويد</span>
        </button>
      </div>
    </nav>
  );
};
