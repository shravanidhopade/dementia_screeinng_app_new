import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, ActivityIndicator, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { TrendingUp, Calendar, ChevronLeft, Award, AlertCircle, Activity } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { globalStyles, colors } from '../theme/styles';
import { getData } from '../utils/storage';
import { translations } from '../utils/translations';
import { fetchHistory } from '../utils/api';

const { width } = Dimensions.get("window");

export default function HistoryScreen({ navigation }) {
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const l = await getData('@language');
    if (l) setLang(l);
    
    try {
      const h = await fetchHistory();
      if (h && Array.isArray(h)) {
        h.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setHistory(h);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const t = translations[lang] || translations['en'];

  const getChartData = () => {
    if (history.length < 2) return null;
    
    const chronoHistory = [...history].reverse().slice(-6);
    
    return {
      labels: chronoHistory.map((_, index) => `#${index + 1}`),
      datasets: [
        {
          data: chronoHistory.map(record => {
            const hasMemory = record.memory_accuracy > 0 || record.attention_accuracy > 0;
            const hasReaction = record.reaction_time > 0;
            const hasVoice = record.speech_rate > 0;
            let scoreTotal = 0;
            let weights = 0;
            if (hasMemory) {
               const validCount = (record.memory_accuracy > 0 ? 1 : 0) + (record.attention_accuracy > 0 ? 1 : 0) || 1;
               scoreTotal += (((record.memory_accuracy || 0) + (record.attention_accuracy || 0)) / validCount) * 0.5;
               weights += 0.5;
            }
            if (hasReaction) {
               scoreTotal += Math.max(0, 100 - ((record.reaction_time || 0) / 10)) * 0.3;
               weights += 0.3;
            }
            if (hasVoice) {
               scoreTotal += Math.min(100, ((record.speech_rate || 0) / 140) * 100) * 0.2;
               weights += 0.2;
            }
            return weights > 0 ? Math.round(scoreTotal / weights) : 0;
          }),
          strokeWidth: 3
        }
      ]
    };
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.history}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {chartData ? (
          <Animated.View entering={FadeIn.duration(800)} style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={styles.chartTitle}>{t.cognitive_trend}</Text>
            </View>
            <LineChart
              data={chartData}
              width={width - 48}
              height={200}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 63, 135, ${opacity})`,
                labelColor: (opacity = 1) => colors.lightText,
                propsForDots: { r: "5", strokeWidth: "2", stroke: colors.primary },
                propsForBackgroundLines: { strokeDasharray: "", stroke: colors.surfaceContainer }
              }}
              bezier
              style={styles.chart}
            />
          </Animated.View>
        ) : (
          <View style={globalStyles.well}>
            <Text style={[globalStyles.text, { textAlign: 'center', marginBottom: 0 }]}>
              {history.length === 0 ? t.no_history_tip : t.more_history_tip}
            </Text>
          </View>
        )}

        <Text style={globalStyles.label}>{t.past_assessments}</Text>

        {history.length > 0 ? (
          history.map((record, index) => {
            const hasMemory = record.memory_accuracy > 0 || record.attention_accuracy > 0;
            const hasReaction = record.reaction_time > 0;
            const hasVoice = record.speech_rate > 0;

            let testName = "Comprehensive Assessment";
            let modules = [];
            if (hasMemory) modules.push("Memory");
            if (hasReaction) modules.push("Reaction");
            if (hasVoice) modules.push("Voice Analysis");

            if (modules.length === 1) {
               testName = modules[0] + " Test";
            } else if (modules.length === 2) {
               testName = modules.join(" & ") + " Check";
            } else if (modules.length === 0) {
               testName = "General Assessment";
            }

            let scoreTotal = 0;
            let weights = 0;
            if (hasMemory) {
               const validCount = (record.memory_accuracy > 0 ? 1 : 0) + (record.attention_accuracy > 0 ? 1 : 0) || 1;
               scoreTotal += (((record.memory_accuracy || 0) + (record.attention_accuracy || 0)) / validCount) * 0.5;
               weights += 0.5;
            }
            if (hasReaction) {
               scoreTotal += Math.max(0, 100 - ((record.reaction_time || 0) / 10)) * 0.3;
               weights += 0.3;
            }
            if (hasVoice) {
               scoreTotal += Math.min(100, ((record.speech_rate || 0) / 140) * 100) * 0.2;
               weights += 0.2;
            }
            const overallScore = weights > 0 ? Math.round(scoreTotal / weights) : 0;

            let desc = "Standard screening routine complete.";
            if (record.risk_level === 'High Risk') desc = "Requires immediate medical screening and attention.";
            else if (record.risk_level === 'Moderate Risk') desc = "Minor challenges observed. Monitor results frequently.";
            else if (testName.includes('Voice')) desc = "Speech fluency and clarity within expected ranges.";
            else if (testName.includes('Memory')) desc = "Pattern recognition and short-term recall was tested.";
            else if (testName.includes('Reaction')) desc = "Good motor response and alertness speed.";

            return (
            <Animated.View 
              key={index} 
              entering={FadeInDown.delay(index * 100).duration(500)}
              style={[globalStyles.card, { marginBottom: 16 }]}
            >
              <View style={styles.recordHeader}>
                <View style={styles.dateBox}>
                  <Calendar size={16} color={colors.lightText} />
                  <Text style={styles.dateText}>
                    {new Date(record.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: record.risk_level === 'No Risk' ? '#E8F5E9' : '#FFF3E0' }]}>
                  <Text style={[styles.badgeText, { color: record.risk_level === 'No Risk' ? colors.secondary : '#E65100' }]}>
                    {record.risk_level || 'Normal'}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }}>{testName}</Text>
              <Text style={{ fontSize: 14, color: colors.lightText, marginBottom: 12 }}>{desc}</Text>

              <View style={styles.recordStats}>
                <View style={[styles.statItem, { paddingVertical: 8 }]}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: colors.primary }}>{overallScore}/100</Text>
                  <Text style={styles.statLabel}>Overall Score</Text>
                </View>
              </View>
            </Animated.View>
            );
          })
        ) : (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Activity size={48} color={colors.surfaceContainer} />
            <Text style={[globalStyles.text, { color: colors.lightText, marginTop: 12 }]}>{t.no_records}</Text>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
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
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 8,
    gap: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.lightText,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recordStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.lightText,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#dcdde1',
  }
});
