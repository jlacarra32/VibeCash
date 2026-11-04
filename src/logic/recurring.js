import { toLocalDateKey, fromLocalDateKey } from './dates.js';

/**
 * Movimientos recurrentes (alquiler, suscripciones, nómina…).
 *
 * Una plantilla describe qué se repite y cada cuánto:
 *   { id, type, amount, description, category, paymentMethod?,
 *     frequency: 'weekly'|'monthly'|'yearly',
 *     startDate: 'YYYY-MM-DD'   (primera fecha; las demás se calculan desde ella)
 *     count: nº de repeticiones ya apuntadas (la siguiente es la nº `count`),
 *     active: boolean }
 *
 * Cada movimiento generado tiene un id fijo (`rec_<plantilla>_<fecha>`), así que
 * repetir el proceso nunca crea duplicados, y si el usuario borra uno generado
 * no vuelve a aparecer (el contador `count` ya lo dio por apuntado).
 */
export const FREQUENCIES = [
  { key: 'weekly', label: 'Cada semana' },
  { key: 'monthly', label: 'Cada mes' },
  { key: 'yearly', label: 'Cada año' },
];

const MAX_PER_RUN = 36; // tope por ejecución (p. ej. tras meses sin abrir la app)
const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n) => String(n).padStart(2, '0');
const daysInMonth = (year, month1) => new Date(year, month1, 0).getDate();
const fmt = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

/** Fecha ('YYYY-MM-DD') de la repetición nº k (k = 0 es la primera). */
export const occurrenceAt = (frequency, startDate, k) => {
  const match = KEY_RE.exec(startDate || '');
  if (!match || !Number.isInteger(k) || k < 0) return null;
  const y = Number(match[1]); const m = Number(match[2]); const d = Number(match[3]);
  if (frequency === 'weekly') {
    return toLocalDateKey(new Date(y, m - 1, d + 7 * k, 12));
  }
  if (frequency === 'monthly') {
    const total = (m - 1) + k;
    const yy = y + Math.floor(total / 12);
    const mm = (total % 12) + 1;
    return fmt(yy, mm, Math.min(d, daysInMonth(yy, mm))); // 31 → último día de meses cortos
  }
  if (frequency === 'yearly') {
    const yy = y + k;
    return fmt(yy, m, Math.min(d, daysInMonth(yy, m))); // 29 feb → 28 feb
  }
  return null;
};

export const isValidTemplate = (t) => !!t && typeof t === 'object'
  && typeof t.id === 'string'
  && (t.type === 'expense' || t.type === 'income')
  && Number(t.amount) > 0
  && FREQUENCIES.some(f => f.key === t.frequency)
  && KEY_RE.test(t.startDate || '')
  && Number.isInteger(t.count) && t.count >= 0;

/** Fecha de la próxima repetición pendiente. */
export const nextDueKey = (tpl) => occurrenceAt(tpl.frequency, tpl.startDate, tpl.count);

/** Primer índice cuya fecha es igual o posterior a `key`. */
const firstIndexFrom = (tpl, key) => {
  for (let k = 0; k < 20000; k++) {
    const occ = occurrenceAt(tpl.frequency, tpl.startDate, k);
    if (!occ || occ >= key) return k;
  }
  return 0;
};

/** Plantilla nueva a partir de un movimiento ya apuntado (que es la 1.ª repetición). */
export const templateFromTransaction = (tx, frequency, id) => {
  const tpl = {
    id,
    type: tx.type === 'income' ? 'income' : 'expense',
    amount: Number(tx.amount) || 0,
    description: tx.description || '',
    category: tx.category || '',
    frequency,
    startDate: toLocalDateKey(tx.date),
    count: 1,
    active: true,
  };
  if (tx.paymentMethod) tpl.paymentMethod = tx.paymentMethod;
  return tpl;
};

/** Al reanudar una plantilla en pausa se saltan las repeticiones que pasaron. */
export const resumeTemplate = (tpl, now = new Date()) => ({
  ...tpl,
  active: true,
  count: Math.max(tpl.count, firstIndexFrom(tpl, toLocalDateKey(now))),
});

const buildTransaction = (tpl, key, id) => {
  const amount = Number(tpl.amount);
  const tx = {
    id,
    description: tpl.description || tpl.category || (tpl.type === 'income' ? 'Ingreso' : ''),
    amount,
    isShared: false,
    myPart: amount,
    refundAmount: 0,
    type: tpl.type,
    category: tpl.category,
    date: fromLocalDateKey(key).toISOString(),
    recurringId: tpl.id,
  };
  if (tpl.paymentMethod) tx.paymentMethod = tpl.paymentMethod;
  return tx;
};

/**
 * Calcula qué movimientos tocan hasta hoy (nunca futuros).
 * Devuelve { templates, transactions, changed }; no modifica lo recibido.
 */
export const generateDue = (templates, transactions, now = new Date()) => {
  const todayKey = toLocalDateKey(now);
  const existing = new Set((transactions || []).map(t => t.id));
  const created = [];
  let changed = false;

  const next = (templates || []).map(tpl => {
    if (!isValidTemplate(tpl) || !tpl.active) return tpl;
    let count = tpl.count;
    for (let n = 0; n < MAX_PER_RUN; n++) {
      const key = occurrenceAt(tpl.frequency, tpl.startDate, count);
      if (!key || key > todayKey) break;
      const id = `rec_${tpl.id}_${key}`;
      if (!existing.has(id)) {
        created.push(buildTransaction(tpl, key, id));
        existing.add(id);
      }
      count++;
    }
    if (count === tpl.count) return tpl;
    changed = true;
    return { ...tpl, count };
  });

  return { templates: changed ? next : templates, transactions: created, changed };
};

export const frequencyLabel = (frequency) => {
  const f = FREQUENCIES.find(x => x.key === frequency);
  return f ? f.label.toLowerCase() : '';
};
