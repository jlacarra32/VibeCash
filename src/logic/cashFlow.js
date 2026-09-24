export const calculateCashFlow = (transactions, filterType = 'all') => {
  let totalIncomeRaw = 0; // Ingresos puros (sueldo, etc)
  let totalExpenseRaw = 0; // Gasto total que sale de la cuenta
  let totalRefunds = 0; // Lo que te deben/devuelven
  let categoryTotalsRaw = {};
  let categoryTotalsNet = {};
  
  const now = new Date();

  // Filter Transactions by Time Period
  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    if (!t.date) return true;

    const txDate = new Date(t.date);
    if (filterType === 'week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - (day === 0 ? 6 : day - 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      return txDate >= monday && txDate <= sunday;
    }
    if (filterType === 'month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    if (filterType === 'year') {
      return txDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const processedTransactions = filteredTransactions.map(t => {
    let amount = Number(t.amount) || 0;
    const isIncome = t.type === 'income';
    const refund = Number(t.refundAmount) || 0;
    
    if (isIncome) {
      totalIncomeRaw += amount;
    } else {
      totalExpenseRaw += amount;
      totalRefunds += refund;
      if (t.category) {
        categoryTotalsRaw[t.category] = (categoryTotalsRaw[t.category] || 0) + amount;
        categoryTotalsNet[t.category] = (categoryTotalsNet[t.category] || 0) + (amount - refund);
      }
    }

    return {
      ...t,
      displayAmount: isIncome ? `+ ${amount.toFixed(2)}€` : `- ${amount.toFixed(2)}€`,
    };
  });

  return {
    transactions: processedTransactions,
    totalIncome: totalIncomeRaw,
    totalExpense: totalExpenseRaw,
    totalRefunds: totalRefunds,
    totalExpenseNet: totalExpenseRaw - totalRefunds,
    netBalance: totalIncomeRaw - (totalExpenseRaw - totalRefunds),
    categoryTotals: categoryTotalsRaw,
    categoryTotalsNet: categoryTotalsNet
  };
};

// ─── Periodos (para comparar y para las barras de Análisis) ─────────────────

const startOfWeek = (d) => {
  const m = new Date(d);
  const day = m.getDay();
  m.setDate(m.getDate() - (day === 0 ? 6 : day - 1));
  m.setHours(0, 0, 0, 0);
  return m;
};

/**
 * Inicio y fin del periodo ('week' | 'month' | 'year'), desplazado `offset`
 * periodos (−1 = el anterior). Para 'all' devuelve null.
 */
export const getPeriodRange = (filter, offset = 0, now = new Date()) => {
  if (filter === 'week') {
    const start = startOfWeek(now);
    start.setDate(start.getDate() + offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (filter === 'year') {
    const start = new Date(now.getFullYear() + offset, 0, 1);
    const end = new Date(now.getFullYear() + offset, 11, 31, 23, 59, 59, 999);
    return { start, end };
  }
  return null;
};

/** Gasto entre dos fechas. net = true descuenta lo que te devuelven. */
export const expenseBetween = (transactions, start, end, net = true) =>
  (transactions || []).reduce((sum, t) => {
    if (t.type === 'income' || !t.date) return sum;
    const d = new Date(t.date);
    if (d < start || d > end) return sum;
    const amount = Number(t.amount) || 0;
    const refund = net ? (Number(t.refundAmount) || 0) : 0;
    return sum + (amount - refund);
  }, 0);

/**
 * Tramos para la gráfica de barras del periodo:
 * semana -> 7 días, mes -> cada día, año / todo -> 12 meses.
 */
export const getPeriodBuckets = (filter, now = new Date()) => {
  const buckets = [];
  if (filter === 'week' || filter === 'month') {
    const { start, end } = getPeriodRange(filter, 0, now);
    const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    for (let d = new Date(start), i = 0; d <= end; d.setDate(d.getDate() + 1), i++) {
      const s = new Date(d); s.setHours(0, 0, 0, 0);
      const e = new Date(d); e.setHours(23, 59, 59, 999);
      buckets.push({ label: filter === 'week' ? weekdays[i] : String(d.getDate()), start: s, end: e });
    }
    return buckets;
  }
  // Año: enero-diciembre del año actual. Todo: últimos 12 meses.
  const letters = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const firstMonth = filter === 'year' ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  for (let i = 0; i < 12; i++) {
    const start = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
    buckets.push({ label: letters[start.getMonth()], start, end });
  }
  return buckets;
};

/** Opciones del selector de periodo (mismo orden en todas las pantallas). */
export const PERIOD_OPTIONS = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
  { key: 'all', label: 'Todo' },
];
