import test from 'node:test';
import assert from 'node:assert/strict';
import { renameCategoryInState } from '../src/logic/categories.js';
import { OLD_USER_TRANSACTIONS as TXS } from './fixtures.js';

const base = () => ({
  transactions: TXS,
  categories: [{ id: 'Comida', color: '#B5562F', icon: 'a' }, { id: 'Transporte', color: '#3F5E7A', icon: 'b' }],
  incomeCategories: [{ id: 'Nómina', color: '#4F7A5A', icon: 'c' }],
});

test('renombrar actualiza la lista y todos los movimientos de esa categoría', () => {
  const s = base();
  const r = renameCategoryInState(s, 'expense', 'Comida', 'Restaurantes');
  assert.ok(r.state);
  assert.deepEqual(r.state.categories.map(c => c.id), ['Restaurantes', 'Transporte']);
  assert.equal(r.state.categories[0].color, '#B5562F');
  const comida = TXS.filter(t => t.category === 'Comida');
  assert.ok(comida.length >= 3);
  for (const t of r.state.transactions.filter(t => comida.some(c => c.id === t.id))) assert.equal(t.category, 'Restaurantes');
  // el resto queda idéntico (misma referencia) y el estado original no se toca
  assert.equal(r.state.transactions.find(t => t.id === '3'), TXS.find(t => t.id === '3'));
  assert.equal(TXS.filter(t => t.category === 'Comida').length, comida.length);
  assert.equal(s.categories[0].id, 'Comida');
});

test('no mezcla gastos con ingresos aunque se llamen igual', () => {
  const s = base();
  s.transactions = [
    { id: 'g', type: 'expense', category: 'Extra', amount: 5 },
    { id: 'i', type: 'income', category: 'Extra', amount: 5 },
  ];
  s.categories = [{ id: 'Extra', color: '#000', icon: 'x' }];
  const r = renameCategoryInState(s, 'expense', 'Extra', 'Otros');
  assert.equal(r.state.transactions.find(t => t.id === 'g').category, 'Otros');
  assert.equal(r.state.transactions.find(t => t.id === 'i').category, 'Extra');
});

test('categorías de ingreso: renombra y respeta "Ingreso" como nombre reservado', () => {
  const r = renameCategoryInState(base(), 'income', 'Nómina', 'Sueldo');
  assert.equal(r.state.incomeCategories[0].id, 'Sueldo');
  assert.equal(renameCategoryInState(base(), 'income', 'Nómina', 'ingreso').error, 'duplicate');
});

test('errores: vacío, igual, repetida (sin distinguir mayúsculas) e inexistente', () => {
  assert.equal(renameCategoryInState(base(), 'expense', 'Comida', '   ').error, 'empty');
  assert.equal(renameCategoryInState(base(), 'expense', 'Comida', 'Comida').error, 'same');
  assert.equal(renameCategoryInState(base(), 'expense', 'Comida', 'transporte').error, 'duplicate');
  assert.equal(renameCategoryInState(base(), 'expense', 'Nada', 'Otra').error, 'missing');
});

test('cambiar solo mayúsculas está permitido', () => {
  const r = renameCategoryInState(base(), 'expense', 'Comida', 'comida');
  assert.equal(r.state.categories[0].id, 'comida');
});

test('también mueve recurrentes y presupuestos de la categoría', () => {
  const s = base();
  s.recurring = [{ id: 'r1', type: 'expense', category: 'Comida' }, { id: 'r2', type: 'income', category: 'Comida' }];
  s.budgets = { monthly: 500, categories: { Comida: 120, Transporte: 40 } };
  const r = renameCategoryInState(s, 'expense', 'Comida', 'Restaurantes');
  assert.equal(r.state.recurring[0].category, 'Restaurantes');
  assert.equal(r.state.recurring[1].category, 'Comida');
  assert.deepEqual(r.state.budgets, { monthly: 500, categories: { Transporte: 40, Restaurantes: 120 } });
});
