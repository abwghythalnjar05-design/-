import React, { useState, useRef } from 'react';
import { Employee, Transaction } from '../types';
import { calculateEmployeeSummary, calculateCompanySummary } from '../utils/finance';
import { Printer, X, Download, FileText, CheckCircle2, User, Building2, Phone, Calendar, Loader2 } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface FinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  transactions: Transaction[];
  currency?: string;
  companyName?: string;
}

export const FinancialReportModal: React.FC<FinancialReportModalProps> = ({
  isOpen,
  onClose,
  employees,
  transactions,
  currency = 'ريال',
  companyName = 'مؤسسة حسابي للحلول المالية والأتمتة',
}) => {
  if (!isOpen) return null;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const activeEmployees = employees.filter((e) => e.status !== 'archived');
  const companyStats = calculateCompanySummary(employees, transactions);

  const selectedEmployee = selectedEmployeeId !== 'all' 
    ? activeEmployees.find((e) => e.id === selectedEmployeeId) 
    : null;

  const employeeStats = selectedEmployee 
    ? calculateEmployeeSummary(selectedEmployee, transactions)
    : null;

  const employeeTransactions = selectedEmployee
    ? transactions
        .filter((t) => t.employeeId === selectedEmployee.id && t.status === 'active')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const printDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || isExportingPDF) return;

    try {
      setIsExportingPDF(true);
      setExportSuccess(false);

      const targetTitle = selectedEmployee 
        ? `كشف_حساب_${selectedEmployee.name.replace(/\s+/g, '_')}`
        : `التقرير_المالي_الموحد_${companyName.replace(/\s+/g, '_')}`;

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${targetTitle}_${dateStr}.pdf`;

      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(reportRef.current).save();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      // Fallback to print
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div 
        id="printable-financial-report"
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right my-6 print:shadow-none print:border-none print:m-0 print:max-w-none"
      >
        {/* Modal Top Control Bar (Hidden in Print and PDF) */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm block">تصدير كشوف الحساب والتقارير المالية (PDF)</span>
              <span className="text-[11px] text-slate-400">توليد ملفات PDF عالية الدقة ومجهزة للطباعة والمشاركة الفورية</span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Filter Selector */}
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">كافة الموظفين (تقرير موحد شامل)</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  كشف حساب: {emp.name} ({emp.role})
                </option>
              ))}
            </select>

            {/* Export PDF Button */}
            <button
              id="export-pdf-btn"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="تحميل كشف الحساب بصيغة PDF"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التصدير...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>تم التنزيل بنجاح!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تحميل PDF</span>
                </>
              )}
            </button>

            {/* Native Print Button */}
            <button
              id="print-report-btn"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>طباعة</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & PDF Content Container */}
        <div ref={reportRef} id="pdf-report-content" className="p-8 sm:p-10 space-y-6 bg-white text-slate-900">
          {/* Header of Report */}
          <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl border border-amber-500/40">
                  حـ
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {selectedEmployee ? `كشف حساب مالي للموظف: ${selectedEmployee.name}` : 'التقرير المالي الموحد للمؤسسة'}
                  </h1>
                  <p className="text-xs font-bold text-slate-600">
                    {companyName}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 pt-1 font-sans">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>تاريخ التقرير: {printDate}</span>
                <span>•</span>
                <span className="font-mono">العملة: {currency}</span>
              </p>
            </div>

            <div className="text-left space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                وثيقة مالية رسمية معتمدة
              </span>
              <p className="text-[10px] text-slate-400 font-mono">
                REF: HISABI-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
              </p>
            </div>
          </div>

          {/* Mathematical Formula Reference */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold block text-slate-900 mb-0.5">معادلة احتساب المستحقات المالية:</span>
              <span className="font-mono text-slate-600 text-[11px]">
                إجمالي الدخل (الراتب الأساسي + العمولات) - إجمالي الخصومات (السحوبات + المصروفات) = الرصيد المتبقي
              </span>
            </div>
            <div className="text-left font-mono font-bold text-emerald-800 text-xs bg-emerald-100/60 px-2.5 py-1 rounded-lg">
              صافي الاستحقاق
            </div>
          </div>

          {/* Summary Metric Cards */}
          {selectedEmployee && employeeStats ? (
            /* Single Employee View */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">اسم الموظف</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedEmployee.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">المسمى الوظيفي</span>
                  <span className="font-bold text-slate-800">{selectedEmployee.role}</span>
                </div>
                {selectedEmployee.phone && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">رقم الجوال</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{selectedEmployee.phone}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block text-[11px]">الراتب الأساسي</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {new Intl.NumberFormat('ar-SA').format(employeeStats.basicSalary)} {currency}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">الراتب الأساسي</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {new Intl.NumberFormat('ar-SA').format(employeeStats.basicSalary)} {currency}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 block">إجمالي العمولات (+)</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    +{new Intl.NumberFormat('ar-SA').format(employeeStats.totalCommissions)} {currency}
                  </span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[11px] text-rose-800 block">السحوبات والمصروفات (-)</span>
                  <span className="text-base font-black text-rose-700 font-mono">
                    -{new Intl.NumberFormat('ar-SA').format(employeeStats.totalWithdrawals + employeeStats.totalExpenses)} {currency}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs">
                  <span className="text-[11px] text-slate-300 block">صافي الرصيد المتبقي</span>
                  <span className="text-base font-black text-white font-mono">
                    {new Intl.NumberFormat('ar-SA').format(employeeStats.remainingBalance)} {currency}
                  </span>
                </div>
              </div>

              {/* Transactions log for this employee */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-900">سجل العمليات المالية المعتمدة لهذا الحساب</h3>
                {employeeTransactions.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    لا توجد عمليات مالية مسجلة بعد لهذا الموظف (الرصيد يطابق الراتب الأساسي).
                  </div>
                ) : (
                  <table className="w-full text-right text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                      <tr>
                        <th className="p-2">التاريخ</th>
                        <th className="p-2">نوع العملية</th>
                        <th className="p-2">التصنيف والبيان</th>
                        <th className="p-2">المبلغ</th>
                        <th className="p-2">سُجّلت بواسطة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {employeeTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-600">{tx.date}</td>
                          <td className="p-2 font-sans font-bold">
                            {tx.type === 'commission' && <span className="text-emerald-700 font-bold">عمولة (+)</span>}
                            {tx.type === 'withdrawal' && <span className="text-amber-700 font-bold">سحب (-)</span>}
                            {tx.type === 'expense' && <span className="text-rose-700 font-bold">مصروف (-)</span>}
                            {tx.type === 'salary' && <span className="text-blue-700 font-bold">راتب</span>}
                          </td>
                          <td className="p-2 font-sans text-slate-800">
                            {tx.description} {tx.category ? `(${tx.category})` : ''}
                          </td>
                          <td className="p-2 font-bold font-mono">
                            <span className={tx.type === 'commission' ? 'text-emerald-700' : 'text-slate-900'}>
                              {new Intl.NumberFormat('ar-SA').format(tx.amount)} {currency}
                            </span>
                          </td>
                          <td className="p-2 font-sans text-slate-500 text-[11px]">{tx.recordedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            /* Consolidated Company View */
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">إجمالي الرواتب الأساسية</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {new Intl.NumberFormat('ar-SA').format(companyStats.totalSalaries)} {currency}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-xs text-emerald-800 block">إجمالي العمولات</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    +{new Intl.NumberFormat('ar-SA').format(companyStats.totalCommissions)} {currency}
                  </span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-xs text-rose-800 block">إجمالي الخصومات</span>
                  <span className="text-base font-black text-rose-700 font-mono">
                    -{new Intl.NumberFormat('ar-SA').format(companyStats.totalDeductions)} {currency}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs">
                  <span className="text-xs text-slate-300 block">صافي الأرصدة المتبقية</span>
                  <span className="text-base font-black text-white font-mono">
                    {new Intl.NumberFormat('ar-SA').format(companyStats.totalRemainingBalance)} {currency}
                  </span>
                </div>
              </div>

              {/* Detailed Table for Employees */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900">
                  كشف استحقاقات وأرصدة الموظفين المعتمدين
                </h3>

                <table className="w-full text-right text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">الموظف والمسمى</th>
                      <th className="p-2.5">الراتب الأساسي</th>
                      <th className="p-2.5">العمولات (+)</th>
                      <th className="p-2.5">السحوبات (-)</th>
                      <th className="p-2.5">المصروفات (-)</th>
                      <th className="p-2.5 font-black text-slate-900">الرصيد المتبقي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {activeEmployees.map((emp) => {
                      const s = calculateEmployeeSummary(emp, transactions);
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-sans font-bold text-slate-900">
                            {emp.name} <span className="text-[10px] text-slate-400 font-normal">({emp.role})</span>
                          </td>
                          <td className="p-2.5 font-bold text-slate-800">
                            {new Intl.NumberFormat('ar-SA').format(s.basicSalary)}
                          </td>
                          <td className="p-2.5 text-emerald-600 font-bold">
                            +{new Intl.NumberFormat('ar-SA').format(s.totalCommissions)}
                          </td>
                          <td className="p-2.5 text-amber-600 font-bold">
                            -{new Intl.NumberFormat('ar-SA').format(s.totalWithdrawals)}
                          </td>
                          <td className="p-2.5 text-rose-600 font-bold">
                            -{new Intl.NumberFormat('ar-SA').format(s.totalExpenses)}
                          </td>
                          <td className="p-2.5 font-black text-slate-900 text-sm">
                            {new Intl.NumberFormat('ar-SA').format(s.remainingBalance)} {currency}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signatures & Official Stamp Footer */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-800 mb-6">إعداد المحاسب / مسؤول النظام</p>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto" />
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-6">مراجعة الموارد البشرية</p>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto" />
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-6">اعتماد المدير العام</p>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto" />
            </div>
          </div>

          {/* Document System Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <div>
              تطبيق حسابي المالي • تطوير المطور أبو غيث النجار 2026 • 0570936035
            </div>
            <div className="font-mono">
              صفحة 1 من 1 • تم استخراج الوثيقة إلكترونياً
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
