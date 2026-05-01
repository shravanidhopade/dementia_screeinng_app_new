import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import * as Speech from 'expo-speech';
import { globalStyles, colors } from '../../theme/styles';
import CustomButton from '../../components/CustomButton';
import SpeechSpeedControl from '../../components/SpeechSpeedControl';
import { getData } from '../../utils/storage';
import { translations } from '../../utils/translations';

const { width, height } = Dimensions.get('window');

export default function AttentionTestScreen({ route, navigation }) {
  const { results = {}, mode = 'single' } = route.params || {};
  const [lang, setLang] = useState('en');
  const [gameState, setGameState] = useState('waiting');
  const [speechRate, setSpeechRate] = useState(1.0);
  
  // Game metrics
  const [circles, setCircles] = useState([]);
  const [score, setScore] = useState(0);
  const [totalShown, setTotalShown] = useState(0);
  const [correctTaps, setCorrectTaps] = useState(0);
  const [incorrectTaps, setIncorrectTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15); // 15 seconds test
  
  const timerRef = useRef(null);
  const spawnRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const l = await getData('@language');
      if (l) setLang(l);
      playInstruction(l || 'en');
    };
    loadData();

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(spawnRef.current);
      Speech.stop();
    };
  }, []);

  const t = translations[lang] || translations['en'];

  const playInstruction = (currentLang, rate = speechRate) => {
    const texts = translations[currentLang] || translations['en'];
    Speech.stop();
    let locale = 'en-US';
    if (currentLang === 'hi') locale = 'hi-IN';
    if (currentLang === 'mr') locale = 'mr-IN';
    Speech.speak(texts.attention_instruction, { language: locale, rate });
  };

  const startTest = () => {
    setGameState('active');
    setScore(0);
    setCorrectTaps(0);
    setIncorrectTaps(0);
    setTotalShown(0);
    setTimeLeft(15);
    
    // Timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawner
    spawnRef.current = setInterval(() => {
      spawnCircle();
    }, 800);
  };

  const spawnCircle = () => {
    const isRed = Math.random() > 0.4; // 60% chance red
    const size = 80;
    const x = Math.random() * (width - size - 40) + 20;
    const y = Math.random() * (height - 300) + 100;

    const newCircle = { id: Date.now(), isRed, x, y, size };
    setCircles([newCircle]); // Show one at a time for focus
    
    if (isRed) {
      setTotalShown(prev => prev + 1);
    }
  };

  const handleTap = (circle) => {
    if (circle.isRed) {
      setCorrectTaps(prev => prev + 1);
      setScore(prev => prev + 10);
    } else {
      setIncorrectTaps(prev => prev + 1);
      setScore(prev => prev - 5);
    }
    setCircles([]);
  };

  const endTest = () => {
    clearInterval(timerRef.current);
    clearInterval(spawnRef.current);
    setCircles([]);
    setGameState('done');
  };

  const finishTest = () => {
    // Calculate attention accuracy: correct red taps / total red shown - penalty for blue taps
    let accuracy = 0;
    if (totalShown > 0) {
      accuracy = ((correctTaps - incorrectTaps) / totalShown) * 100;
      if (accuracy < 0) accuracy = 0;
      if (accuracy > 100) accuracy = 100;
    }
    
    const newResults = {
      ...results,
      attention_accuracy: accuracy || 50
    };
    if (mode === 'comprehensive') {
      navigation.replace('PatternMemory', { results: newResults, mode });
    } else {
      navigation.replace('Results', { results: newResults });
    }
  };

  return (
    <View style={globalStyles.container}>
      {gameState === 'waiting' && (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={globalStyles.title}>{t.attention_test}</Text>
          <View style={globalStyles.card}>
            <Text style={globalStyles.text}>{t.attention_instruction}</Text>
          </View>
          <CustomButton 
            title={t.replay_instruction} 
            onPress={() => playInstruction(lang)} 
            variant="secondary"
            style={{ marginBottom: 20 }}
          />
          <SpeechSpeedControl lang={lang} rate={speechRate} setRate={setSpeechRate} />
          <CustomButton title={t.start} onPress={startTest} />
        </View>
      )}

      {gameState === 'active' && (
        <View style={{ flex: 1 }}>
          <Text style={globalStyles.subtitle}>{t.time_left} {timeLeft}s</Text>
          
          {circles.map(circle => (
            <TouchableOpacity
              key={circle.id}
              activeOpacity={0.7}
              onPress={() => handleTap(circle)}
              style={{
                position: 'absolute',
                left: circle.x,
                top: circle.y,
                width: circle.size,
                height: circle.size,
                borderRadius: circle.size / 2,
                backgroundColor: circle.isRed ? colors.redCircle : colors.blueCircle,
              }}
            />
          ))}
        </View>
      )}

      {gameState === 'done' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={globalStyles.title}>{t.test_complete}</Text>
          <View style={globalStyles.card}>
            <Text style={globalStyles.text}>{t.score_label} {score}</Text>
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
