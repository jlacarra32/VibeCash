import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { getCategoryIcon, getCategoryColor } from '../logic/helpers';

export default function HistoryScreen({ transactions, categories, incomeCategories, onEdit, onDelete, onBack }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'expense', 'income'
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesCat = !selectedCategory || tx.category === selectedCategory;
      return matchesSearch && matchesType && matchesCat;
    }).slice().reverse();
  }, [transactions, search, typeFilter, selectedCategory]);

  const filteredIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const filteredExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const allCats = typeFilter === 'income' ? incomeCategories : (typeFilter === 'expense' ? categories : [...categories, ...incomeCategories]);
  // Remove duplicates if any (by id)
  const uniqueCats = Array.from(new Map(allCats.map(item => [item.id, item])).values());



  return (
    <View style={styles.container}>
      {/* Header with Back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explorador</Text>
        <View style={{width: 40}} />
      </View>

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Resultados</Text>
          <Text style={styles.summaryValueNeutral}>{filteredTransactions.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ingresos</Text>
          <Text style={[styles.summaryValue, { color: THEME.colors.success }]}>+{filteredIncome.toFixed(0)}€</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Gastos</Text>
          <Text style={[styles.summaryValue, { color: THEME.colors.error }]}>-{filteredExpense.toFixed(0)}€</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={THEME.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar descripción..."
          placeholderTextColor={THEME.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={THEME.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filters */}
      <View style={styles.typeFilterRow}>
        {['all', 'expense', 'income'].map(t => (
          <TouchableOpacity 
            key={t}
            style={[styles.typeChip, typeFilter === t && styles.typeChipActive]}
            onPress={() => { setTypeFilter(t); setSelectedCategory(null); }}
          >
            <Text style={[styles.typeChipText, typeFilter === t && styles.typeChipTextActive]}>
              {t === 'all' ? 'Todos' : t === 'expense' ? 'Gastos' : 'Ingresos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter Scroll */}
      <View style={{ marginBottom: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          <TouchableOpacity 
            style={[styles.catChip, !selectedCategory && styles.catChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.catChipText, !selectedCategory && styles.catChipTextActive]}>Todas</Text>
          </TouchableOpacity>
          {uniqueCats.map(cat => (
            <TouchableOpacity 
              key={cat.id}
              style={[
                styles.catChip, 
                selectedCategory === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }
              ]}
              onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
            >
              <Ionicons name={cat.icon} size={16} color={selectedCategory === cat.id ? cat.color : THEME.colors.textSecondary} />
              <Text style={[
                styles.catChipText, 
                selectedCategory === cat.id && { color: cat.color, fontWeight: '800' }
              ]}>{cat.id}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredTransactions.map(tx => {
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
                  <TouchableOpacity onPress={() => onDelete(tx.id)} style={styles.txActionBtn}>
                    <Ionicons name="trash-outline" size={16} color={THEME.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {filteredTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={60} color={THEME.colors.border} />
            <Text style={styles.emptyText}>No se encontraron movimientos</Text>
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
    paddingTop: 60,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 25,
    borderRadius: 18,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 55,
    color: '#FFF',
    fontSize: 16,
  },
  typeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    gap: 10,
    marginBottom: 15,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  typeChipActive: {
    backgroundColor: THEME.colors.accent,
    borderColor: THEME.colors.accent,
  },
  typeChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  typeChipTextActive: {
    color: '#FFF',
  },
  catScroll: {
    paddingHorizontal: 25,
    gap: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  catChipActive: {
    borderColor: THEME.colors.accent,
  },
  catChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: THEME.colors.accent,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 25,
    paddingBottom: 120,
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
  summaryStrip: {
    flexDirection: 'row',
    marginHorizontal: 25,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 10,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  summaryValueNeutral: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
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
    paddingVertical: 80,
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    marginTop: 15,
    fontWeight: '600',
  }
});
