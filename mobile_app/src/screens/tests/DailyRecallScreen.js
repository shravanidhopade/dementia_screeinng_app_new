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

export default function DailyRecallScreen({ route, navigation }) {
  const { results = {}, mode = 'single' } = route.params || {};
  const [lang, setLang] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameState, setGameState] = useState('waiting'); // waiting, active, done, analyzing
  const [speechRate, setSpeechRate] = useState(1.0);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Live speaking indicator (metering-based, just for UI feedback)
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false);

  const timerRef = useRef(null);
  const recordingRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const l = await getData('@language');
      if (l) setLang(l);
      playInstruction(l || 'en');
    };
    loadData();

    return () => {
      Speech.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const t = translations[lang] || translations['en'];

  const playInstruction = (currentLang, rate = speechRate) => {
    const texts = translations[currentLang] || translations['en'];
    Speech.stop();
    let locale = 'en-US';
    if (currentLang === 'hi') locale = 'hi-IN';
    if (currentLang === 'mr') locale = 'mr-IN';
    Speech.speak(texts.daily_recall_instruction, { language: locale, rate });
  };

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

      const options = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(options);

      // Live speaking indicator for UI only
      newRecording.setProgressUpdateInterval(100);
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.isMeteringEnabled) {
          setIsCurrentlySpeaking(status.metering > -42);
        }
      });

      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsRecording(true);
      setGameState('active');
      setTimeLeft(45);
      setIsCurrentlySpeaking(false);

      // Fixed 45s countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      alert('Failed to start recording: ' + err.message);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      setIsCurrentlySpeaking(false);

      const currentRecording = recordingRef.current;
      if (currentRecording) {
        recordingRef.current = null;
        currentRecording.setOnRecordingStatusUpdate(null);
        await currentRecording.stopAndUnloadAsync();
        const uri = currentRecording.getURI();
        setRecording(null);

        // Send to backend for genuine transcription + pause analysis
        setGameState('analyzing');
        const analysis = await analyzeVoice(uri, 3);
        setAnalysisResult(analysis);
        setGameState('done');
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setGameState('done');
    }
  };

  const finishTest = () => {
    let memoryAccAdj = results.memory_accuracy || 100.0;
    let pauseDurAdj = results.pause_duration || 0.4;

    if (analysisResult) {
      // Use genuine clarity from backend
      const clarity = analysisResult.clarity || 'Vague';
      memoryAccAdj += (analysisResult.memory_accuracy_adj !== undefined ? analysisResult.memory_accuracy_adj : -40);
      pauseDurAdj += (analysisResult.pause_duration_adj !== undefined ? analysisResult.pause_duration_adj : 1.5);
    } else {
      // Fallback: assume high risk if backend unreachable/no data
      memoryAccAdj = 30.0;
      pauseDurAdj = 2.5;
    }

    const newResults = {
      ...results,
      task_completion_time: (results.task_completion_time || 0) + (analysisResult?.task_completion_time || 45),
      memory_accuracy: Math.max(0, memoryAccAdj),
      pause_duration: pauseDurAdj,
    };

    if (mode === 'comprehensive') {
      navigation.navigate('ReactionTime', { results: newResults, mode });
    } else {
      navigation.navigate('Results', { results: newResults });
    }
  };

  // ── Analyzing State ──────────────────────────────────────────────────────────
  if (gameState === 'analyzing') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.text, { marginTop: 20, textAlign: 'center' }]}>
          {t.analyzing || 'Analyzing your voice...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Waiting State ── */}
      {gameState === 'waiting' && (
        <View style={{ flex: 1 }}>
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
            <Text style={globalStyles.title}>{t.daily_recall_test}</Text>

            <View style={globalStyles.card}>
              <Text style={globalStyles.text}>{t.daily_recall_instruction}</Text>
            </View>

            <CustomButton
              title={t.replay_instruction}
              onPress={() => playInstruction(lang)}
              variant="secondary"
              style={{ marginBottom: 20 }}
            />
            <SpeechSpeedControl lang={lang} rate={speechRate} setRate={setSpeechRate} />
            <CustomButton
              title={t.start_recording}
              onPress={startRecording}
              style={{ backgroundColor: colors.redCircle }}
            />
          </View>
        </View>
      )}

      {/* ── Active State ── */}
      {gameState === 'active' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={globalStyles.title}>{t.daily_recall_test}</Text>
          <Text style={[globalStyles.title, { fontSize: 48, color: colors.error, marginVertical: 40 }]}>
            00:{timeLeft.toString().padStart(2, '0')}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: isCurrentlySpeaking ? colors.success : colors.lightText, marginBottom: 20 }}>
            {isCurrentlySpeaking ? '🎙️ Listening...' : '⏸️ Paused...'}
          </Text>
          <CustomButton
            title={t.stop_recording}
            onPress={handleStopRecording}
          />
        </View>
      )}

      {/* ── Done State ── */}
      {gameState === 'done' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={globalStyles.title}>{t.test_complete}</Text>

          <View style={globalStyles.card}>
            {analysisResult ? (
              <>
                <Text style={globalStyles.text}>
                  {t.clarity_score} {analysisResult.clarity ?? '—'}
                </Text>
                <Text style={[globalStyles.text, { marginTop: 8, color: colors.lightText }]}>
                  📝 Words spoken: {analysisResult.word_count ?? '—'}
                </Text>
                {analysisResult.transcription ? (
                  <Text style={[globalStyles.text, { marginTop: 8, fontSize: 12, color: colors.lightText }]}>
                    "{analysisResult.transcription}"
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={globalStyles.text}>
                {t.clarity_score} (offline fallback)
              </Text>
            )}
          </View>

          <View style={{ width: '100%', marginTop: 40 }}>
            <CustomButton title={t.next} onPress={finishTest} />
            <CustomButton title={t.back} onPress={() => navigation.replace('TestSelection')} variant="secondary" style={{ marginTop: 16 }} />
          </View>
        </View>
      )}
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
