import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { ChevronLeft } from 'lucide-react-native';
import { globalStyles, colors } from '../../theme/styles';
import CustomButton from '../../components/CustomButton';
import SpeechSpeedControl from '../../components/SpeechSpeedControl';
import { getData } from '../../utils/storage';
import { translations } from '../../utils/translations';
import { analyzeVoice } from '../../utils/api';

export default function VoiceTaskScreen({ route, navigation }) {
  const { results = {}, mode = 'single' } = route.params || {};
  const [lang, setLang] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordTime, setRecordTime] = useState('00:00');
  const [analyzing, setAnalyzing] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  useEffect(() => {
    const loadData = async () => {
      const l = await getData('@language');
      if (l) setLang(l);
      playInstruction(l || 'en');
    };
    loadData();

    return () => {
      Speech.stop();
      if (recording) stopRecording();
    };
  }, []);

  const t = translations[lang] || translations['en'];

  const playInstruction = (currentLang, rate = speechRate) => {
    const texts = translations[currentLang] || translations['en'];
    Speech.stop();
    
    // Map internal language codes to Expo Speech locales
    let locale = 'en-US';
    if (currentLang === 'hi') locale = 'hi-IN';
    if (currentLang === 'mr') locale = 'mr-IN';
    
    Speech.speak(texts.voice_instruction, { language: locale, rate });
  };

  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      
      // Fixed Timer Logic: Use a ref and clear it only on stop
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        setRecordTime(`${mins}:${secs}`);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordTime('00:00');

      // Send audio to backend for genuine analysis
      setAnalyzing(true);
      const analysis = await analyzeVoice(uri, 1);
      setAnalyzing(false);

      let newResults;
      if (analysis) {
        // Use genuine metrics from the backend
        newResults = {
          ...results,
          task_completion_time: (results.task_completion_time || 0) + (analysis.task_completion_time || 15.0),
          speech_rate: analysis.speech_rate ?? 60.0,
          pause_duration: analysis.pause_duration || 1.5,
          pitch_variance: analysis.pitch_variance || 20.0,
          memory_accuracy: analysis.memory_accuracy ?? 0.0,
        };
      } else {
        // Fallback if backend is unreachable - assume high risk if fail to connect and no data
        newResults = {
          ...results,
          task_completion_time: (results.task_completion_time || 0) + 15.0,
          speech_rate: 60.0,
          pause_duration: 1.5,
          pitch_variance: 20.0,
          memory_accuracy: 0.0,
        };
      }
      
      // Always proceed to next phase of voice analysis
      navigation.navigate('AnimalNaming', { results: newResults, mode });
    } catch (err) {
      console.error('Failed to stop recording', err);
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.text, { marginTop: 20, textAlign: 'center' }]}>{t.analyzing || 'Analyzing your voice...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ width: 44 }} /> 
      </View>

      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={globalStyles.title}>{t.voice_test}</Text>
        
        <View style={globalStyles.card}>
          <Text style={globalStyles.text}>{t.voice_instruction}</Text>
        </View>

        <CustomButton 
          title={t.replay_instruction} 
          onPress={() => playInstruction(lang)} 
          variant="secondary"
          style={{ marginBottom: 20 }}
        />
        <SpeechSpeedControl lang={lang} rate={speechRate} setRate={setSpeechRate} />

        <Text style={[globalStyles.subtitle, { textAlign: 'center', marginVertical: 20 }]}>

          {isRecording ? recordTime : ''}
        </Text>

        {!isRecording ? (
          <CustomButton 
            title={t.start_recording} 
            onPress={startRecording} 
            style={{ backgroundColor: colors.redCircle }}
          />
        ) : (
          <CustomButton 
            title={t.stop_recording} 
            onPress={stopRecording} 
          />
        )}
      </View>
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
  }
});
