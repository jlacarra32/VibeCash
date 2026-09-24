import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

/** Estado vacío: frase en serif, explicación y acción opcional. */
export default function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: THEME.space.xxl,
    paddingHorizontal: THEME.space.xl,
  },
  title: {
    ...THEME.text.heading,
    fontFamily: THEME.fonts.displayItalic,
    textAlign: 'center',
  },
  message: {
    ...THEME.text.small,
    textAlign: 'center',
    marginTop: THEME.space.sm,
    lineHeight: 19,
  },
  action: {
    marginTop: THEME.space.lg,
    paddingVertical: 10,
    paddingHorizontal: THEME.space.lg,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.ink,
  },
  actionText: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    color: THEME.colors.ink,
  },
});
