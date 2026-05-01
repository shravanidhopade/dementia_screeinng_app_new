import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { globalStyles, colors } from '../../theme/styles';
import CustomButton from '../../components/CustomButton';
import SpeechSpeedControl from '../../components/SpeechSpeedControl';
import { getData } from '../../utils/storage';
import { translations } from '../../utils/translations';

export default function ReactionTimeScreen({ route, navigation }) {
  const { results = {}, mode = 'single' } = route.params || {};
  const [lang, setLang] = useState('en');
  const [gameMode, setGameMode] = useState('select'); // select, classic, matching
  const [gameState, setGameState] = useState('waiting'); // waiting, ready, active, done
  const [reactionTime, setReactionTime] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [speechRate, setSpeechRate] = useState(1.0);
  
  const timeoutRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const l = await getData('@language');
      if (l) setLang(l);
    };
    loadData();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      Speech.stop();
    };
  }, []);

  const t = translations[lang] || translations['en'];

  const playInstruction = (currentLang, instructionKey = 'reaction_instruction', rate = speechRate) => {
    const texts = translations[currentLang] || translations['en'];
    Speech.stop();
    let locale = 'en-US';
    if (currentLang === 'hi') locale = 'hi-IN';
    if (currentLang === 'mr') locale = 'mr-IN';
    Speech.speak(texts[instructionKey], { language: locale, rate });
  };

  const startTest = () => {
    setGameState('ready');
    // Random wait between 2-5 seconds
    const delay = Math.random() * 3000 + 2000;
    timeoutRef.current = setTimeout(() => {
      setGameState('active');
      setStartTime(Date.now());
    }, delay);
  };

  const handleTap = () => {
    if (gameState === 'active') {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setGameState('done');
    } else if (gameState === 'ready') {
      // tapped too early
      clearTimeout(timeoutRef.current);
      setGameState('waiting');
      alert(t.tapped_too_early);
    }
  };

  const resetSelection = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    Speech.stop();
    setGameMode('select');
    setGameState('waiting');
    setReactionTime(null);
    setStartTime(0);
  };

  const finishTest = () => {
    const newResults = {
      ...results,
      reaction_time: reactionTime || 900
    };
    if (mode === 'comprehensive') {
      navigation.replace('AttentionTest', { results: newResults, mode });
    } else {
      navigation.replace('Results', { results: newResults });
    }
  };

  return (
    <View style={globalStyles.container}>
      {gameMode === 'select' && (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={globalStyles.title}>{t.reaction_test}</Text>
          <View style={globalStyles.card}>
            <Text style={globalStyles.text}>{t.reaction_test_sub}</Text>
          </View>
          
          <TouchableOpacity 
            style={[globalStyles.card, { marginBottom: 20, padding: 20, borderWidth: 2, borderColor: colors.primary }]}
            onPress={() => {
              Speech.stop();
              setGameMode('classic');
              playInstruction(lang, 'reaction_instruction');
            }}
          >
            <Text style={[globalStyles.subtitle, { marginBottom: 10 }]}>Game 1: Speed Tap</Text>
            <Text style={globalStyles.text}>{t.reaction_instruction}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[globalStyles.card, { padding: 20, borderWidth: 2, borderColor: '#FF9800' }]}
            onPress={() => {
              Speech.stop();
              setGameMode('matching');
              playInstruction(lang, 'audio_visual_instruction');
            }}
          >
            <Text style={[globalStyles.subtitle, { marginBottom: 10, color: '#FF9800' }]}>Game 2: Audio-Visual Match</Text>
            <Text style={globalStyles.text}>{t.audio_visual_instruction}</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameMode === 'classic' && (
        <>
          {gameState === 'waiting' && (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={globalStyles.title}>{t.reaction_test}</Text>
              <View style={globalStyles.card}>
                <Text style={globalStyles.text}>{t.reaction_instruction}</Text>
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

          {gameState === 'ready' && (
            <TouchableOpacity style={[styles.testArea, { backgroundColor: colors.error }]} onPress={handleTap} activeOpacity={1}>
              <Text style={styles.testText}>{t.wait_color}</Text>
            </TouchableOpacity>
          )}

          {gameState === 'active' && (
            <TouchableOpacity style={[styles.testArea, { backgroundColor: '#2ECC71' }]} onPress={handleTap} activeOpacity={1}>
              <Text style={styles.testText}>{t.tap_now}</Text>
            </TouchableOpacity>
          )}

          {gameState === 'done' && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={globalStyles.title}>{t.reaction_time_label}</Text>
              <Text style={[globalStyles.title, { color: colors.primary, fontSize: 48 }]}>
                {reactionTime} ms
              </Text>
              <View style={{ width: '100%', marginTop: 40 }}>
                <CustomButton title={t.next} onPress={finishTest} />
                <CustomButton title={t.back} onPress={resetSelection} variant="secondary" style={{ marginTop: 16 }} />
              </View>
            </View>
          )}
        </>
      )}

      {gameMode === 'matching' && (
        <AudioVisualGame
          results={results}
          mode={mode}
          lang={lang}
          navigation={navigation}
          onBack={resetSelection}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  testArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginVertical: 40,
  },
  testText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  imageBox: {
    width: '45%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
  }
});

// Audio-Visual Matching Game Component
const ITEMS = [
  { id: 1, name: 'Apple', emoji: '🍎', word_en: 'apple', word_hi: 'सेब', word_mr: 'सफरचंद' },
  { id: 2, name: 'Dog', emoji: '🐕', word_en: 'dog', word_hi: 'कुत्ता', word_mr: 'कुत्रा' },
  { id: 3, name: 'House', emoji: '🏠', word_en: 'house', word_hi: 'घर', word_mr: 'घर' },
  { id: 4, name: 'Car', emoji: '🚗', word_en: 'car', word_hi: 'गाड़ी', word_mr: 'कार' },
  { id: 5, name: 'Cat', emoji: '🐈', word_en: 'cat', word_hi: 'बिल्ली', word_mr: 'मांजर' },
  { id: 6, name: 'Tree', emoji: '🌳', word_en: 'tree', word_hi: 'पेड़', word_mr: 'झाड' },
  { id: 7, name: 'Sun', emoji: '☀️', word_en: 'sun', word_hi: 'सूरज', word_mr: 'सूर्य' },
  { id: 8, name: 'Fish', emoji: '🐟', word_en: 'fish', word_hi: 'मछली', word_mr: 'मासा' },
];

function AudioVisualGame({ results, mode, lang, navigation, onBack }) {
  const [gameState, setGameState] = useState('ready'); // ready, playing, answered, done
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [items, setItems] = useState([]);
  const [correctItem, setCorrectItem] = useState(null);
  const [timeLeft, setTimeLeft] = useState(4);
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef(null);
  
  const t = translations[lang] || translations['en'];

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      handleTimeOut();
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, gameState]);

  const startRound = () => {
    setGameState('playing');
    setTimeLeft(4);
    setAnswered(false);
    
    // Shuffle and pick 4 items
    const shuffled = [...ITEMS].sort(() => Math.random() - 0.5).slice(0, 4);
    setItems(shuffled);
    
    // Pick correct answer
    const correct = shuffled[Math.floor(Math.random() * shuffled.length)];
    setCorrectItem(correct);
    
    // Speak the word after 1 second
    setTimeout(() => {
      const wordKey = lang === 'en' ? 'word_en' : lang === 'hi' ? 'word_hi' : 'word_mr';
      let locale = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US';
      Speech.speak(correct[wordKey], { language: locale });
    }, 1000);
  };

  const handleImageTap = (tappedItem) => {
    if (answered || gameState !== 'playing') return;
    
    setAnswered(true);
    clearTimeout(timerRef.current);
    
    if (tappedItem.id === correctItem.id) {
      setScore(score + 1);
      Speech.speak(t.correct_answer, { language: lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US' });
    } else {
      Speech.speak(t.wrong_answer, { language: lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US' });
    }
    
    setGameState('answered');
    setTimeout(() => {
      if (currentRound < 4) {
        setCurrentRound(currentRound + 1);
        setGameState('ready');
      } else {
        finishGame();
      }
    }, 1500);
  };

  const handleTimeOut = () => {
    if (!answered) {
      setAnswered(true);
      Speech.speak(t.wrong_answer, { language: lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US' });
      setGameState('answered');
      setTimeout(() => {
        if (currentRound < 4) {
          setCurrentRound(currentRound + 1);
          setGameState('ready');
        } else {
          finishGame();
        }
      }, 1500);
    }
  };

  const finishGame = () => {
    setGameState('done');
  };

  return (
    <View style={[globalStyles.container, { justifyContent: 'center' }]}>
      {gameState === 'ready' && currentRound === 0 && (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={globalStyles.title}>{t.audio_visual_test}</Text>
          <View style={globalStyles.card}>
            <Text style={globalStyles.text}>{t.audio_visual_instruction}</Text>
          </View>
          <CustomButton title={t.start} onPress={startRound} />
        </View>
      )}

      {(gameState === 'playing' || gameState === 'answered') && (
        <View style={{ flex: 1, justifyContent: 'space-around', paddingVertical: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[globalStyles.title, { marginBottom: 10 }]}>Round {currentRound + 1}/5</Text>
            <Text style={[globalStyles.subtitle, { color: timeLeft <= 1 ? colors.error : colors.primary }]}>
              {timeLeft}s
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 15 }}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.imageBox,
                  {
                    backgroundColor: answered 
                      ? item.id === correctItem.id 
                        ? '#2ECC71' 
                        : '#FF6B6B'
                      : '#f5f5f5',
                    borderWidth: answered && item.id === correctItem.id ? 3 : 1,
                    borderColor: answered && item.id === correctItem.id ? '#2ECC71' : '#ddd',
                  }
                ]}
                onPress={() => handleImageTap(item)}
                disabled={answered}
              >
                <Text style={{ fontSize: 48, marginBottom: 10 }}>{item.emoji}</Text>
                <Text style={{ fontSize: 14, color: '#333' }}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={[globalStyles.subtitle]}>Score: {score}/5</Text>
          </View>
        </View>
      )}

      {gameState === 'ready' && currentRound > 0 && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <CustomButton title={t.next} onPress={startRound} />
        </View>
      )}

      {gameState === 'done' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={globalStyles.title}>{t.matching_score}</Text>
          <Text style={[globalStyles.title, { color: colors.primary, fontSize: 48 }]}>
            {score}/5
          </Text>          <View style={{ width: '100%', marginTop: 40 }}>
            <CustomButton
              title={t.next}
              onPress={() => {
                const newResults = {
                  ...results,
                  reaction_time: (score / 5) * 100
                };
                if (mode === 'comprehensive') {
                  navigation.replace('AttentionTest', { results: newResults, mode });
                } else {
                  navigation.replace('Results', { results: newResults });
                }
              }}
            />
            <CustomButton title={t.back} onPress={onBack} variant="secondary" style={{ marginTop: 16 }} />
          </View>        </View>
      )}
    </View>
  );
}
