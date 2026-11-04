import test from 'node:test';
import assert from 'node:assert/strict';
import { toLocalDateKey, fromLocalDateKey, isValidDate } from '../src/logic/dates.js';
import { formatMoney } from '../src/logic/format.js';

test('toLocalDateKey usa el día local, no el UTC', () => {
  assert.equal(toLocalDateKey(new Date(2026, 10, 4, 0, 30)), '2026-11-04');
  assert.equal(toLocalDateKey('basura'), null);
});

test('fromLocalDateKey ida y vuelta', () => {
  assert.equal(toLocalDateKey(fromLocalDateKey('2026-02-28')), '2026-02-28');
  assert.equal(fromLocalDateKey('2026-2-8'), null);
});

test('isValidDate', () => {
  assert.equal(isValidDate('2026-11-04T10:00:00.000Z'), true);
  assert.equal(isValidDate(undefined), false);
});

test('formatMoney', () => {
  assert.equal(formatMoney(1234.5).replace(/\s/g, ' '), '1.234,50 €');
  assert.equal(formatMoney(-5).replace(/\s/g, ' '), '−5,00 €');
  assert.equal(formatMoney(0, { sign: 'always' }).replace(/\s/g, ' '), '0,00 €');
});
