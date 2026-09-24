import React from 'react';
import { View, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import ScreenHeader from '../components/ScreenHeader';
import Segmented from '../components/Segmented';
import HistoryScreen from './HistoryScreen';
import CalendarScreen from './CalendarScreen';

const VIEWS = [
  { key: 'list', label: 'Lista' },
  { key: 'calendar', label: 'Calendario' },
];

/** Pestaña "Movimientos": el historial y el calendario en una sola pantalla. */
export default function MovementsScreen({
  view, onViewChange,
  transactions, categories, incomeCategories,
  onOpen, onAddForDate, onSelectedDateChange,
}) {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Movimientos" />
      <Segmented
        options={VIEWS}
        value={view}
        onChange={onViewChange}
        style={styles.switcher}
      />
      <View style={styles.body}>
        {view === 'calendar' ? (
          <CalendarScreen
            transactions={transactions}
            categories={categories}
            incomeCategories={incomeCategories}
            onAddForDate={onAddForDate}
            onSelectedDateChange={onSelectedDateChange}
            onOpen={onOpen}
          />
        ) : (
          <HistoryScreen
            transactions={transactions}
            categories={categories}
            incomeCategories={incomeCategories}
            onOpen={onOpen}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  switcher: {
    marginHorizontal: THEME.layout.gutter,
    marginBottom: THEME.space.md,
  },
  body: {
    flex: 1,
  },
});
