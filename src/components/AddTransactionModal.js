import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Modal, Platform, KeyboardAvoidingView, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { THEME } from '../constants/theme';
import { toLocalDateKey, fromLocalDateKey, isValidDate } from '../logic/dates';
import { showAlert } from '../logic/dialogs';

// defaultDate: fecha con la que se abre un movimiento NUEVO (p. ej. el día
// elegido en el calendario). Si no se pasa, se usa hoy.
export default function AddTransactionModal({ visible, onClose, onSave, initialData, defaultDate, categories, incomeCategories }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); 
  const [category, setCategory] = useState('Comida');
  const [isShared, setIsShared] = useState(false);
  const [myPart, setMyPart] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      // Defensivo: movimientos de versiones antiguas pueden no tener todos los campos
      const txType = initialData.type === 'income' ? 'income' : 'expense';
      setDescription(initialData.description || '');
      setAmount(initialData.amount != null ? String(initialData.amount) : '');
      setType(txType);
      setCategory(txType === 'income' ? 'Ingreso' : (initialData.category || ''));
      setIsShared(!!initialData.isShared);
      setMyPart(initialData.myPart != null ? String(initialData.myPart) : '');
      setDate(isValidDate(initialData.date) ? new Date(initialData.date) : new Date());
    } else {
      resetForm();
    }
    // Solo se rellena/limpia al abrir o cambiar el movimiento a editar; no al
    // cambiar tipo o categorías mientras el usuario escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, visible, defaultDate]);

  // Estado del selector de fecha
  const selectedKey = toLocalDateKey(date);
  const todayKey = toLocalDateKey(new Date());
  const yesterdayKey = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return toLocalDateKey(d); })();
  const dateMode = selectedKey === todayKey ? 'today' : selectedKey === yesterdayKey ? 'yesterday' : 'other';
  const otherDateLabel = dateMode === 'other' && isValidDate(date)
    ? date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : 'Otra fecha';
  const fullDateLabel = isValidDate(date)
    ? date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const handleSave = () => {
    const normalizedAmount = amount.replace(',', '.');
    if (!description || !normalizedAmount || isNaN(parseFloat(normalizedAmount))) {
      showAlert('Faltan datos', 'Por favor rellena descripción y un importe válido');
      return;
    }

    const totalAmount = parseFloat(normalizedAmount);
    if (totalAmount <= 0) {
      showAlert('Importe no válido', 'El importe tiene que ser mayor que 0');
      return;
    }
    const myPartValue = (type === 'expense' && isShared) ? parseFloat(myPart.replace(',', '.') || normalizedAmount) : totalAmount;
    if (isNaN(myPartValue) || myPartValue > totalAmount) {
      showAlert('Tu parte no es válida', 'Tu parte no puede ser mayor que el importe total');
      return;
    }
    const refund = (type === 'expense' && isShared) ? Math.max(0, totalAmount - myPartValue) : 0;

    const newTx = {
      id: initialData ? initialData.id : Date.now().toString(),
      description,
      amount: totalAmount,
      isShared: type === 'expense' ? isShared : false,
      myPart: myPartValue,
      refundAmount: refund,
      type,
      category: type === 'income' ? 'Ingreso' : category,
      date: (isValidDate(date) ? date : new Date()).toISOString(),
    };

    onSave(newTx);
    onClose();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setIsShared(false);
    setMyPart('');
    setDate(defaultDate && isValidDate(defaultDate) ? new Date(defaultDate) : new Date());
    setCategory(type === 'expense' ? (categories[0]?.id || '') : 'Ingreso');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalOverlay}
      >
        {/* Tap outside to close */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalContent}>
          {/* Drag handle */}
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initialData ? 'Editar Registro' : 'Nuevo Registro'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type Selector */}
            <View style={styles.typeRow}>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
                onPress={() => { setType('income'); setCategory('Ingreso'); }}
              >
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Ingreso</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
                onPress={() => { setType('expense'); setCategory(categories[0]?.id || ''); }}
              >
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Gasto</Text>
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input}
              placeholder={type === 'income' ? "¿De dónde viene este dinero?" : "¿En qué lo has gastado?"}
              placeholderTextColor={THEME.colors.textTertiary}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.amountGroup}>
              <TextInput 
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="0.00"
                placeholderTextColor={THEME.colors.textTertiary}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(val) => {
                  // Permitir números, puntos y comas
                  // Solo permitir un separador (punto o coma)
                  if ((val.split(/[.,]/).length - 1) > 1) return;
                  // Regex que permite números y opcionalmente un punto o coma al final o en medio
                  if (val !== '' && !/^\d*[.,]?\d*$/.test(val)) return;
                  setAmount(val);
                }}
              />
              {type === 'expense' && (
                <TouchableOpacity 
                  style={[styles.sharedBtn, isShared && styles.sharedBtnActive]}
                  onPress={() => setIsShared(!isShared)}
                >
                  <Ionicons name="people" size={20} color={isShared ? THEME.colors.onAccent : THEME.colors.accent} />
                </TouchableOpacity>
              )}
            </View>

            {isShared && (
               <TextInput 
                  style={[styles.input, { marginTop: 15, borderColor: THEME.colors.accent }]}
                  placeholder="Tu parte (Dime solo cuánto pagas tú)"
                  placeholderTextColor={THEME.colors.textTertiary}
                  keyboardType="decimal-pad"
                  value={myPart}
                  onChangeText={(val) => {
                    if ((val.split(/[.,]/).length - 1) > 1) return;
                    if (val !== '' && !/^\d*[.,]?\d*$/.test(val)) return;
                    setMyPart(val);
                  }}
               />
            )}

            {/* Category selection */}
            {type === 'expense' && (
              <>
                <Text style={styles.label}>Categoría</Text>
                <View style={styles.categoryGrid}>
                  {(categories || []).map(cat => (
                    <TouchableOpacity 
                      key={cat.id} 
                      style={[styles.catItem, category === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Ionicons 
                        name={cat.icon || 'cart-outline'} 
                        size={20} 
                        color={category === cat.id ? cat.color : THEME.colors.textTertiary} 
                      />
                      <Text style={[styles.catText, category === cat.id && { color: cat.color }]}>{cat.id}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Fecha: accesos rápidos Hoy / Ayer y "Otra fecha" que abre el
                calendario del sistema directamente, sin pasos intermedios */}
            <Text style={styles.label}>Fecha</Text>
            <View style={styles.dateChips}>
              <TouchableOpacity
                style={[styles.dateChip, dateMode === 'today' && styles.dateChipActive]}
                onPress={() => setDate(new Date())}
              >
                <Text style={[styles.dateChipText, dateMode === 'today' && styles.dateChipTextActive]}>Hoy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateChip, dateMode === 'yesterday' && styles.dateChipActive]}
                onPress={() => setDate(fromLocalDateKey(yesterdayKey))}
              >
                <Text style={[styles.dateChipText, dateMode === 'yesterday' && styles.dateChipTextActive]}>Ayer</Text>
              </TouchableOpacity>

              {Platform.OS === 'web' ? (
                // En web, un <input type="date"> invisible cubre el botón: al
                // tocarlo se abre el calendario del navegador a la primera
                <View style={[styles.dateChip, styles.dateChipOther, dateMode === 'other' && styles.dateChipActive]}>
                  <Ionicons name="calendar-outline" size={16} color={dateMode === 'other' ? THEME.colors.onAccent : THEME.colors.textSecondary} />
                  <Text style={[styles.dateChipText, dateMode === 'other' && styles.dateChipTextActive]}>{otherDateLabel}</Text>
                  <input
                    type="date"
                    aria-label="Elegir otra fecha"
                    value={selectedKey || ''}
                    onClick={(e) => { try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_err) { /* navegador sin showPicker: el toque ya abre el calendario */ } }}
                    onChange={(e) => {
                      // Si el campo se vacía o es inválido, se mantiene la fecha anterior
                      const picked = fromLocalDateKey(e.target.value);
                      if (picked) setDate(picked);
                    }}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      opacity: 0, cursor: 'pointer', border: 'none', padding: 0, margin: 0,
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.dateChip, styles.dateChipOther, dateMode === 'other' && styles.dateChipActive]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color={dateMode === 'other' ? THEME.colors.onAccent : THEME.colors.textSecondary} />
                  <Text style={[styles.dateChipText, dateMode === 'other' && styles.dateChipTextActive]}>{otherDateLabel}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.dateFull}>{fullDateLabel}</Text>

            {showDatePicker && Platform.OS !== 'web' && (
              <DateTimePicker
                value={isValidDate(date) ? date : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="light"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (event?.type !== 'dismissed' && selectedDate) setDate(selectedDate);
                }}
              />
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{initialData ? 'Guardar Cambios' : 'Guardar Movimiento'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.scrim,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 5,
  },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.sunken,
    borderRadius: 18,
    padding: 5,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  typeBtnActiveIncome: {
    backgroundColor: THEME.colors.surface,
  },
  typeBtnActiveExpense: {
    backgroundColor: THEME.colors.surface,
  },
  typeBtnText: {
    color: THEME.colors.textTertiary,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: THEME.colors.accent,
  },
  input: {
    backgroundColor: THEME.colors.sunken,
    borderRadius: 18,
    padding: 18,
    color: THEME.colors.textPrimary,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  amountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedBtn: {
    width: 60,
    height: 60,
    backgroundColor: THEME.colors.sunken,
    borderRadius: 18,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sharedBtnActive: {
    backgroundColor: THEME.colors.accent,
    borderColor: THEME.colors.accent,
  },
  label: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 15,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  catItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: THEME.colors.sunken,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  catText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textTertiary,
  },
  dateChips: {
    flexDirection: 'row',
    gap: 10,
  },
  dateChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 15,
    backgroundColor: THEME.colors.sunken,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  dateChipOther: {
    flex: 1.4,
  },
  dateChipActive: {
    backgroundColor: THEME.colors.accent,
    borderColor: THEME.colors.accent,
  },
  dateChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  dateChipTextActive: {
    color: THEME.colors.onAccent,
  },
  dateFull: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 25,
    marginLeft: 4,
  },
  saveBtn: {
    backgroundColor: THEME.colors.accent,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 30,
  },
  saveBtnText: {
    color: THEME.colors.onAccent,
    fontSize: 18,
    fontWeight: '800',
  },
});
