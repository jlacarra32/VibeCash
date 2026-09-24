import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { getCategoryColor, getCategoryIcon } from '../logic/helpers';
import { formatMoney, formatDateShort } from '../logic/format';

/**
 * Fila de un movimiento. Al tocarla se abre su detalle (onPress).
 * showDate: añade la fecha en la línea secundaria (cuando la lista no está
 * agrupada por día).
 */
export default function TransactionRow({ tx, categories, incomeCategories, onPress, showDate, isLast }) {
  const isIncome = tx.type === 'income';
  const color = getCategoryColor(tx.category, tx.type, categories, incomeCategories);
  const icon = getCategoryIcon(tx.category, tx.type, categories, incomeCategories);
  const amount = Number(tx.amount) || 0;

  const title = tx.description || (isIncome ? 'Ingreso' : tx.category);
  // Sin nota, el título ya es la categoría: no se repite debajo
  const meta = [title === (isIncome ? 'Ingreso' : tx.category) ? null : (isIncome ? 'Ingreso' : tx.category)];
  if (!isIncome && tx.isShared && tx.myPart != null && Number(tx.myPart) < amount) {
    meta.push(`tu parte ${formatMoney(tx.myPart)}`);
  }
  if (showDate) meta.push(formatDateShort(tx.date));

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress && onPress(tx)}
      activeOpacity={0.6}
      accessibilityRole="button"
    >
      <View style={[styles.icon, { backgroundColor: color + '1F' }]}>
        <Ionicons name={icon || 'ellipse-outline'} size={17} color={color} />
      </View>
      <View style={[styles.body, !isLast && styles.divider]}>
        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {meta.some(Boolean) && (
            <Text style={styles.meta} numberOfLines={1}>{meta.filter(Boolean).join(' · ')}</Text>
          )}
        </View>
        <Text style={[styles.amount, isIncome && styles.amountIncome]}>
          {isIncome ? formatMoney(amount, { sign: 'always' }) : formatMoney(-amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.space.md,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.hairline,
  },
  texts: {
    flex: 1,
    marginRight: THEME.space.md,
  },
  title: {
    ...THEME.text.bodyMedium,
  },
  meta: {
    ...THEME.text.small,
    marginTop: 2,
  },
  amount: {
    ...THEME.text.amount,
  },
  amountIncome: {
    color: THEME.colors.income,
  },
});
