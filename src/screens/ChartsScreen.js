import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { calculateCashFlow } from '../logic/cashFlow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOP = Platform.OS === 'web' ? 20 : 50;

// ─── Tiny donut ring using stacked arcs ─────────────────────────────────────
function DonutSegments({ categories, categoryTotals, total, size = 130 }) {
  const strokeW = 18;
  const radius = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const segments = (categories || [])
    .map(cat => {
      const val = categoryTotals[cat.id] || 0;
      return { cat, val };
    })
    .filter(s => s.val > 0);

  if (total <= 0 || segments.length === 0) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeW, borderColor: 'rgba(255,255,255,0.05)',
          justifyContent: 'center', alignItems: 'center'
        }}>
          <Text style={{ color: THEME.colors.textSecondary, fontSize: 11 }}>Sin datos</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      {/* SVG-like rings via absolute positioned views – React Native SVG not needed */}
      {segments.map(({ cat, val }, i) => {
        const pct = val / total;
        const segEnd = offset + pct;
        const seg = { cat, pct, start: offset, end: segEnd };
        offset = segEnd;
        return null; // rendered below as progress bars
      })}
      {/* Fallback: plain coloured stroke ring */}
      <View style={{
        position: 'absolute', top: 0, left: 0, width: size, height: size,
        borderRadius: size / 2, borderWidth: strokeW, borderColor: 'rgba(255,255,255,0.05)'
      }} />
      {/* Inner text */}
      <View style={{
        position: 'absolute', top: strokeW, left: strokeW,
        width: size - strokeW * 2, height: size - strokeW * 2,
        borderRadius: (size - strokeW * 2) / 2,
        justifyContent: 'center', alignItems: 'center'
      }}>
        <Text style={{ color: THEME.colors.textSecondary, fontSize: 10, fontWeight: '600' }}>GASTO</Text>
        <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>{total.toFixed(0)}€</Text>
      </View>
    </View>
  );
}

