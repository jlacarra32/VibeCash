import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, StatusBar, Platform, TextInput, Animated, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { exportBackup, pickBackupFile, parseBackup } from './src/logic/backup';
import { loadData, saveData, clearAllData, requestPersistence } from './src/logic/storage';
import { isBackupDue } from './src/logic/backupReminder';
import { renameCategoryInState } from './src/logic/categories';
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
import UndoToast from './src/components/UndoToast';
import { showAlert, confirmAction } from './src/logic/dialogs';
import { fromLocalDateKey } from './src/logic/dates';
import { withDisplayColors } from './src/logic/helpers';

// Formas esperadas de lo guardado: si algo no encaja, storage.js lo aparta
// en "<clave>_corrupt" en vez de dejar que rompa la app.
const isObjectList = (v) => Array.isArray(v) && v.every(x => x && typeof x === 'object');
const isTransactionList = (v) => isObjectList(v) && v.every(x => x.id != null);
const isCategoryList = (v) => isObjectList(v) && v.every(x => typeof x.id === 'string');

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
  const [lastBackupAt, setLastBackupAt] = useState(null); // clave nueva: last_backup_at
  const [backupNudgeHidden, setBackupNudgeHidden] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Bandera para evitar guardados basura antes de cargar

  useEffect(() => {
    requestPersistence();
    Promise.all([
      loadData('user_transactions', isTransactionList),
      loadData('user_name', (v) => typeof v === 'string'),
      loadData('user_categories', isCategoryList),
      loadData('user_income_categories', isCategoryList),
      loadData('has_seen_welcome', (v) => typeof v === 'boolean'),
      loadData('last_backup_at', (v) => typeof v === 'number'),
    ]).then(([txs, name, cats, incCats, seen, backupAt]) => {
      if (backupAt) setLastBackupAt(backupAt);
      if (txs) setTransactions(txs);
      if (name) setUserName(name);
      if (cats) setCategories(cats);
      if (incCats) setIncomeCategories(incCats);
      if (seen) setHasSeenWelcome(seen);
    }).catch((e) => {
      console.log('Error cargando datos', e);
    }).finally(() => {
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

  useEffect(() => {
    if (!isLoaded || lastBackupAt == null) return;
    saveData('last_backup_at', lastBackupAt);
  }, [lastBackupAt, isLoaded]);

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
      await clearAllData();
      setTransactions([]);
      setUserName(null);
      setTempUserName('');
      setHasSeenWelcome(false);
      setLastBackupAt(null);
      setCategories(CATEGORIES);
      setIncomeCategories(INCOME_CATEGORIES);
      setCurrentScreen('DataEntry');
      showAlert('Listo', 'La aplicación se ha reiniciado por completo.');
    } catch (_e) {
      showAlert('Error', 'No se pudo reiniciar la aplicación.');
    }
  };

  // Recupera una copia exportada. Sustituye los datos actuales, así que
  // antes se valida el archivo y se pide confirmación.
  const handleImport = async () => {
    let text;
    try {
      text = await pickBackupFile();
    } catch (_e) {
      showAlert('No disponible', 'Importar datos solo funciona en la versión web de VibeCash.');
      return;
    }
    if (text == null) return;

    const backup = parseBackup(text);
    if (!backup) {
      showAlert('Archivo no válido', 'Ese archivo no es una copia de VibeCash. Elige el archivo que exportaste desde Ajustes.');
      return;
    }

    const d = backup.data;
    const count = d.user_transactions.length;
    const date = new Date(backup.exportedAt);
    const dateText = isNaN(date.getTime()) ? '' : ` del ${date.toLocaleDateString('es-ES')}`;
    const replaceText = transactions.length > 0
      ? ` Se sustituirán tus ${transactions.length} movimientos actuales.`
      : '';

    confirmAction(
      'Importar datos',
      `La copia${dateText} tiene ${count} movimiento${count === 1 ? '' : 's'}.${replaceText} ¿Continuar?`,
      () => {
        // Lo de antes se guarda en memoria para poder deshacer la importación
        const before = { transactions, categories, incomeCategories, userName, hasSeenWelcome };
        setTransactions(d.user_transactions);
        if (d.user_categories) setCategories(d.user_categories);
        if (d.user_income_categories) setIncomeCategories(d.user_income_categories);
        const name = d.user_name || userName || tempUserName.trim();
        if (name) setUserName(name);
        setHasSeenWelcome(true);
        showUndo('Datos importados', () => {
          setTransactions(before.transactions);
          setCategories(before.categories);
          setIncomeCategories(before.incomeCategories);
          if (before.userName) setUserName(before.userName);
          setHasSeenWelcome(before.hasSeenWelcome);
        });
      },
      'Importar'
    );
  };

  // Aviso con "Deshacer" (borrados e importaciones)
  const [toast, setToast] = useState(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const showUndo = (message, onUndo) => setToast({ id: Date.now(), message, onUndo });

  // Detalle de un movimiento (hoja con Editar / Borrar), común a todas las pantallas
  const [detailTx, setDetailTx] = useState(null);

  const editFromDetail = (tx) => {
    setDetailTx(null);
    // En iOS no se puede abrir una hoja mientras otra se está cerrando
    setTimeout(() => openEditModal(tx), Platform.OS === 'ios' ? 350 : 0);
  };

  // Borra al instante y deja 6 segundos para deshacer (vuelve a su sitio)
  const deleteFromDetail = (tx) => {
    const index = transactions.findIndex(t => t.id === tx.id);
    setTransactions(prev => prev.filter(t => t.id !== tx.id));
    setDetailTx(null);
    showUndo('Movimiento borrado', () => {
      setTransactions(prev => {
        if (prev.some(t => t.id === tx.id)) return prev;
        const next = [...prev];
        next.splice(Math.min(Math.max(index, 0), next.length), 0, tx);
        return next;
      });
    });
  };

  // Renombra una categoría y actualiza a la vez todos los movimientos que la
  // usan. Se puede deshacer. Devuelve { error } si el nombre no vale.
  const handleRenameCategory = (kind, oldId, newId) => {
    const before = { transactions, categories, incomeCategories };
    const result = renameCategoryInState(before, kind, oldId, newId);
    if (result.error) return result;
    setTransactions(result.state.transactions);
    setCategories(result.state.categories);
    setIncomeCategories(result.state.incomeCategories);
    showUndo(`Categoría renombrada a «${newId.trim()}»`, () => {
      setTransactions(before.transactions);
      setCategories(before.categories);
      setIncomeCategories(before.incomeCategories);
    });
    return {};
  };

  const clearTransactions = () => {
    const before = transactions;
    if (before.length === 0) return;
    setTransactions([]);
    showUndo(`${before.length} movimientos borrados`, () => setTransactions(before));
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
                  backupDue={!backupNudgeHidden && isBackupDue({ lastBackupAt, transactionCount: transactions.length })}
                  onBackupNow={() => navigate('Profile')}
                  onBackupLater={() => setBackupNudgeHidden(true)}
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
                  onClearTransactions={clearTransactions}
                  categories={displayCategories}
                  setCategories={setCategories}
                  incomeCategories={displayIncomeCategories}
                  setIncomeCategories={setIncomeCategories}
                  onRenameCategory={handleRenameCategory}
                  onFullReset={handleFullReset}
                  onExport={async () => {
                    const result = await exportBackup({ transactions, userName, categories, incomeCategories });
                    if (result !== 'cancelled') setLastBackupAt(Date.now());
                    return result;
                  }}
                  onImport={handleImport}
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
                {Platform.OS === 'web' && (
                  <TouchableOpacity style={styles.onboardingLink} onPress={handleImport} activeOpacity={0.6}>
                    <Text style={styles.onboardingLinkText}>¿Ya usabas VibeCash? Importar mis datos</Text>
                  </TouchableOpacity>
                )}
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
        <UndoToast toast={toast} onDismiss={dismissToast} />
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
  onboardingLink: {
    alignItems: 'center',
    paddingVertical: THEME.space.lg,
    marginTop: THEME.space.xs,
  },
  onboardingLinkText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 15,
    color: THEME.colors.accent,
  },
  onboardingBtnText: {
    fontFamily: THEME.fonts.strong,
    fontSize: 16,
    color: THEME.colors.onAccent,
  },
});
