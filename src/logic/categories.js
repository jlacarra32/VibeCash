/**
 * Renombrar una categoría actualiza, en una sola operación, la lista de
 * categorías y TODOS los elementos que la usan por nombre (movimientos y, si
 * existen, recurrentes y presupuestos). No modifica el estado recibido.
 *
 * kind: 'expense' | 'income'. Devuelve { state } o { error }, donde error es
 * 'empty' | 'same' | 'missing' | 'duplicate'.
 */
export const GENERAL_INCOME = 'Ingreso'; // categoría general de ingresos (siempre existe)

export const renameCategoryInState = (state, kind, oldId, rawNewId) => {
  const newId = (rawNewId || '').trim();
  if (!newId) return { error: 'empty' };
  if (newId === oldId) return { error: 'same' };

  const isIncome = kind === 'income';
  const listKey = isIncome ? 'incomeCategories' : 'categories';
  const list = state[listKey] || [];
  if (!list.some(c => c.id === oldId)) return { error: 'missing' };

  const lower = newId.toLowerCase();
  const taken = list.some(c => c.id !== oldId && c.id.toLowerCase() === lower)
    || (isIncome && lower === GENERAL_INCOME.toLowerCase());
  if (taken) return { error: 'duplicate' };

  const type = isIncome ? 'income' : 'expense';
  const typeOf = (t) => (t.type === 'income' ? 'income' : 'expense');
  const retarget = (item) => (typeOf(item) === type && item.category === oldId ? { ...item, category: newId } : item);

  const next = { ...state };
  next[listKey] = list.map(c => (c.id === oldId ? { ...c, id: newId } : c));
  next.transactions = (state.transactions || []).map(retarget);
  if (state.recurring) next.recurring = state.recurring.map(retarget);
  if (!isIncome && state.budgets && state.budgets.categories && oldId in state.budgets.categories) {
    const { [oldId]: value, ...rest } = state.budgets.categories;
    next.budgets = { ...state.budgets, categories: { ...rest, [newId]: value } };
  }
  return { state: next };
};
