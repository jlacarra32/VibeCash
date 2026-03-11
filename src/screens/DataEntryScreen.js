import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Platform, Alert } from 'react-native';

const TOP = Platform.OS === 'web' ? 20 : 50;
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { calculateCashFlow } from '../logic/cashFlow';
import { getCategoryIcon, getCategoryColor } from '../logic/helpers';

export default function DataEntryScreen({ transactions, setTransactions, onEdit, userName, categories, incomeCategories, onGoToHistory }) {
  const [timeFilter, setTimeFilter] = useState('month');
  const [showBalance, setShowBalance] = useState(true);
  const [displayBalance, setDisplayBalance] = useState(0);
  const balanceAnim = useRef(new Animated.Value(1)).current;

  // Efecto para animar el balance cuando cambia
  useEffect(() => {
    const cashFlow = calculateCashFlow(transactions, timeFilter);
    const target = cashFlow.netBalance;
    
    // Animación de escala/opacidad
    Animated.sequence([
      Animated.timing(balanceAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(balanceAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Simulación de contador (micro-interacción)
    let start = displayBalance;
    const end = target;
    if (start === end) return;
    
    const duration = 800;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out expo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + (end - start) * easeProgress;
      
      setDisplayBalance(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [timeFilter, transactions]);

  const handleResetData = () => {
    Alert.alert(
      "Borrar Todo",
      "¿Estás seguro de que quieres borrar todos los datos?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: "destructive", onPress: () => setTransactions([]) }
      ]
    );
  };

  const cashFlow = calculateCashFlow(transactions, timeFilter);

  const deleteTransaction = (id) => {
    const performDelete = () => setTransactions(prev => prev.filter(t => t.id !== id));

    if (Platform.OS === 'web') {
      if (window.confirm("¿Estás seguro de que quieres eliminar este registro?")) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Borrar Movimiento",
        "¿Estás seguro de que quieres eliminar este registro?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Borrar", style: "destructive", onPress: performDelete }
        ]
      );
    }
  };



  return (
    <View style={styles.container}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>VibeCash</Text>
          <Text style={styles.signatureText}>por Javier Lacarra Rubio</Text>
          <Text style={styles.userName}>¡Hola, {userName || 'Usuario'}!</Text>
        </View>
        <TouchableOpacity style={styles.topIconBtn} onPress={onGoToHistory}>
          <Ionicons name="search-outline" size={24} color={THEME.colors.accent} />
        </TouchableOpacity>
      </View>

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
              color="rgba(255,255,255,0.6)" 
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
                color: cashFlow.netBalance >= 0 ? '#4ADE80' : '#FC8181' 
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
          {(cashFlow.transactions || []).slice().reverse().slice(0, 15).map(tx => {
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
                      <Text style={[styles.catChipText, { color: catColor }]}>{tx.category}</Text>
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
                    <TouchableOpacity onPress={() => deleteTransaction(tx.id)} style={styles.txActionBtn}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: TOP,
    paddingBottom: 20,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  signatureText: {
    fontSize: 10,
    color: THEME.colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: -2,
    marginBottom: 4,
  },
  userName: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  topIconBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: THEME.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
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
    color: 'rgba(255,255,255,0.7)',
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
    color: '#FFF',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 8,
  },
  heroAmount: {
    color: '#FFF',
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
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  heroStatValue: {
    color: '#FFF',
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
    color: '#FFF',
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
