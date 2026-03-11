import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { getCategoryColor, getCategoryIcon } from '../logic/helpers';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

export default function CalendarScreen({ transactions, categories, incomeCategories }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTx, setSelectedTx] = useState(null);

  const markedDates = useMemo(() => {
    const marks = {};
    transactions.forEach(t => {
      if (!t.date) return;
      const dateStr = t.date.split('T')[0];
      if (!marks[dateStr]) {
        marks[dateStr] = {
          marked: true,
          dotColor: t.type === 'income' ? THEME.colors.success : THEME.colors.accent,
        };
      } else if (marks[dateStr].dotColor !== (t.type === 'income' ? THEME.colors.success : THEME.colors.accent)) {
        marks[dateStr].dotColor = '#F39C12'; // Color mixto
      }
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: THEME.colors.accent,
        selectedTextColor: '#FFF',
      };
    }
    return marks;
  }, [transactions, selectedDate]);

  const dailyTransactions = useMemo(() => {
    return transactions.filter(t => t.date && t.date.split('T')[0] === selectedDate);
  }, [transactions, selectedDate]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.header}>Historial</Text>
      
      <View style={styles.cardContainer}>
        <Calendar
          style={styles.calendar}
          theme={{
            backgroundColor: THEME.colors.background,
            calendarBackground: THEME.colors.surface,
            selectedDayBackgroundColor: THEME.colors.accent,
            selectedDayTextColor: '#FFF',
            todayTextColor: THEME.colors.accent,
            dayTextColor: '#FFF',
            textDisabledColor: THEME.colors.textSecondary,
            dotColor: THEME.colors.accent,
            selectedDotColor: '#FFF',
            arrowColor: THEME.colors.accent,
            monthTextColor: '#FFF',
            textDayHeaderFontWeight: '800',
            textMonthFontWeight: '800',
          }}
          markedDates={markedDates}
          onDayPress={day => setSelectedDate(day.dateString)}
          firstDay={1}
        />
      </View>

      <View style={styles.detailsList}>
        <Text style={styles.detailsTitle}>Movimientos del día</Text>
        {dailyTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No hay movimientos este día</Text>
        ) : (
          dailyTransactions.map(item => (
            <TouchableOpacity 
              key={item.id}
              style={styles.transactionCard}
              onPress={() => setSelectedTx(item)}
            >
              <View style={[styles.txIconContainer, { backgroundColor: getCategoryColor(item.category, item.type, categories, incomeCategories) + '15' }]}>
                <Ionicons 
                  name={getCategoryIcon(item.category, item.type, categories, incomeCategories)} 
                  size={22} 
                  color={getCategoryColor(item.category, item.type, categories, incomeCategories)} 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.txDesc}>{item.description}</Text>
                <Text style={styles.txDate}>{item.category}</Text>
              </View>
              <Text style={[styles.txAmount, { color: item.type === 'income' ? THEME.colors.success : THEME.colors.accent, fontWeight: 'bold' }]}>
                {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(2)}€
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Modal de Detalle */}
      <Modal
        visible={selectedTx !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedTx(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedTx(null)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle del Movimiento</Text>
              <TouchableOpacity onPress={() => setSelectedTx(null)}>
                <Ionicons name="close" size={24} color={THEME.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {selectedTx && (
              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Descripción:</Text>
                  <Text style={styles.modalValue}>{selectedTx.description}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Categoría:</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Ionicons 
                      name={getCategoryIcon(selectedTx.category, selectedTx.type, categories, incomeCategories)} 
                      size={18} 
                      color={getCategoryColor(selectedTx.category, selectedTx.type, categories, incomeCategories)} 
                      style={{marginRight: 6}}
                    />
                    <Text style={styles.modalValue}>{selectedTx.category}</Text>
                  </View>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Importe:</Text>
                  <Text style={[styles.modalValue, { color: selectedTx.type === 'income' ? THEME.colors.success : THEME.colors.accent, fontWeight: 'bold' }]}>
                    {selectedTx.type === 'income' ? '+' : '-'}{selectedTx.amount.toFixed(2)}€
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Tipo:</Text>
                  <Text style={styles.modalValue}>{selectedTx.type === 'income' ? 'Ingreso' : 'Gasto'}</Text>
                </View>
                 <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Fecha:</Text>
                  <Text style={styles.modalValue}>{new Date(selectedTx.date).toLocaleDateString()}</Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingTop: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  cardContainer: {
    marginHorizontal: 20,
    backgroundColor: THEME.colors.surface,
    borderRadius: 30,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 25,
  },
  calendar: {
    borderRadius: 20,
  },
  detailsList: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: THEME.colors.textSecondary,
    marginTop: 40,
    fontSize: 14,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  txCat: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  modalContent: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modalBody: {
    gap: 15,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    flex: 1,
  },
  modalValue: {
    fontSize: 15,
    color: THEME.colors.textPrimary,
    flex: 2,
    textAlign: 'right',
    fontWeight: '600',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
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
  txDate: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});

