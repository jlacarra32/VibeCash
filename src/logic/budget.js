import { calculateCashFlow } from './cashFlow.js';

/**
 * Presupuesto mensual opcional: un total y/o un límite por categoría de gasto.
 *   { monthly: number | null, categories: { [categoría]: number } }
 * Se compara con lo que te cuesta de verdad cada gasto este mes (neto de lo
 * que te devuelven), igual que el resto de la app.
 */
export const EMPTY_BUDGETS = { monthly: null, categories: {} };

const positive = (n) => typeof n === 'number' && isFinite(n) && n > 0;

/** Devuelve una copia válida de lo guardado (descarta valores incorrectos). */
export const normalizeBudgets = (value) => {
  const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const categories = {};
  if (v.categories && typeof v.categories === 'object' && !Array.isArray(v.categories)) {
    for (const [id, limit] of Object.entries(v.categories)) {
      if (positive(limit)) categories[id] = limit;
    }
  }
  return { monthly: positive(v.monthly) ? v.monthly : null, categories };
};

export const hasBudgets = (budgets) => {
  const b = normalizeBudgets(budgets);
  return b.monthly != null || Object.keys(b.categories).length > 0;
};

/** ok: < 80 % · warn: 80–100 % · over: te has pasado. */
export const budgetLevel = (ratio) => (ratio > 1 ? 'over' : ratio >= 0.8 ? 'warn' : 'ok');

const line = (limit, spent) => {
  const ratio = spent / limit;
  return { limit, spent, remaining: limit - spent, ratio, level: budgetLevel(ratio) };
};

/**
 * Estado del presupuesto del mes de `now`. categoryIds (opcional) limita las
 * categorías a las que existen ahora. Las categorías salen de más a menos
 * gastado respecto a su límite.
 */
export const budgetStatus = (budgets, transactions, now = new Date(), categoryIds) => {
  const b = normalizeBudgets(budgets);
  const flow = calculateCashFlow(transactions || [], 'month', now);
  const total = b.monthly != null ? line(b.monthly, flow.totalExpenseNet) : null;
  const categories = Object.entries(b.categories)
    .filter(([id]) => !categoryIds || categoryIds.includes(id))
    .map(([id, limit]) => ({ id, ...line(limit, flow.categoryTotalsNet[id] || 0) }))
    .sort((a, c) => c.ratio - a.ratio);
  return { total, categories };
};
