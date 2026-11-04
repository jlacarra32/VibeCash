import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStorage } from './storageCore';
import { showAlert } from './dialogs';

/**
 * Guardado local de la app. En web AsyncStorage usa localStorage con la misma
 * clave, así que los datos que ya hay se leen igual que antes.
 */
const storage = createStorage({
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
  onSaveError: () => showAlert(
    'No se pudo guardar',
    'Tu navegador no deja guardar datos ahora mismo (¿modo privado o sin espacio?). Exporta una copia desde Ajustes para no perder lo que has apuntado.'
  ),
});

export const loadData = storage.load;
export const saveData = storage.save;

/** Borra TODO lo guardado (también las copias *_corrupt). */
export const clearAllData = async () => {
  storage.reset();
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
  await AsyncStorage.clear();
};

/**
 * Pide al navegador que no borre los datos de VibeCash cuando falte espacio o
 * pasen días sin abrirla. Es una petición: el navegador puede ignorarla.
 */
export const requestPersistence = async () => {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }
  } catch (_e) { /* no es crítico */ }
};
