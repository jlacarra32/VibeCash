import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

/**
 * Aviso breve con "Deshacer". `toast` = { id, message, onUndo } o null.
 * Se cierra solo a los 6 segundos; un aviso nuevo reinicia la cuenta.
 */
const DURATION = 6000;

export default function UndoToast({ toast, onDismiss }) {
  const id = toast ? toast.id : null;
  useEffect(() => {
    if (id == null) return;
    const timer = setTimeout(onDismiss, DURATION);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  if (!toast) return null;
  return (
    <View style={styles.wrap} pointerEvents="box-none" accessibilityLiveRegion="polite">
      <View style={styles.toast}>
        <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
        <TouchableOpacity
          onPress={() => { toast.onUndo(); onDismiss(); }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Deshacer"
        >
          <Text style={styles.undo}>Deshacer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: THEME.layout.gutter,
    right: THEME.layout.gutter,
    bottom: 90,
    zIndex: 2000,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.space.lg,
    width: '100%',
    maxWidth: 520,
    paddingVertical: 14,
    paddingHorizontal: THEME.space.lg,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.ink,
  },
  message: {
    ...THEME.text.small,
    flex: 1,
    color: THEME.colors.onAccent,
  },
  undo: {
    fontFamily: THEME.fonts.strong,
    fontSize: THEME.type.small,
    color: THEME.colors.onAccent,
    textDecorationLine: 'underline',
  },
});
