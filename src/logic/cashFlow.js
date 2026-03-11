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
