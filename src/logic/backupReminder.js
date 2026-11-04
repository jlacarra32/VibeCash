/**
 * ¿Toca recordar al usuario que guarde una copia?
 * - Sin movimientos no hay nada que proteger.
 * - Si nunca ha exportado, se avisa cuando ya hay algo de contenido.
 * - Si exportó hace más de `maxDays` días, se avisa.
 */
export const BACKUP_MAX_DAYS = 14;
export const BACKUP_MIN_TRANSACTIONS = 5;

export const isBackupDue = ({ lastBackupAt, transactionCount, now = Date.now(), maxDays = BACKUP_MAX_DAYS }) => {
  if (!transactionCount) return false;
  if (typeof lastBackupAt !== 'number' || !isFinite(lastBackupAt)) {
    return transactionCount >= BACKUP_MIN_TRANSACTIONS;
  }
  return now - lastBackupAt > maxDays * 86400000;
};
