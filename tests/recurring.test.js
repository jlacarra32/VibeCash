import test from 'node:test';
import assert from 'node:assert/strict';
import { occurrenceAt, generateDue, templateFromTransaction, resumeTemplate, isValidTemplate, nextDueKey } from '../src/logic/recurring.js';

const tpl = (over = {}) => ({
  id: 'r1', type: 'expense', amount: 650, description: 'Alquiler', category: 'Casa',
  frequency: 'monthly', startDate: '2026-01-31', count: 1, active: true, ...over,
});
const at = (y, m, d) => new Date(y, m - 1, d, 12);

test('mensual: el día 31 cae en el último día de los meses cortos y vuelve a 31', () => {
  const keys = [0, 1, 2, 3].map(k => occurrenceAt('monthly', '2026-01-31', k));
  assert.deepEqual(keys, ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  assert.equal(occurrenceAt('monthly', '2026-11-15', 2), '2027-01-15'); // cruza de año
});

test('semanal y anual (29 feb → 28 feb en año no bisiesto)', () => {
  assert.equal(occurrenceAt('weekly', '2026-12-28', 1), '2027-01-04');
  assert.equal(occurrenceAt('yearly', '2024-02-29', 1), '2025-02-28');
  assert.equal(occurrenceAt('yearly', '2024-02-29', 4), '2028-02-29');
});

test('genera las repeticiones vencidas hasta hoy y nunca las futuras', () => {
  const r = generateDue([tpl()], [], at(2026, 4, 30));
  assert.deepEqual(r.transactions.map(t => t.id), ['rec_r1_2026-02-28', 'rec_r1_2026-03-31', 'rec_r1_2026-04-30']);
  assert.equal(r.templates[0].count, 4);
  assert.equal(nextDueKey(r.templates[0]), '2026-05-31');
  const t = r.transactions[0];
  assert.equal(t.amount, 650); assert.equal(t.type, 'expense'); assert.equal(t.recurringId, 'r1');
  assert.equal(t.refundAmount, 0); assert.equal(t.myPart, 650); assert.equal(t.isShared, false);
});

test('es idempotente: ejecutarlo dos veces no duplica', () => {
  const first = generateDue([tpl()], [], at(2026, 3, 31));
  const second = generateDue(first.templates, first.transactions, at(2026, 3, 31));
  assert.equal(second.transactions.length, 0);
  assert.equal(second.changed, false);
  assert.equal(second.templates, first.templates);
});

test('si el usuario borra un movimiento generado, no reaparece', () => {
  const first = generateDue([tpl()], [], at(2026, 3, 31));
  const kept = first.transactions.filter(t => t.id !== 'rec_r1_2026-02-28'); // lo borra
  const again = generateDue(first.templates, kept, at(2026, 3, 31));
  assert.equal(again.transactions.length, 0);
});

test('mismo id ya existente (p. ej. importado): no se duplica pero avanza el contador', () => {
  const existing = [{ id: 'rec_r1_2026-02-28' }];
  const r = generateDue([tpl()], existing, at(2026, 2, 28));
  assert.equal(r.transactions.length, 0);
  assert.equal(r.templates[0].count, 2);
});

test('plantillas en pausa o inválidas se ignoran sin romper nada', () => {
  const r = generateDue([tpl({ active: false }), { id: 'x' }, null], [], at(2027, 1, 1));
  assert.equal(r.transactions.length, 0);
  assert.equal(r.changed, false);
});

test('tras mucho tiempo sin abrir, el tope por ejecución limita y la siguiente continúa', () => {
  const t = tpl({ frequency: 'weekly', startDate: '2020-01-06', count: 1 });
  const a = generateDue([t], [], at(2026, 11, 4));
  assert.equal(a.transactions.length, 36);
  const b = generateDue(a.templates, a.transactions, at(2026, 11, 4));
  assert.ok(b.transactions.length > 0);
});

test('plantilla desde un movimiento: el propio movimiento es la 1.ª repetición', () => {
  const tx = { id: '9', type: 'expense', amount: 12.5, description: 'Netflix', category: 'Ocio', paymentMethod: 'card', date: at(2026, 11, 5).toISOString() };
  const t = templateFromTransaction(tx, 'monthly', 'r9');
  assert.equal(t.startDate, '2026-11-05'); assert.equal(t.count, 1); assert.equal(t.paymentMethod, 'card');
  assert.equal(isValidTemplate(t), true);
  assert.equal(generateDue([t], [tx], at(2026, 11, 20)).transactions.length, 0);
  assert.equal(generateDue([t], [tx], at(2026, 12, 5)).transactions.length, 1);
});

test('reanudar salta lo que pasó durante la pausa', () => {
  const paused = tpl({ active: false, count: 1 });
  const resumed = resumeTemplate(paused, at(2026, 6, 10));
  assert.equal(resumed.active, true);
  assert.equal(nextDueKey(resumed), '2026-06-30');
  assert.equal(generateDue([resumed], [], at(2026, 6, 10)).transactions.length, 0);
});

test('no modifica los datos recibidos', () => {
  const t = [tpl()]; const snapshot = JSON.stringify(t);
  generateDue(t, [], at(2026, 6, 10));
  assert.equal(JSON.stringify(t), snapshot);
});
