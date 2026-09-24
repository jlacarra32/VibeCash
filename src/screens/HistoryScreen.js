import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { sortByDateDesc, groupByDay } from '../logic/helpers';
import { formatMoney, formatDayLabel } from '../logic/format';
import TransactionRow from '../components/TransactionRow';
import EmptyState from '../components/EmptyState';

// Cuántos movimientos se pintan de golpe (luego "Ver más")
const PAGE = 60;

/** Lista completa de movimientos con buscador y filtros (vista "Lista"). */
export default function HistoryScreen({ transactions, categories, incomeCategories, onOpen }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [limit, setLimit] = useState(PAGE);

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortByDateDesc((transactions || []).filter(tx => {
      const matchesSearch = !q
        || (tx.description || '').toLowerCase().includes(q)
        || (tx.category || '').toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesCat = !selectedCategory || tx.category === selectedCategory;
      return matchesSearch && matchesType && matchesCat;
    }));
  }, [transactions, search, typeFilter, selectedCategory]);

  const filteredIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const filteredExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const groups = groupByDay(filteredTransactions.slice(0, limit));
  const count = filteredTransactions.length;

  const setType = (key) => { setTypeFilter(key); setSelectedCategory(null); setLimit(PAGE); };
  const toggleCategory = (id) => { setSelectedCategory(prev => (prev === id ? null : id)); setLimit(PAGE); };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Buscador */}
      <View style={styles.search}>
        <Ionicons name="search-outline" size={17} color={THEME.colors.inkSoft} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar"
          placeholderTextColor={THEME.colors.inkFaint}
          value={search}
          onChangeText={(v) => { setSearch(v); setLimit(PAGE); }}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Borrar búsqueda">
            <Ionicons name="close-circle" size={17} color={THEME.colors.inkFaint} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros: tipo y categoría en una sola fila */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}
      >
        {[
          { key: 'all', label: 'Todo' },
          { key: 'expense', label: 'Gastos' },
          { key: 'income', label: 'Ingresos' },
        ].map(f => {
          const active = typeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setType(f.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
        {typeFilter !== 'income' && (categories || []).length > 0 && <View style={styles.filtersDivider} />}
        {typeFilter !== 'income' && (categories || []).map(cat => {
          const active = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
              onPress={() => toggleCategory(cat.id)}
            >
              <View style={[styles.chipDot, { backgroundColor: active ? THEME.colors.onAccent : cat.color }]} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.id}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Resumen de lo filtrado */}
      <Text style={styles.summary}>
        {count} {count === 1 ? 'movimiento' : 'movimientos'}
        {filteredIncome > 0 ? <Text style={{ color: THEME.colors.income }}>{`  ·  ${formatMoney(filteredIncome, { sign: 'always' })}`}</Text> : null}
        {filteredExpense > 0 ? `  ·  ${formatMoney(-filteredExpense)}` : ''}
      </Text>

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

      {count > limit && (
        <TouchableOpacity style={styles.more} onPress={() => setLimit(l => l + PAGE)}>
          <Text style={styles.moreText}>Ver más</Text>
        </TouchableOpacity>
      )}

      {count === 0 && (
        (transactions || []).length === 0
          ? <EmptyState title="Todavía no hay movimientos" message="Cuando apuntes algo, aparecerá aquí." />
          : <EmptyState title="Sin resultados" message="Prueba con otra búsqueda o quita algún filtro." />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: THEME.layout.gutter,
    paddingBottom: 120,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.space.sm,
    backgroundColor: THEME.colors.sunken,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.space.md,
  },
  searchInput: {
    ...THEME.text.body,
    flex: 1,
    paddingVertical: 11,
    outlineStyle: 'none',
  },
  filtersScroll: {
    marginHorizontal: -THEME.layout.gutter,
    marginTop: THEME.space.md,
  },
  filters: {
    paddingHorizontal: THEME.layout.gutter,
    gap: THEME.space.sm,
    alignItems: 'center',
  },
  filtersDivider: {
    width: 1,
    height: 20,
    backgroundColor: THEME.colors.hairline,
    marginHorizontal: THEME.space.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
  },
  chipActive: {
    backgroundColor: THEME.colors.ink,
    borderColor: THEME.colors.ink,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    color: THEME.colors.ink,
  },
  chipTextActive: {
    color: THEME.colors.onAccent,
  },
  summary: {
    ...THEME.text.small,
    marginTop: THEME.space.lg,
    fontVariant: ['tabular-nums'],
  },
  group: {
    marginTop: THEME.space.lg,
  },
  groupLabel: {
    ...THEME.text.label,
    marginBottom: THEME.space.xs,
  },
  more: {
    alignSelf: 'center',
    marginTop: THEME.space.lg,
    paddingVertical: 10,
    paddingHorizontal: THEME.space.xl,
  },
  moreText: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    color: THEME.colors.accent,
  },
});
