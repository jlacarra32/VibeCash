import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { toLocalDateKey } from '../logic/dates';
import { formatMoney, monthName } from '../logic/format';
import TransactionRow from '../components/TransactionRow';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const pad = (n) => String(n).padStart(2, '0');

/** Lo que te cuesta un gasto (descontando lo que te devuelven). */
const netExpense = (t) => (Number(t.amount) || 0) - (Number(t.refundAmount) || 0);

/**
 * Vista "Calendario": mapa de calor del mes (cuanto más gasto, más tinta)
 * y el detalle del día elegido.
 */
export default function CalendarScreen({
  transactions, categories, incomeCategories,
  onAddForDate, onSelectedDateChange, onOpen,
}) {
  const today = toLocalDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  // Avisar a App del día elegido, para que el botón "+" lo use como fecha
  useEffect(() => {
    if (onSelectedDateChange) onSelectedDateChange(selectedDate);
  }, [selectedDate, onSelectedDateChange]);

  // Mes que se está viendo (los totales siguen al mes visible)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const now = new Date();
  const isCurrentMonth = visibleMonth.year === now.getFullYear() && visibleMonth.month === now.getMonth();

  const moveMonth = (delta) => {
    setVisibleMonth(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };
  const goToday = () => {
    setVisibleMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(today);
  };

  // Totales por día del mes visible
  const { byDay, monthIncome, monthExpense, maxExpense } = useMemo(() => {
    const days = {};
    let income = 0;
    let expense = 0;
    (transactions || []).forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (d.getMonth() !== visibleMonth.month || d.getFullYear() !== visibleMonth.year) return;
      const key = toLocalDateKey(d);
      if (!days[key]) days[key] = { income: 0, expense: 0 };
      if (t.type === 'income') {
        days[key].income += Number(t.amount) || 0;
        income += Number(t.amount) || 0;
      } else {
        days[key].expense += netExpense(t);
        expense += netExpense(t);
      }
    });
    const max = Math.max(0, ...Object.values(days).map(v => v.expense));
    return { byDay: days, monthIncome: income, monthExpense: expense, maxExpense: max };
  }, [transactions, visibleMonth]);

  // Celdas del mes, semana empezando en lunes
  const cells = useMemo(() => {
    const first = new Date(visibleMonth.year, visibleMonth.month, 1);
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(visibleMonth.year, visibleMonth.month + 1, 0).getDate();
    const list = Array.from({ length: lead }, (_, i) => ({ key: `pad-${i}` }));
    for (let day = 1; day <= daysInMonth; day++) {
      list.push({ key: `${visibleMonth.year}-${pad(visibleMonth.month + 1)}-${pad(day)}`, day });
    }
    while (list.length % 7 !== 0) list.push({ key: `pad-end-${list.length}` });
    return list;
  }, [visibleMonth]);

  // Movimientos del día elegido
  const dailyTransactions = useMemo(() =>
    (transactions || []).filter(t => t.date && toLocalDateKey(t.date) === selectedDate),
    [transactions, selectedDate]);
  const dayIncome = dailyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const dayExpense = dailyTransactions.filter(t => t.type !== 'income').reduce((s, t) => s + netExpense(t), 0);

  // "Hoy" o el día de la semana; debajo, "20 de septiembre"
  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const weekday = selectedDateObj.toLocaleDateString('es-ES', { weekday: 'long' });
  const dayTitle = selectedDate === today ? 'Hoy' : weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const daySubtitle = selectedDateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const shortDayLabel = selectedDate === today ? 'hoy' : `el ${daySubtitle}`;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {/* Mes */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => moveMonth(-1)} style={styles.arrow} accessibilityLabel="Mes anterior">
          <Ionicons name="chevron-back" size={20} color={THEME.colors.ink} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.monthTitle}>
            {monthName(visibleMonth.month)} <Text style={styles.monthYear}>{visibleMonth.year}</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={() => moveMonth(1)} style={styles.arrow} accessibilityLabel="Mes siguiente">
          <Ionicons name="chevron-forward" size={20} color={THEME.colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.monthSummary}>
        <Text style={styles.monthSummaryText}>
          Gastado <Text style={styles.monthSummaryValue}>{formatMoney(monthExpense)}</Text>
          {'   ·   '}Ingresado <Text style={[styles.monthSummaryValue, { color: THEME.colors.income }]}>{formatMoney(monthIncome)}</Text>
        </Text>
        {!isCurrentMonth && (
          <TouchableOpacity onPress={goToday}>
            <Text style={styles.link}>Hoy</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cuadrícula */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map(d => <Text key={d} style={styles.weekday}>{d}</Text>)}
      </View>
      <View style={styles.grid}>
        {cells.map(cell => {
          if (!cell.day) return <View key={cell.key} style={styles.cell} />;
          const totals = byDay[cell.key];
          const expense = totals ? totals.expense : 0;
          const ratio = maxExpense > 0 ? expense / maxExpense : 0;
          const isSelected = cell.key === selectedDate;
          const isToday = cell.key === today;
          const strong = ratio > 0.6;
          return (
            <TouchableOpacity
              key={cell.key}
              style={styles.cell}
              onPress={() => setSelectedDate(cell.key)}
              activeOpacity={0.7}
              accessibilityLabel={`${cell.day}${expense > 0 ? `, gastado ${formatMoney(expense)}` : ''}`}
            >
              <View style={[
                styles.cellInner,
                expense > 0 && { backgroundColor: THEME.inkAlpha(0.06 + ratio * 0.6) },
                isSelected && styles.cellSelected,
              ]}>
                <Text style={[
                  styles.dayNumber,
                  strong && { color: THEME.colors.onAccent },
                  isToday && styles.dayToday,
                  isToday && strong && { color: THEME.colors.onAccent },
                ]}>
                  {cell.day}
                </Text>
                {expense > 0 ? (
                  <Text style={[styles.dayAmount, strong && { color: THEME.colors.onAccent }]} numberOfLines={1}>
                    {Math.round(expense)}
                  </Text>
                ) : totals && totals.income > 0 ? (
                  <View style={styles.incomeDot} />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Día elegido */}
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayTitle}>{dayTitle}</Text>
          <Text style={styles.daySubtitle}>{daySubtitle}</Text>
        </View>
        <View style={styles.dayTotals}>
          {dayIncome > 0 && (
            <Text style={[styles.dayTotal, { color: THEME.colors.income }]}>{formatMoney(dayIncome, { sign: 'always' })}</Text>
          )}
          {dayExpense > 0 && <Text style={styles.dayTotal}>{formatMoney(-dayExpense)}</Text>}
        </View>
      </View>

      {dailyTransactions.length === 0 ? (
        <Text style={styles.emptyDay}>Nada apuntado este día.</Text>
      ) : (
        dailyTransactions.map((tx, i) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            categories={categories}
            incomeCategories={incomeCategories}
            onPress={onOpen}
            isLast={i === dailyTransactions.length - 1}
          />
        ))
      )}

      {onAddForDate && (
        <TouchableOpacity style={styles.addDayBtn} onPress={() => onAddForDate(selectedDate)} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color={THEME.colors.accent} />
          <Text style={styles.addDayText}>Añadir {shortDayLabel}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: THEME.layout.gutter,
    paddingBottom: 120,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthCenter: {
    flex: 1,
    alignItems: 'center',
  },
  monthTitle: {
    ...THEME.text.heading,
    fontSize: 22,
  },
  monthYear: {
    fontFamily: THEME.fonts.displayItalic,
    color: THEME.colors.inkSoft,
  },
  monthSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: THEME.space.md,
    marginTop: THEME.space.xs,
    marginBottom: THEME.space.lg,
  },
  monthSummaryText: {
    ...THEME.text.small,
  },
  monthSummaryValue: {
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.ink,
    fontVariant: ['tabular-nums'],
  },
  link: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    color: THEME.colors.accent,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: THEME.space.xs,
  },
  weekday: {
    ...THEME.text.label,
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: THEME.colors.inkFaint,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 54,
    padding: 2,
  },
  cellInner: {
    flex: 1,
    borderRadius: THEME.radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cellSelected: {
    borderColor: THEME.colors.accent,
  },
  dayNumber: {
    fontFamily: THEME.fonts.body,
    fontSize: 14,
    color: THEME.colors.ink,
    fontVariant: ['tabular-nums'],
  },
  dayToday: {
    fontFamily: THEME.fonts.strong,
    color: THEME.colors.accent,
    textDecorationLine: 'underline',
  },
  dayAmount: {
    fontFamily: THEME.fonts.medium,
    fontSize: 10,
    color: THEME.colors.inkSoft,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  incomeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: THEME.colors.income,
    marginTop: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: THEME.space.xl,
    paddingTop: THEME.space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.hairline,
    marginBottom: THEME.space.xs,
  },
  dayTitle: {
    ...THEME.text.heading,
    fontSize: 22,
  },
  daySubtitle: {
    ...THEME.text.small,
    marginTop: 2,
  },
  dayTotals: {
    alignItems: 'flex-end',
  },
  dayTotal: {
    ...THEME.text.amount,
  },
  emptyDay: {
    ...THEME.text.small,
    fontFamily: THEME.fonts.displayItalic,
    fontSize: THEME.type.body,
    paddingVertical: THEME.space.lg,
  },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: THEME.space.lg,
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.colors.hairline,
  },
  addDayText: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    color: THEME.colors.accent,
  },
});
