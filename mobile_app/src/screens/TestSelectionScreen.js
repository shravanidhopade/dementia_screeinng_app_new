import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Mic, Zap, Eye, Binary, Play, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { globalStyles, colors } from '../theme/styles';
import { getData } from '../utils/storage';
import { translations } from '../utils/translations';

const TestCard = ({ title, subtitle, icon: Icon, onPress, delay = 0, color = colors.primary }) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()}>
    <TouchableOpacity style={globalStyles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Icon size={28} color={color} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <Play size={20} color={colors.primary} fill={colors.primary} fillOpacity={0.2} />
      </View>
    </TouchableOpacity>
  </Animated.View>
);

export default function TestSelectionScreen({ navigation }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const loadData = async () => {
      const l = await getData('@language');
      if (l) setLang(l);
    };
    loadData();
  }, []);

  const t = translations[lang] || translations['en'];

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.tests_title}</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={globalStyles.subtitle}>{t.tests_subtitle}</Text>

        <TestCard 
          title={t.voice_test}
          subtitle={t.voice_test_sub}
          icon={Mic}
          onPress={() => navigation.navigate('VoiceTask', { results: {}, mode: 'single' })}
          delay={100}
        />

        <TestCard 
          title={t.reaction_test}
          subtitle={t.reaction_test_sub}
          icon={Zap}
          onPress={() => navigation.navigate('ReactionTime', { results: {}, mode: 'single' })}
          delay={200}
          color="#FF9800"
        />

        <TestCard 
          title={t.attention_test}
          subtitle={t.attention_test_sub}
          icon={Eye}
          onPress={() => navigation.navigate('AttentionTest', { results: {}, mode: 'single' })}
          delay={300}
          color="#E91E63"
        />

        <TestCard 
          title={t.pattern_test}
          subtitle={t.pattern_test_sub}
          icon={Binary}
          onPress={() => navigation.navigate('PatternMemory', { results: {}, mode: 'single' })}
          delay={400}
          color="#009688"
        />

        <View style={styles.fullTestSection}>
          <TouchableOpacity 
            style={styles.fullTestButton}
            onPress={() => navigation.navigate('VoiceTask', { results: {}, mode: 'comprehensive' })}
          >
            <Text style={styles.fullTestText}>{t.start_comprehensive}</Text>
          </TouchableOpacity>
          <Text style={styles.fullTestHint}>{t.comprehensive_duration}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.lightText,
    marginTop: 2,
  },
  fullTestSection: {
    marginTop: 40,
    marginBottom: 60,
    alignItems: 'center',
  },
  fullTestButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fullTestText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  fullTestHint: {
    marginTop: 12,
    fontSize: 14,
    color: colors.lightText,
    fontStyle: 'italic',
  }
});
