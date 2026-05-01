import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TestSelectionScreen from '../screens/TestSelectionScreen';
import VoiceTaskScreen from '../screens/tests/VoiceTaskScreen';
import ReactionTimeScreen from '../screens/tests/ReactionTimeScreen';
import AttentionTestScreen from '../screens/tests/AttentionTestScreen';
import PatternMemoryScreen from '../screens/tests/PatternMemoryScreen';
import AnimalNamingScreen from '../screens/tests/AnimalNamingScreen';
import DailyRecallScreen from '../screens/tests/DailyRecallScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false, // Clean UI without default headers
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Language" component={LanguageSelectionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="TestSelection" component={TestSelectionScreen} />
      <Stack.Screen name="VoiceTask" component={VoiceTaskScreen} />
      <Stack.Screen name="AnimalNaming" component={AnimalNamingScreen} />
      <Stack.Screen name="DailyRecall" component={DailyRecallScreen} />
      <Stack.Screen name="ReactionTime" component={ReactionTimeScreen} />
      <Stack.Screen name="AttentionTest" component={AttentionTestScreen} />
      <Stack.Screen name="PatternMemory" component={PatternMemoryScreen} />
      <Stack.Screen name="Results" component={ResultScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  );
}
