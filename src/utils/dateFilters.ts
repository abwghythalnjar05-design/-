import { FilterPeriod, Transaction } from '../types';

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: FilterPeriod,
  customStart?: string,
  customEnd?: string
): Transaction[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Helper to format Date to YYYY-MM-DD
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  switch (period) {
    case 'today': {
      return transactions.filter((t) => t.date === todayStr);
    }
    case 'this_week': {
      // Start of week (Sunday or Saturday - let's do 7 days back or start of Sunday)
      const d = new Date(now);
      const day = d.getDay(); // 0 is Sunday
      const diff = d.getDate() - day;
      const startOfWeek = new Date(d.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      const startStr = formatYMD(startOfWeek);
      return transactions.filter((t) => t.date >= startStr && t.date <= todayStr);
    }
    case 'this_month': {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      return transactions.filter((t) => t.date.startsWith(prefix));
    }
    case 'last_month': {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = prevMonthDate.getFullYear();
      const month = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      return transactions.filter((t) => t.date.startsWith(prefix));
    }
    case 'last_3_months': {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const startStr = formatYMD(threeMonthsAgo);
      return transactions.filter((t) => t.date >= startStr);
    }
    case 'custom': {
      if (!customStart && !customEnd) return transactions;
      return transactions.filter((t) => {
        if (customStart && t.date < customStart) return false;
        if (customEnd && t.date > customEnd) return false;
        return true;
      });
    }
    default:
      return transactions;
  }
}
