import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { globalStyles, colors } from '../theme/styles';
import CustomButton from '../components/CustomButton';
import { getData, saveData } from '../utils/storage';
import { translations } from '../utils/translations';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const loadData = async () => {
      const u = await getData('@user');
      const l = await getData('@language');
      if (u) setUser(u);
      if (l) setLang(l);
    };
    loadData();
  }, []);

  const t = translations[lang] || translations['en'];

  const handleLogout = async () => {
    await saveData('@user', null);
    await saveData('@auth_token', null);
    await saveData('@language', null);
    navigation.replace('Language');
  };

  return (
    <View style={globalStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={globalStyles.title}>{t.profile}</Text>
        
        <View style={globalStyles.card}>
          <Text style={globalStyles.text}>{t.user_label} {user?.name || 'Guest'}</Text>
          <Text style={globalStyles.text}>{t.language_label} {lang.toUpperCase()}</Text>
        </View>
        
        <View style={{ marginTop: 40 }}>
          <CustomButton 
            title={t.back_home} 
            onPress={() => navigation.navigate('Home')} 
          />
          <View style={{ marginTop: 10 }}>
            <CustomButton 
              title={t.logout} 
              onPress={handleLogout} 
              color={colors.error || "#FF3B30"}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
