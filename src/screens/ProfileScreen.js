import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { showAlert, confirmAction } from '../logic/dialogs';

const TOP = Platform.OS === 'web' ? 20 : 50;

const ICON_MAP = {
  // Ingresos
  nomina:'cash-outline', sueldo:'cash-outline', paga:'cash-outline',
  bizum:'send-outline', transferencia:'swap-horizontal-outline',
  ahorro:'wallet-outline', inversion:'trending-up-outline',
  acciones:'stats-chart-outline', prestamo:'wallet-outline',
  hacienda:'document-text-outline', devolucion:'refresh-outline',
  venta:'pricetag-outline', extra:'gift-outline',
  
  // Gastos Comida/Hogar
  comida:'fast-food-outline', restaurante:'restaurant-outline',
  bar:'beer-outline', cafe:'cafe-outline', copa:'wine-outline',
  cena:'restaurant-outline', super:'cart-outline', compra:'basket-outline',
  compras:'cart-outline', amazon:'logo-amazon',
  pizza:'pizza-outline', hamburguesa:'fast-food-outline', sushi:'fish-outline',
  alquiler:'home-outline', casa:'home-outline', piso:'home-outline',
  hipoteca:'business-outline', seguro:'shield-checkmark-outline',
  luz:'flash-outline', electricidad:'flash-outline', agua:'water-outline',
  gas:'flame-outline', internet:'wifi-outline', movil:'phone-portrait-outline',
  
  // Transporte
  coche:'car-outline', moto:'bicycle-outline', bicicleta:'bicycle-outline',
  gasolina:'funnel-outline', reparacion:'build-outline', parking:'car-sport-outline',
  bus:'bus-outline', tren:'train-outline', metro:'subway-outline',
  vuelo:'airplane-outline', avion:'airplane-outline', viaje:'airplane-outline',
  
  // Salud/Cuidado
  salud:'medkit-outline', medico:'medical-outline', farmacia:'bandage-outline',
  psicologo:'chatbubble-ellipses-outline', peluqueria:'cut-outline',
  gimnasio:'fitness-outline', gym:'fitness-outline',
  
  // Ocio/Deportes/Cultura
  deporte:'fitness-outline', futbol:'football-outline', padel:'tennisball-outline',
  tenis:'tennisball-outline', cine:'film-outline', netflix:'play-circle-outline',
  spotify:'musical-note-outline', fiesta:'sparkles-outline',
  ropa:'shirt-outline', calzado:'footsteps-outline', regalo:'gift-outline',
  tecnologia:'desktop-outline', ordenador:'desktop-outline',
  juegos:'game-controller-outline', hobby:'infinite-outline',
  
  // Estudios/Profesional
  estudios:'school-outline', universidad:'school-outline', colegio:'school-outline',
  curso:'school-outline', master:'school-outline', arquitectura:'brush-outline',
  diseño:'brush-outline', arte:'brush-outline', dibujo:'brush-outline',
  libros:'book-outline', lectura:'book-outline', suscripciones:'card-outline',
  
  // Otros
  perro:'paw-outline', gato:'paw-outline', mascota:'paw-outline',
};

const getSmartIcon = (name, type) => {
  const lower = name.toLowerCase();
  for (const key in ICON_MAP) {
    if (lower.includes(key)) return ICON_MAP[key];
  }
  return type === 'income' ? 'cash-outline' : 'cart-outline';
};

const COLORS = ['#8B5CF6','#EC4899','#F43F5E','#10B981','#3B82F6','#F59E0B','#64748B','#06B6D4','#84CC16','#F97316'];

