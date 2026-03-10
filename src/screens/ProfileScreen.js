import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

export default function ProfileScreen({ userName, setUserName }) {
  const [tempName, setTempName] = useState(userName || '');

  const handleUpdate = () => {
    if (!tempName.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }
    setUserName(tempName.trim());
    Alert.alert("Éxito", "Nombre actualizado correctamente");
  };

  return (
    <View style={styles.container}>
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

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Sobre VibeCash</Text>
          <Text style={styles.infoText}>Versión 1.2.0</Text>
          <Text style={styles.infoText}>Tus datos se guardan localmente para tu privacidad.</Text>
        </View>
      </View>
    </View>
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
  }
});
