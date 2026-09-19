import React, { useState } from 'react';
import { Transaction, Employee } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  ArrowDownRight, 
  PieChart as PieIcon, 
  Scale, 
  Users, 
  BarChart3 
} from 'lucide-react';

interface FinancialChartsProps {
  transactions: Transaction[];
  employees: Employee[];
  currency?: string;
  isManager?: boolean;
}

const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  transactions,
  employees,
  currency = 'ريال',
  isManager = false,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<
    'income_vs_deductions' | 'commissions' | 'withdrawals' | 'expenses_by_cat' | 'employee_breakdown'
  >('income_vs_deductions');

  const activeTx = transactions.filter((t) => t.status === 'active');

  // 1. Group by Date for Chronological Time Series (Commissions & Withdrawals)
  const dateMap: Record<string, { date: string; commissions: number; withdrawals: number; expenses: number; income: number; deductions: number }> = {};

  activeTx.forEach((tx) => {
    if (!dateMap[tx.date]) {
      dateMap[tx.date] = {
        date: tx.date.substring(5), // MM-DD
        commissions: 0,
        withdrawals: 0,
        expenses: 0,
        income: 0,
        deductions: 0,
      };
    }

    if (tx.type === 'commission') {
      dateMap[tx.date].commissions += tx.amount;
      dateMap[tx.date].income += tx.amount;
    } else if (tx.type === 'salary') {
      dateMap[tx.date].income += tx.amount;
    } else if (tx.type === 'withdrawal') {
      dateMap[tx.date].withdrawals += tx.amount;
      dateMap[tx.date].deductions += tx.amount;
    } else if (tx.type === 'expense') {
      dateMap[tx.date].expenses += tx.amount;
      dateMap[tx.date].deductions += tx.amount;
    }
  });

  const timeSeriesData = Object.keys(dateMap)
    .sort()
    .map((k) => dateMap[k]);

  // 2. Expenses Distribution by Category (Section 9: المصروفات حسب التصنيف)
  const categoryMap: Record<string, number> = {};
  activeTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'أخرى';
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });

  const expenseCategoryData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: categoryMap[cat],
  }));

  // 3. Employees Data Comparison (Section 9: أداء الموظفين - عرض بيانات كل موظف بدون تقييمات غير مطلوبة)
  const employeeBreakdownData = employees.map((emp) => {
    const empTx = activeTx.filter((t) => t.employeeId === emp.id);
    const comm = empTx.filter((t) => t.type === 'commission').reduce((s, t) => s + t.amount, 0);
    const withdr = empTx.filter((t) => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
    const exp = empTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {
      name: emp.name,
      الراتب: emp.basicSalary,
      العمولات: comm,
      السحوبات: withdr,
      المصروفات: exp,
      المتبقي: emp.basicSalary + comm - (withdr + exp),
    };
  });

  // Custom tooltip formatter
  const formatTooltipValue = (value: any) => `${new Intl.NumberFormat('ar-SA').format(Number(value))} ${currency}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Chart Selector Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            الرسوم البيانية والتحليل البصري
          </h3>
          <p className="text-xs text-slate-500">
            تفاعلية ومباشرة تعكس العمليات المعتمدة
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setActiveChartTab('income_vs_deductions')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeChartTab === 'income_vs_deductions'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الدخل مقابل الخصومات
          </button>

          <button
            onClick={() => setActiveChartTab('commissions')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeChartTab === 'commissions'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            العمولات عبر الوقت
          </button>

          <button
            onClick={() => setActiveChartTab('withdrawals')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeChartTab === 'withdrawals'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            السحوبات
          </button>

          <button
            onClick={() => setActiveChartTab('expenses_by_cat')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeChartTab === 'expenses_by_cat'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المصروفات حسب التصنيف
          </button>

          {isManager && (
            <button
              onClick={() => setActiveChartTab('employee_breakdown')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeChartTab === 'employee_breakdown'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              بيانات الموظفين
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-4 sm:p-6">
        {/* TAB 1: Income vs Deductions (الراتب + العمولات مقابل السحوبات + المصروفات) */}
        {activeChartTab === 'income_vs_deductions' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold text-slate-700">مقارنة إجمالي الدخل مقابل إجمالي الخصومات</span>
              <span>الأرقام بالـ {currency}</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip formatter={formatTooltipValue} />
                  <Legend />
                  <Bar dataKey="income" name="إجمالي الدخل (رواتب + عمولات)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deductions" name="إجمالي الخصومات (سحوبات + مصروفات)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: Commissions Over Time (العمولات عبر الوقت) */}
        {activeChartTab === 'commissions' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold text-emerald-800">حجم العمولات اليومية والأسبوعية المسجلة</span>
              <span>الأرقام بالـ {currency}</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip formatter={formatTooltipValue} />
                  <Area
                    type="monotone"
                    dataKey="commissions"
                    name="العمولات المكتسبة"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#commGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: Withdrawals (السحوبات عبر الفترة) */}
        {activeChartTab === 'withdrawals' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold text-amber-800">السحوبات النقدية من المستحقات عبر الفترة</span>
              <span>الأرقام بالـ {currency}</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip formatter={formatTooltipValue} />
                  <Bar dataKey="withdrawals" name="السحوبات النقدية" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 4: Expenses by Category (توزيع المصروفات حسب التصنيف) */}
        {activeChartTab === 'expenses_by_cat' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold text-rose-800">توزيع المصروفات حسب التصنيفات المعتمدة</span>
              <span>الأرقام بالـ {currency}</span>
            </div>
            {expenseCategoryData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-xs text-slate-400">
                لا توجد مصروفات مسجلة في الفترة الحالية
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={formatTooltipValue} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend list */}
                <div className="space-y-2 text-xs">
                  {expenseCategoryData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} 
                        />
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-rose-600">
                        {new Intl.NumberFormat('ar-SA').format(item.value)} {currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Employee Data Breakdown (أداء وبيانات كل موظف بدون تقييمات غير مطلوبة) */}
        {activeChartTab === 'employee_breakdown' && isManager && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold text-blue-800">بيانات مستحقات ومسحوبات كل موظف</span>
              <span>الأرقام بالـ {currency}</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeBreakdownData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip formatter={formatTooltipValue} />
                  <Legend />
                  <Bar dataKey="الراتب" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="العمولات" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="السحوبات" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="المصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
