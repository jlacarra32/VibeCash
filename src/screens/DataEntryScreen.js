import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { calculateCashFlow, PERIOD_OPTIONS } from '../logic/cashFlow';
import { sortByDateDesc, groupByDay } from '../logic/helpers';
import { formatMoney, formatDayLabel, monthName } from '../logic/format';
import ScreenHeader from '../components/ScreenHeader';
import Segmented from '../components/Segmented';
import TransactionRow from '../components/TransactionRow';
import EmptyState from '../components/EmptyState';

const RECENT_LIMIT = 15;

// "de septiembre", "de esta semana"...
const periodCaption = (filter) => {
  const now = new Date();
  if (filter === 'week') return 'esta semana';
  if (filter === 'month') return monthName(now.getMonth()).toLowerCase();
  if (filter === 'year') return String(now.getFullYear());
  return 'desde el principio';
};

export default function DataEntryScreen({ transactions, userName, categories, incomeCategories, onOpen, onGoToHistory, onAdd }) {
  const [timeFilter, setTimeFilter] = useState('month');
  const [showBalance, setShowBalance] = useState(true);
  const [displayBalance, setDisplayBalance] = useState(0);
  const displayBalanceRef = useRef(0); // valor mostrado en cada momento (para no partir de uno viejo)

  const cashFlow = calculateCashFlow(transactions, timeFilter);

  // Contador animado del balance cuando cambia el periodo o los datos
  useEffect(() => {
    const target = cashFlow.netBalance;
    const start = displayBalanceRef.current;
    if (start === target) return;

    const duration = 700;
    const startTime = Date.now();
    let frameId;
    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress); // ease-out expo
      const current = start + (target - start) * eased;
      displayBalanceRef.current = current;
      setDisplayBalance(current);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    // Si cambia el filtro a mitad o se sale de la pantalla, se cancela la animación
    return () => cancelAnimationFrame(frameId);
  }, [cashFlow.netBalance]);

  const firstName = (userName || '').trim().split(/\s+/)[0];
  // "jueves, 24 de septiembre"
  const todayLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  // Reparto del gasto por categoría (lo que te toca pagar)
  const catEntries = Object.entries(cashFlow.categoryTotalsNet)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, value]) => {
      const cat = (categories || []).find(c => c.id === id);
      return { id, value, color: cat ? cat.color : THEME.colors.inkFaint };
    });
  const spent = cashFlow.totalExpenseNet;

  const recent = sortByDateDesc(cashFlow.transactions).slice(0, RECENT_LIMIT);
  const groups = groupByDay(recent);
  const hidden = '••••';

  return (
    <View style={styles.container}>
      <ScreenHeader
        eyebrow={todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}
        title={`Hola, ${firstName || 'de nuevo'}`}
        right={
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onGoToHistory}
            accessibilityLabel="Buscar movimientos"
          >
            <Ionicons name="search-outline" size={19} color={THEME.colors.ink} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Segmented options={PERIOD_OPTIONS} value={timeFilter} onChange={setTimeFilter} />

        {/* Balance */}
        <View style={styles.balance}>
          <View style={styles.balanceLabelRow}>
            <Text style={styles.balanceLabel}>
              Balance · <Text style={styles.balanceLabelItalic}>{periodCaption(timeFilter)}</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowBalance(v => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={showBalance ? 'Ocultar importes' : 'Mostrar importes'}
            >
              <Ionicons name={showBalance ? 'eye-outline' : 'eye-off-outline'} size={18} color={THEME.colors.inkSoft} />
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.balanceAmount, cashFlow.netBalance < 0 && { color: THEME.colors.danger }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {showBalance ? formatMoney(displayBalance, { sign: 'always' }) : `${hidden} €`}
          </Text>

          <View style={styles.flowRow}>
            <View style={styles.flowItem}>
              <Text style={styles.flowLabel}>Ingresado</Text>
              <Text style={[styles.flowValue, { color: THEME.colors.income }]}>
                {showBalance ? formatMoney(cashFlow.totalIncome) : hidden}
              </Text>
            </View>
            <View style={styles.flowDivider} />
            <View style={styles.flowItem}>
              <Text style={styles.flowLabel}>Gastado</Text>
              <Text style={styles.flowValue}>{showBalance ? formatMoney(spent) : hidden}</Text>
            </View>
          </View>
        </View>

        {/* En qué se va el dinero */}
        {spent > 0 && catEntries.length > 0 && (
          <View style={styles.split}>
            <View style={styles.splitBar}>
              {catEntries.map(e => (
                <View key={e.id} style={{ flex: e.value, backgroundColor: e.color }} />
              ))}
            </View>
            <View style={styles.splitLegend}>
              {catEntries.slice(0, 3).map(e => (
                <View key={e.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: e.color }]} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {e.id} <Text style={styles.legendPct}>{Math.round((e.value / spent) * 100)} %</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Movimientos recientes, agrupados por día */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recientes</Text>
          {recent.length > 0 && (
            <TouchableOpacity onPress={onGoToHistory} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.link}>Ver todos</Text>
            </TouchableOpacity>
          )}
        </View>

        {groups.map(group => (
          <View key={group.key} style={styles.group}>
            <Text style={styles.groupLabel}>{formatDayLabel(group.key)}</Text>
            {group.items.map((tx, i) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                categories={categories}
                incomeCategories={incomeCategories}
                onPress={onOpen}
                isLast={i === group.items.length - 1}
              />
            ))}
          </View>
        ))}

        {recent.length === 0 && (
          transactions.length === 0 ? (
            <EmptyState
              title="Aún no hay nada apuntado"
              message="Apunta tu primer gasto y aquí verás en qué se va tu dinero."
              actionLabel="Añadir un gasto"
              onAction={onAdd}
            />
          ) : (
            <EmptyState
              title="Nada en este periodo"
              message="Prueba con otro periodo o añade un movimiento."
            />
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
  },
  scroll: {
    paddingHorizontal: THEME.layout.gutter,
    paddingBottom: 120,
  },
  balance: {
    marginTop: THEME.space.xl,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    ...THEME.text.small,
    fontFamily: THEME.fonts.medium,
  },
  balanceLabelItalic: {
    fontFamily: THEME.fonts.displayItalic,
    fontSize: THEME.type.body,
    color: THEME.colors.ink,
  },
  balanceAmount: {
    ...THEME.text.display,
    fontSize: 52,
    marginTop: THEME.space.sm,
    fontVariant: ['tabular-nums'],
  },
  flowRow: {
    flexDirection: 'row',
    marginTop: THEME.space.lg,
    paddingTop: THEME.space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.hairline,
  },
  flowItem: {
    flex: 1,
  },
  flowDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: THEME.colors.hairline,
    marginHorizontal: THEME.space.lg,
  },
  flowLabel: {
    ...THEME.text.small,
  },
  flowValue: {
    ...THEME.text.amount,
    fontSize: 17,
    marginTop: 2,
  },
  split: {
    marginTop: THEME.space.xl,
  },
  splitBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
  },
  splitLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: THEME.space.md,
    columnGap: THEME.space.lg,
    rowGap: THEME.space.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    ...THEME.text.small,
    color: THEME.colors.ink,
  },
  legendPct: {
    color: THEME.colors.inkSoft,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 40,
    marginBottom: THEME.space.sm,
  },
  sectionTitle: {
    ...THEME.text.heading,
    fontSize: 22,
  },
  link: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    color: THEME.colors.accent,
  },
  group: {
    marginTop: THEME.space.lg,
  },
  groupLabel: {
    ...THEME.text.label,
    marginBottom: THEME.space.xs,
  },
});
