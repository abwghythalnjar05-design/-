import { Employee, FinancialSummary, Transaction } from '../types';

export function calculateEmployeeSummary(
  employee: Employee,
  transactions: Transaction[]
): FinancialSummary {
  const activeTx = transactions.filter(
    (t) => t.employeeId === employee.id && t.status === 'active'
  );

  const totalCommissions = activeTx
    .filter((t) => t.type === 'commission')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = activeTx
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = activeTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const basicSalary = employee.basicSalary;
  const totalIncome = basicSalary + totalCommissions;
  const totalDeductions = totalWithdrawals + totalExpenses;
  const remainingBalance = totalIncome - totalDeductions;

  return {
    basicSalary,
    totalCommissions,
    totalIncome,
    totalWithdrawals,
    totalExpenses,
    totalDeductions,
    remainingBalance,
  };
}

export function calculateCompanySummary(
  employees: Employee[],
  transactions: Transaction[]
) {
  const activeEmployees = employees.filter((e) => e.status === 'active');

  let totalSalaries = 0;
  let totalCommissions = 0;
  let totalWithdrawals = 0;
  let totalExpenses = 0;
  let totalIncome = 0;
  let totalDeductions = 0;
  let totalRemainingBalance = 0;

  activeEmployees.forEach((emp) => {
    const summary = calculateEmployeeSummary(emp, transactions);
    totalSalaries += summary.basicSalary;
    totalCommissions += summary.totalCommissions;
    totalWithdrawals += summary.totalWithdrawals;
    totalExpenses += summary.totalExpenses;
    totalIncome += summary.totalIncome;
    totalDeductions += summary.totalDeductions;
    totalRemainingBalance += summary.remainingBalance;
  });

  return {
    employeeCount: activeEmployees.length,
    totalEmployees: employees.length,
    totalSalaries,
    totalCommissions,
    totalWithdrawals,
    totalExpenses,
    totalIncome, // Total Entitlements (إجمالي المستحقات)
    totalDeductions,
    totalRemainingBalance,
  };
}
