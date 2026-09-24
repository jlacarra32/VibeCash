import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { THEME } from '../constants/theme';

/**
 * Hoja inferior común: fondo oscurecido que cierra al tocarlo, asa y
 * contenido. Todas las hojas de la app usan esta.
 */
export default function Sheet({ visible, onClose, children, style }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[styles.sheet, style]}>
          <View style={styles.handle} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: THEME.colors.scrim,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: THEME.colors.elevated,
    borderTopLeftRadius: THEME.radius.lg,
    borderTopRightRadius: THEME.radius.lg,
    paddingHorizontal: THEME.layout.gutter,
    paddingTop: THEME.space.sm,
    paddingBottom: THEME.space.xl,
    maxHeight: '92%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.hairline,
    alignSelf: 'center',
    marginBottom: THEME.space.lg,
  },
});
