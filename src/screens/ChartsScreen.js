import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, CATEGORIES } from '../constants/theme';
import { calculateCashFlow } from '../logic/cashFlow';

export default function ChartsScreen({ transactions }) {
  const [activeTab, setActiveTab] = useState('real'); // 'real' o 'total'
  const cashFlow = calculateCashFlow(transactions);

  const isReal = activeTab === 'real';
  const displayExpense = isReal ? cashFlow.totalExpenseNet : cashFlow.totalExpense;
  const displayCategories = isReal ? cashFlow.categoryTotalsNet : cashFlow.categoryTotals;

  const maxAmount = Math.max(cashFlow.totalIncome, displayExpense, 1);
  const incomeBarHeight = (cashFlow.totalIncome / maxAmount) * 100;
  const expenseBarHeight = (displayExpense / maxAmount) * 100;

  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animValue.setValue(0);
    Animated.spring(animValue, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: false
    }).start();
  }, [cashFlow.totalIncome, displayExpense, activeTab]);

  const animatedIncomeHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${incomeBarHeight}%`]
  });

  const animatedExpenseHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${expenseBarHeight}%`]
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Análisis</Text>
          <Text style={styles.headerSub}>Balance {isReal ? 'Neto' : 'Total'}</Text>
        </View>
        <Text style={styles.headerBalance}>{cashFlow.netBalance.toFixed(2)}€</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, isReal && styles.tabActive]} 
          onPress={() => setActiveTab('real')}
        >
          <Text style={[styles.tabLabel, isReal && styles.tabLabelActive]}>Real</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, !isReal && styles.tabActive]} 
          onPress={() => setActiveTab('total')}
        >
          <Text style={[styles.tabLabel, !isReal && styles.tabLabelActive]}>Bruto</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainCard}>
          <View style={styles.chartWrapper}>
            {/* Income Bar */}
            <View style={styles.barBox}>
              <Text style={styles.barValue}>{cashFlow.totalIncome.toFixed(0)}€</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, { height: animatedIncomeHeight, backgroundColor: THEME.colors.success }]} />
              </View>
              <Text style={styles.barLabel}>Ingresos</Text>
            </View>

            {/* Expense Bar */}
            <View style={styles.barBox}>
              <Text style={styles.barValue}>{displayExpense.toFixed(0)}€</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, { height: animatedExpenseHeight, backgroundColor: THEME.colors.border, overflow: 'hidden' }]}>
                  {CATEGORIES.map(cat => {
                    const amount = displayCategories[cat.id] || 0;
                    if (amount <= 0 || displayExpense <= 0) return null;
                    const partHeight = (amount / displayExpense) * 100;
                    return (
                      <View 
                        key={cat.id} 
                        style={{ height: `${partHeight}%`, backgroundColor: cat.color, width: '100%' }} 
                      />
                    );
                  })}
                </Animated.View>
              </View>
              <Text style={styles.barLabel}>Gastos</Text>
            </View>
          </View>

          <View style={styles.legendGrid}>
            {CATEGORIES.map(cat => (
              <View key={cat.id} style={styles.legendCell}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.legendName}>{cat.id}</Text>
              </View>
            ))}
          </View>
        </View>

        {displayExpense > 0 && (
          <View style={styles.breakdownCard}>
            <Text style={styles.cardTitle}>Desglose de Gastos</Text>
            {CATEGORIES.map(cat => {
              const amountFloat = displayCategories[cat.id] || 0;
              if (amountFloat <= 0) return null;
              const percentage = ((amountFloat / displayExpense) * 100).toFixed(0);
              return (
                <View key={cat.id} style={styles.catLine}>
                  <View style={[styles.catIconCircle, { backgroundColor: cat.color + '15' }]}>
                    <Ionicons name={cat.icon} size={16} color={cat.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.catLabelRow}>
                      <Text style={styles.catName}>{cat.id}</Text>
                      <Text style={styles.catVal}>{amountFloat.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: percentage + '%', backgroundColor: cat.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 25,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSub: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  headerBalance: {
    color: THEME.colors.success,
    fontSize: 20,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 15,
  },
  tabActive: {
    backgroundColor: THEME.colors.accent,
  },
  tabLabel: {
    color: THEME.colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  tabLabelActive: {
    color: '#FFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  mainCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 30,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 180,
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  barBox: {
    alignItems: 'center',
    width: 80,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  barTrack: {
    width: 40,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 0,
  },
  barLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  legendCell: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendName: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  breakdownCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 20,
  },
  catLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  catVal: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.accent,
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  }
});
