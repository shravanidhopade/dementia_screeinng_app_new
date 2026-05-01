import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/styles';
import { translations } from '../utils/translations';

const SPEED_OPTIONS = [
  { key: 'slow', value: 0.75 },
  { key: 'normal', value: 1.0 },
  { key: 'fast', value: 1.25 },
];

export default function SpeechSpeedControl({ lang, rate, setRate }) {
  const t = translations[lang] || translations['en'];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t.speech_speed}</Text>
      <View style={styles.row}>
        {SPEED_OPTIONS.map((option) => {
          const isSelected = option.value === rate;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.button, isSelected && styles.selectedButton]}
              onPress={() => setRate(option.value)}
            >
              <Text style={[styles.buttonText, isSelected && styles.selectedText]}>
                {t[option.key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: colors.lightText,
    fontSize: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
  },
});
