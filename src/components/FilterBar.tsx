import React from 'react';
import { FilterPeriod, Employee } from '../types';
import { Calendar, Filter, User, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  selectedPeriod: FilterPeriod;
  onSelectPeriod: (period: FilterPeriod) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  selectedEmployeeId: string; // 'all' or specific employeeId
  onSelectEmployeeId: (empId: string) => void;
  employees: Employee[];
  isManager: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedPeriod,
  onSelectPeriod,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  selectedEmployeeId,
  onSelectEmployeeId,
  employees,
  isManager,
}) => {
  const periods: { id: FilterPeriod; label: string }[] = [
    { id: 'today', label: 'اليوم' },
    { id: 'this_week', label: 'هذا الأسبوع' },
    { id: 'this_month', label: 'هذا الشهر' },
    { id: 'last_month', label: 'الشهر السابق' },
    { id: 'last_3_months', label: 'آخر 3 أشهر' },
    { id: 'custom', label: 'فترة مخصصة' },
  ];

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 ml-1 hidden sm:inline flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            الفترة:
          </span>
          {periods.map((p) => {
            const isActive = selectedPeriod === p.id;
            return (
              <button
                key={p.id}
                id={`filter-period-${p.id}`}
                type="button"
                onClick={() => onSelectPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Employee Filter (For Manager) or Reset */}
        <div className="flex items-center gap-2">
          {isManager && (
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                id="filter-employee-select"
                value={selectedEmployeeId}
                onChange={(e) => onSelectEmployeeId(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="all">جميع الموظفين (المجموع)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {(selectedPeriod !== 'this_month' || (isManager && selectedEmployeeId !== 'all')) && (
            <button
              onClick={() => {
                onSelectPeriod('this_month');
                if (isManager) onSelectEmployeeId('all');
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              title="إعادة التصفية الافتراضية (هذا الشهر)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Inputs if selectedPeriod === 'custom' */}
      {selectedPeriod === 'custom' && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-slate-700">من تاريخ:</span>
          <input
            id="custom-start-date"
            type="date"
            value={customStartDate}
            onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:border-emerald-500"
          />

          <span className="font-bold text-slate-700">إلى تاريخ:</span>
          <input
            id="custom-end-date"
            type="date"
            value={customEndDate}
            onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      )}
    </div>
  );
};
