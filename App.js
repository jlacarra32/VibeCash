import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, StatusBar, Platform, TextInput, Animated, KeyboardAvoidingView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { exportBackup } from './src/logic/backup';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { THEME, CATEGORIES, INCOME_CATEGORIES } from './src/constants/theme';
import DataEntryScreen from './src/screens/DataEntryScreen';
import ChartsScreen from './src/screens/ChartsScreen';
import MovementsScreen from './src/screens/MovementsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddTransactionModal from './src/components/AddTransactionModal';
import TransactionSheet from './src/components/TransactionSheet';
import { showAlert, confirmAction } from './src/logic/dialogs';
import { fromLocalDateKey } from './src/logic/dates';
import { withDisplayColors } from './src/logic/helpers';

// Memoria de emergencia por si el móvil bloquea el almacenamiento
let backupStorage = {};

const saveData = async (key, val) => {
  try {
    const jsonValue = JSON.stringify(val);
    backupStorage[key] = jsonValue; // Guardamos en memoria por si acaso
    
    // DOBLE GUARDADO EXTREMO EN WEB: Usar localStorage directo como salvavidas
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, jsonValue);
    }

    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(key, jsonValue);
    }
  } catch (error) {
    console.log("Aviso: Error de guardado principal, usando memoria temporal", error);
  }
};

const loadData = async (key) => {
  try {
    let res = null;
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      res = await AsyncStorage.getItem(key);
    }

    // RESCATE EN WEB: Si AsyncStorage está vacío o falla, leer de localStorage directo
    if (!res && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      res = window.localStorage.getItem(key);
    }

    if (res) return JSON.parse(res);
    return backupStorage[key] ? JSON.parse(backupStorage[key]) : null;
  } catch (error) {
    console.log("Error crítico leyendo datos, intentando rescate", error);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      let fallback = window.localStorage.getItem(key);
      if (fallback) return JSON.parse(fallback);
    }
    return backupStorage[key] ? JSON.parse(backupStorage[key]) : null;
  }
};


