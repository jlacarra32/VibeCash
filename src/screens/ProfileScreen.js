import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Platform } from 'react-native';

const ICON_MAP = {
  gym: 'fitness-outline',
  gimnasio: 'fitness-outline',
  deporte: 'bicycle-outline',
  entreno: 'barbell-outline',
  comida: 'fast-food-outline',
  restaurante: 'restaurant-outline',
  bar: 'beer-outline',
  super: 'cart-outline',
  compra: 'basket-outline',
  alquiler: 'home-outline',
  casa: 'home-outline',
  luz: 'flash-outline',
  agua: 'water-outline',
  internet: 'wifi-outline',
  netflix: 'play-circle-outline',
  musica: 'musical-notes-outline',
  salud: 'medkit-outline',
  medico: 'medical-outline',
  farmacia: 'bandage-outline',
  viaje: 'airplane-outline',
  vuelo: 'airplane-outline',
  hotel: 'bed-outline',
  coche: 'car-outline',
  gasolina: 'funnel-outline',
  transporte: 'bus-outline',
  tren: 'train-outline',
  ropa: 'shirt-outline',
  regalo: 'gift-outline',
  ocio: 'game-controller-outline',
  cine: 'film-outline',
  fiesta: 'sparkles-outline',
  nomina: 'cash-outline',
  sueldo: 'cash-outline',
  bizum: 'send-outline',
  transferencia: 'swap-horizontal-outline',
  ahorro: 'savings-outline',
  inversion: 'trending-up-outline',
  prestamo: 'wallet-outline',
};

const getSmartIcon = (name, type) => {
  const lowerName = name.toLowerCase();
  for (const key in ICON_MAP) {
    if (lowerName.includes(key)) return ICON_MAP[key];
  }
  return type === 'income' ? 'cash-outline' : 'cart-outline';
};

