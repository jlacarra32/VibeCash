import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

/** Control segmentado: options = [{ key, label }] */
export default function Segmented({ options, value, onChange, style }) {
  return (
    <View style={[styles.track, style]}>
      {options.map(o => {
        const active = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => onChange(o.key)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.sunken,
    borderRadius: THEME.radius.md,
    padding: 3,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: THEME.radius.md - 3,
  },
  itemActive: {
    backgroundColor: THEME.colors.elevated,
    shadowColor: THEME.colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.type.small,
    color: THEME.colors.inkSoft,
  },
  labelActive: {
    color: THEME.colors.ink,
  },
});
