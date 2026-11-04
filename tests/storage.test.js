import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../src/logic/storageCore.js';
import { OLD_USER_TRANSACTIONS as TXS } from './fixtures.js';

const makeBackend = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: async (k) => (k in data ? data[k] : null),
    setItem: async (k, v) => { data[k] = v; },
    removeItem: async (k) => { delete data[k]; },
  };
};
const isArray = Array.isArray;

test('datos antiguos se leen idénticos y un guardado posterior no los altera', async () => {
  const be = makeBackend({ user_transactions: JSON.stringify(TXS) });
  const s = createStorage(be);
  const loaded = await s.load('user_transactions', isArray);
  assert.deepEqual(loaded, TXS);
  await s.save('user_transactions', loaded);
  assert.deepEqual(JSON.parse(be.data.user_transactions), TXS);
});

test('clave inexistente devuelve null', async () => {
  const s = createStorage(makeBackend());
  assert.equal(await s.load('user_name'), null);
});

test('JSON corrupto: se aparta en *_corrupt y devuelve null', async () => {
  const be = makeBackend({ user_transactions: '[{"id":"1",' });
  const s = createStorage(be);
  assert.equal(await s.load('user_transactions', isArray), null);
  assert.equal(be.data.user_transactions_corrupt, '[{"id":"1",');
});

test('JSON válido pero con forma incorrecta también se aparta', async () => {
  const be = makeBackend({ user_transactions: '{"a":1}' });
  const s = createStorage(be);
  assert.equal(await s.load('user_transactions', isArray), null);
  assert.equal(be.data.user_transactions_corrupt, '{"a":1}');
});

test('una segunda copia corrupta no pisa la primera', async () => {
  const be = makeBackend({ user_transactions: 'mal2', user_transactions_corrupt: 'mal1' });
  const s = createStorage(be);
  await s.load('user_transactions', isArray);
  assert.equal(be.data.user_transactions_corrupt, 'mal1');
  assert.ok(Object.keys(be.data).some(k => k.startsWith('user_transactions_corrupt_')));
});

test('si leer falla, esa clave no se sobrescribe', async () => {
  const be = makeBackend({ user_transactions: JSON.stringify(TXS) });
  be.getItem = async () => { throw new Error('boom'); };
  let warnings = 0;
  const s = createStorage({ ...be, onSaveError: () => { warnings++; } });
  assert.equal(await s.load('user_transactions', isArray), null);
  assert.equal(await s.save('user_transactions', []), false);
  assert.deepEqual(JSON.parse(be.data.user_transactions), TXS);
  assert.equal(warnings, 1);
});

test('fallo al guardar avisa una sola vez y no lanza', async () => {
  const be = makeBackend();
  be.setItem = async () => { throw new Error('QuotaExceeded'); };
  let warnings = 0;
  const s = createStorage({ ...be, onSaveError: () => { warnings++; } });
  assert.equal(await s.save('a', 1), false);
  assert.equal(await s.save('a', 2), false);
  assert.equal(warnings, 1);
});