export default function ProfileScreen({
  userName, setUserName, setTransactions,
  categories, setCategories,
  incomeCategories, setIncomeCategories,
  onFullReset,
}) {
  const [tempName, setTempName] = useState(userName || '');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(THEME.colors.accent);
  const newCatType = 'expense'; // Forzado a gasto

  const handleUpdate = () => {
    if (!tempName.trim()) { showAlert('Error', 'El nombre no puede estar vacío'); return; }
    setUserName(tempName.trim());
    showAlert('Actualizado', 'Nombre guardado correctamente');
  };

  const closeAddModal = () => {
    setIsAddModalVisible(false);
    setNewCatName('');
    setNewCatColor(THEME.colors.accent);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const cat = { id: newCatName.trim(), color: newCatColor, icon: getSmartIcon(newCatName, 'expense') };
    setCategories(prev => [...prev, cat]);
    closeAddModal();
  };

  const totalCats = categories?.length || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <Text style={styles.headerSub}>Gestiona tu cuenta y preferencias</Text>
      </View>

      {/* Avatar hero */}
      <View style={styles.heroCard}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>
              {userName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        </View>
        <Text style={styles.heroName}>{userName || 'Usuario'}</Text>
        <Text style={styles.heroSub}>Usuario de VibeCash</Text>

        {/* Mini stats */}
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatVal}>{totalCats}</Text>
            <Text style={styles.heroStatLabel}>Categorías</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatVal, { color: THEME.colors.accent }]}>VibeCash</Text>
            <Text style={styles.heroStatLabel}>v1.5.0</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Ionicons name="shield-checkmark" size={16} color={THEME.colors.success} />
            <Text style={styles.heroStatLabel}>Privado</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>

        {/* ── Nombre ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={THEME.colors.accent} />
            <Text style={styles.sectionTitle}>Nombre de usuario</Text>
          </View>
          <TextInput
            style={styles.input}
            value={tempName}
            onChangeText={setTempName}
            placeholder="Escribe tu nombre..."
            placeholderTextColor={THEME.colors.textSecondary}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdate}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Guardar nombre</Text>
          </TouchableOpacity>
        </View>

        {/* ── Categorías ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={18} color={THEME.colors.accent} />
            <Text style={styles.sectionTitle}>Categorías</Text>
          </View>
          <Text style={styles.sectionSub}>Toca la ✕ para eliminar una categoría</Text>

          <View style={styles.catGrid}>
            {(categories || []).map(cat => (
              <View key={cat.id} style={[styles.catCard, { borderColor: cat.color + '60' }]}>
                <View style={[styles.catCardIcon, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon || 'cart-outline'} size={16} color={cat.color} />
                </View>
                <Text style={[styles.catCardName, { color: cat.color }]}>{cat.id}</Text>
                <TouchableOpacity
                  onPress={() => setCategories(prev => prev.filter(c => c.id !== cat.id))}
                  style={styles.catRemoveBtn}
                >
                  <Ionicons name="close-circle" size={16} color={THEME.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.outlineBtn} onPress={() => setIsAddModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={18} color={THEME.colors.accent} />
            <Text style={styles.outlineBtnText}>Nueva categoría</Text>
          </TouchableOpacity>
        </View>

        {/* ── Datos ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={18} color={THEME.colors.accent} />
            <Text style={styles.sectionTitle}>Gestión de datos</Text>
          </View>
          <Text style={styles.sectionSub}>Los datos se guardan sólo en este dispositivo</Text>

          <TouchableOpacity
            style={styles.dangerRowSoft}
            onPress={() => confirmAction(
              'Borrar movimientos',
              '¿Borrar todos los movimientos? Se conservarán nombre y categorías.',
              () => setTransactions([]),
              'Borrar'
            )}
          >
            <View style={[styles.dangerRowIcon, { backgroundColor: THEME.colors.warning + '20' }]}>
              <Ionicons name="trash-outline" size={18} color={THEME.colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerRowTitle}>Borrar movimientos</Text>
              <Text style={styles.dangerRowSub}>Mantiene nombre y categorías</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={THEME.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerRowHard}
            onPress={() => confirmAction(
              'Reinicio total',
              'Se borrará TODO: nombre, categorías y movimientos. ¿Seguro?',
              onFullReset,
              'Reiniciar'
            )}
          >
            <View style={[styles.dangerRowIcon, { backgroundColor: THEME.colors.error + '20' }]}>
              <Ionicons name="refresh-circle-outline" size={18} color={THEME.colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dangerRowTitle, { color: THEME.colors.error }]}>Reinicio completo</Text>
              <Text style={styles.dangerRowSub}>Borra todo, vuelve al onboarding</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={THEME.colors.error} />
          </TouchableOpacity>
        </View>

        {/* ── Sobre la app ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={18} color={THEME.colors.accent} />
            <Text style={styles.sectionTitle}>Sobre VibeCash</Text>
          </View>
          {[
            { icon: 'code-slash-outline', label: 'Desarrollado por', value: 'Javier Lacarra Rubio' },
            { icon: 'layers-outline', label: 'Versión', value: '1.5.0' },
            { icon: 'shield-checkmark-outline', label: 'Privacidad', value: 'Datos 100% locales' },
            { icon: 'phone-portrait-outline', label: 'Plataforma', value: Platform.OS === 'web' ? 'Web App' : 'Móvil (Expo)' },
          ].map(row => (
            <View key={row.label} style={styles.infoRow}>
              <Ionicons name={row.icon} size={16} color={THEME.colors.textSecondary} />
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

      </View>

      {/* ── Modal Nueva Categoría (bottom sheet) ── */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent onRequestClose={closeAddModal}>
        {/* Overlay — tap to close */}
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeAddModal}>
          {/* Sheet — tap inside doesn't close */}
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet} onPress={() => {}}>
            {/* Handle */}
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nueva Categoría</Text>



            {/* Nombre */}
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre (ej: Gimnasio)"
              placeholderTextColor={THEME.colors.textSecondary}
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
            />

            {/* Color */}
            <Text style={styles.modalLabel}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorCircle, { backgroundColor: c }, newCatColor === c && styles.colorCircleActive]}
                  onPress={() => setNewCatColor(c)}
                >
                  {newCatColor === c && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            {newCatName.trim() !== '' && (
              <View style={styles.previewRow}>
                <View style={[styles.previewIcon, { backgroundColor: newCatColor + '25' }]}>
                  <Ionicons name={getSmartIcon(newCatName, newCatType)} size={18} color={newCatColor} />
                </View>
                <Text style={[styles.previewText, { color: newCatColor }]}>{newCatName}</Text>
              </View>
            )}

            {/* Botones */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={closeAddModal}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: newCatName.trim() ? THEME.colors.accent : THEME.colors.border }]}
                onPress={handleAddCategory}
                disabled={!newCatName.trim()}
              >
                <Text style={styles.modalBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingTop: TOP,
    paddingHorizontal: 22,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  // Hero
  heroCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: THEME.colors.surface,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: THEME.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    padding: 3,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: THEME.colors.accent + '25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 36,
    fontWeight: '900',
    color: THEME.colors.accent,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 16,
    width: '100%',
    justifyContent: 'space-around',
  },
  heroStat: {
    alignItems: 'center',
    gap: 4,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: THEME.colors.border,
  },
  heroStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  heroStatLabel: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  // Content sections
  content: {
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  sectionSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 16,
    marginTop: -8,
  },
  input: {
    backgroundColor: THEME.colors.background,
    borderRadius: 14,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: THEME.colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: THEME.colors.accent,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  outlineBtnText: {
    color: THEME.colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  // Category grid
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 6,
  },
  catCardIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catCardName: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 80,
  },
  catRemoveBtn: {
    padding: 2,
  },
  // Danger rows
  dangerRowSoft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dangerRowHard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.error + '08',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: THEME.colors.error + '40',
  },
  dangerRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  dangerRowSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '700',
  },
  // Modal bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  typeBtnActive: {
    backgroundColor: THEME.colors.accent + '20',
    borderColor: THEME.colors.accent,
  },
  typeBtnText: {
    color: THEME.colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  typeBtnTextActive: {
    color: THEME.colors.accent,
    fontWeight: '800',
  },
  modalInput: {
    backgroundColor: THEME.colors.background,
    borderRadius: 14,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleActive: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  previewIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalBtnCancelText: {
    color: THEME.colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
