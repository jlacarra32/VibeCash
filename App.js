import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, StatusBar, Alert, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME, CATEGORIES, INCOME_CATEGORIES } from './src/constants/theme';
import DataEntryScreen from './src/screens/DataEntryScreen';
import ChartsScreen from './src/screens/ChartsScreen';
import CalendarScreen from './src/screens/CalendarScreen';

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
  const [transactions, setTransactions] = useState([]);
  const [userName, setUserName] = useState(null);
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

  const handleFinishOnboarding = () => {
    if (tempUserName.trim()) {
      setUserName(tempUserName.trim());
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.colors.background} />
        
        {/* Screen Content */}
        <View style={styles.content}>
          {currentScreen === 'DataEntry' 
            ? <DataEntryScreen 
                transactions={transactions} 
                setTransactions={setTransactions} 
                onEdit={openEditModal}
                userName={userName}
                categories={categories}
                incomeCategories={incomeCategories}
              /> 
            : currentScreen === 'Charts'
            ? <ChartsScreen transactions={transactions} categories={categories} />
            : currentScreen === 'Calendar'
            ? <CalendarScreen transactions={transactions} categories={categories} incomeCategories={incomeCategories} />
            : <ProfileScreen 
                userName={userName} 
                setUserName={setUserName} 
                setTransactions={setTransactions} 
                categories={categories}
                setCategories={setCategories}
                incomeCategories={incomeCategories}
                setIncomeCategories={setIncomeCategories}
              />
          }
        </View>

        {/* Bottom Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.navBtn}
            onPress={() => setCurrentScreen('DataEntry')}
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
            onPress={() => setCurrentScreen('Charts')}
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
            onPress={() => setCurrentScreen('Calendar')}
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
            onPress={() => setCurrentScreen('Profile')}
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
        {!userName && (
          <View style={styles.onboardingOverlay}>
            <View style={styles.onboardingCard}>
              <Text style={styles.onboardingTitle}>Bienvenido a VibeCash</Text>
              <Text style={styles.onboardingSub}>Para empezar, ¿cómo te llamas?</Text>
              <TextInput
                style={styles.onboardingInput}
                placeholder="Tu nombre aquí..."
                placeholderTextColor={THEME.colors.textSecondary}
                value={tempUserName}
                onChangeText={setTempUserName}
                autoFocus
              />
              <TouchableOpacity style={styles.onboardingBtn} onPress={handleFinishOnboarding}>
                <Text style={styles.onboardingBtnText}>Empezar</Text>
              </TouchableOpacity>
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
  }
});
