import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, StatusBar, Alert, Platform, TextInput, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '@vercel/analytics/react';
import { THEME, CATEGORIES, INCOME_CATEGORIES } from './src/constants/theme';
import DataEntryScreen from './src/screens/DataEntryScreen';
import ChartsScreen from './src/screens/ChartsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Memoria de emergencia por si el móvil bloquea el almacenamiento
let backupStorage = null;

const saveData = async (key, val) => {
  try {
    const jsonValue = JSON.stringify(val);
    backupStorage = jsonValue; // Guardamos en memoria por si acaso
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(key, jsonValue);
    }
  } catch (error) {
    console.log("Aviso: Guardando en memoria temporal");
  }
};

const loadData = async (key) => {
  try {
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      const res = await AsyncStorage.getItem(key);
      if (res) return JSON.parse(res);
    }
    return backupStorage ? JSON.parse(backupStorage) : null;
  } catch (error) {
    return backupStorage ? JSON.parse(backupStorage) : null;
  }
};

import AddTransactionModal from './src/components/AddTransactionModal';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('DataEntry');
  const [displayedScreen, setDisplayedScreen] = useState('DataEntry');
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const navigate = useCallback((screen) => {
    if (screen === currentScreen) return;
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen(screen);
      setDisplayedScreen(screen);
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [currentScreen, screenOpacity]);
  const [transactions, setTransactions] = useState([]);
  const [userName, setUserName] = useState(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [tempUserName, setTempUserName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [categories, setCategories] = useState(CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState(INCOME_CATEGORIES);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData('user_transactions').then(data => {
      if (data) setTransactions(data);
    });
    loadData('user_name').then(name => {
      if (name) setUserName(name);
    });
    loadData('user_categories').then(cats => {
      if (cats) setCategories(cats);
    });
    loadData('user_income_categories').then(cats => {
      if (cats) setIncomeCategories(cats);
    });
    loadData('has_seen_welcome').then(seen => {
      if (seen) setHasSeenWelcome(seen);
    });
  }, []);

  // Guardar datos cuando cambien
  useEffect(() => {
    saveData('user_transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    if (userName) {
      saveData('user_name', userName);
    }
  }, [userName]);

  useEffect(() => {
    saveData('user_categories', categories);
  }, [categories]);

  useEffect(() => {
    saveData('user_income_categories', incomeCategories);
  }, [incomeCategories]);

  useEffect(() => {
    saveData('has_seen_welcome', hasSeenWelcome);
  }, [hasSeenWelcome]);

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

  const openAddModal = () => {
    setEditingTransaction(null);
    setModalVisible(true);
  };

  const handleNextOnboarding = () => {
    if (onboardingStep < 2) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      if (tempUserName.trim()) {
        setUserName(tempUserName.trim());
        setHasSeenWelcome(true);
      }
    }
  };

  const handleFullReset = async () => {
    try {
      await AsyncStorage.clear();
      setTransactions([]);
      setUserName(null);
      setTempUserName('');
      setHasSeenWelcome(false);
      setOnboardingStep(0);
      setCategories(CATEGORIES);
      setIncomeCategories(INCOME_CATEGORIES);
      setCurrentScreen('DataEntry');
      Alert.alert("Éxito", "La aplicación se ha reiniciado por completo.");
    } catch (e) {
      Alert.alert("Error", "No se pudo reiniciar la aplicación.");
    }
  };

  const handleDeleteTransaction = (id) => {
    const performDelete = () => setTransactions(prev => prev.filter(t => t.id !== id));

    if (Platform.OS === 'web') {
      if (window.confirm("¿Estás seguro de que quieres eliminar este registro?")) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Borrar Movimiento",
        "¿Estás seguro de que quieres eliminar este registro?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Borrar", style: "destructive", onPress: performDelete }
        ]
      );
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.colors.background} />
        
        {/* Screen Content */}
        <Animated.View style={[styles.content, { opacity: screenOpacity }]}>
          {currentScreen === 'DataEntry' 
            ? <DataEntryScreen 
                transactions={transactions} 
                setTransactions={setTransactions} 
                onEdit={openEditModal}
                userName={userName}
                categories={categories}
                incomeCategories={incomeCategories}
                onGoToHistory={() => navigate('History')}
              /> 
            : currentScreen === 'Charts'
            ? <ChartsScreen transactions={transactions} categories={categories} />
            : currentScreen === 'Calendar'
            ? <CalendarScreen transactions={transactions} categories={categories} incomeCategories={incomeCategories} />
            : currentScreen === 'History'
            ? <HistoryScreen 
                transactions={transactions} 
                categories={categories} 
                incomeCategories={incomeCategories} 
                onEdit={openEditModal}
                onDelete={handleDeleteTransaction}
                onBack={() => navigate('DataEntry')}
              />
            : <ProfileScreen 
                userName={userName} 
                setUserName={setUserName} 
                setTransactions={setTransactions} 
                categories={categories}
                setCategories={setCategories}
                incomeCategories={incomeCategories}
                setIncomeCategories={setIncomeCategories}
                onFullReset={handleFullReset}
              />
          }
        </Animated.View>

        {/* Bottom Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.navBtn}
            onPress={() => navigate('DataEntry')}
          >
            <Ionicons 
              name={currentScreen === 'DataEntry' ? 'home' : 'home-outline'} 
              size={24} 
              color={currentScreen === 'DataEntry' ? THEME.colors.accent : THEME.colors.textSecondary} 
            />
            <Text style={[styles.navBtnText, currentScreen === 'DataEntry' && { color: THEME.colors.accent }]}>Inicio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navBtn}
            onPress={() => navigate('Charts')}
          >
            <Ionicons 
              name={currentScreen === 'Charts' ? 'stats-chart' : 'stats-chart-outline'} 
              size={24} 
              color={currentScreen === 'Charts' ? THEME.colors.accent : THEME.colors.textSecondary} 
            />
            <Text style={[styles.navBtnText, currentScreen === 'Charts' && { color: THEME.colors.accent }]}>Análisis</Text>
          </TouchableOpacity>

          {/* Central Add Button */}
          <View style={styles.fabContainer}>
            <TouchableOpacity 
              style={styles.fabBtn}
              onPress={openAddModal}
            >
              <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.navBtn}
            onPress={() => navigate('Calendar')}
          >
            <Ionicons 
              name={currentScreen === 'Calendar' ? 'calendar' : 'calendar-outline'} 
              size={24} 
              color={currentScreen === 'Calendar' ? THEME.colors.accent : THEME.colors.textSecondary} 
            />
            <Text style={[styles.navBtnText, currentScreen === 'Calendar' && { color: THEME.colors.accent }]}>Calendario</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navBtn}
            onPress={() => navigate('Profile')}
          >
            <Ionicons 
              name={currentScreen === 'Profile' ? 'person' : 'person-outline'} 
              size={24} 
              color={currentScreen === 'Profile' ? THEME.colors.accent : THEME.colors.textSecondary} 
            />
            <Text style={[styles.navBtnText, currentScreen === 'Profile' && { color: THEME.colors.accent }]}>Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Onboarding Overlay */}
        {!hasSeenWelcome && (
          <View style={styles.onboardingOverlay}>
            <View style={styles.onboardingCard}>
              {onboardingStep === 0 && (
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.welcomeIconCircle}>
                    <Text style={{ fontSize: 60 }}>💰</Text>
                  </View>
                  <Text style={styles.onboardingTitle}>Bienvenido a VibeCash</Text>
                  <Text style={styles.signatureBadge}>By Javier Lacarra Rubio</Text>
                  <Text style={styles.onboardingSub}>
                    Controla tus gastos con estilo. Una aplicación diseñada para que gestionar tu dinero sea tan vibrante como tu vida.
                  </Text>
                  <View style={styles.privacyNote}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={THEME.colors.success} style={{marginRight: 8}} />
                    <Text style={styles.privacyText}>
                      Tus datos se guardan <Text style={{fontWeight: 'bold'}}>solo en este dispositivo</Text>. El creador no tiene acceso a ellos en ningún momento.
                    </Text>
                  </View>
                </View>
              )}

              {onboardingStep === 1 && (
                <View style={{ width: '100%' }}>
                  <Text style={styles.onboardingTitle}>¿Qué puedes hacer?</Text>
                  <View style={styles.featureRow}>
                    <Text style={styles.featureEmoji}>📈</Text>
                    <View>
                      <Text style={styles.featureName}>Análisis Visual</Text>
                      <Text style={styles.featureDesc}>Mira tus gastos en gráficas limpias.</Text>
                    </View>
                  </View>
                  <View style={styles.featureRow}>
                    <Text style={styles.featureEmoji}>🗓️</Text>
                    <View>
                      <Text style={styles.featureName}>Calendario</Text>
                      <Text style={styles.featureDesc}>No pierdas de vista ningún día.</Text>
                    </View>
                  </View>
                  <View style={styles.featureRow}>
                    <Text style={styles.featureEmoji}>🎨</Text>
                    <View>
                      <Text style={styles.featureName}>Personalización</Text>
                      <Text style={styles.featureDesc}>Crea categorías con tus emojis favoritos.</Text>
                    </View>
                  </View>
                </View>
              )}

              {onboardingStep === 2 && (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={styles.onboardingTitle}>Último paso</Text>
                  <Text style={styles.onboardingSub}>¿Cómo quieres que te llamemos?</Text>
                  <TextInput
                    style={styles.onboardingInput}
                    placeholder="Tu nombre aquí..."
                    placeholderTextColor={THEME.colors.textSecondary}
                    value={tempUserName}
                    onChangeText={setTempUserName}
                    autoFocus
                  />
                </View>
              )}

              <TouchableOpacity 
                style={[styles.onboardingBtn, onboardingStep === 2 && !tempUserName.trim() && { opacity: 0.5 }]} 
                onPress={handleNextOnboarding}
                disabled={onboardingStep === 2 && !tempUserName.trim()}
              >
                <Text style={styles.onboardingBtnText}>
                  {onboardingStep < 2 ? 'Siguiente' : '¡Empezar ahora!'}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.stepIndicator}>
                {[0, 1, 2].map(s => (
                  <View 
                    key={s} 
                    style={[styles.stepDot, onboardingStep === s && styles.stepDotActive]} 
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        <AddTransactionModal 
          visible={modalVisible} 
          onClose={() => { setModalVisible(false); setEditingTransaction(null); }} 
          onSave={handleSaveTransaction} 
          initialData={editingTransaction}
          categories={categories}
          incomeCategories={incomeCategories}
        />
        {Platform.OS === 'web' && <Analytics />}
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
    backgroundColor: THEME.colors.surface,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginTop: 5,
  },
  fabContainer: {
    width: 65,
    height: 65,
    marginTop: -45, // Levanta el botón central
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBtn: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: THEME.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: THEME.colors.surface,
  },
  onboardingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 30,
  },
  onboardingCard: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderRadius: 35,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 10,
  },
  onboardingSub: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    marginBottom: 25,
    textAlign: 'center',
  },
  onboardingInput: {
    width: '100%',
    backgroundColor: THEME.colors.background,
    borderRadius: 18,
    padding: 20,
    color: '#FFF',
    fontSize: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 25,
    textAlign: 'center',
  },
  onboardingBtn: {
    backgroundColor: THEME.colors.accent,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  onboardingBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  welcomeIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: THEME.colors.accent,
  },
  signatureBadge: {
    fontSize: 10,
    color: THEME.colors.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: THEME.colors.background,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  featureEmoji: {
    fontSize: 28,
    marginRight: 15,
  },
  featureName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  featureDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
  },
  stepIndicator: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.border,
  },
  stepDotActive: {
    backgroundColor: THEME.colors.accent,
    width: 20,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  privacyText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    flex: 1,
  }
});
