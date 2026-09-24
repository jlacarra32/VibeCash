import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import Sheet from './Sheet';
import { getCategoryColor, getCategoryIcon } from '../logic/helpers';
import { formatMoney, formatDateLong } from '../logic/format';

/** Detalle de un movimiento con las acciones Editar y Borrar. */
export default function TransactionSheet({ tx, categories, incomeCategories, onClose, onEdit, onDelete }) {
  return (
    <Sheet visible={!!tx} onClose={onClose}>
      {tx ? (
        <Detail
          tx={tx}
          categories={categories}
          incomeCategories={incomeCategories}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : null}
    </Sheet>
  );
}

function Detail({ tx, categories, incomeCategories, onEdit, onDelete }) {
  const isIncome = tx.type === 'income';
  const color = getCategoryColor(tx.category, tx.type, categories, incomeCategories);
  const icon = getCategoryIcon(tx.category, tx.type, categories, incomeCategories);
  const amount = Number(tx.amount) || 0;
  const refund = Number(tx.refundAmount) || 0;

  const rows = [
    { label: 'Categoría', value: isIncome ? 'Ingreso' : tx.category },
    { label: 'Fecha', value: formatDateLong(tx.date) },
  ];
  if (!isIncome && tx.isShared) {
    rows.push({ label: 'Tu parte', value: formatMoney(tx.myPart != null ? tx.myPart : amount) });
    if (refund > 0) rows.push({ label: 'Te devuelven', value: formatMoney(refund) });
  }

  return (
    <View>
      <View style={styles.hero}>
        <View style={[styles.icon, { backgroundColor: color + '1F' }]}>
          <Ionicons name={icon || 'ellipse-outline'} size={22} color={color} />
        </View>
        <Text style={[styles.amount, isIncome && { color: THEME.colors.income }]}>
          {isIncome ? formatMoney(amount, { sign: 'always' }) : formatMoney(-amount)}
        </Text>
        <Text style={styles.description}>{tx.description}</Text>
      </View>

      <View style={styles.rows}>
        {rows.map((row, i) => (
          <View key={row.label} style={[styles.row, i < rows.length - 1 && styles.rowDivider]}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={() => onDelete(tx)} activeOpacity={0.8}>
          <Text style={[styles.btnText, { color: THEME.colors.danger }]}>Borrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnEdit]} onPress={() => onEdit(tx)} activeOpacity={0.8}>
          <Text style={[styles.btnText, { color: THEME.colors.onAccent }]}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: THEME.space.xl,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.space.md,
  },
  amount: {
    ...THEME.text.display,
    fontSize: 40,
    fontVariant: ['tabular-nums'],
  },
  description: {
    ...THEME.text.body,
    color: THEME.colors.inkSoft,
    marginTop: THEME.space.xs,
    textAlign: 'center',
  },
  rows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.colors.hairline,
    marginBottom: THEME.space.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.hairline,
  },
  rowLabel: {
    ...THEME.text.small,
    fontSize: THEME.type.body,
  },
  rowValue: {
    ...THEME.text.bodyMedium,
  },
  actions: {
    flexDirection: 'row',
    gap: THEME.space.md,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
  },
  btnDelete: {
    borderWidth: 1,
    borderColor: THEME.colors.danger + '55',
  },
  btnEdit: {
    backgroundColor: THEME.colors.accent,
  },
  btnText: {
    fontFamily: THEME.fonts.strong,
    fontSize: THEME.type.body,
  },
});
