import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Platform } from 'react-native';

const ICON_MAP = {
  // INGRESOS Y FINANZAS
  nomina: 'cash-outline',
  sueldo: 'cash-outline',
  paga: 'cash-outline',
  bizum: 'send-outline',
  transferencia: 'swap-horizontal-outline',
  ahorro: 'savings-outline',
  inversion: 'trending-up-outline',
  acciones: 'stats-chart-outline',
  prestamo: 'wallet-outline',
  hacienda: 'document-text-outline',
  devolucion: 'refresh-outline',
  interes: 'trending-up-outline',
  venta: 'pricetag-outline',
  extra: 'gift-outline',

  // COMIDA Y BEBIDA
  comida: 'fast-food-outline',
  restaurante: 'restaurant-outline',
  bar: 'beer-outline',
  cafe: 'cafe-outline',
  desayuno: 'cafe-outline',
  copa: 'wine-outline',
  cena: 'restaurant-outline',
  merienda: 'pizza-outline',
  super: 'cart-outline',
  compra: 'basket-outline',
  fruta: 'nutrition-outline',
  pan: 'nutrition-outline',
  pizza: 'pizza-outline',
  hamburguesa: 'fast-food-outline',
  sushi: 'fish-outline',
  carne: 'nutrition-outline',
  pescado: 'fish-outline',

  // CASA Y SUMINISTROS
  alquiler: 'home-outline',
  casa: 'home-outline',
  piso: 'home-outline',
  hipoteca: 'business-outline',
  comunidad: 'people-outline',
  seguro: 'shield-checkmark-outline',
  luz: 'flash-outline',
  electricidad: 'flash-outline',
  agua: 'water-outline',
  gas: 'flame-outline',
  internet: 'wifi-outline',
  fibra: 'cellular-outline',
  telefono: 'call-outline',
  movil: 'phone-portrait-outline',
  mueble: 'bed-outline',
  decoracion: 'brush-outline',
  ikea: 'hammer-outline',
  leroy: 'construct-outline',
  limpieza: 'shiny-outline',
  lavanderia: 'shirt-outline',
  reformas: 'construct-outline',

  // TRANSPORTE Y VEHÍCULOS
  coche: 'car-outline',
  moto: 'bicycle-outline',
  bicicleta: 'bicycle-outline',
  bici: 'bicycle-outline',
  gasolina: 'funnel-outline',
  diesel: 'funnel-outline',
  reparacion: 'build-outline',
  mecanico: 'construct-outline',
  itv: 'list-circle-outline',
  neumatico: 'disc-outline',
  parking: 'car-sport-outline',
  peaje: 'barcode-outline',
  transporte: 'bus-outline',
  bus: 'bus-outline',
  tren: 'train-outline',
  ave: 'train-outline',
  metro: 'subway-outline',
  taxi: 'car-outline',
  uber: 'car-outline',
  cabify: 'car-outline',
  vuelo: 'airplane-outline',
  avion: 'airplane-outline',

  // SALUD Y BELLEZA
  salud: 'medkit-outline',
  medico: 'medical-outline',
  dentista: 'medical-outline',
  farmacia: 'bandage-outline',
  psicologo: 'chatbubble-ellipses-outline',
  optica: 'eye-outline',
  gafas: 'eye-outline',
  peluqueria: 'cut-outline',
  barberia: 'cut-outline',
  estetica: 'sparkles-outline',
  crema: 'color-palette-outline',
  gimnasio: 'fitness-outline',
  gym: 'fitness-outline',
  fitness: 'fitness-outline',
  bienestar: 'leaf-outline',

  // DEPORTE
  deporte: 'football-outline',
  futbol: 'football-outline',
  padel: 'tennisball-outline',
  tenis: 'tennisball-outline',
  yoga: 'body-outline',
  piscina: 'water-outline',
  ski: 'snow-outline',
  nieve: 'snow-outline',
  senderismo: 'trail-sign-outline',
  barbell: 'barbell-outline',
  pesas: 'barbell-outline',

  // OCIO Y CULTURA
  ocio: 'game-controller-outline',
  juego: 'game-controller-outline',
  playstation: 'logo-playstation',
  xbox: 'logo-xbox',
  nintendo: 'game-controller-outline',
  cine: 'film-outline',
  netflix: 'play-circle-outline',
  hbo: 'tv-outline',
  yt: 'logo-youtube',
  youtube: 'logo-youtube',
  disney: 'tv-outline',
  amazon: 'package-outline',
  musica: 'musical-notes-outline',
  concierto: 'musical-notes-outline',
  spotify: 'musical-note-outline',
  teatro: 'megaphone-outline',
  libros: 'book-outline',
  lectura: 'book-outline',
  revista: 'newspaper-outline',
  fiesta: 'sparkles-outline',
  evento: 'calendar-outline',

  // COMPRAS Y ESTILO
  ropa: 'shirt-outline',
  calzado: 'footsteps-outline',
  zapatos: 'footsteps-outline',
  accesorio: 'watch-outline',
  joya: 'diamond-outline',
  regalo: 'gift-outline',
  cumpleaños: 'balloon-outline',
  aniversario: 'heart-outline',
  tecnologia: 'desktop-outline',
  ordenador: 'desktop-outline',
  pc: 'desktop-outline',
  laptop: 'laptop-outline',
  tablet: 'tablet-portrait-outline',
  gadget: 'hardware-chip-outline',

  // VIAJES
  viaje: 'airplane-outline',
  escapada: 'map-outline',
  hotel: 'bed-outline',
  apartamento: 'home-outline',
  airbnb: 'home-outline',
  destino: 'location-outline',
  mapa: 'map-outline',
  maleta: 'briefcase-outline',

  // EDUCACIÓN Y TRABAJO
  curso: 'school-outline',
  formacion: 'library-outline',
  universidad: 'school-outline',
  colegio: 'school-outline',
  academia: 'library-outline',
  material: 'pencil-outline',
  papeleria: 'paper-plane-outline',
  oficina: 'business-outline',
  freelance: 'laptop-outline',

  // MASCOTAS Y OTROS
  perro: 'paw-outline',
  gato: 'paw-outline',
  mascota: 'paw-outline',
  veterinario: 'medkit-outline',
  donacion: 'heart-half-outline',
  ong: 'heart-circle-outline',
  tabaco: 'nuclear-outline',
  estanco: 'nuclear-outline',
  loteria: 'ticket-outline',
  multa: 'alert-circle-outline',
  imprevisto: 'help-circle-outline',
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