// Pestañas de la barra inferior
const TABS = [
  { key: 'DataEntry', label: 'Inicio', icon: 'home' },
  { key: 'Movements', label: 'Movimientos', icon: 'list' },
  { key: 'Charts', label: 'Análisis', icon: 'pie-chart' },
  { key: 'Profile', label: 'Ajustes', icon: 'settings' },
];

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular, Fraunces_400Regular_Italic, Fraunces_600SemiBold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  });
  const [currentScreen, setCurrentScreen] = useState('DataEntry');
  // Vista dentro de "Movimientos": 'list' o 'calendar'
  const [movementsView, setMovementsView] = useState('list');
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Cambia de pantalla al instante (la pestaña se marca enseguida) y hace un
  // fundido de entrada. Si se pulsa otra pestaña durante el fundido, se corta
  // la animación anterior en vez de encadenarse.
  const navigate = useCallback((screen) => {
    if (screen === currentScreen) return;
    screenOpacity.stopAnimation();
    screenOpacity.setValue(0);
    setCurrentScreen(screen);
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [currentScreen, screenOpacity]);
  const [transactions, setTransactions] = useState([]);
  const [userName, setUserName] = useState(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [categories, setCategories] = useState(CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState(INCOME_CATEGORIES);
  const [isLoaded, setIsLoaded] = useState(false); // Bandera para evitar guardados basura antes de cargar

  useEffect(() => {
    Promise.all([
      loadData('user_transactions'),
      loadData('user_name'),
      loadData('user_categories'),
      loadData('user_income_categories'),
      loadData('has_seen_welcome')
    ]).then(([txs, name, cats, incCats, seen]) => {
      if (txs) setTransactions(txs);
      if (name) setUserName(name);
      if (cats) setCategories(cats);
      if (incCats) setIncomeCategories(incCats);
      if (seen) setHasSeenWelcome(seen);
      setIsLoaded(true); // Ya podemos guardar de forma segura
    });
  }, []);

  // Guardar datos cuando cambien - SOLO si ya se ha cargado inicialmente
  useEffect(() => {
    if (!isLoaded) return;
    saveData('user_transactions', transactions);
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !userName) return;
    saveData('user_name', userName);
  }, [userName, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveData('user_categories', categories);
  }, [categories, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveData('user_income_categories', incomeCategories);
  }, [incomeCategories, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveData('has_seen_welcome', hasSeenWelcome);
  }, [hasSeenWelcome, isLoaded]);

  // Categorías con los colores de la paleta nueva, solo para pintarlas.
  // Lo guardado (categories) no cambia.
  const displayCategories = useMemo(() => withDisplayColors(categories), [categories]);
  const displayIncomeCategories = useMemo(() => withDisplayColors(incomeCategories), [incomeCategories]);

  const handleSaveTransaction = (tx) => {
    setTransactions(prev => {
      const exists = prev.find(t => t.id === tx.id);
      if (exists) {
        return prev.map(t => t.id === tx.id ? tx : t);
      }
      return [...prev, tx];
    });
    setEditingTransaction(null);
  };

  const openEditModal = (tx) => {
    setEditingTransaction(tx);
    setModalVisible(true);
  };

  // Día seleccionado en el Calendario ('YYYY-MM-DD'). Se usa como fecha por
  // defecto al pulsar "+" estando en esa pantalla.
  const calendarDateRef = useRef(null);
  const [newTxDate, setNewTxDate] = useState(null);

  // dateKey opcional: abre el formulario con ese día ya puesto
  const openAddModal = (dateKey) => {
    setEditingTransaction(null);
    setNewTxDate(typeof dateKey === 'string' ? fromLocalDateKey(dateKey) : null);
    setModalVisible(true);
  };

  const finishOnboarding = () => {
    if (!tempUserName.trim()) return;
    setUserName(tempUserName.trim());
    setHasSeenWelcome(true);
  };

  const handleFullReset = async () => {
    try {
      // Limpiar todas las capas de persistencia para asegurar un reinicio limpio
      backupStorage = {};
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
      await AsyncStorage.clear();
      setTransactions([]);
      setUserName(null);
      setTempUserName('');
      setHasSeenWelcome(false);
      setCategories(CATEGORIES);
      setIncomeCategories(INCOME_CATEGORIES);
      setCurrentScreen('DataEntry');
      showAlert('Listo', 'La aplicación se ha reiniciado por completo.');
    } catch (_e) {
      showAlert('Error', 'No se pudo reiniciar la aplicación.');
    }
  };

  // Detalle de un movimiento (hoja con Editar / Borrar), común a todas las pantallas
  const [detailTx, setDetailTx] = useState(null);

  const editFromDetail = (tx) => {
    setDetailTx(null);
    // En iOS no se puede abrir una hoja mientras otra se está cerrando
    setTimeout(() => openEditModal(tx), Platform.OS === 'ios' ? 350 : 0);
  };

  const deleteFromDetail = (tx) => {
    confirmAction(
      'Borrar movimiento',
      '¿Seguro que quieres borrar este movimiento?',
      () => {
        setTransactions(prev => prev.filter(t => t.id !== tx.id));
        setDetailTx(null);
      },
      'Borrar'
    );
  };

  // Mientras cargan las fuentes se muestra solo el fondo (evita un parpadeo
  // con la tipografía del sistema). Si fallan, se sigue con la del sistema.
  if (!fontsLoaded && !fontError) {
    return <View style={styles.container} />;
  }

  // El "+" usa el día elegido si se está viendo el calendario
  const addUsesCalendarDate = currentScreen === 'Movements' && movementsView === 'calendar';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />

        <View style={styles.content}>
          <Animated.View style={[styles.content, { opacity: screenOpacity }]}>
            {currentScreen === 'DataEntry'
              ? <DataEntryScreen
                  transactions={transactions}
                  userName={userName}
                  categories={displayCategories}
                  incomeCategories={displayIncomeCategories}
                  onOpen={setDetailTx}
                  onAdd={() => openAddModal()}
                  onGoToHistory={() => { setMovementsView('list'); navigate('Movements'); }}
                />
              : currentScreen === 'Charts'
              ? <ChartsScreen transactions={transactions} categories={displayCategories} />
              : currentScreen === 'Movements'
              ? <MovementsScreen
                  view={movementsView}
                  onViewChange={setMovementsView}
                  transactions={transactions}
                  categories={displayCategories}
                  incomeCategories={displayIncomeCategories}
                  onOpen={setDetailTx}
                  onAddForDate={openAddModal}
                  onSelectedDateChange={(dateKey) => { calendarDateRef.current = dateKey; }}
                />
              : <ProfileScreen
                  userName={userName}
                  setUserName={setUserName}
                  setTransactions={setTransactions}
                  categories={displayCategories}
                  setCategories={setCategories}
                  onFullReset={handleFullReset}
                  onExport={() => exportBackup({ transactions, userName, categories, incomeCategories })}
                />
            }
          </Animated.View>

          {/* Botón para añadir (no aparece en Ajustes) */}
          {currentScreen !== 'Profile' && (
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Añadir movimiento"
              onPress={() => openAddModal(addUsesCalendarDate ? calendarDateRef.current : null)}
            >
              <Ionicons name="add" size={28} color={THEME.colors.onAccent} />
            </TouchableOpacity>
          )}
        </View>

        {/* Barra inferior */}
        <View style={styles.navBar}>
          {TABS.map(tab => {
            const active = currentScreen === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.navBtn}
                onPress={() => navigate(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Ionicons
                  name={active ? tab.icon : `${tab.icon}-outline`}
                  size={22}
                  color={active ? THEME.colors.ink : THEME.colors.inkFaint}
                />
                <Text style={[styles.navBtnText, active && styles.navBtnTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bienvenida: una sola pantalla */}
        {!hasSeenWelcome && (
          <KeyboardAvoidingView
            style={styles.onboarding}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView contentContainerStyle={styles.onboardingScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.onboardingBrand}>VibeCash</Text>

              <View>
                <Text style={styles.onboardingTitle}>Tus cuentas,{'\n'}claras.</Text>
                <Text style={styles.onboardingSub}>
                  Apunta lo que gastas en segundos y mira, sin agobios, a dónde va tu dinero.
                </Text>
                <View style={styles.privacyNote}>
                  <Ionicons name="lock-closed-outline" size={15} color={THEME.colors.income} />
                  <Text style={styles.privacyText}>Todo se queda en este dispositivo. Nadie más lo ve.</Text>
                </View>
              </View>

              <View>
                <Text style={styles.onboardingLabel}>¿Cómo te llamas?</Text>
                <TextInput
                  style={styles.onboardingInput}
                  placeholder="Tu nombre"
                  placeholderTextColor={THEME.colors.inkFaint}
                  value={tempUserName}
                  onChangeText={setTempUserName}
                  onSubmitEditing={finishOnboarding}
                  returnKeyType="go"
                />
                <TouchableOpacity
                  style={[styles.onboardingBtn, !tempUserName.trim() && { opacity: 0.4 }]}
                  onPress={finishOnboarding}
                  disabled={!tempUserName.trim()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.onboardingBtnText}>Empezar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        <TransactionSheet
          tx={detailTx}
          categories={displayCategories}
          incomeCategories={displayIncomeCategories}
          onClose={() => setDetailTx(null)}
          onEdit={editFromDetail}
          onDelete={deleteFromDetail}
        />

        <AddTransactionModal
          visible={modalVisible}
          onClose={() => { setModalVisible(false); setEditingTransaction(null); }}
          onSave={handleSaveTransaction}
          initialData={editingTransaction}
          defaultDate={newTxDate}
          categories={displayCategories}
          incomeCategories={displayIncomeCategories}
        />
        {Platform.OS === 'web' && <Analytics />}
        {Platform.OS === 'web' && <SpeedInsights />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.elevated,
    paddingTop: 10,
    paddingBottom: 8, // el hueco de la barra de gestos lo añade SafeAreaView
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.hairline,
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navBtnText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.inkFaint,
    marginTop: 4,
  },
  navBtnTextActive: {
    color: THEME.colors.ink,
  },
  addBtn: {
    position: 'absolute',
    right: THEME.layout.gutter,
    bottom: THEME.space.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  onboarding: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.background,
    zIndex: 1000,
  },
  onboardingScroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 28,
    paddingTop: 40,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  onboardingBrand: {
    fontFamily: THEME.fonts.displayItalic,
    fontSize: 22,
    color: THEME.colors.accent,
  },
  onboardingTitle: {
    ...THEME.text.display,
    fontSize: 48,
    lineHeight: 52,
    marginTop: 40,
  },
  onboardingSub: {
    ...THEME.text.body,
    fontSize: 17,
    lineHeight: 25,
    color: THEME.colors.inkSoft,
    marginTop: THEME.space.lg,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.space.sm,
    marginTop: THEME.space.xl,
  },
  privacyText: {
    ...THEME.text.small,
    color: THEME.colors.ink,
    flex: 1,
  },
  onboardingLabel: {
    ...THEME.text.label,
    marginTop: 40,
    marginBottom: THEME.space.sm,
  },
  onboardingInput: {
    ...THEME.text.body,
    fontSize: 18,
    backgroundColor: THEME.colors.sunken,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.space.lg,
    paddingVertical: 15,
    outlineStyle: 'none',
  },
  onboardingBtn: {
    marginTop: THEME.space.md,
    backgroundColor: THEME.colors.accent,
    paddingVertical: 16,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  onboardingBtnText: {
    fontFamily: THEME.fonts.strong,
    fontSize: 16,
    color: THEME.colors.onAccent,
  },
});
