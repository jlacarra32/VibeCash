/**
 * Utilidades de fecha en HORA LOCAL.
 * Las fechas se guardan como ISO (UTC), pero el "día" de un movimiento
 * es el día local del usuario. Usar toISOString().split('T')[0] da el
 * día UTC, que en España se desplaza al día anterior entre las 00:00 y las 02:00.
 */

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' del día local de una fecha (Date o string ISO). */
export const toLocalDateKey = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Convierte 'YYYY-MM-DD' en un Date local a mediodía (evita saltos de día). */
export const fromLocalDateKey = (key) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
};

/** true si el valor es una fecha válida. */
export const isValidDate = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  return !isNaN(d.getTime());
};