// ─── Animated horizontal bar ─────────────────────────────────────────────────
function HorizBar({ color, pct, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      delay,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const widthInterp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.max(pct * 100, 0)}%`],
  });

  return (
    <View style={horizStyles.track}>
      <Animated.View style={[horizStyles.fill, { width: widthInterp, backgroundColor: color }]} />
    </View>
  );
}

const horizStyles = StyleSheet.create({
  track: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
});

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, color, sub }) {
  return (
    <View style={kpiStyles.card}>
      <View style={[kpiStyles.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={kpiStyles.label}>{label}</Text>
      <Text style={[kpiStyles.value, { color }]}>{value}</Text>
      {sub ? <Text style={kpiStyles.sub}>{sub}</Text> : null}
    </View>
  );
}

const kpiStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'flex-start',
    minWidth: 130,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
  },
  sub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
});

// ─── Filter Pill ──────────────────────────────────────────────────────────────
function FilterPill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[filterStyles.pill, active && filterStyles.pillActive]}
    >
      <Text style={[filterStyles.label, active && filterStyles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const filterStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillActive: {
    backgroundColor: THEME.colors.accent,
    borderColor: THEME.colors.accent,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  labelActive: {
    color: '#FFF',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TIME_FILTERS = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
  { key: 'all', label: 'Todo' },
];

export default function ChartsScreen({ transactions, categories }) {
  const [netMode, setNetMode] = useState(true); // true = neto, false = bruto
  const [timeFilter, setTimeFilter] = useState('month');

  const cashFlow = calculateCashFlow(transactions || [], timeFilter);

  const displayExpense = netMode ? cashFlow.totalExpenseNet : cashFlow.totalExpense;
  const displayCategories = netMode ? cashFlow.categoryTotalsNet : cashFlow.categoryTotals;

  const savingsRate =
    cashFlow.totalIncome > 0
      ? Math.max(0, ((cashFlow.totalIncome - displayExpense) / cashFlow.totalIncome) * 100)
      : 0;

  const txCount = (transactions || []).filter(t => {
    if (timeFilter === 'all') return true;
    if (!t.date) return true;
    const now = new Date();
    const d = new Date(t.date);
    if (timeFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (timeFilter === 'year') return d.getFullYear() === now.getFullYear();
    if (timeFilter === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - (day === 0 ? 6 : day - 1);
      const monday = new Date(now); monday.setDate(diff); monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
      return d >= monday && d <= sunday;
    }
    return true;
  }).length;

  // Best category (highest expense)
  const catEntries = (categories || [])
    .map(cat => ({ cat, val: displayCategories[cat.id] || 0 }))
    .filter(e => e.val > 0)
    .sort((a, b) => b.val - a.val);

  const topCat = catEntries[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Análisis</Text>
          <Text style={styles.headerSub}>Tu dinero en detalle</Text>
        </View>
        {/* Net / Bruto toggle */}
        <TouchableOpacity
          style={styles.modeToggle}
          onPress={() => setNetMode(p => !p)}
        >
          <Ionicons
            name={netMode ? 'git-network-outline' : 'cash-outline'}
            size={14}
            color={THEME.colors.accent}
          />
          <Text style={styles.modeToggleText}>{netMode ? 'Neto' : 'Bruto'}</Text>
        </TouchableOpacity>
      </View>

      {/* Time filter row */}
      <View style={styles.filterRow}>
        {TIME_FILTERS.map(f => (
          <FilterPill
            key={f.key}
            label={f.label}
            active={timeFilter === f.key}
            onPress={() => setTimeFilter(f.key)}
          />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── KPI row ── */}
        <View style={styles.kpiRow}>
          <KpiCard
            icon="trending-up-outline"
            label="Ingresos"
            value={`${cashFlow.totalIncome.toFixed(0)}€`}
            color={THEME.colors.success}
          />
          <View style={{ width: 12 }} />
          <KpiCard
            icon="trending-down-outline"
            label="Gastos"
            value={`${displayExpense.toFixed(0)}€`}
            color={THEME.colors.error}
            sub={cashFlow.totalRefunds > 0 ? `Reembolsos: ${cashFlow.totalRefunds.toFixed(0)}€` : null}
          />
        </View>

        <View style={[styles.kpiRow, { marginTop: 12 }]}>
          <KpiCard
            icon="wallet-outline"
            label="Balance"
            value={`${cashFlow.netBalance.toFixed(0)}€`}
            color={cashFlow.netBalance >= 0 ? THEME.colors.success : THEME.colors.error}
          />
          <View style={{ width: 12 }} />
          <KpiCard
            icon="save-outline"
            label="Ahorro"
            value={`${savingsRate.toFixed(0)}%`}
            color={THEME.colors.warning}
            sub={`${txCount} movimientos`}
          />
        </View>

        {/* ── Balance visual bar ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingresos vs Gastos</Text>
          <View style={styles.balanceVisual}>
            {/* Income bar */}
            <View style={styles.bvRow}>
              <View style={styles.bvLabelWrap}>
                <View style={[styles.bvDot, { backgroundColor: THEME.colors.success }]} />
                <Text style={styles.bvLabel}>Ingresos</Text>
              </View>
              <HorizBar
                color={THEME.colors.success}
                pct={cashFlow.totalIncome > 0 ? 1 : 0}
                delay={0}
              />
              <Text style={styles.bvVal}>{cashFlow.totalIncome.toFixed(0)}€</Text>
            </View>
            {/* Expense bar */}
            <View style={[styles.bvRow, { marginTop: 14 }]}>
              <View style={styles.bvLabelWrap}>
                <View style={[styles.bvDot, { backgroundColor: THEME.colors.error }]} />
                <Text style={styles.bvLabel}>Gastos</Text>
              </View>
              <HorizBar
                color={THEME.colors.error}
                pct={cashFlow.totalIncome > 0 ? displayExpense / cashFlow.totalIncome : (displayExpense > 0 ? 1 : 0)}
                delay={150}
              />
              <Text style={styles.bvVal}>{displayExpense.toFixed(0)}€</Text>
            </View>
            {/* Savings bar */}
            {cashFlow.totalIncome > 0 && (
              <View style={[styles.bvRow, { marginTop: 14 }]}>
                <View style={styles.bvLabelWrap}>
                  <View style={[styles.bvDot, { backgroundColor: THEME.colors.warning }]} />
                  <Text style={styles.bvLabel}>Ahorro</Text>
                </View>
                <HorizBar
                  color={THEME.colors.warning}
                  pct={savingsRate / 100}
                  delay={300}
                />
                <Text style={styles.bvVal}>{(cashFlow.totalIncome - displayExpense).toFixed(0)}€</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Category breakdown ── */}
        {displayExpense > 0 && catEntries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Por categoría</Text>
              {topCat && (
                <View style={[styles.topBadge, { backgroundColor: topCat.cat.color + '20' }]}>
                  <Ionicons name={topCat.cat.icon || 'flame'} size={12} color={topCat.cat.color} />
                  <Text style={[styles.topBadgeText, { color: topCat.cat.color }]}>
                    Top: {topCat.cat.id}
                  </Text>
                </View>
              )}
            </View>

            {catEntries.map(({ cat, val }, idx) => {
              const pct = val / displayExpense;
              const pctLabel = (pct * 100).toFixed(0);
              return (
                <View key={cat.id} style={styles.catRow}>
                  {/* Icon */}
                  <View style={[styles.catIcon, { backgroundColor: cat.color + '18' }]}>
                    <Ionicons name={cat.icon || 'cart-outline'} size={18} color={cat.color} />
                  </View>
                  {/* Bar + info */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.catTopRow}>
                      <Text style={styles.catName}>{cat.id}</Text>
                      <Text style={[styles.catAmount, { color: cat.color }]}>{val.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.catBarRow}>
                      <HorizBar color={cat.color} pct={pct} delay={idx * 80} />
                      <Text style={styles.catPct}>{pctLabel}%</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Donut visual (css ring with stacked pills) ── */}
        {displayExpense > 0 && catEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribución</Text>
            {/* Stacked pill bar */}
            <View style={styles.stackedBar}>
              {catEntries.map(({ cat, val }) => {
                const pct = (val / displayExpense) * 100;
                return (
                  <View
                    key={cat.id}
                    style={{ flex: pct, backgroundColor: cat.color, minWidth: 4 }}
                  />
                );
              })}
            </View>
            {/* Legend below */}
            <View style={styles.distLegend}>
              {catEntries.map(({ cat, val }) => {
                const pct = ((val / displayExpense) * 100).toFixed(0);
                return (
                  <View key={cat.id} style={styles.distLegendItem}>
                    <View style={[styles.distDot, { backgroundColor: cat.color }]} />
                    <View>
                      <Text style={styles.distName}>{cat.id}</Text>
                      <Text style={[styles.distPct, { color: cat.color }]}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Empty state ── */}
        {txCount === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="bar-chart-outline" size={64} color={THEME.colors.textSecondary} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyTitle}>Sin datos en este período</Text>
            <Text style={styles.emptySub}>Añade movimientos para ver el análisis</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: TOP,
    paddingBottom: 16,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  headerSub: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.accent + '50',
    backgroundColor: THEME.colors.accent + '10',
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.accent,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  kpiRow: {
    flexDirection: 'row',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 20,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 20,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  topBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Balance visual
  balanceVisual: {
    gap: 4,
  },
  bvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bvLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  bvDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bvLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  bvVal: {
    width: 50,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  // Category
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  catIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  catAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  catBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catPct: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    width: 32,
    textAlign: 'right',
  },
  // Stacked bar
  stackedBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  distLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  distLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 90,
  },
  distDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  distPct: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Empty
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: TOP,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  emptySub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    opacity: 0.6,
  },
});
