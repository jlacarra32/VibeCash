import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBudgets, hasBudgets, budgetLevel, budgetStatus } from '../src/logic/budget.js';

const now = new Date(2026, 10, 15, 12);
const d = (m, day) => new Date(2026, m, day, 12).toISOString();
const TXS = [
  { id: '1', type: 'income', amount: 1500, category: 'Ingreso', date: d(10, 1) },
  { id: '2', type: 'expense', amount: 80, refundAmount: 60, category: 'Comida', date: d(10, 2) },   // neto 20
  { id: '3', type: 'expense', amount: 45.5, refundAmount: 0, category: 'Transporte', date: d(10, 3) },
  { id: '4', type: 'expense', amount: 300, category: 'Comida', date: d(9, 20) },                    // mes anterior
  { id: '5', type: 'expense', amount: 10, category: 'Comida' },                                       // sin fecha
];

test('normalizeBudgets descarta valores inválidos', () => {
  assert.deepEqual(normalizeBudgets(null), { monthly: null, categories: {} });
  assert.deepEqual(normalizeBudgets({ monthly: -5, categories: { A: 0, B: 'x', C: 30 } }), { monthly: null, categories: { C: 30 } });
  assert.deepEqual(normalizeBudgets([1, 2]), { monthly: null, categories: {} });
});

test('hasBudgets', () => {
  assert.equal(hasBudgets(null), false);
  assert.equal(hasBudgets({ monthly: null, categories: {} }), false);
  assert.equal(hasBudgets({ monthly: 500, categories: {} }), true);
  assert.equal(hasBudgets({ monthly: null, categories: { Comida: 50 } }), true);
});

test('niveles: ok, warn (80 %) y over (>100 %)', () => {
  assert.equal(budgetLevel(0.79), 'ok');
  assert.equal(budgetLevel(0.8), 'warn');
  assert.equal(budgetLevel(1), 'warn');
  assert.equal(budgetLevel(1.01), 'over');
});

test('solo cuenta el gasto neto del mes (sin mes anterior ni movimientos sin fecha)', () => {
  const s = budgetStatus({ monthly: 100, categories: { Comida: 20, Transporte: 100 } }, TXS, now);
  assert.equal(s.total.spent, 65.5);
  assert.equal(s.total.remaining, 34.5);
  assert.equal(s.total.level, 'ok');
  const comida = s.categories.find(c => c.id === 'Comida');
  assert.equal(comida.spent, 20);
  assert.equal(comida.level, 'warn'); // 100 % del límite
  assert.deepEqual(s.categories.map(c => c.id), ['Comida', 'Transporte']); // más gastado primero
});

test('pasarse del límite da restante negativo', () => {
  const s = budgetStatus({ monthly: 50, categories: {} }, TXS, now);
  assert.equal(s.total.level, 'over');
  assert.ok(s.total.remaining < 0);
});

test('categorías que ya no existen se omiten; sin total devuelve null', () => {
  const s = budgetStatus({ monthly: null, categories: { Comida: 50, Vieja: 10 } }, TXS, now, ['Comida', 'Transporte']);
  assert.equal(s.total, null);
  assert.deepEqual(s.categories.map(c => c.id), ['Comida']);
});
