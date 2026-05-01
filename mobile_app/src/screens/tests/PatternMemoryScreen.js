import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { globalStyles, colors } from '../../theme/styles';
import CustomButton from '../../components/CustomButton';
import SpeechSpeedControl from '../../components/SpeechSpeedControl';
import { getData, saveData } from '../../utils/storage';
import { translations } from '../../utils/translations';

const SHAPES = [
  { id: 1, color: '#E53935' }, // Red
  { id: 2, color: '#1E88E5' }, // Blue
  { id: 3, color: '#43A047' }, // Green
  { id: 4, color: '#FFB300' }  // Yellow
];

export default function PatternMemoryScreen({ route, navigation }) {
  const { results = {}, mode = 'single' } = route.params || {};
  const [lang, setLang] = useState('en');
  const [gameState, setGameState] = useState('waiting');
  const [speechRate, setSpeechRate] = useState(1.0);
  
  const [sequenceLength, setSequenceLength] = useState(3);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [activeShape, setActiveShape] = useState(null);
  const [memoryScore, setMemoryScore] = useState(100);

  useEffect(() => {
    const loadData = async () => {
      const l = await getData('@language');
      if (l) setLang(l);
      
      // Adaptive Difficulty logic
      const history = await getData('@test_history');
      if (history && history.length > 0) {
        const lastScore = history[history.length - 1].score || 0;
        if (lastScore > 80) setSequenceLength(4); // Increase diff
        else if (lastScore < 40) setSequenceLength(2); // Decrease diff
      }
      playInstruction(l || 'en');
    };
    loadData();
    return () => Speech.stop();
  }, []);

  const t = translations[lang] || translations['en'];

  const playInstruction = (currentLang, rate = speechRate) => {
    const texts = translations[currentLang] || translations['en'];
    Speech.stop();
    let locale = 'en-US';
    if (currentLang === 'hi') locale = 'hi-IN';
    if (currentLang === 'mr') locale = 'mr-IN';
    Speech.speak(texts.pattern_instruction, { language: locale, rate });
  };

  const startTest = () => {
    setGameState('showing');
    setUserSequence([]);
    generateSequence();
  };

  const generateSequence = () => {
    const newSeq = [];
    for (let i = 0; i < sequenceLength; i++) {
      newSeq.push(SHAPES[Math.floor(Math.random() * SHAPES.length)].id);
    }
    setSequence(newSeq);
    playSequence(newSeq);
  };

  const playSequence = (seq) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index >= seq.length) {
        clearInterval(interval);
        setActiveShape(null);
        setGameState('playing');
        return;
      }
      setActiveShape(seq[index]);
      setTimeout(() => {
        setActiveShape(null);
      }, 500); // Shape active for 500ms
      index++;
    }, 1000); // 1s between shapes
  };

  const handleShapeTap = (id) => {
    if (gameState !== 'playing') return;

    const newUserSeq = [...userSequence, id];
    setUserSequence(newUserSeq);
    setActiveShape(id);
    setTimeout(() => setActiveShape(null), 200);

    const currentIndex = newUserSeq.length - 1;
    if (newUserSeq[currentIndex] !== sequence[currentIndex]) {
      // Wrong tap
      setMemoryScore(0); // For simple semester project, one mistake = 0 on this test portion
      setGameState('done');
      return;
    }

    if (newUserSeq.length === sequence.length) {
      // Correct!
      setMemoryScore(100);
      setGameState('done');
    }
  };

  const finishTest = () => {
    // In comprehensive mode, average voice + pattern memory
    // In single mode, just use the pattern memory score
    const priorMemory = results.memory_accuracy;
    const totalMemoryAccuracy = priorMemory !== undefined
      ? (priorMemory + memoryScore) / 2
      : memoryScore;

    const newResults = {
      ...results,
      memory_accuracy: totalMemoryAccuracy
    };
    navigation.replace('Results', { results: newResults });
  };

  return (
    <View style={globalStyles.container}>
      {gameState === 'waiting' && (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={globalStyles.title}>{t.pattern_test}</Text>
          <View style={globalStyles.card}>
            <Text style={globalStyles.text}>{t.pattern_instruction}</Text>
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

      {(gameState === 'showing' || gameState === 'playing') && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[globalStyles.title, { marginBottom: 40 }]}>
            {gameState === 'showing' ? t.watch_pattern : t.your_turn}
          </Text>
          
          <View style={styles.grid}>
            {SHAPES.map(shape => (
              <TouchableOpacity
                key={shape.id}
                activeOpacity={0.5}
                onPress={() => handleShapeTap(shape.id)}
                style={[
                  styles.shape, 
                  { backgroundColor: shape.color, opacity: activeShape === shape.id ? 1 : 0.4 }
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {gameState === 'done' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={globalStyles.title}>{t.test_complete}</Text>
          <View style={globalStyles.card}>
            <Text style={globalStyles.text}>{t.pattern_accuracy} {memoryScore}%</Text>
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
  grid: {
    width: 300,
    height: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between'
  },
  shape: {
    width: 140,
    height: 140,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#FFF',
  }
});
