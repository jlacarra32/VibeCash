import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Animated, ScrollView, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { calculateCashFlow } from '../logic/cashFlow';

export default function DataEntryScreen({ transactions, setTransactions, onEdit, userName, categories, incomeCategories }) {
  const [timeFilter, setTimeFilter] = useState('month');
  const balanceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(balanceAnim, { toValue: 0.5, duration: 100, useNativeDriver: true }),
      Animated.timing(balanceAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
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
    Alert.alert(
      "Borrar Movimiento",
      "¿Estás seguro de que quieres eliminar este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: "destructive", onPress: () => {
          setTransactions(prev => prev.filter(t => t.id !== id));
        }}
      ]
    );
  };

  const getCategoryIcon = (catId, type) => {
    const list = (type === 'income' ? incomeCategories : categories) || [];
    const cat = list.find(c => c.id === catId);
    return cat ? cat.icon : '📦';
  };

  const getCategoryColor = (catId, type) => {
    const list = (type === 'income' ? incomeCategories : categories) || [];
    const cat = list.find(c => c.id === catId);
    return cat ? cat.color : THEME.colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeTitle}>¡Hola!</Text>
          <Text style={styles.userName}>{userName || 'Usuario'}</Text>
        </View>
        <View style={styles.topIconBtn}>
          <Ionicons name="leaf-outline" size={24} color={THEME.colors.accent} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Giant Balance Hero */}
        <View style={styles.balanceHero}>
          <Text style={styles.heroLabel}>
            Balance {timeFilter === 'all' ? 'Total' : timeFilter === 'week' ? 'de la Semana' : timeFilter === 'month' ? 'del Mes' : 'del Año'}
          </Text>
          <Animated.Text style={[styles.heroAmount, { opacity: balanceAnim }]}>
            {cashFlow.netBalance.toFixed(2)}€
          </Animated.Text>
          
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Ionicons name="arrow-up-circle" size={20} color={THEME.colors.success} />
              <View style={{marginLeft: 8}}>
                <Text style={styles.heroStatLabel}>Ingresos</Text>
                <Text style={styles.heroStatValue}>{cashFlow.totalIncome.toFixed(0)}€</Text>
              </View>
            </View>
            <View style={styles.heroStat}>
              <Ionicons name="arrow-down-circle" size={20} color={THEME.colors.error} />
              <View style={{marginLeft: 8}}>
                <Text style={styles.heroStatLabel}>Gastos</Text>
                <Text style={styles.heroStatValue}>{cashFlow.totalExpenseNet.toFixed(0)}€</Text>
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
          <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
          {(transactions || []).slice().reverse().map(tx => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={[styles.txIconContainer, { backgroundColor: getCategoryColor(tx.category, tx.type) + '15' }]}>
                <Text style={{fontSize: 18}}>{getCategoryIcon(tx.category, tx.type)}</Text>
              </View>
              
              <View style={styles.txInfo}>
                <Text style={styles.txTitle}>{tx.description}</Text>
                <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</Text>
              </View>

              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? THEME.colors.success : THEME.colors.textPrimary }]}>
                  {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)}€
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
          ))}
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  welcomeTitle: {
    color: THEME.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    color: THEME.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
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
    marginBottom: 20,
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
  },
  txDate: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
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
