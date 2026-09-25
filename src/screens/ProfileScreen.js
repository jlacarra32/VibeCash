import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, CATEGORY_COLORS as COLORS } from '../constants/theme';
import { showAlert, confirmAction } from '../logic/dialogs';
import appConfig from '../../app.json';
import ScreenHeader from '../components/ScreenHeader';
import Sheet from '../components/Sheet';

const APP_VERSION = appConfig.expo.version;

// Icono automático según el nombre de la categoría
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

export default function ProfileScreen({
  userName, setUserName, setTransactions,
  categories, setCategories,
  onFullReset, onExport,
}) {
  const [tempName, setTempName] = useState(userName || '');
  // Hoja de categoría: null | { mode: 'new' } | { mode: 'edit', cat }
  const [sheet, setSheet] = useState(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(COLORS[0]);

  useEffect(() => { setTempName(userName || ''); }, [userName]);

  // El nombre se guarda al salir del campo; si se deja vacío, se recupera
  const commitName = () => {
    const name = tempName.trim();
    if (!name) { setTempName(userName || ''); return; }
    if (name !== userName) setUserName(name);
  };

  const openNew = () => {
    setCatName('');
    setCatColor(COLORS[0]);
    setSheet({ mode: 'new' });
  };
  const openEdit = (cat) => {
    setCatColor(cat.color);
    setSheet({ mode: 'edit', cat });
  };
  const closeSheet = () => setSheet(null);
  // Categoría que se está editando (null si la hoja está cerrada o es nueva)
  const editingCat = sheet && sheet.mode === 'edit' ? sheet.cat : null;

  const handleAddCategory = () => {
    const name = catName.trim();
    if (!name) return;
    const exists = (categories || []).some(c => c.id.toLowerCase() === name.toLowerCase());
    if (exists) {
      showAlert('Categoría repetida', `Ya existe una categoría llamada "${name}".`);
      return;
    }
    setCategories(prev => [...prev, { id: name, color: catColor, icon: getSmartIcon(name, 'expense') }]);
    closeSheet();
  };

  // Solo cambia el color: el nombre es la clave que enlaza con los movimientos
  const handleSaveColor = () => {
    if (!editingCat) return;
    const id = editingCat.id;
    // Sin cambios: no se reescribe lo guardado
    if (catColor === editingCat.color) { closeSheet(); return; }
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, color: catColor } : c)));
    closeSheet();
  };

  const handleDeleteCategory = () => {
    if (!editingCat) return;
    const id = editingCat.id;
    confirmAction(
      'Eliminar categoría',
      `¿Eliminar "${id}"? Los movimientos que ya tengas en esta categoría no se borran.`,
      () => { setCategories(prev => prev.filter(c => c.id !== id)); closeSheet(); },
      'Eliminar'
    );
  };

  const handleExport = async () => {
    try {
      const result = await onExport();
      if (result === 'downloaded') {
        showAlert('Copia descargada', 'Guarda el archivo en un sitio seguro: lo necesitarás para recuperar tus datos.');
      }
    } catch (_e) {
      showAlert('Error', 'No se pudo exportar la copia de tus datos.');
    }
  };

  const isNew = sheet && sheet.mode === 'new';
  const previewName = isNew ? catName.trim() : editingCat?.id;
  const previewIcon = isNew ? getSmartIcon(catName || '', 'expense') : (editingCat?.icon || 'cart-outline');

  return (
    <View style={styles.container}>
      <ScreenHeader title="Ajustes" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Tú */}
        <Text style={styles.groupLabel}>Tú</Text>
        <View style={styles.group}>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowTitle}>Nombre</Text>
            <TextInput
              style={styles.nameInput}
              value={tempName}
              onChangeText={setTempName}
              onBlur={commitName}
              onSubmitEditing={commitName}
              placeholder="Tu nombre"
              placeholderTextColor={THEME.colors.inkFaint}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Categorías */}
        <Text style={styles.groupLabel}>Categorías</Text>
        <View style={styles.group}>
          {(categories || []).map(cat => (
            <TouchableOpacity key={cat.id} style={styles.row} onPress={() => openEdit(cat)} activeOpacity={0.6}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + '1F' }]}>
                <Ionicons name={cat.icon || 'cart-outline'} size={16} color={cat.color} />
              </View>
              <Text style={[styles.rowTitle, { flex: 1 }]} numberOfLines={1}>{cat.id}</Text>
              <Ionicons name="chevron-forward" size={16} color={THEME.colors.inkFaint} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.row, styles.rowLast]} onPress={openNew} activeOpacity={0.6}>
            <View style={[styles.catIcon, { backgroundColor: THEME.colors.sunken }]}>
              <Ionicons name="add" size={18} color={THEME.colors.accent} />
            </View>
            <Text style={[styles.rowTitle, { color: THEME.colors.accent }]}>Nueva categoría</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.groupNote}>Toca una categoría para cambiar su color o eliminarla.</Text>

        {/* Datos */}
        <Text style={styles.groupLabel}>Tus datos</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} activeOpacity={0.6} onPress={handleExport}>
            <View style={[styles.catIcon, { backgroundColor: THEME.colors.sunken }]}>
              <Ionicons name="download-outline" size={17} color={THEME.colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Exportar mis datos</Text>
              <Text style={styles.rowSub}>Guarda una copia de todo en un archivo</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={THEME.colors.inkFaint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => confirmAction(
              'Borrar movimientos',
              '¿Borrar todos los movimientos? Se conservarán tu nombre y tus categorías.',
              () => setTransactions([]),
              'Borrar'
            )}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: THEME.colors.danger }]}>Borrar movimientos</Text>
              <Text style={styles.rowSub}>Conserva tu nombre y tus categorías</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            activeOpacity={0.6}
            onPress={() => confirmAction(
              'Empezar de cero',
              'Se borrará TODO: nombre, categorías y movimientos. ¿Seguro?',
              onFullReset,
              'Borrar todo'
            )}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: THEME.colors.danger }]}>Empezar de cero</Text>
              <Text style={styles.rowSub}>Borra todo y vuelve a la bienvenida</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.groupNote}>Todo se guarda solo en este dispositivo. Nadie más puede verlo.</Text>

        {/* Acerca de */}
        <Text style={styles.groupLabel}>Acerca de</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Versión</Text>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Hecha por</Text>
            <Text style={styles.rowValue}>Javier Lacarra Rubio</Text>
          </View>
        </View>

        <Text style={styles.colophon}>VibeCash</Text>
      </ScrollView>

      {/* Hoja: nueva categoría / editar categoría */}
      <Sheet visible={!!sheet} onClose={closeSheet}>
        {sheet && (
          <View>
            <Text style={styles.sheetTitle}>{isNew ? 'Nueva categoría' : editingCat?.id}</Text>

            {isNew && (
              <TextInput
                style={styles.sheetInput}
                placeholder="Nombre (p. ej. Gimnasio)"
                placeholderTextColor={THEME.colors.inkFaint}
                value={catName}
                onChangeText={setCatName}
                autoFocus
              />
            )}

            <Text style={styles.sheetLabel}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => {
                const active = (catColor || '').toUpperCase() === c.toUpperCase();
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, active && styles.colorSwatchActive]}
                    onPress={() => setCatColor(c)}
                    accessibilityLabel={`Color ${c}`}
                  >
                    {active && <Ionicons name="checkmark" size={16} color={THEME.colors.onAccent} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {!!previewName && (
              <View style={styles.preview}>
                <View style={[styles.catIcon, { backgroundColor: catColor + '1F' }]}>
                  <Ionicons name={previewIcon} size={16} color={catColor} />
                </View>
                <Text style={styles.rowTitle}>{previewName}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, isNew && !catName.trim() && { opacity: 0.4 }]}
              onPress={isNew ? handleAddCategory : handleSaveColor}
              disabled={isNew && !catName.trim()}
            >
              <Text style={styles.primaryBtnText}>{isNew ? 'Crear categoría' : 'Guardar'}</Text>
            </TouchableOpacity>

            {!isNew && (
              <TouchableOpacity style={styles.deleteLink} onPress={handleDeleteCategory}>
                <Text style={styles.deleteLinkText}>Eliminar categoría</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scroll: {
    paddingHorizontal: THEME.layout.gutter,
    paddingBottom: 60,
  },
  groupLabel: {
    ...THEME.text.label,
    marginTop: THEME.space.xl,
    marginBottom: THEME.space.sm,
    marginLeft: THEME.space.xs,
  },
  group: {
    backgroundColor: THEME.colors.elevated,
    borderRadius: THEME.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.colors.hairline,
    paddingLeft: THEME.space.lg,
  },
  groupNote: {
    ...THEME.text.small,
    marginTop: THEME.space.sm,
    marginHorizontal: THEME.space.xs,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingVertical: 10,
    paddingRight: THEME.space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.hairline,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowTitle: {
    ...THEME.text.body,
  },
  rowSub: {
    ...THEME.text.small,
    marginTop: 2,
  },
  rowValue: {
    ...THEME.text.body,
    color: THEME.colors.inkSoft,
  },
  nameInput: {
    ...THEME.text.body,
    flex: 1,
    textAlign: 'right',
    color: THEME.colors.inkSoft,
    marginLeft: THEME.space.lg,
    paddingVertical: 4,
    outlineStyle: 'none',
  },
  catIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.space.md,
  },
  colophon: {
    fontFamily: THEME.fonts.displayItalic,
    fontSize: THEME.type.heading,
    color: THEME.colors.inkFaint,
    textAlign: 'center',
    marginTop: 40,
  },
  sheetTitle: {
    ...THEME.text.heading,
    fontSize: 24,
    marginBottom: THEME.space.lg,
  },
  sheetInput: {
    ...THEME.text.body,
    backgroundColor: THEME.colors.sunken,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.space.lg,
    paddingVertical: 14,
    outlineStyle: 'none',
  },
  sheetLabel: {
    ...THEME.text.label,
    marginTop: THEME.space.lg,
    marginBottom: THEME.space.sm,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.space.md,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: THEME.colors.ink,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.space.lg,
  },
  primaryBtn: {
    marginTop: THEME.space.xl,
    backgroundColor: THEME.colors.accent,
    paddingVertical: 15,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: THEME.fonts.strong,
    fontSize: THEME.type.body,
    color: THEME.colors.onAccent,
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: THEME.space.lg,
    marginTop: THEME.space.xs,
  },
  deleteLinkText: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.body,
    color: THEME.colors.danger,
  },
});
