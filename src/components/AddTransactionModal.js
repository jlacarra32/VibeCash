import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  Platform, ScrollView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { THEME } from '../constants/theme';
import { toLocalDateKey, fromLocalDateKey, isValidDate } from '../logic/dates';
import { showAlert } from '../logic/dialogs';
import { formatMoney } from '../logic/format';
import Sheet from './Sheet';
import Segmented from './Segmented';

const TYPES = [
  { key: 'expense', label: 'Gasto' },
  { key: 'income', label: 'Ingreso' },
];

// Solo números con un separador decimal (punto o coma)
const isAmountText = (val) => val === '' || ((val.split(/[.,]/).length - 1) <= 1 && /^\d*[.,]?\d*$/.test(val));

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
  const amountRef = useRef(null);

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

  // Al abrir, el cursor va directo al importe
  React.useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => amountRef.current && amountRef.current.focus(), 350);
    return () => clearTimeout(id);
  }, [visible]);

  // Estado del selector de fecha
  const selectedKey = toLocalDateKey(date);
  const todayKey = toLocalDateKey(new Date());
  const yesterdayKey = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return toLocalDateKey(d); })();
  const dateMode = selectedKey === todayKey ? 'today' : selectedKey === yesterdayKey ? 'yesterday' : 'other';
  const otherDateLabel = dateMode === 'other' && isValidDate(date)
    ? date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')
    : 'Otro día';

  const changeType = (next) => {
    setType(next);
    setCategory(next === 'income' ? 'Ingreso' : (categories[0]?.id || ''));
  };

  const handleSave = () => {
    const normalizedAmount = amount.replace(',', '.');
    if (!normalizedAmount || isNaN(parseFloat(normalizedAmount))) {
      showAlert('Falta el importe', 'Escribe cuánto ha sido.');
      return;
    }

    const totalAmount = parseFloat(normalizedAmount);
    if (totalAmount <= 0) {
      showAlert('Importe no válido', 'El importe tiene que ser mayor que 0.');
      return;
    }
    const myPartValue = (type === 'expense' && isShared) ? parseFloat(myPart.replace(',', '.') || normalizedAmount) : totalAmount;
    if (isNaN(myPartValue) || myPartValue > totalAmount) {
      showAlert('Tu parte no es válida', 'Tu parte no puede ser mayor que el importe total.');
      return;
    }
    const refund = (type === 'expense' && isShared) ? Math.max(0, totalAmount - myPartValue) : 0;
    const finalCategory = type === 'income' ? 'Ingreso' : category;

    // Mismo formato de siempre; si no hay nota, se usa el nombre de la categoría
    const newTx = {
      id: initialData ? initialData.id : Date.now().toString(),
      description: description.trim() || finalCategory,
      amount: totalAmount,
      isShared: type === 'expense' ? isShared : false,
      myPart: myPartValue,
      refundAmount: refund,
      type,
      category: finalCategory,
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

  const title = initialData ? 'Editar movimiento' : type === 'income' ? 'Nuevo ingreso' : 'Nuevo gasto';
  const parsedAmount = parseFloat((amount || '0').replace(',', '.')) || 0;
  const parsedPart = parseFloat((myPart || '').replace(',', '.'));
  const theyOwe = isShared && !isNaN(parsedPart) && parsedPart <= parsedAmount ? parsedAmount - parsedPart : 0;

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Cerrar">
          <Ionicons name="close" size={22} color={THEME.colors.inkSoft} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Segmented options={TYPES} value={type} onChange={changeType} />

        {/* Importe */}
        <View style={styles.amountWrap}>
          <TextInput
            ref={amountRef}
            // El ancho sigue a las cifras para que el "€" quede pegado al número
            style={[styles.amountInput, { width: (amount || '0').length * 33 + 14 }, type === 'income' && { color: THEME.colors.income }]}
            placeholder="0"
            placeholderTextColor={THEME.colors.inkFaint}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(val) => { if (isAmountText(val)) setAmount(val); }}
            accessibilityLabel="Importe"
          />
          <Text style={[styles.amountCurrency, type === 'income' && { color: THEME.colors.income }]}>€</Text>
        </View>

        {/* Categoría */}
        {type === 'expense' && (
          <>
            <Text style={styles.label}>Categoría</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              keyboardShouldPersistTaps="handled"
            >
              {(categories || []).map(cat => {
                const active = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={cat.icon || 'cart-outline'} size={15} color={active ? THEME.colors.onAccent : cat.color} />
                    <Text style={[styles.chipText, active && { color: THEME.colors.onAccent }]}>{cat.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Nota */}
        <Text style={styles.label}>Nota</Text>
        <TextInput
          style={styles.input}
          placeholder={type === 'income' ? 'Nómina, Bizum de Ana…' : 'Cena con amigos, gasolina…'}
          placeholderTextColor={THEME.colors.inkFaint}
          value={description}
          onChangeText={setDescription}
          returnKeyType="done"
        />

        {/* Fecha: accesos rápidos Hoy / Ayer y "Otro día" que abre el
            calendario del sistema directamente, sin pasos intermedios */}
        <Text style={styles.label}>Fecha</Text>
        <View style={styles.dateRow}>
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
              <Ionicons name="calendar-outline" size={15} color={dateMode === 'other' ? THEME.colors.onAccent : THEME.colors.inkSoft} />
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
              <Ionicons name="calendar-outline" size={15} color={dateMode === 'other' ? THEME.colors.onAccent : THEME.colors.inkSoft} />
              <Text style={[styles.dateChipText, dateMode === 'other' && styles.dateChipTextActive]}>{otherDateLabel}</Text>
            </TouchableOpacity>
          )}
        </View>

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

        {/* Gasto compartido */}
        {type === 'expense' && (
          <View style={styles.sharedBox}>
            <View style={styles.sharedRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sharedTitle}>Gasto compartido</Text>
                <Text style={styles.sharedSub}>Lo pagaste tú, pero solo cuenta tu parte</Text>
              </View>
              <Switch
                value={isShared}
                onValueChange={setIsShared}
                trackColor={{ false: THEME.colors.hairline, true: THEME.colors.accent }}
                thumbColor={THEME.colors.elevated}
                activeThumbColor={THEME.colors.elevated}
              />
            </View>
            {isShared && (
              <View style={styles.partRow}>
                <Text style={styles.partLabel}>Tu parte</Text>
                <TextInput
                  style={styles.partInput}
                  placeholder={amount || '0'}
                  placeholderTextColor={THEME.colors.inkFaint}
                  keyboardType="decimal-pad"
                  value={myPart}
                  onChangeText={(val) => { if (isAmountText(val)) setMyPart(val); }}
                />
                <Text style={styles.partCurrency}>€</Text>
              </View>
            )}
            {isShared && theyOwe > 0 && (
              <Text style={styles.partHint}>Te tienen que devolver {formatMoney(theyOwe)}</Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{initialData ? 'Guardar cambios' : 'Guardar'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.space.lg,
  },
  title: {
    ...THEME.text.heading,
    fontSize: 24,
  },
  amountWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    paddingVertical: THEME.space.xl,
  },
  amountInput: {
    ...THEME.text.display,
    fontSize: 56,
    textAlign: 'right',
    maxWidth: '80%',
    padding: 0,
    fontVariant: ['tabular-nums'],
    outlineStyle: 'none',
  },
  amountCurrency: {
    ...THEME.text.display,
    fontSize: 40,
    color: THEME.colors.inkSoft,
    marginLeft: THEME.space.sm,
  },
  label: {
    ...THEME.text.label,
    marginTop: THEME.space.lg,
    marginBottom: THEME.space.sm,
  },
  chipRow: {
    gap: THEME.space.sm,
    paddingRight: THEME.space.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
    backgroundColor: THEME.colors.elevated,
  },
  chipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    color: THEME.colors.ink,
  },
  input: {
    ...THEME.text.body,
    backgroundColor: THEME.colors.sunken,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.space.lg,
    paddingVertical: 14,
    outlineStyle: 'none',
  },
  dateRow: {
    flexDirection: 'row',
    gap: THEME.space.sm,
  },
  dateChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.sunken,
    position: 'relative',
    overflow: 'hidden',
  },
  dateChipOther: {
    flex: 1.4,
  },
  dateChipActive: {
    backgroundColor: THEME.colors.accent,
  },
  dateChipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    color: THEME.colors.ink,
  },
  dateChipTextActive: {
    color: THEME.colors.onAccent,
  },
  sharedBox: {
    marginTop: THEME.space.xl,
    paddingTop: THEME.space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.hairline,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.space.md,
  },
  sharedTitle: {
    ...THEME.text.bodyMedium,
  },
  sharedSub: {
    ...THEME.text.small,
    marginTop: 2,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.space.md,
    backgroundColor: THEME.colors.sunken,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.space.lg,
  },
  partLabel: {
    ...THEME.text.small,
    color: THEME.colors.ink,
    marginRight: THEME.space.md,
  },
  partInput: {
    ...THEME.text.amount,
    flex: 1,
    textAlign: 'right',
    paddingVertical: 14,
    outlineStyle: 'none',
  },
  partCurrency: {
    ...THEME.text.amount,
    color: THEME.colors.inkSoft,
    marginLeft: 4,
  },
  partHint: {
    ...THEME.text.small,
    marginTop: THEME.space.sm,
  },
  saveBtn: {
    marginTop: THEME.space.xl,
    backgroundColor: THEME.colors.accent,
    paddingVertical: 16,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: THEME.fonts.strong,
    fontSize: 16,
    color: THEME.colors.onAccent,
  },
});
