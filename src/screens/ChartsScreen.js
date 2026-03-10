import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, CATEGORIES } from '../constants/theme';
import { calculateCashFlow } from '../logic/cashFlow';

export default function ChartsScreen({ transactions, categories }) {
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
    Animated.timing(animValue, {
      toValue: 1,
      duration: 1000,
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
        <View style={styles.chartSection}>
          <View style={styles.chartWrapper}>
            {/* Income Column */}
            <View style={styles.columnBox}>
              <View style={styles.barContainer}>
                <Animated.View style={[styles.barFill, { height: animatedIncomeHeight, backgroundColor: THEME.colors.success }]}>
                   <View style={styles.glow} />
                </Animated.View>
              </View>
              <Text style={styles.barLabel}>Ingresos</Text>
              <Text style={styles.barValue}>{cashFlow.totalIncome.toFixed(0)}€</Text>
            </View>

            {/* Expense Column */}
            <View style={styles.columnBox}>
              <View style={styles.barContainer}>
                <Animated.View style={[styles.barFill, { height: animatedExpenseHeight, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }]}>
                  {categories.map(cat => {
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
              <Text style={styles.barValue}>{displayExpense.toFixed(0)}€</Text>
            </View>
          </View>

          <View style={styles.legendContainer}>
            {categories.map(cat => (
              <View key={cat.id} style={styles.legendTag}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.legendName}>{cat.id}</Text>
              </View>
            ))}
          </View>
        </View>

        {displayExpense > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Distribución Mensual</Text>
            {categories.map(cat => {
              const amountFloat = displayCategories[cat.id] || 0;
              if (amountFloat <= 0) return null;
              const percentage = ((amountFloat / displayExpense) * 100).toFixed(0);
              return (
                <View key={cat.id} style={styles.listLine}>
                  <View style={[styles.iconCircle, { backgroundColor: cat.color + '15' }]}>
                    <Ionicons name={cat.icon} size={18} color={cat.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{cat.id}</Text>
                      <Text style={styles.rowVal}>{amountFloat.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: percentage + '%', backgroundColor: cat.color }]} />
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
    paddingBottom: 120,
  },
  chartSection: {
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 300,
    alignItems: 'flex-end',
  },
  columnBox: {
    alignItems: 'center',
    width: 120,
  },
  barContainer: {
    width: 60,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 30,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 15,
  },
  barFill: {
    width: '100%',
    borderRadius: 30,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 40,
  },
  legendTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  legendName: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  listSection: {
    paddingHorizontal: 25,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 25,
  },
  listLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  rowVal: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.accent,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  }
});
