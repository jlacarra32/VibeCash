import { Platform, Share } from 'react-native';
import { toLocalDateKey } from './dates';

/**
 * Copia de seguridad de los datos del usuario en un archivo .json.
 * Guarda los mismos valores y claves que usa el almacenamiento de la app,
 * sin transformarlos, para poder restaurarlos tal cual más adelante.
 */

const BACKUP_FORMAT = 1;

export const buildBackup = ({ transactions, userName, categories, incomeCategories }) => ({
  app: 'VibeCash',
  format: BACKUP_FORMAT,
  exportedAt: new Date().toISOString(),
  data: {
    user_transactions: transactions,
    user_name: userName,
    user_categories: categories,
    user_income_categories: incomeCategories,
  },
});

/**
 * Entrega la copia al usuario. Devuelve 'shared', 'downloaded' o 'cancelled'.
 * - Móvil web (iPhone/Android): menú de compartir del sistema, desde el que se
 *   puede "Guardar en Archivos", mandar por WhatsApp, correo, etc. Hay que
 *   llamarlo directamente desde el toque del botón (sin esperas antes).
 * - Ordenador: descarga normal del archivo.
 */
export const exportBackup = async (state) => {
  const json = JSON.stringify(buildBackup(state), null, 2);
  const fileName = `vibecash-copia-${toLocalDateKey(new Date())}.json`;

  if (Platform.OS !== 'web') {
    const res = await Share.share({ title: fileName, message: json });
    return res.action === Share.dismissedAction ? 'cancelled' : 'shared';
  }

  const file = typeof File !== 'undefined'
    ? new File([json], fileName, { type: 'application/json' })
    : null;

  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Copia de VibeCash' });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      // Si compartir falla por otro motivo, se intenta la descarga normal
    }
  }

  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
};

/**
 * Abre el selector de archivos y devuelve el texto del archivo elegido,
 * o null si se cancela. Solo en web (no hay selector instalado en nativo).
 * Sin filtro "accept": en iPhone, filtrar por .json a veces deja los
 * archivos en gris; el contenido se valida después.
 */
export const pickBackupFile = () => new Promise((resolve, reject) => {
  if (Platform.OS !== 'web') {
    reject(new Error('unsupported'));
    return;
  }
  const input = document.createElement('input');
  input.type = 'file';
  input.style.display = 'none';
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.remove();
    if (!file) { resolve(null); return; }
    try { resolve(await file.text()); } catch (e) { reject(e); }
  });
  input.addEventListener('cancel', () => { input.remove(); resolve(null); });
  document.body.appendChild(input);
  input.click();
});

const isCategoryList = (v) => Array.isArray(v) && v.every(c => c && typeof c.id === 'string');

/**
 * Comprueba que el texto es una copia válida de VibeCash.
 * Devuelve la copia o null si el archivo no sirve. No toca ningún dato.
 */
export const parseBackup = (text) => {
  let backup;
  try { backup = JSON.parse(text); } catch (_e) { return null; }
  if (!backup || backup.app !== 'VibeCash' || !backup.data) return null;
  const d = backup.data;
  if (!Array.isArray(d.user_transactions)) return null;
  if (!d.user_transactions.every(t => t && typeof t === 'object' && t.id != null)) return null;
  if (d.user_categories != null && !isCategoryList(d.user_categories)) return null;
  if (d.user_income_categories != null && !isCategoryList(d.user_income_categories)) return null;
  if (d.user_name != null && typeof d.user_name !== 'string') return null;
  return backup;
};
