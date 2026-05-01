import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Activity, Brain, History, User, Settings, LogOut, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { globalStyles, colors } from '../theme/styles';
import { getData, removeData } from '../utils/storage';
import { translations } from '../utils/translations';

const { width } = Dimensions.get('window');

const ActionCard = ({ title, subtitle, icon: Icon, onPress, delay = 0, color = colors.primary }) => (
  <Animated.View entering={FadeInUp.delay(delay).duration(600).springify()}>
    <TouchableOpacity style={globalStyles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Icon size={28} color={color} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight size={20} color={colors.lightText} />
      </View>
    </TouchableOpacity>
  </Animated.View>
);

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const loadData = async () => {
      const userData = await getData('@user');
      const l = await getData('@language');
      setUser(userData);
      if (l) setLang(l);
    };
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const t = translations[lang] || translations['en'];

  const handleLogout = async () => {
    await removeData('@user');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>{t.hello}</Text>
          <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={() => navigation.navigate('Profile')}
        >
          <User size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Branding Plate */}
        <View style={styles.brandingPlate}>
          <Text style={styles.brandingTitle}>{t.app_title}</Text>
          <Text style={styles.brandingMotto}>{t.app_motto}</Text>
        </View>

        <Text style={globalStyles.label}>{t.actions}</Text>
        
        <ActionCard 
          title={t.daily_screening}
          subtitle={t.daily_screening_sub}
          icon={Activity}
          onPress={() => navigation.navigate('TestSelection')}
          delay={100}
        />

        <ActionCard 
          title={t.screening_history}
          subtitle={t.screening_history_sub}
          icon={History}
          onPress={() => navigation.navigate('History')}
          delay={200}
          color="#673AB7"
        />

        <View style={styles.settingsSection}>
          <Text style={globalStyles.label}>{t.account}</Text>
          <View style={styles.well}>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.replace('Language')}>
              <Settings size={20} color={colors.lightText} />
              <Text style={styles.settingText}>{t.change_language_menu}</Text>
              <ChevronRight size={16} color={colors.lightText} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <LogOut size={20} color={colors.error} />
              <Text style={[styles.settingText, { color: colors.error }]}>{t.logout}</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.lightText,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  brandingPlate: {
    backgroundColor: '#1b3a6b',
    borderRadius: 30,
    padding: 28,
    marginBottom: 32,
    alignItems: 'center',
  },
  brandingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  brandingMotto: {
    fontSize: 14,
    color: '#b0c4de',
    marginTop: 6,
    letterSpacing: 0.3,
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
  settingsSection: {
    marginTop: 32,
    marginBottom: 40,
  },
  well: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceContainer,
    marginHorizontal: 16,
  }
});
