import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Languages, ChevronRight } from 'lucide-react-native';
import { globalStyles, colors } from '../theme/styles';
import { saveData } from '../utils/storage';

export default function LanguageSelectionScreen({ navigation }) {
  
  const selectLanguage = async (lang) => {
    await saveData('@language', lang);
    navigation.replace('Login');
  };

  const LanguageOption = ({ title, sub, lang, delay }) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()}>
      <TouchableOpacity 
        style={styles.langCard} 
        onPress={() => selectLanguage(lang)}
      >
        <View style={styles.langInfo}>
          <Text style={styles.langTitle}>{title}</Text>
          <Text style={styles.langSub}>{sub}</Text>
        </View>
        <ChevronRight size={20} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={globalStyles.title}>CogniScreen</Text>
        <Text style={styles.tagline}>Select your preferred language</Text>
      </View>
      
      <View style={styles.optionsContainer}>
        <LanguageOption title="English" sub="Primary interface" lang="en" delay={100} />
        <LanguageOption title="हिंदी" sub="हिंदी भाषा में जारी रखें" lang="hi" delay={200} />
        <LanguageOption title="मराठी" sub="मराठी भाषेत सुरू ठेवा" lang="mr" delay={300} />
      </View>

      <View style={styles.footer}>
        <Languages size={24} color={colors.lightText} />
        <Text style={styles.footerText}>Multilingual Cognitive Assessment</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: colors.lightText,
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 8,
  },
  langCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  langInfo: {
    flex: 1,
  },
  langTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  langSub: {
    fontSize: 14,
    color: colors.lightText,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 40,
    gap: 10,
  },
  footerText: {
    fontSize: 14,
    color: colors.lightText,
    fontWeight: '500',
  }
});
