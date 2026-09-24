import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { calculateCashFlow } from '../logic/cashFlow';
import { getCategoryIcon, getCategoryColor, sortByDateDesc } from '../logic/helpers';
import ScreenHeader from '../components/ScreenHeader';


export default function DataEntryScreen({ transactions, onEdit, onDelete, userName, categories, incomeCategories, onGoToHistory }) {
  const [timeFilter, setTimeFilter] = useState('month');
  const [showBalance, setShowBalance] = useState(true);
  const [displayBalance, setDisplayBalance] = useState(0);
  const displayBalanceRef = useRef(0); // valor mostrado en cada momento (para no partir de uno viejo)
  const balanceAnim = useRef(new Animated.Value(1)).current;

  // Efecto para animar el balance cuando cambia
  useEffect(() => {
    const target = calculateCashFlow(transactions, timeFilter).netBalance;

    // Animación de escala/opacidad
    Animated.sequence([
      Animated.timing(balanceAnim, { toValue: 0.8, duration: 100, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(balanceAnim, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();

    // Contador animado desde el valor que se está mostrando ahora mismo
    const start = displayBalanceRef.current;
    if (start === target) return;

    const duration = 800;
    const startTime = Date.now();
    let frameId;

    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      // Easing out expo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + (target - start) * easeProgress;

      displayBalanceRef.current = current;
      setDisplayBalance(current);

      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    // Si cambia el filtro a mitad o se sale de la pantalla, se cancela la animación
    return () => cancelAnimationFrame(frameId);
  }, [timeFilter, transactions, balanceAnim]);

  const cashFlow = calculateCashFlow(transactions, timeFilter);
  const firstName = (userName || '').trim().split(/\s+/)[0];
  // "jueves, 24 de septiembre"
  const todayLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.container}>
      <ScreenHeader
        eyebrow={todayLabel}
        title={`Hola, ${firstName || 'de nuevo'}`}
        right={
          <TouchableOpacity
            style={styles.topIconBtn}
            onPress={onGoToHistory}
            accessibilityLabel="Buscar movimientos"
          >
            <Ionicons name="search-outline" size={20} color={THEME.colors.ink} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Giant Balance Hero */}
        <View style={styles.balanceHero}>
          <TouchableOpacity 
            style={styles.eyeBtn} 
            onPress={() => setShowBalance(!showBalance)}
          >
            <Ionicons 
              name={showBalance ? "eye-outline" : "eye-off-outline"} 
              size={18} 
              color={THEME.colors.onAccent} 
            />
          </TouchableOpacity>

          <Text style={styles.heroLabel}>
            Balance {timeFilter === 'all' ? 'Total' : timeFilter === 'week' ? 'de la Semana' : timeFilter === 'month' ? 'del Mes' : 'del Año'}
          </Text>
          
          {showBalance ? (
            <Animated.Text style={[
              styles.heroAmount,
              { 
                opacity: balanceAnim, 
                transform: [{ scale: balanceAnim }],
                color: THEME.colors.onAccent 
              }
            ]}>
              {displayBalance >= 0 ? '+' : ''}{displayBalance.toFixed(2)}€
            </Animated.Text>
          ) : (
            <View style={styles.blurredBalanceContainer}>
              <Text style={styles.blurredBalanceText}>••••••</Text>
            </View>
          )}
          
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Ionicons name="arrow-up-circle" size={20} color={THEME.colors.success} />
              <View style={{marginLeft: 8}}>
                <Text style={styles.heroStatLabel}>Ingresos</Text>
                <Text style={styles.heroStatValue}>
                  {showBalance ? `${cashFlow.totalIncome.toFixed(2)}€` : '•••€'}
                </Text>
              </View>
            </View>
            <View style={styles.heroStat}>
              <Ionicons name="arrow-down-circle" size={20} color={THEME.colors.error} />
              <View style={{marginLeft: 8}}>
                <Text style={styles.heroStatLabel}>Gastos</Text>
                <Text style={styles.heroStatValue}>
                  {showBalance ? `${cashFlow.totalExpenseNet.toFixed(2)}€` : '•••€'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterBar}>
          {['all', 'week', 'month', 'year'].map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterChip, timeFilter === f && styles.filterChipActive]}
              onPress={() => setTimeFilter(f)}
            >
              <Text style={[styles.filterChipText, timeFilter === f && styles.filterChipTextActive]}>
                {f === 'all' ? 'Todo' : f === 'week' ? 'Semana' : f === 'month' ? 'Mes' : 'Año'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions list */}
        <View style={styles.historyList}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
            <TouchableOpacity onPress={onGoToHistory}>
              <Text style={styles.verTodoLink}>Ver Todo</Text>
            </TouchableOpacity>
          </View>
          {sortByDateDesc(cashFlow.transactions).slice(0, 15).map(tx => {
            const catColor = getCategoryColor(tx.category, tx.type, categories, incomeCategories);
            const catIcon = getCategoryIcon(tx.category, tx.type, categories, incomeCategories);
            const isIncome = tx.type === 'income';
            return (
              <View key={tx.id} style={styles.transactionCard}>
                <View style={[styles.txIconContainer, { backgroundColor: catColor + '18' }]}>
                  <Ionicons name={catIcon} size={22} color={catColor} />
                </View>

                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{tx.description}</Text>
                  <View style={styles.txMeta}>
                    <View style={[styles.catChip, { backgroundColor: catColor + '18' }]}>
                      <Text style={[styles.catChipText, { color: catColor }]}>{isIncome ? 'Ingreso' : tx.category}</Text>
                    </View>
                    <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</Text>
                  </View>
                </View>

                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: isIncome ? THEME.colors.success : THEME.colors.error }]}>
                    {isIncome ? '+' : '-'}{tx.amount.toFixed(2)}€
                  </Text>
                  <View style={styles.txActions}>
                    <TouchableOpacity onPress={() => onEdit(tx)} style={styles.txActionBtn}>
                      <Ionicons name="pencil-outline" size={16} color={THEME.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(tx.id)} style={styles.txActionBtn}>
                      <Ionicons name="trash-outline" size={16} color={THEME.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
          {transactions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={THEME.colors.border} />
              <Text style={styles.emptyText}>No hay registros aún</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  balanceHero: {
    backgroundColor: THEME.colors.accent,
    borderRadius: 35,
    padding: 30,
    marginTop: 10,
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  heroLabel: {
    color: THEME.colors.onAccent,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  eyeBtn: {
    position: 'absolute',
    top: 20,
    right: 25,
    padding: 8,
    zIndex: 10,
  },
  blurredBalanceContainer: {
    height: 72, // Match actual height roughly
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  blurredBalanceText: {
    color: THEME.colors.onAccent,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 8,
  },
  heroAmount: {
    color: THEME.colors.onAccent,
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 15,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(247, 243, 234, 0.2)',
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroStatLabel: {
    color: THEME.colors.onAccent,
    fontSize: 11,
    fontWeight: '600',
  },
  heroStatValue: {
    color: THEME.colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
  filterBar: {
    flexDirection: 'row',
    marginTop: 30,
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 15,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.accent,
  },
  filterChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: THEME.colors.onAccent,
  },
  historyList: {
    marginTop: 35,
  },
  sectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  verTodoLink: {
    color: THEME.colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: 22,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  txIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 15,
  },
  txTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catChipText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  txDate: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  txActions: {
    flexDirection: 'row',
    marginTop: 6,
  },
  txActionBtn: {
    padding: 4,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    marginTop: 15,
    fontWeight: '600',
  }
});
