/**
 * Formato de importes y fechas en español.
 */

const moneyFormatters = {};
const getMoneyFormatter = (decimals) => {
  if (!moneyFormatters[decimals]) {
    moneyFormatters[decimals] = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: 'always', // "1.500 €" también con 4 cifras
    });
  }
  return moneyFormatters[decimals];
};

/**
 * 1234.5 -> "1.234,50 €"
 * sign: 'auto' (solo "−" si es negativo), 'always' ("+" o "−"), 'never'.
 * decimals: 2 por defecto.
 */
export const formatMoney = (value, { sign = 'auto', decimals = 2 } = {}) => {
  const n = Number(value) || 0;
  const body = getMoneyFormatter(decimals).format(Math.abs(n));
  const rounded = Number(Math.abs(n).toFixed(decimals));
  if (sign === 'never' || rounded === 0) return body;
  if (n < 0) return `−${body}`;
  return sign === 'always' ? `+${body}` : body;
};

/** Fecha corta: "24 sept" */
export const formatDateShort = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
};

/** Fecha larga: "24 de septiembre de 2026" */
export const formatDateLong = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** "Hoy", "Ayer" o "lun 22 sept" para una clave 'YYYY-MM-DD'. */
export const formatDayLabel = (dateKey) => {
  const [y, m, d] = (dateKey || '').split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1, 12);
  if (isNaN(date.getTime())) return '';
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const diffDays = Math.round((today - date) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  const opts = { weekday: 'short', day: 'numeric', month: 'short' };
  if (date.getFullYear() !== today.getFullYear()) opts.year = 'numeric';
  const label = date.toLocaleDateString('es-ES', opts).replace(/\./g, '').replace(',', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Nombre del mes con mayúscula: "Septiembre" */
export const monthName = (monthIndex) => {
  const s = new Date(2000, monthIndex, 1).toLocaleDateString('es-ES', { month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
