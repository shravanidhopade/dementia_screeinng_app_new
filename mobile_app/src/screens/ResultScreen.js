import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { globalStyles, colors } from '../theme/styles';
import CustomButton from '../components/CustomButton';
import { getData, saveTestResult } from '../utils/storage';
import { predictRisk } from '../utils/api';
import { translations } from '../utils/translations';

export default function ResultScreen({ route, navigation }) {
  const { results = {} } = route.params || {};
  const [lang, setLang] = useState('en');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const loadDataAndPredict = async () => {
      const l = await getData('@language');
      const u = await getData('@user');
      if (l) setLang(l);
      if (u) setUser(u);

      // Prepare features for ML Model
      const features = {
        memory_accuracy: results.memory_accuracy || 0,
        reaction_time: results.reaction_time || 0,
        attention_accuracy: results.attention_accuracy || 0,
        speech_rate: results.speech_rate || 0,
        pause_duration: results.pause_duration || 0,
        pitch_variance: results.pitch_variance || 0,
        task_completion_time: results.task_completion_time || 0,
        age: u?.age || 65
      };

      // Call API
      const apiResult = await predictRisk(features);
      setPrediction(apiResult);
      
      // Calculate overall cognitive score safely (0-100)
      const hasMemory = results.memory_accuracy !== undefined || results.attention_accuracy !== undefined;
      const hasReaction = results.reaction_time !== undefined;
      const hasVoice = results.speech_rate !== undefined;

      let scoreTotal = 0;
      let weights = 0;

      if (hasMemory) {
        const memAcc = features.memory_accuracy || 0;
        const attAcc = features.attention_accuracy || 0;
        const validCount = (results.memory_accuracy !== undefined ? 1 : 0) + (results.attention_accuracy !== undefined ? 1 : 0) || 1;
        scoreTotal += ((memAcc + attAcc) / validCount) * 0.5;
        weights += 0.5;
      }
      if (hasReaction) {
        scoreTotal += Math.max(0, 100 - (features.reaction_time / 10)) * 0.3;
        weights += 0.3;
      }
      if (hasVoice) {
        // Speech rate generally 130-160 WPM, cap at 100
        scoreTotal += Math.min(100, (features.speech_rate / 140) * 100) * 0.2;
        weights += 0.2;
      }

      const calculatedScore = weights > 0 ? Math.round(scoreTotal / weights) : 0;
      
      // Save History
      await saveTestResult({
        score: calculatedScore,
        riskLabel: apiResult.predicted_risk_level,
        recommendation: apiResult.recommendation_message,
        details: features
      });

      setLoading(false);
    };

    loadDataAndPredict();
  }, []);

  const t = translations[lang] || translations['en'];

  if (loading) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.text, { marginTop: 20 }]}>{t.analyzing}</Text>
      </View>
    );
  }

  // Calculate score again for display, safely
  const hasMemory = results.memory_accuracy !== undefined || results.attention_accuracy !== undefined;
  const hasReaction = results.reaction_time !== undefined;
  const hasVoice = results.speech_rate !== undefined;

  let scoreTotal = 0;
  let weights = 0;

  if (hasMemory) {
    const memAcc = results.memory_accuracy || 0;
    const attAcc = results.attention_accuracy || 0;
    const validCount = (results.memory_accuracy !== undefined ? 1 : 0) + (results.attention_accuracy !== undefined ? 1 : 0) || 1;
    scoreTotal += ((memAcc + attAcc) / validCount) * 0.5;
    weights += 0.5;
  }
  if (hasReaction) {
    scoreTotal += Math.max(0, 100 - ((results.reaction_time || 0) / 10)) * 0.3;
    weights += 0.3;
  }
  if (hasVoice) {
    scoreTotal += Math.min(100, ((results.speech_rate || 0) / 140) * 100) * 0.2;
    weights += 0.2;
  }

  const overallScore = weights > 0 ? Math.round(scoreTotal / weights) : 0;

  // Add dynamic Observations and Improvements based on tests completed
  const getObservations = () => {
    let obs = [];
    if (hasVoice) {
      if (results.speech_rate < 120) obs.push("\u2022 Speech fluency and processing rate are slightly delayed.");
      else obs.push("\u2022 Speech fluency and recall speed are within normal, healthy limits.");
      
      if (results.pause_duration > 0.5) obs.push("\u2022 Frequent pauses detected between words, which may indicate word-finding difficulty.");
    }
    if (hasReaction) {
      if (results.reaction_time > 800) obs.push("\u2022 Reaction time to visual stimuli was slower than average.");
      else obs.push("\u2022 Good motor response and visual alertness.");
    }
    if (hasMemory) {
      if ((results.memory_accuracy !== undefined && results.memory_accuracy < 70) || (results.attention_accuracy !== undefined && results.attention_accuracy < 70)) {
        obs.push("\u2022 Short-term memory recall and sequence recognition showed minor inaccuracies.");
      } else {
        obs.push("\u2022 Excellent pattern recognition and memory recall.");
      }
    }
    return obs.length > 0 ? obs.join('\n') : "General markers are stable.";
  };

  const getImprovements = () => {
    let imp = [];
    if (hasVoice && (results.speech_rate < 120 || results.pause_duration > 0.5)) {
      imp.push("- Practice reading aloud daily to improve verbal flow and reduce hesitation.");
    }
    if (hasReaction && results.reaction_time > 800) {
      imp.push("- Engage in fast-paced visual sorting games to boost reaction speed.");
    }
    if (hasMemory && ((results.memory_accuracy !== undefined && results.memory_accuracy < 70) || (results.attention_accuracy !== undefined && results.attention_accuracy < 70))) {
      imp.push("- Incorporate daily memory exercises (crosswords, puzzles) to strengthen retention.");
    }
    return imp.length > 0 ? imp.join('\n') : "- Keep up the great work! Maintain an active and healthy lifestyle.";
  };

  let riskColor = colors.success;
  if (prediction?.predicted_risk_level === 'Moderate Risk') riskColor = colors.secondary;
  if (prediction?.predicted_risk_level === 'High Risk') riskColor = colors.error;

  return (
    <View style={globalStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={globalStyles.title}>{t.results_title}</Text>
        
        <View style={globalStyles.card}>
          <Text style={globalStyles.text}>{t.score} <Text style={{fontWeight: 'bold'}}>{overallScore}/100</Text></Text>
          <Text style={globalStyles.text}>{t.risk_level} <Text style={{fontWeight: 'bold', color: riskColor}}>{prediction?.predicted_risk_level || 'N/A'}</Text></Text>
          
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />
          
          <Text style={globalStyles.subtitle}>{t.recommendation}</Text>
          <Text style={globalStyles.text}>{prediction?.recommendation_message}</Text>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />
          
          <Text style={globalStyles.subtitle}>Observations</Text>
          <Text style={[globalStyles.text, { fontSize: 14, color: colors.textLight, marginTop: 4 }]}>
            {getObservations()}
          </Text>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

          <Text style={globalStyles.subtitle}>Areas for Improvement</Text>
          <Text style={[globalStyles.text, { fontSize: 14, color: colors.textLight, marginTop: 4 }]}>
            {getImprovements()}
          </Text>
        </View>
        
        <View style={{ marginTop: 40 }}>
          <CustomButton 
            title={t.back_home} 
            onPress={() => navigation.navigate('Home')} 
          />
        </View>
      </View>
    </View>
  );
}
