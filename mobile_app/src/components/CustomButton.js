import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { colors, globalStyles } from '../theme/styles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CustomButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle,
  disabled
}) {
  const isPrimary = variant === 'primary';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable 
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[globalStyles.button, style, animatedStyle]}
    >
      <LinearGradient
        colors={isPrimary ? [colors.primary, colors.primaryContainer] : [colors.surfaceContainer, '#e1e5f0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[
          styles.text,
          { color: isPrimary ? '#FFFFFF' : colors.primary },
          textStyle
        ]}>
          {title}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});