export default function ProfileScreen({ 
  userName, 
  setUserName, 
  setTransactions, 
  categories, 
  setCategories, 
  incomeCategories, 
  setIncomeCategories,
  onFullReset 
}) {
  const [tempName, setTempName] = useState(userName || '');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(THEME.colors.accent);
  const [newCatType, setNewCatType] = useState('expense');

  const COLORS = ['#8B5CF6', '#EC4899', '#F43F5E', '#10B981', '#3B82F6', '#F59E0B', '#64748B'];

  const handleUpdate = () => {
    if (!tempName.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }
    setUserName(tempName.trim());
    Alert.alert("Éxito", "Nombre actualizado correctamente");
  };



  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={50} color={THEME.colors.accent} />
          </View>
          <Text style={styles.currentName}>{userName}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Nombre de Usuario</Text>
          <TextInput
            style={styles.input}
            value={tempName}
            onChangeText={setTempName}
            placeholder="Escribe tu nombre..."
            placeholderTextColor={THEME.colors.textSecondary}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
            <Text style={styles.saveBtnText}>Actualizar Perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Gestión de Datos</Text>
          <Text style={styles.subLabel}>Opciones para limpiar tu información</Text>
          
          <TouchableOpacity 
            style={[styles.resetBtn, { marginBottom: 15 }]} 
            onPress={() => {
              const performReset = () => setTransactions([]);
              if (Platform.OS === 'web') {
                if (window.confirm("¿Seguro que quieres borrar todos los gastos e ingresos? Mantendrás tu nombre y categorías.")) {
                  performReset();
                }
              } else {
                Alert.alert(
                  "Borrar Movimientos",
                  "¿Seguro que quieres borrar todos los gastos e ingresos? Mantendrás tu nombre y categorías.",
                  [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Sí, Borrar", style: "destructive", onPress: performReset }
                  ]
                );
              }
            }}
          >
            <Ionicons name="list-outline" size={20} color={THEME.colors.textPrimary} />
            <Text style={styles.resetBtnText}>Borrar solo movimientos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.resetBtn, { borderColor: THEME.colors.error }]} 
            onPress={() => {
              if (Platform.OS === 'web') {
                if (window.confirm("REINICIO TOTAL: Se borrará TODO (nombre, categorías y gastos). ¿Estás seguro?")) {
                  onFullReset();
                }
              } else {
                Alert.alert(
                  "REINICIO TOTAL",
                  "Se borrará TODO: nombre, categorías y gastos. Volverás a la pantalla de bienvenida. ¿Estás seguro?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    { text: "REINICIAR TODO", style: "destructive", onPress: onFullReset }
                  ]
                );
              }
            }}
          >
            <Ionicons name="refresh-circle-outline" size={20} color={THEME.colors.error} />
            <Text style={[styles.resetBtnText, { color: THEME.colors.error }]}>Reiniciar aplicación completa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Gestión de Categorías</Text>
          <Text style={styles.subLabel}>Toca una categoría para verla o añade nuevas</Text>
          
          <Text style={styles.groupTitle}>Gastos</Text>
          <View style={styles.categoriesGrid}>
            {(categories || []).map(cat => (
              <View key={cat.id} style={[styles.catChip, { borderColor: cat.color }]}>
                <Ionicons name={cat.icon || 'cart-outline'} size={18} color={cat.color} />
                <Text style={[styles.catChipText, { color: cat.color }]}>{cat.id}</Text>
                <TouchableOpacity onPress={() => {
                  setCategories(prev => prev.filter(c => c.id !== cat.id));
                }}>
                  <Ionicons name="close-circle" size={18} color={THEME.colors.error} style={{marginLeft: 5}} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Text style={[styles.groupTitle, {marginTop: 15}]}>Ingresos</Text>
          <View style={styles.categoriesGrid}>
            {(incomeCategories || []).map(cat => (
              <View key={cat.id} style={[styles.catChip, { borderColor: cat.color }]}>
                <Ionicons name={cat.icon || 'cash-outline'} size={18} color={cat.color} />
                <Text style={[styles.catChipText, { color: cat.color }]}>{cat.id}</Text>
                <TouchableOpacity onPress={() => {
                  setIncomeCategories(prev => prev.filter(c => c.id !== cat.id));
                }}>
                  <Ionicons name="close-circle" size={18} color={THEME.colors.error} style={{marginLeft: 5}} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, { marginTop: 20, backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.colors.accent }]} 
            onPress={() => setIsAddModalVisible(true)}
          >
            <Text style={[styles.saveBtnText, { color: THEME.colors.accent }]}>+ Nueva Categoría</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Nueva Categoría */}
        <Modal visible={isAddModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nueva Categoría</Text>
              
              <View style={styles.typeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, newCatType === 'expense' && {backgroundColor: THEME.colors.accent}]}
                  onPress={() => setNewCatType('expense')}
                >
                  <Text style={{color: '#FFF', fontWeight: 'bold'}}>Gasto</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, newCatType === 'income' && {backgroundColor: THEME.colors.success}]}
                  onPress={() => setNewCatType('income')}
                >
                  <Text style={{color: '#FFF', fontWeight: 'bold'}}>Ingreso</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Nombre (ej: Gimnasio)"
                placeholderTextColor={THEME.colors.textSecondary}
                value={newCatName}
                onChangeText={setNewCatName}
              />

              <Text style={styles.label}>Color</Text>
              <View style={styles.categoriesGrid}>
                {COLORS.map(c => (
                  <TouchableOpacity 
                    key={c} 
                    style={[styles.colorCircle, {backgroundColor: c}, newCatColor === c && {borderWidth: 3, borderColor: '#FFF'}]}
                    onPress={() => setNewCatColor(c)}
                  />
                ))}
              </View>

              <View style={{flexDirection: 'row', gap: 10, marginTop: 30}}>
                <TouchableOpacity 
                  style={[styles.saveBtn, {flex: 1, backgroundColor: '#334155'}]}
                  onPress={() => setIsAddModalVisible(false)}
                >
                  <Text style={styles.saveBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveBtn, {flex: 1}]}
                  onPress={() => {
                    if (!newCatName) return;
                    const cat = { 
                      id: newCatName, 
                      color: newCatColor, 
                      icon: getSmartIcon(newCatName, newCatType)
                    };
                    if (newCatType === 'income') setIncomeCategories([...incomeCategories, cat]);
                    else setCategories([...categories, cat]);
                    setIsAddModalVisible(false);
                    setNewCatName('');
                  }}
                >
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Sobre VibeCash</Text>
          <Text style={[styles.infoText, { fontWeight: '700', color: THEME.colors.accent, marginBottom: 10 }]}>Hecho por Javier Lacarra Rubio</Text>
          <Text style={styles.infoText}>Versión 1.4.0</Text>
          <Text style={styles.infoText}>Tus datos y categorías se guardan localmente para tu privacidad.</Text>
        </View>
      </View>
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
    paddingHorizontal: 25,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.accent,
    marginBottom: 15,
  },
  currentName: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  formCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 20,
  },
  label: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: THEME.colors.background,
    borderRadius: 15,
    padding: 15,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: THEME.colors.accent,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  infoCard: {
    padding: 20,
    alignItems: 'center',
  },
  infoTitle: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 5,
  },
  infoText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  subLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginBottom: 20,
    marginTop: -10,
  },
  groupTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  resetBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },
  colorCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 25,
    textAlign: 'center',
  }
});
