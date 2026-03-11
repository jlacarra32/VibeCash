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
 * Obtiene el color de una categoría por su ID y tipo.
 */
export const getCategoryColor = (catId, type, categories, incomeCategories) => {
  const list = (type === 'income' ? incomeCategories : categories) || [];
  const cat = list.find(c => c.id === catId);
  return cat ? cat.color : THEME.colors.textSecondary;
};
