import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { User, Lock, Calendar, ArrowRight } from 'lucide-react-native';
import { globalStyles, colors } from '../theme/styles';
import CustomButton from '../components/CustomButton';
import { saveData, getData } from '../utils/storage';
import { translations } from '../utils/translations';
import { loginUser, registerUser } from '../utils/api';

export default function LoginScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLang = async () => {
      const l = await getData('@language');
      if (l) setLang(l);
    };
    loadLang();
  }, []);

  const t = translations[lang] || translations['en'];

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim() || (!isLogin && !age.trim())) {
      Alert.alert(t.auth_failed, t.auth_error_fields);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        console.log('🔐 Starting login attempt...');
        const result = await loginUser(username, password);
        console.log('✅ Login result:', result);
        if (result && result.access_token) {
          await saveData('@user', { name: username });
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }
      } else {
        console.log('📝 Starting registration attempt...');
        await registerUser({ 
          username, 
          password, 
          age: parseInt(age, 10) 
        });
        console.log('✅ Registration successful');
        Alert.alert("✓", t.auth_success);
        setIsLogin(true);
      }
    } catch (error) {
      console.error("❌ Auth error:", error);
      console.error("❌ Error response:", error.response);
      console.error("❌ Error message:", error.message);
      const errorMsg = error.response?.data?.detail || error.message || t.connection_failed;
      Alert.alert(t.auth_failed, typeof errorMsg === 'string' ? errorMsg : t.connection_failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Branding Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoSmall}
            resizeMode="contain"
          />
          <Text style={globalStyles.title}>CogniScreen</Text>
          <Text style={styles.tagline}>{t.app_tagline}</Text>
        </View>

        {/* Auth Card */}
        <Animated.View layout={Layout.springify()} style={globalStyles.card}>
          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              onPress={() => setIsLogin(true)}
              style={[styles.tab, isLogin && styles.activeTab]}
            >
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>{t.login}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setIsLogin(false)}
              style={[styles.tab, !isLogin && styles.activeTab]}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>{t.signup}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 20 }}>
            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <User size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder={t.username_placeholder}
                placeholderTextColor={colors.lightText}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Lock size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder={t.password_placeholder}
                placeholderTextColor={colors.lightText}
              />
            </View>

            {/* Age Input (Signup only) */}
            {!isLogin && (
              <Animated.View 
                entering={FadeIn.duration(300)} 
                exiting={FadeOut.duration(200)}
                style={styles.inputWrapper}
              >
                <Calendar size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder={t.age_placeholder}
                  placeholderTextColor={colors.lightText}
                />
              </Animated.View>
            )}
            
            <View style={{ marginTop: 24 }}>
              <CustomButton 
                title={loading ? t.processing : (isLogin ? `${t.login} ` : `${t.signup} `)} 
                onPress={handleSubmit} 
                disabled={loading}
              />
            </View>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.replace('Language')}>
            <Text style={styles.footerLink}>{t.change_language}</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Info */}
        <View style={styles.debugBox}>
          <Text style={styles.debugLabel}>Backend IP: 192.168.1.211:8000</Text>
          <Text style={styles.debugLabel}>Your WiFi: Check if on same network</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoSmall: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: colors.lightText,
    fontWeight: '500',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 6,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.lightText,
  },
  activeTabText: {
    color: colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 18,
    color: colors.text,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  debugBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  debugLabel: {
    fontSize: 12,
    color: colors.lightText,
    fontFamily: 'monospace',
    marginBottom: 4,
  }
});
