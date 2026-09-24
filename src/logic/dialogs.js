import { Alert, Platform } from 'react-native';

/**
 * Diálogos que funcionan en web y móvil.
 * En react-native-web, Alert.alert no hace nada, así que en web
 * se usan window.alert / window.confirm.
 */

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

/** Muestra un aviso simple. */
export const showAlert = (title, message) => {
  if (isWeb) {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};

/** Pide confirmación y ejecuta onConfirm si el usuario acepta. */
export const confirmAction = (title, message, onConfirm, confirmText = 'Aceptar') => {
  if (isWeb) {
    if (window.confirm(message ? `${title}\n\n${message}` : title)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
  }
};
