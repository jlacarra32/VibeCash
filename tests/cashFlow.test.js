import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCashFlow, getPeriodRange, expenseBetween, getPeriodBuckets } from '../src/logic/cashFlow.js';
import { OLD_USER_TRANSACTIONS as TXS } from './fixtures.js';

test('"all" cuenta todo, y el gasto resta lo que te devuelven', () => {
  const r = calculateCashFlow(TXS, 'all');
  assert.equal(r.totalIncome, 1500);
  assert.equal(r.totalExpense, 80 + 45.5 + 10 + 100);
  assert.equal(r.totalRefunds, 60);
  assert.equal(r.totalExpenseNet, 80 + 45.5 + 10 + 100 - 60);
  assert.equal(r.netBalance, 1500 - r.totalExpenseNet);
});

test('reparto por forma de pago: sin indicar queda en "none"', () => {
  const r = calculateCashFlow(TXS, 'all');
  assert.equal(r.paymentTotals.expense.card, 45.5);
  assert.equal(r.paymentTotals.expense.cash, 100);
  assert.equal(r.paymentTotals.expense.none, 90);
});

test('getPeriodRange: semana empieza en lunes', () => {
  const { start, end } = getPeriodRange('week', 0, new Date(2026, 10, 4, 12)); // miércoles 4-nov-2026
  assert.equal(start.getDay(), 1);
  assert.equal(start.getDate(), 2);
  assert.equal(end.getDate(), 8);
});

test('getPeriodRange: mes y año con desplazamiento', () => {
  const m = getPeriodRange('month', -1, new Date(2026, 0, 15));
  assert.equal(m.start.getFullYear(), 2025);
  assert.equal(m.start.getMonth(), 11);
  assert.equal(m.end.getDate(), 31);
  assert.equal(getPeriodRange('year', 0, new Date(2026, 5, 1)).start.getFullYear(), 2026);
  assert.equal(getPeriodRange('all'), null);
});

test('expenseBetween: neto y bruto', () => {
  const s = new Date('2026-11-01T00:00:00Z');
  const e = new Date('2026-11-30T23:59:59Z');
  assert.equal(expenseBetween(TXS, s, e, true), 20 + 45.5);
  assert.equal(expenseBetween(TXS, s, e, false), 80 + 45.5);
});

test('getPeriodBuckets: 7 días en semana, 12 meses en año', () => {
  assert.equal(getPeriodBuckets('week').length, 7);
  assert.equal(getPeriodBuckets('year').length, 12);
  assert.equal(getPeriodBuckets('all').length, 12);
});

test('no modifica el array original', () => {
  const copy = JSON.stringify(TXS);
  calculateCashFlow(TXS, 'month');
  assert.equal(JSON.stringify(TXS), copy);
});
