import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { getCategoryColor, getCategoryIcon } from '../logic/helpers';
import { toLocalDateKey } from '../logic/dates';

const TOP = THEME.layout.screenTop;

LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['D','L','M','X','J','V','S'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

export default function CalendarScreen({ transactions, categories, incomeCategories }) {
  const today = toLocalDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTx, setSelectedTx] = useState(null);

  // Mes que se está viendo en el calendario (los totales siguen al mes visible)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const isCurrentMonth = (() => {
    const now = new Date();
    return visibleMonth.year === now.getFullYear() && visibleMonth.month === now.getMonth();
  })();
  const visibleMonthLabel = isCurrentMonth
    ? 'este mes'
    : `${LocaleConfig.locales['es'].monthNames[visibleMonth.month].toLowerCase()} ${visibleMonth.year}`;

  const monthTransactions = useMemo(() =>
    (transactions || []).filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d.getMonth() === visibleMonth.month && d.getFullYear() === visibleMonth.year;
    }), [transactions, visibleMonth]);

  const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const monthBalance = monthIncome - monthExpense;

  // Build marked dates: multiple dots per day
  const markedDates = useMemo(() => {
    const marks = {};
    (transactions || []).forEach(t => {
      const dateStr = toLocalDateKey(t.date);
      if (!dateStr) return;
      if (!marks[dateStr]) marks[dateStr] = { dots: [] };
      const color = t.type === 'income' ? THEME.colors.success : THEME.colors.error;
      const alreadyHas = marks[dateStr].dots.some(d => d.color === color);
      if (!alreadyHas) marks[dateStr].dots.push({ key: t.type, color });
    });
    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: THEME.colors.accent,
      };
    }
    return marks;
  }, [transactions, selectedDate]);

  // Transactions for selected day
  const dailyTransactions = useMemo(() =>
    (transactions || []).filter(t => t.date && toLocalDateKey(t.date) === selectedDate),
    [transactions, selectedDate]);

  const dayIncome = dailyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const dayExpense = dailyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Calendario</Text>
          <Text style={styles.headerSub}>Vista mensual</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={[styles.headerBalance, { color: monthBalance >= 0 ? THEME.colors.success : THEME.colors.error }]}>
            {monthBalance >= 0 ? '+' : ''}{monthBalance.toFixed(0)}€
          </Text>
          <Text style={styles.headerBalanceLabel}>{visibleMonthLabel}</Text>
        </View>
      </View>

      {/* Month KPI strip */}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiItem}>
          <Ionicons name="arrow-up-circle" size={14} color={THEME.colors.success} />
          <Text style={styles.kpiLabel}>Ingresos</Text>
          <Text style={[styles.kpiValue, { color: THEME.colors.success }]}>{monthIncome.toFixed(0)}€</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Ionicons name="arrow-down-circle" size={14} color={THEME.colors.error} />
          <Text style={styles.kpiLabel}>Gastos</Text>
          <Text style={[styles.kpiValue, { color: THEME.colors.error }]}>{monthExpense.toFixed(0)}€</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Ionicons name="receipt-outline" size={14} color={THEME.colors.textSecondary} />
          <Text style={styles.kpiLabel}>Movimientos</Text>
          <Text style={[styles.kpiValue, { color: '#FFF' }]}>{monthTransactions.length}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Calendar */}
        <View style={styles.calendarCard}>
          <Calendar
            style={styles.calendar}
            markingType="multi-dot"
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              selectedDayBackgroundColor: THEME.colors.accent,
              selectedDayTextColor: '#FFF',
              todayTextColor: THEME.colors.accent,
              dayTextColor: '#E2E8F0',
              textDisabledColor: '#334155',
              dotColor: THEME.colors.accent,
              selectedDotColor: '#FFF',
              arrowColor: THEME.colors.accent,
              monthTextColor: '#FFF',
              textDayFontWeight: '600',
              textDayHeaderFontWeight: '700',
              textMonthFontWeight: '800',
              textDayFontSize: 14,
              textMonthFontSize: 16,
            }}
            markedDates={markedDates}
            onDayPress={day => setSelectedDate(day.dateString)}
            onMonthChange={m => setVisibleMonth({ year: m.year, month: m.month - 1 })}
            firstDay={1}
          />
        </View>

        {/* Selected day panel */}
        <View style={styles.dayPanel}>
          {/* Day header */}
          <View style={styles.dayHeader}>
            <View>
              <Text style={styles.dayTitle}>
                {selectedDate === today ? '📅 Hoy' : formattedDate}
              </Text>
              {selectedDate !== today && (
                <Text style={styles.daySubtitle}>{formattedDate}</Text>
              )}
            </View>
            {dailyTransactions.length > 0 && (
              <View style={styles.dayStats}>
                {dayIncome > 0 && (
                  <Text style={[styles.dayStat, { color: THEME.colors.success }]}>+{dayIncome.toFixed(0)}€</Text>
                )}
                {dayExpense > 0 && (
                  <Text style={[styles.dayStat, { color: THEME.colors.error }]}>-{dayExpense.toFixed(0)}€</Text>
                )}
              </View>
            )}
          </View>

          {/* Transactions */}
          {dailyTransactions.length === 0 ? (
            <View style={styles.emptyDay}>
              <Ionicons name="moon-outline" size={36} color={THEME.colors.textSecondary} style={{ opacity: 0.4 }} />
              <Text style={styles.emptyDayText}>Sin movimientos este día</Text>
            </View>
          ) : (
            dailyTransactions.map(item => {
              const catColor = getCategoryColor(item.category, item.type, categories, incomeCategories);
              const catIcon = getCategoryIcon(item.category, item.type, categories, incomeCategories);
              const isIncome = item.type === 'income';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.txCard}
                  onPress={() => setSelectedTx(item)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.txIcon, { backgroundColor: catColor + '20' }]}>
                    <Ionicons name={catIcon} size={20} color={catColor} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txDesc}>{item.description}</Text>
                    <View style={[styles.txCatChip, { backgroundColor: catColor + '18' }]}>
                      <Text style={[styles.txCatText, { color: catColor }]}>{isIncome ? 'Ingreso' : item.category}</Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: isIncome ? THEME.colors.success : THEME.colors.error }]}>
                      {isIncome ? '+' : '-'}{item.amount.toFixed(2)}€
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={THEME.colors.textSecondary} style={{ marginTop: 2 }} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={selectedTx !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedTx(null)}
        >
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {selectedTx && (() => {
              const catColor = getCategoryColor(selectedTx.category, selectedTx.type, categories, incomeCategories);
              const catIcon = getCategoryIcon(selectedTx.category, selectedTx.type, categories, incomeCategories);
              const isIncome = selectedTx.type === 'income';
              return (
                <>
                  {/* Icon + amount header */}
                  <View style={styles.modalHero}>
                    <View style={[styles.modalHeroIcon, { backgroundColor: catColor + '25' }]}>
                      <Ionicons name={catIcon} size={32} color={catColor} />
                    </View>
                    <Text style={[styles.modalHeroAmount, { color: isIncome ? THEME.colors.success : THEME.colors.error }]}>
                      {isIncome ? '+' : '-'}{selectedTx.amount.toFixed(2)}€
                    </Text>
                    <Text style={styles.modalHeroDesc}>{selectedTx.description}</Text>
                  </View>

                  {/* Detail rows */}
                  <View style={styles.modalRows}>
                    {[
                      { label: 'Tipo', value: isIncome ? 'Ingreso' : 'Gasto', color: isIncome ? THEME.colors.success : THEME.colors.error },
                      { label: 'Categoría', value: isIncome ? 'Ingreso' : selectedTx.category, color: catColor },
                      { label: 'Fecha', value: new Date(selectedTx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) },
                      ...(selectedTx.refundAmount > 0 ? [{ label: 'Reembolso', value: `${Number(selectedTx.refundAmount).toFixed(2)}€`, color: THEME.colors.warning }] : []),
                    ].map(row => (
                      <View key={row.label} style={styles.modalRow}>
                        <Text style={styles.modalLabel}>{row.label}</Text>
                        <Text style={[styles.modalValue, row.color && { color: row.color }]}>{row.value}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedTx(null)}>
                    <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingTop: TOP,
    paddingHorizontal: 22,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  headerBadge: {
    alignItems: 'flex-end',
  },
  headerBalance: {
    fontSize: 20,
    fontWeight: '900',
  },
  headerBalanceLabel: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  kpiStrip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 2,
  },
  kpiDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 8,
  },
  kpiLabel: {
    fontSize: 9,
    color: THEME.colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  calendarCard: {
    marginHorizontal: 16,
    backgroundColor: THEME.colors.surface,
    borderRadius: 26,
    padding: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 18,
  },
  calendar: {
    borderRadius: 20,
  },
  dayPanel: {
    marginHorizontal: 16,
    backgroundColor: THEME.colors.surface,
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  daySubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  dayStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dayStat: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyDayText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 5,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  txCatChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txCatText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  // Modal bottom sheet style
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalHero: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  modalHeroIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalHeroAmount: {
    fontSize: 32,
    fontWeight: '900',
  },
  modalHeroDesc: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  modalRows: {
    backgroundColor: THEME.colors.background,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  modalValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
  },
  modalCloseBtn: {
    backgroundColor: THEME.colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
