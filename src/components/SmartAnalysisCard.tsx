import React from 'react';
import { Transaction, Employee, FilterPeriod } from '../types';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Calculator, 
  Tag, 
  Compass,
  DollarSign
} from 'lucide-react';

interface SmartAnalysisCardProps {
  transactions: Transaction[];
  employees: Employee[];
  currency?: string;
  selectedPeriod: FilterPeriod;
}

export const SmartAnalysisCard: React.FC<SmartAnalysisCardProps> = ({
  transactions,
  employees,
  currency = 'ريال',
  selectedPeriod,
}) => {
  const activeTx = transactions.filter((t) => t.status === 'active');

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('ar-SA').format(Math.round(num * 100) / 100);

  // If insufficient data
  if (activeTx.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
        <h3 className="text-sm font-bold text-slate-700">لا توجد بيانات كافية للتحليل المالي الذكي</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          التحليل المالي الذكي يعتمد بالكامل على العمليات المعتمدة المدخلة في النظام. يرجى إضافة عمليات مالية أو توسيع نطاق الفترة الزمنية لعرض المؤشرات.
        </p>
      </div>
    );
  }

  // Calculations based STRICTLY on actual data:
  const commissionsTx = activeTx.filter((t) => t.type === 'commission');
  const withdrawalsTx = activeTx.filter((t) => t.type === 'withdrawal');
  const expensesTx = activeTx.filter((t) => t.type === 'expense');
  const salaryTx = activeTx.filter((t) => t.type === 'salary');

  const totalCommissions = commissionsTx.reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = withdrawalsTx.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expensesTx.reduce((sum, t) => sum + t.amount, 0);
  const totalSalaries = salaryTx.reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = totalSalaries + totalCommissions;
  const totalDeductions = totalWithdrawals + totalExpenses;
  const netRemaining = totalIncome - totalDeductions;

  // Average expense
  const averageExpense = expensesTx.length > 0 ? totalExpenses / expensesTx.length : 0;

  // Highest Expense Category
  const expenseCatCount: Record<string, number> = {};
  expensesTx.forEach((t) => {
    const cat = t.category || 'عام';
    expenseCatCount[cat] = (expenseCatCount[cat] || 0) + t.amount;
  });

  let topCategory = 'لا يوجد';
  let topCategoryAmount = 0;
  for (const cat in expenseCatCount) {
    if (expenseCatCount[cat] > topCategoryAmount) {
      topCategoryAmount = expenseCatCount[cat];
      topCategory = cat;
    }
  }

  // Ratio calculations
  const withdrawalRatio = totalIncome > 0 ? Math.round((totalWithdrawals / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
  const retentionRatio = totalIncome > 0 ? Math.round((netRemaining / totalIncome) * 100) : 0;

  // Real Trends & Observations (Section 11)
  const trends: string[] = [];

  if (totalCommissions > totalSalaries && totalSalaries > 0) {
    trends.push(`نسبة نمو العمولات مرتفعة حيث تجاوزت الرواتب الأساسية بنسبة ${Math.round((totalCommissions / totalSalaries) * 100)}%.`);
  } else if (totalCommissions > 0) {
    trends.push(`تشكل العمولات نسبة ${Math.round((totalCommissions / (totalIncome || 1)) * 100)}% من إجمالي الدخل المحقق.`);
  }

  if (withdrawalRatio > 50) {
    trends.push(`تنبيه مالي: نسبة السحوبات النقدية مرتفعة نسبياً وتمثل ${withdrawalRatio}% من إجمالي الدخل.`);
  } else if (totalWithdrawals > 0) {
    trends.push(`السحوبات النقدية منضبطة وتمثل ${withdrawalRatio}% من إجمالي المستحقات.`);
  }

  if (topCategoryAmount > 0) {
    trends.push(`أعلى فئة تم الصرف عليها هي "${topCategory}" بإجمالي ${formatNumber(topCategoryAmount)} ${currency} (${Math.round((topCategoryAmount / (totalExpenses || 1)) * 100)}% من المصروفات).`);
  }

  if (retentionRatio > 0) {
    trends.push(`صافي الرصيد المتبقي إيجابي بنسبة احتفاظ بلغت ${retentionRatio}% من إجمالي الدخل.`);
  } else if (retentionRatio < 0) {
    trends.push(`تنبيه: إجمالي الخصومات تجاوز الدخل في هذه الفترة بعجز قدره ${formatNumber(Math.abs(netRemaining))} ${currency}.`);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              التحليل المالي الذكي المتقدم
            </h3>
            <p className="text-xs text-slate-500">
              مؤشرات إحصائية وتحليلات مستخلصة من واقع السجلات المحفوظة
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
          مبني على {activeTx.length} عملية
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Core Financial Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-800 block">إجمالي الدخل</span>
            <span className="text-lg sm:text-xl font-black text-emerald-950 font-mono mt-1 block">
              {formatNumber(totalIncome)} {currency}
            </span>
            <span className="text-[10px] text-emerald-700 mt-1 block">
              الرواتب: {formatNumber(totalSalaries)} + العمولات: {formatNumber(totalCommissions)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100">
            <span className="text-[11px] font-bold text-rose-800 block">إجمالي الخصومات</span>
            <span className="text-lg sm:text-xl font-black text-rose-950 font-mono mt-1 block">
              {formatNumber(totalDeductions)} {currency}
            </span>
            <span className="text-[10px] text-rose-700 mt-1 block">
              سحوبات: {formatNumber(totalWithdrawals)} + مصروفات: {formatNumber(totalExpenses)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
            <span className="text-[11px] font-bold text-amber-800 block">أعلى فئة مصروفات</span>
            <span className="text-sm sm:text-base font-black text-amber-950 truncate mt-1 block">
              {topCategory}
            </span>
            <span className="text-[10px] text-amber-700 mt-1 block font-mono">
              {formatNumber(topCategoryAmount)} {currency}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-[11px] font-bold text-blue-800 block">متوسط المصروف الواحد</span>
            <span className="text-lg sm:text-xl font-black text-blue-950 font-mono mt-1 block">
              {formatNumber(averageExpense)} {currency}
            </span>
            <span className="text-[10px] text-blue-700 mt-1 block">
              من أصل {expensesTx.length} فواتير مصروفات
            </span>
          </div>
        </div>

        {/* Observed Trends and Insights (Section 11: الاتجاهات الملحوظة) */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-purple-600" />
            الاتجاهات والملاحظات المالية المستخلصة:
          </h4>
          <div className="space-y-2">
            {trends.map((trend, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>{trend}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
