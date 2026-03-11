import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { getCategoryIcon, getCategoryColor } from '../logic/helpers';

const TOP = Platform.OS === 'web' ? 20 : 50;

export default function HistoryScreen({ transactions, categories, incomeCategories, onEdit, onDelete, onBack }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
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

  const allCats = typeFilter === 'income'
    ? incomeCategories
    : typeFilter === 'expense'
    ? categories
    : [...categories, ...incomeCategories];
  const uniqueCats = Array.from(new Map(allCats.map(item => [item.id, item])).values());

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explorador</Text>
        <View style={{ width: 40 }} />
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

      {/* Scrollable filters + list together */}
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={THEME.colors.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar descripción..."
            placeholderTextColor={THEME.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Type Filters */}
        <View style={styles.typeFilterRow}>
          {[
            { key: 'all', label: 'Todos', icon: 'layers-outline' },
            { key: 'expense', label: 'Gastos', icon: 'trending-down-outline' },
            { key: 'income', label: 'Ingresos', icon: 'trending-up-outline' },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.typeChip, typeFilter === f.key && styles.typeChipActive]}
              onPress={() => { setTypeFilter(f.key); setSelectedCategory(null); }}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={typeFilter === f.key ? '#FFF' : THEME.colors.textSecondary}
              />
              <Text style={[styles.typeChipText, typeFilter === f.key && styles.typeChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category filter grid — wrapped, vertical scroll */}
        <View style={styles.catSection}>
          <Text style={styles.catSectionLabel}>Categoría</Text>
          <View style={styles.catGrid}>
            <TouchableOpacity
              style={[styles.catCard, !selectedCategory && styles.catCardActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <View style={[styles.catCardIcon, !selectedCategory && { backgroundColor: THEME.colors.accent + '30' }]}>
                <Ionicons name="apps-outline" size={18} color={!selectedCategory ? THEME.colors.accent : THEME.colors.textSecondary} />
              </View>
              <Text style={[styles.catCardText, !selectedCategory && { color: THEME.colors.accent }]}>Todas</Text>
            </TouchableOpacity>

            {uniqueCats.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catCard, isActive && { borderColor: cat.color, backgroundColor: cat.color + '12' }]}
                  onPress={() => setSelectedCategory(isActive ? null : cat.id)}
                >
                  <View style={[styles.catCardIcon, { backgroundColor: cat.color + (isActive ? '30' : '15') }]}>
                    <Ionicons name={cat.icon || 'ellipse-outline'} size={18} color={cat.color} />
                  </View>
                  <Text style={[styles.catCardText, isActive && { color: cat.color, fontWeight: '800' }]}>
                    {cat.id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Transaction list */}
        <View style={styles.listContent}>
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
                    <View style={[styles.txCatChip, { backgroundColor: catColor + '18' }]}>
                      <Text style={[styles.txCatChipText, { color: catColor }]}>{tx.category}</Text>
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
                      <Ionicons name="pencil-outline" size={15} color={THEME.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(tx.id)} style={styles.txActionBtn}>
                      <Ionicons name="trash-outline" size={15} color={THEME.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          {filteredTransactions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={52} color={THEME.colors.border} style={{ opacity: 0.4 }} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyText}>Prueba con otro filtro o búsqueda</Text>
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
    paddingTop: TOP,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
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
  summaryStrip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  summaryValueNeutral: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
  },
  typeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 18,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
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
    fontSize: 12,
    fontWeight: '700',
  },
  typeChipTextActive: {
    color: '#FFF',
  },
  // Category grid
  catSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  catSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  catCardActive: {
    borderColor: THEME.colors.accent,
    backgroundColor: THEME.colors.accent + '12',
  },
  catCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  // Transaction list
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  txIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txCatChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txCatChipText: {
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
    fontSize: 15,
    fontWeight: '800',
  },
  txActions: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 4,
  },
  txActionBtn: {
    padding: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    color: THEME.colors.textSecondary,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    opacity: 0.6,
  },
});
