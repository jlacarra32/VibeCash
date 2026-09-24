import { THEME } from '../constants/theme';

/**
 * Obtiene el icono de una categoría por su ID y tipo.
 * Evita duplicar esta lógica en cada pantalla.
 */
export const getCategoryIcon = (catId, type, categories, incomeCategories) => {
  const list = (type === 'income' ? incomeCategories : categories) || [];
  const cat = list.find(c => c.id === catId);
  return cat ? cat.icon : (type === 'income' ? 'cash-outline' : 'cart-outline');
};

/**
 * Devuelve una COPIA ordenada por fecha, del más reciente al más antiguo.
 * Si dos movimientos tienen la misma fecha, va primero el creado después.
 * No modifica el array original (ni lo guardado).
 */
export const sortByDateDesc = (transactions) => {
  const time = (t) => {
    const ms = new Date(t.date).getTime();
    return isNaN(ms) ? 0 : ms;
  };
  return (transactions || [])
    .map((t, index) => ({ t, index }))
    .sort((a, b) => (time(b.t) - time(a.t)) || (b.index - a.index))
    .map(({ t }) => t);
};

/**
 * Obtiene el color de una categoría por su ID y tipo.
 */
export const getCategoryColor = (catId, type, categories, incomeCategories) => {
  const list = (type === 'income' ? incomeCategories : categories) || [];
  const cat = list.find(c => c.id === catId);
  return cat ? cat.color : (type === 'income' ? THEME.colors.success : THEME.colors.textSecondary);
};
