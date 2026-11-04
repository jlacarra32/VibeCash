// Datos "de usuario antiguo": movimientos tal y como los guardan versiones previas
// (algunos sin paymentMethod, uno sin fecha, compartidos con devolución).
export const OLD_USER_TRANSACTIONS = [
  { id: '1', description: 'Nómina', amount: 1500, isShared: false, myPart: 1500, refundAmount: 0, type: 'income', category: 'Ingreso', date: '2026-11-01T09:00:00.000Z' },
  { id: '2', description: 'Cena con amigos', amount: 80, isShared: true, myPart: 20, refundAmount: 60, type: 'expense', category: 'Comida', date: '2026-11-02T20:00:00.000Z' },
  { id: '3', description: 'Gasolina', amount: 45.5, isShared: false, myPart: 45.5, refundAmount: 0, type: 'expense', category: 'Transporte', date: '2026-11-03T08:00:00.000Z', paymentMethod: 'card' },
  { id: '4', description: 'Sin fecha', amount: 10, type: 'expense', category: 'Comida' },
  { id: '5', description: 'Año pasado', amount: 100, isShared: false, myPart: 100, refundAmount: 0, type: 'expense', category: 'Comida', date: '2025-06-10T10:00:00.000Z', paymentMethod: 'cash' },
];
