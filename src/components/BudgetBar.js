import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { formatMoney } from '../logic/format';

const LEVEL_COLOR = {
  ok: THEME.colors.accent,
  warn: THEME.colors.warning,
  over: THEME.colors.danger,
};

/**
 * Barra de una línea de presupuesto. status = { limit, spent, remaining, ratio, level }.
 * hide: oculta los importes (cuando el usuario los ha ocultado en Inicio).
 */
export default function BudgetBar({ label, status, hide }) {
  const color = LEVEL_COLOR[status.level];
  const fill = Math.max(0, Math.min(1, status.ratio));
  const money = (v) => (hide ? '••••' : formatMoney(v, { decimals: 0 }));
  const note = status.remaining >= 0
    ? `Te quedan ${hide ? '••••' : formatMoney(status.remaining, { decimals: 0 })}`
    : `Te has pasado ${hide ? '••••' : formatMoney(-status.remaining, { decimals: 0 })}`;

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${label}: ${money(status.spent)} de ${money(status.limit)}. ${note}`}>
      <View style={styles.head}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <Text style={styles.amounts}>{money(status.spent)} <Text style={styles.of}>de {money(status.limit)}</Text></Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.note, status.level === 'over' && { color: THEME.colors.danger }]}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: THEME.space.md,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: THEME.space.md,
  },
  label: {
    ...THEME.text.bodyMedium,
    flex: 1,
  },
  amounts: {
    ...THEME.text.amount,
  },
  of: {
    ...THEME.text.small,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.sunken,
    overflow: 'hidden',
    marginTop: THEME.space.sm,
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  note: {
    ...THEME.text.small,
    marginTop: 4,
  },
});
