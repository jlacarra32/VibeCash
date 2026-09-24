import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { THEME } from '../constants/theme';
import {
  calculateCashFlow, getPeriodRange, expenseBetween, getPeriodBuckets, PERIOD_OPTIONS,
} from '../logic/cashFlow';
import { formatMoney, monthName } from '../logic/format';
import ScreenHeader from '../components/ScreenHeader';
import Segmented from '../components/Segmented';
import EmptyState from '../components/EmptyState';

const MODES = [
  { key: 'net', label: 'Mi parte' },
  { key: 'gross', label: 'Total pagado' },
];

const periodName = (filter, offset, now = new Date()) => {
  if (filter === 'week') return offset === 0 ? 'esta semana' : 'la semana pasada';
  if (filter === 'month') return monthName(new Date(now.getFullYear(), now.getMonth() + offset, 1).getMonth()).toLowerCase();
  if (filter === 'year') return String(now.getFullYear() + offset);
  return 'desde el principio';
};

export default function ChartsScreen({ transactions, categories }) {
  const [mode, setMode] = useState('net');
  const [timeFilter, setTimeFilter] = useState('month');
  const netMode = mode === 'net';
  const txs = transactions || [];

  const cashFlow = calculateCashFlow(txs, timeFilter);
  const spent = netMode ? cashFlow.totalExpenseNet : cashFlow.totalExpense;
  const byCategory = netMode ? cashFlow.categoryTotalsNet : cashFlow.categoryTotals;
  const balance = cashFlow.totalIncome - spent;
  // Puede ser negativo: si gastas más de lo que ingresas, se muestra el déficit
  const savingsRate = cashFlow.totalIncome > 0 ? (balance / cashFlow.totalIncome) * 100 : null;
  const txCount = cashFlow.transactions.length;

  // Comparación con el periodo anterior
  const prevRange = getPeriodRange(timeFilter, -1);
  const prevSpent = prevRange ? expenseBetween(txs, prevRange.start, prevRange.end, netMode) : 0;
  let comparison = null;
  if (prevRange && prevSpent > 0) {
    const diff = ((spent - prevSpent) / prevSpent) * 100;
    const prevName = periodName(timeFilter, -1);
    if (Math.abs(diff) < 1) comparison = { text: `Igual que ${prevName}`, color: THEME.colors.inkSoft };
    else if (diff < 0) comparison = { text: `${Math.round(-diff)} % menos que ${prevName}`, color: THEME.colors.income };
    else comparison = { text: `${Math.round(diff)} % más que ${prevName}`, color: THEME.colors.danger };
  }

  // Todas las categorías con gasto, incluidas las que el usuario ya borró
  // (sus movimientos siguen existiendo y deben contar en el reparto)
  const catEntries = Object.entries(byCategory)
    .filter(([, val]) => val > 0)
    .map(([id, val]) => {
      const known = (categories || []).find(c => c.id === id);
      return {
        id,
        label: known ? id : `${id} (eliminada)`,
        color: known ? known.color : THEME.colors.inkFaint,
        val,
      };
    })
    .sort((a, b) => b.val - a.val);

  // Barras del periodo
  const buckets = getPeriodBuckets(timeFilter).map(b => ({ ...b, value: expenseBetween(txs, b.start, b.end, netMode) }));
  const maxBucket = Math.max(0, ...buckets.map(b => b.value));
  const nowTime = Date.now();
  const showLabel = (i) => timeFilter !== 'month' || i === 0 || (i + 1) % 5 === 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Análisis" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Segmented options={PERIOD_OPTIONS} value={timeFilter} onChange={setTimeFilter} />

        {txCount === 0 ? (
          <EmptyState
            title="Sin datos en este periodo"
            message="Cuando apuntes movimientos, aquí verás en qué se va tu dinero."
          />
        ) : (
          <>
            {/* Cifra principal */}
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>
                Gastado · <Text style={styles.heroLabelItalic}>{periodName(timeFilter, 0)}</Text>
              </Text>
              <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(spent)}</Text>
              {comparison && <Text style={[styles.comparison, { color: comparison.color }]}>{comparison.text}</Text>}
            </View>

            {/* Tres datos */}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Ingresado</Text>
                <Text style={[styles.statValue, { color: THEME.colors.income }]}>{formatMoney(cashFlow.totalIncome, { decimals: 0 })}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Balance</Text>
                <Text style={[styles.statValue, balance < 0 && { color: THEME.colors.danger }]}>
                  {formatMoney(balance, { sign: 'always', decimals: 0 })}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{savingsRate !== null && savingsRate < 0 ? 'Déficit' : 'Ahorro'}</Text>
                <Text style={[styles.statValue, savingsRate !== null && savingsRate < 0 && { color: THEME.colors.danger }]}>
                  {savingsRate === null ? '—' : `${Math.round(savingsRate)} %`}
                </Text>
              </View>
            </View>

            {/* Mi parte / Total pagado: solo tiene sentido si hay gastos compartidos */}
            {cashFlow.totalRefunds > 0 && (
              <View style={styles.modeBox}>
                <Segmented options={MODES} value={mode} onChange={setMode} />
                <Text style={styles.modeNote}>
                  {netMode
                    ? `Descuenta los ${formatMoney(cashFlow.totalRefunds)} que te devuelven de gastos compartidos.`
                    : 'Cuenta todo lo que ha salido de tu cuenta, aunque luego te lo devuelvan.'}
                </Text>
              </View>
            )}

            {/* Por categoría */}
            {spent > 0 && catEntries.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Por categoría</Text>
                <View style={styles.stackedBar}>
                  {catEntries.map(e => <View key={e.id} style={{ flex: e.val, backgroundColor: e.color }} />)}
                </View>
                {catEntries.map((e, i) => {
                  const pct = (e.val / spent) * 100;
                  return (
                    <View key={e.id} style={[styles.catRow, i < catEntries.length - 1 && styles.catDivider]}>
                      <View style={[styles.catDot, { backgroundColor: e.color }]} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.catTop}>
                          <Text style={styles.catName} numberOfLines={1}>{e.label}</Text>
                          <Text style={styles.catAmount}>{formatMoney(e.val)}</Text>
                        </View>
                        <View style={styles.catBarRow}>
                          <View style={styles.catTrack}>
                            <View style={[styles.catFill, { width: `${Math.max(pct, 1)}%`, backgroundColor: e.color }]} />
                          </View>
                          <Text style={styles.catPct}>{Math.round(pct)} %</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Día a día / mes a mes */}
            {maxBucket > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {timeFilter === 'week' || timeFilter === 'month' ? 'Día a día' : 'Mes a mes'}
                </Text>
                <View style={styles.bars}>
                  {buckets.map((b, i) => {
                    const isCurrent = nowTime >= b.start.getTime() && nowTime <= b.end.getTime();
                    const h = b.value > 0 ? Math.max(3, (b.value / maxBucket) * 100) : 0;
                    return (
                      <View key={b.start.toISOString()} style={styles.barCol}>
                        <View style={styles.barArea}>
                          {b.value > 0 && (
                            <View style={[
                              styles.bar,
                              { height: `${h}%`, backgroundColor: isCurrent ? THEME.colors.accent : THEME.inkAlpha(0.22) },
                            ]} />
                          )}
                        </View>
                        <Text style={[styles.barLabel, isCurrent && { color: THEME.colors.ink }]}>
                          {showLabel(i) ? b.label : ''}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.barsNote}>
                  Máximo: {formatMoney(maxBucket)} {timeFilter === 'week' || timeFilter === 'month' ? 'en un día' : 'en un mes'}
                </Text>
              </View>
            )}
          </>
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
  scroll: {
    paddingHorizontal: THEME.layout.gutter,
    paddingBottom: 120,
  },
  hero: {
    marginTop: THEME.space.xl,
  },
  heroLabel: {
    ...THEME.text.small,
    fontFamily: THEME.fonts.medium,
  },
  heroLabelItalic: {
    fontFamily: THEME.fonts.displayItalic,
    fontSize: THEME.type.body,
    color: THEME.colors.ink,
  },
  heroAmount: {
    ...THEME.text.display,
    fontSize: 52,
    marginTop: THEME.space.sm,
    fontVariant: ['tabular-nums'],
  },
  comparison: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    marginTop: THEME.space.xs,
  },
  stats: {
    flexDirection: 'row',
    marginTop: THEME.space.lg,
    paddingVertical: THEME.space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.colors.hairline,
  },
  stat: {
    flex: 1,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: THEME.colors.hairline,
    marginHorizontal: THEME.space.md,
  },
  statLabel: {
    ...THEME.text.small,
  },
  statValue: {
    ...THEME.text.amount,
    fontSize: 17,
    marginTop: 2,
  },
  modeBox: {
    marginTop: THEME.space.lg,
  },
  modeNote: {
    ...THEME.text.small,
    marginTop: THEME.space.sm,
    lineHeight: 18,
  },
  section: {
    marginTop: 36,
  },
  sectionTitle: {
    ...THEME.text.heading,
    fontSize: 22,
    marginBottom: THEME.space.lg,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    gap: 2,
    marginBottom: THEME.space.sm,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: THEME.space.md,
  },
  catDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.hairline,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: THEME.space.md,
  },
  catTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catName: {
    ...THEME.text.bodyMedium,
    flex: 1,
    marginRight: THEME.space.sm,
  },
  catAmount: {
    ...THEME.text.amount,
  },
  catBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.space.sm,
  },
  catTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.sunken,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    borderRadius: 2,
  },
  catPct: {
    ...THEME.text.small,
    width: 44,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 2,
  },
  barCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  barArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    maxWidth: 22,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 10,
    color: THEME.colors.inkFaint,
    marginTop: 6,
    height: 14,
  },
  barsNote: {
    ...THEME.text.small,
    marginTop: THEME.space.md,
  },
});
