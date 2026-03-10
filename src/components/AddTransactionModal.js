import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Modal, Platform, KeyboardAvoidingView, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { THEME, CATEGORIES, INCOME_CATEGORIES } from '../constants/theme';

export default function AddTransactionModal({ visible, onClose, onSave, initialData }) {
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
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setCategory(initialData.category);
      setIsShared(initialData.isShared);
      setMyPart(initialData.myPart.toString());
      setDate(new Date(initialData.date));
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!description || !amount) {
      alert("Por favor rellena description y monto");
      return;
    }

    const newTx = {
      id: initialData ? initialData.id : Date.now().toString(),
      description,
      amount: parseFloat(amount),
      isShared: type === 'expense' ? isShared : false,
      myPart: (type === 'expense' && isShared) ? parseFloat(myPart) : parseFloat(amount),
      type,
      category,
      date: date.toISOString(),
    };

    onSave(newTx);
    onClose();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setIsShared(false);
    setMyPart('');
    setDate(new Date());
    setCategory(type === 'expense' ? 'Comida' : 'Nómina');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo Registro</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type Selector */}
            <View style={styles.typeRow}>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
                onPress={() => { setType('income'); setCategory('Nómina'); }}
              >
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Ingreso</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
                onPress={() => { setType('expense'); setCategory('Comida'); }}
              >
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Gasto</Text>
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input}
              placeholder="¿En qué lo has gastado?"
              placeholderTextColor="#64748B"
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.amountGroup}>
              <TextInput 
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Monto"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              {type === 'expense' && (
                <TouchableOpacity 
                  style={[styles.sharedBtn, isShared && styles.sharedBtnActive]}
                  onPress={() => setIsShared(!isShared)}
                >
                  <Ionicons name="people" size={20} color={isShared ? '#FFF' : THEME.colors.accent} />
                </TouchableOpacity>
              )}
            </View>

            {isShared && (
               <TextInput 
                  style={[styles.input, { marginTop: 15, borderColor: THEME.colors.accent }]}
                  placeholder="Tu parte (Dime solo cuánto pagas tú)"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={myPart}
                  onChangeText={setMyPart}
               />
            )}

            {/* Category selection */}
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoryGrid}>
              {(type === 'expense' ? CATEGORIES : INCOME_CATEGORIES).map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.catItem, category === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons name={cat.icon} size={20} color={category === cat.id ? cat.color : '#64748B'} />
                  <Text style={[styles.catText, category === cat.id && { color: cat.color }]}>{cat.id}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Selection */}
            <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={THEME.colors.accent} />
              <Text style={styles.dateText}>Fecha: {date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Guardar Movimiento</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 5,
  },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
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
    color: '#64748B',
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: THEME.colors.accent,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    color: '#FFF',
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
    backgroundColor: '#0F172A',
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
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  catText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 15,
    borderRadius: 15,
    marginBottom: 25,
  },
  dateText: {
    color: '#FFF',
    marginLeft: 10,
    fontWeight: '600',
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
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  }
});
