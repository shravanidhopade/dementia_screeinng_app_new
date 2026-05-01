import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';
import { globalStyles, colors } from '../theme/styles';
import { getData } from '../utils/storage';

const { width } = Dimensions.get('window');
export default function SplashScreen({ navigation }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    console.log('SplashScreen: Animating...');
    opacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
    scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.back(1.5)) });

    const checkStatus = async () => {
      console.log('SplashScreen: Checking status...');
      try {
        const lang = await getData('@language');
        const user = await getData('@user');
        console.log('SplashScreen: Status check complete - Lang:', lang, 'User:', user?.name);
        
        setTimeout(() => {
          if (!user) {
            console.log('SplashScreen: Navigating to Language');
            navigation.replace('Language');
          } else {
            console.log('SplashScreen: Navigating to Home');
            navigation.replace('Home');
          }
        }, 2000);
      } catch (err) {
        console.error('SplashScreen: Status check error', err);
        navigation.replace('Language'); // Fallback
      }
    };

    checkStatus();
  }, [navigation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={globalStyles.centerContainer}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={globalStyles.title}>CogniScreen</Text>
        <Text style={globalStyles.subtitle}>Your partner in brain health</Text>
      </Animated.View>
      
      <Animated.View style={[styles.footer, footerStyle]}>
        <View style={styles.loaderLine} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    width: '60%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loaderLine: {
    width: '30%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  }
});
