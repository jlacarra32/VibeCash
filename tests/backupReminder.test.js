import test from 'node:test';
import assert from 'node:assert/strict';
import { isBackupDue } from '../src/logic/backupReminder.js';

const DAY = 86400000;
const now = Date.UTC(2026, 10, 4);

test('sin movimientos nunca avisa', () => {
  assert.equal(isBackupDue({ lastBackupAt: null, transactionCount: 0, now }), false);
});
test('nunca exportó: avisa solo con algo de contenido', () => {
  assert.equal(isBackupDue({ lastBackupAt: null, transactionCount: 2, now }), false);
  assert.equal(isBackupDue({ lastBackupAt: null, transactionCount: 5, now }), true);
});
test('exportó hace poco: no avisa; hace mucho: sí', () => {
  assert.equal(isBackupDue({ lastBackupAt: now - 3 * DAY, transactionCount: 50, now }), false);
  assert.equal(isBackupDue({ lastBackupAt: now - 15 * DAY, transactionCount: 50, now }), true);
});
