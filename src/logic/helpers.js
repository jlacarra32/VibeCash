import { THEME } from '../constants/theme';
import { toLocalDateKey } from './dates';

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

// Colores de la paleta antigua (Tailwind) -> su equivalente apagado.
// Las categorías guardadas conservan su color original; solo cambia cómo se pinta.
const LEGACY_COLOR_MAP = {
  '#F97316': '#B5562F', // naranja -> terracota
  '#EC4899': '#9E4A6B', // rosa -> ciruela rosada
  '#3B82F6': '#3F5E7A', // azul -> azul pizarra
  '#10B981': '#4F7A5A', // esmeralda -> salvia
  '#94A3B8': '#8A8272', // gris pizarra -> arena
  '#8B5CF6': '#6A4E7E', // violeta -> ciruela
  '#F43F5E': '#A34A45', // rosa fuerte -> teja
  '#F59E0B': '#B0832A', // ámbar -> ocre
  '#64748B': '#5F5B52', // gris -> grafito
  '#06B6D4': '#3E7C7E', // cian -> petróleo
  '#84CC16': '#7A8A3A', // lima -> oliva
};

/** Color con el que se pinta una categoría (convierte los colores antiguos). */
export const displayColor = (hex) => {
  if (typeof hex !== 'string') return THEME.colors.textSecondary;
  return LEGACY_COLOR_MAP[hex.toUpperCase()] || hex;
};

/** Copia de las categorías con el color de pintado; no modifica lo guardado. */
export const withDisplayColors = (categories) =>
  (categories || []).map(c => ({ ...c, color: displayColor(c.color) }));

/**
 * Agrupa movimientos (ya ordenados) por día local:
 * [{ key: 'YYYY-MM-DD', items: [...] }, ...] conservando el orden.
 */
export const groupByDay = (transactions) => {
  const groups = [];
  const byKey = {};
  (transactions || []).forEach(t => {
    const key = toLocalDateKey(t.date) || 'sin-fecha';
    if (!byKey[key]) {
      byKey[key] = { key, items: [] };
      groups.push(byKey[key]);
    }
    byKey[key].items.push(t);
  });
  return groups;
};
