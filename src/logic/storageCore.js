/**
 * Núcleo del guardado local, sin dependencias de React Native para poder
 * probarlo con Node. `src/logic/storage.js` lo conecta con AsyncStorage.
 *
 * Reglas para no perder datos:
 * - Si un valor guardado no se puede leer como JSON (o no tiene la forma
 *   esperada), NO se borra: se copia tal cual a "<clave>_corrupt" y la app
 *   arranca con los valores por defecto.
 * - Si leer una clave falla (error del almacenamiento), esa clave queda
 *   bloqueada para escritura en esta sesión, así un fallo pasajero nunca
 *   sobrescribe datos buenos con datos vacíos.
 * - Un fallo al guardar se comunica con onSaveError (una vez por sesión).
 */
export const createStorage = ({ getItem, setItem, removeItem, onSaveError }) => {
  let memory = {};
  const blocked = new Set();
  let warned = false;

  const warn = (error) => {
    if (warned) return;
    warned = true;
    try { onSaveError && onSaveError(error); } catch (_e) { /* el aviso nunca debe romper la app */ }
  };

  const quarantine = async (key, raw) => {
    try {
      let target = `${key}_corrupt`;
      if (await getItem(target) != null) target = `${key}_corrupt_${Date.now()}`;
      await setItem(target, raw);
    } catch (_e) { /* si ni siquiera se puede apartar, al menos no se pierde el original hasta que se guarde algo nuevo */ }
  };

  /** Lee y valida una clave. Devuelve el valor o null (sin datos / no válido). */
  const load = async (key, validate) => {
    let raw;
    try {
      raw = await getItem(key);
    } catch (_e) {
      blocked.add(key);
      return memory[key] != null ? JSON.parse(memory[key]) : null;
    }
    if (raw == null || raw === '') {
      return memory[key] != null ? JSON.parse(memory[key]) : null;
    }
    try {
      const value = JSON.parse(raw);
      if (validate && !validate(value)) throw new Error('forma inesperada');
      return value;
    } catch (_e) {
      await quarantine(key, raw);
      return null;
    }
  };

  /** Guarda una clave. Devuelve true si se guardó. */
  const save = async (key, value) => {
    if (blocked.has(key)) {
      warn(new Error(`lectura fallida de ${key}`));
      return false;
    }
    try {
      const json = JSON.stringify(value);
      memory[key] = json;
      await setItem(key, json);
      return true;
    } catch (error) {
      warn(error);
      return false;
    }
  };

  const reset = () => { memory = {}; blocked.clear(); warned = false; };

  return { load, save, reset, removeItem };
};
