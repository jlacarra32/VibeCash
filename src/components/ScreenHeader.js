import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

/**
 * Cabecera común de pantalla: línea pequeña opcional (eyebrow), título en
 * serif y, como mucho, una acción a la derecha.
 */
export default function ScreenHeader({ eyebrow, title, right }) {
  return (
    <View style={styles.header}>
      <View style={styles.titles}>
        {eyebrow ? <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.layout.gutter,
    paddingTop: THEME.layout.screenTop,
    paddingBottom: THEME.space.lg,
  },
  titles: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    color: THEME.colors.inkSoft,
    marginBottom: THEME.space.xs,
  },
  title: {
    fontFamily: THEME.fonts.display,
    fontSize: THEME.type.title,
    color: THEME.colors.ink,
    letterSpacing: -0.5,
  },
  right: {
    marginLeft: THEME.space.md,
    marginBottom: THEME.space.xs,
  },
});
