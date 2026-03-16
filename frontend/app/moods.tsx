import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

// ── Mood scale: Normal = 0, positive above, negative below ────
// Positive (mania side): Pleasant=1, Very Happy=2, Hypomanic=3, Manic=4
// Negative (depression side): Sad=-1, Depressed=-2, Extremely Depressed=-3, Extremely Suicidal=-4
const MOOD_SCALE: { [key: string]: number } = {
  "Manic": 4,
  "Hypomanic": 3,
  "Very Happy": 2,
  "Pleasant": 1,
  "Normal": 0,
  "Sad": -1,
  "Depressed": -2,
  "Extremely Depressed": -3,
  "Extremely Suicidal": -4,
};

const MOOD_OPTIONS = [
  { label: "Manic",              colors: ['#ff4444', '#ff0000'] as [string, string] },
  { label: "Hypomanic",          colors: ['#ff8c00', '#ff6600'] as [string, string] },
  { label: "Very Happy",         colors: ['#ffd700', '#ffb300'] as [string, string] },
  { label: "Pleasant",           colors: ['#90ee90', '#4caf50'] as [string, string] },
  { label: "Normal",             colors: ['#a8edea', '#4dd0e1'] as [string, string] },
  { label: "Sad",                colors: ['#81d4fa', '#0288d1'] as [string, string] },
  { label: "Depressed",          colors: ['#7986cb', '#3949ab'] as [string, string] },
  { label: "Extremely Depressed",colors: ['#5e35b1', '#311b92'] as [string, string] },
  { label: "Extremely Suicidal", colors: ['#37474f', '#000000'] as [string, string] },
];

const MANIA_SYMPTOMS = [
  { key: "racing_thoughts", label: "Racing Thoughts" },
  { key: "no_sleep",        label: "No Need of Sleep" },
  { key: "over_interest",   label: "Overly Interested in Things" },
  { key: "lack_control",    label: "Lack of Physical Control" },
  { key: "anxiety",         label: "Anxiety" },
  { key: "ordering",        label: "Ordering" },
  { key: "over_planning",   label: "Over Planning" },
];

const DEPRESSION_SYMPTOMS = [
  { key: "self_harm",        label: "Self Harm" },
  { key: "angry",            label: "Angry" },
  { key: "depressed_anxiety",label: "Anxious" },
];

interface MoodEntry {
  id: string;
  mood: string;
  date: string;
  racing_thoughts: boolean;
  no_sleep: boolean;
  over_interest: boolean;
  lack_control: boolean;
  anxiety: boolean;
  ordering: boolean;
  over_planning: boolean;
  self_harm: boolean;
  angry: boolean;
  depressed_anxiety: boolean;
}

interface DailyAvg {
  dateKey: string; // YYYY-MM-DD
  avg: number;     // float, -4 to 4
}

interface MonthlyHistogram {
  [monthKey: string]: DailyAvg[]; // "YYYY-MM"
}

const MOODS_KEY    = "polarpath_moods";
const HIST_KEY     = "polarpath_mood_histogram";
const SCREEN_WIDTH = Dimensions.get("window").width;

// ── Storage ────────────────────────────────────────────────────
const load = (key: string, fallback: any) => {
  if (Platform.OS === "web") {
    try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; }
    catch { return fallback; }
  }
  return fallback;
};
const store = (key: string, data: any) => {
  if (Platform.OS === "web") localStorage.setItem(key, JSON.stringify(data));
};

const getTodayKey  = () => new Date().toISOString().slice(0, 10);
const getMonthKey  = () => new Date().toISOString().slice(0, 7);

// ── Bar colour by value ────────────────────────────────────────
const getBarColors = (val: number): [string, string] => {
  if (val >= 4)  return ['#cc0000', '#ff0000'];   // Manic — dark red caution
  if (val >= 3)  return ['#ff6600', '#ff8c00'];   // Hypomanic — orange caution
  if (val >= 2)  return ['#ffd700', '#ffeb3b'];   // Very Happy
  if (val >= 1)  return ['#81c784', '#4caf50'];   // Pleasant
  if (val <= -4) return ['#1a1a2e', '#37474f'];   // Suicidal — near-black caution
  if (val <= -3) return ['#311b92', '#5e35b1'];   // Ext Depressed — deep purple caution
  if (val <= -2) return ['#3949ab', '#7986cb'];   // Depressed
  if (val <= -1) return ['#0288d1', '#81d4fa'];   // Sad
  return ['#4dd0e1', '#a8edea'];                  // Normal
};

const isExtreme = (val: number) => Math.abs(val) >= 3;

export default function Moods() {
  const router = useRouter();
  const [selectedMood, setSelectedMood]     = useState<string | null>(null);
  const [currentMoodId, setCurrentMoodId]   = useState<string | null>(null);
  const [symptoms, setSymptoms]             = useState<{[k:string]:boolean}>({});
  const [moodHistory, setMoodHistory]       = useState<MoodEntry[]>([]);
  const [histogram, setHistogram]           = useState<MonthlyHistogram>({});
  const [loading, setLoading]               = useState(false);
  const [savingSymptoms, setSavingSymptoms] = useState(false);

  useEffect(() => {
    setMoodHistory([...load(MOODS_KEY, [])].reverse());
    setHistogram(load(HIST_KEY, {}));
  }, []);

  // Rebuild histogram for current month from all mood entries
  const rebuildHistogram = (allMoods: MoodEntry[], existingHist: MonthlyHistogram): MonthlyHistogram => {
    const monthKey = getMonthKey();
    // Group current-month entries by day
    const byDay: { [day: string]: number[] } = {};
    allMoods.forEach(e => {
      if (e.date.slice(0, 7) === monthKey) {
        const dk = e.date.slice(0, 10);
        if (!byDay[dk]) byDay[dk] = [];
        byDay[dk].push(MOOD_SCALE[e.mood] ?? 0);
      }
    });
    const dailyAvgs: DailyAvg[] = Object.entries(byDay).map(([dk, vals]) => ({
      dateKey: dk,
      avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
    })).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    return { ...existingHist, [monthKey]: dailyAvgs };
  };

  const handleMoodSelect = (mood: string) => {
    setLoading(true);
    const newEntry: MoodEntry = {
      id: Date.now().toString(), mood,
      date: new Date().toISOString(),
      racing_thoughts: false, no_sleep: false, over_interest: false,
      lack_control: false, anxiety: false, ordering: false,
      over_planning: false, self_harm: false, angry: false, depressed_anxiety: false,
    };
    const existing = load(MOODS_KEY, []);
    const updated  = [...existing, newEntry];
    store(MOODS_KEY, updated);
    const newHist = rebuildHistogram(updated, load(HIST_KEY, {}));
    store(HIST_KEY, newHist);
    setMoodHistory([...updated].reverse());
    setHistogram(newHist);
    setSelectedMood(mood);
    setCurrentMoodId(newEntry.id);
    setSymptoms({});
    setLoading(false);
  };

  const handleSaveSymptoms = () => {
    if (!currentMoodId) return;
    setSavingSymptoms(true);
    const existing = load(MOODS_KEY, []);
    const updated  = existing.map((e: MoodEntry) => e.id === currentMoodId ? { ...e, ...symptoms } : e);
    store(MOODS_KEY, updated);
    setMoodHistory([...updated].reverse());
    setSelectedMood(null); setCurrentMoodId(null); setSymptoms({});
    setSavingSymptoms(false);
  };

  const toggleSymptom = (key: string) => setSymptoms(p => ({ ...p, [key]: !p[key] }));

  const showManiaSymptoms      = selectedMood && ["Very Happy","Hypomanic","Manic"].includes(selectedMood);
  const showDepressionSymptoms = selectedMood && ["Depressed","Extremely Depressed"].includes(selectedMood);

  const formatDate = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  };

  // Current month histogram data
  const currentMonthData: DailyAvg[] = histogram[getMonthKey()] || [];

  // Chart dimensions
  const CHART_H   = 220; // total chart height (pixels)
  const ZERO_Y    = CHART_H / 2; // pixel y of zero line
  const PX_PER_U  = ZERO_Y / 4;  // pixels per mood unit (4 units max each side)
  const barW      = Math.max(16, Math.min(28, (SCREEN_WIDTH - 80) / Math.max(currentMonthData.length, 1) - 4));

  return (
    <LinearGradient colors={['#ffeef8','#e8f4fd','#f0e6ff']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#8b5a8e" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <LinearGradient colors={['#d4b3e8','#c8a7e8']} style={styles.headerIcon}>
              <Ionicons name="happy-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Mood Tracking</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Mood buttons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((mood) => (
                <TouchableOpacity key={mood.label} onPress={() => handleMoodSelect(mood.label)} disabled={loading} activeOpacity={0.8}>
                  <LinearGradient colors={mood.colors} style={styles.moodButton} start={{x:0,y:0}} end={{x:1,y:1}}>
                    <Text style={styles.moodButtonText}>{mood.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading && <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#9370db" /></View>}

          {/* Mania symptoms */}
          {showManiaSymptoms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mania Symptoms</Text>
              <View style={styles.symptomsContainer}>
                {MANIA_SYMPTOMS.map(s => (
                  <TouchableOpacity key={s.key} style={styles.checkboxRow} onPress={() => toggleSymptom(s.key)}>
                    <Ionicons name={symptoms[s.key] ? "checkbox" : "square-outline"} size={24} color="#d4b3e8" />
                    <Text style={styles.checkboxLabel}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={handleSaveSymptoms} disabled={savingSymptoms} activeOpacity={0.8}>
                  <LinearGradient colors={['#d4b3e8','#c8a7e8']} style={styles.saveButton}>
                    {savingSymptoms ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Symptoms</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Depression symptoms */}
          {showDepressionSymptoms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Depression Symptoms</Text>
              <View style={styles.symptomsContainer}>
                {DEPRESSION_SYMPTOMS.map(s => (
                  <TouchableOpacity key={s.key} style={styles.checkboxRow} onPress={() => toggleSymptom(s.key)}>
                    <Ionicons name={symptoms[s.key] ? "checkbox" : "square-outline"} size={24} color="#d4b3e8" />
                    <Text style={styles.checkboxLabel}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={handleSaveSymptoms} disabled={savingSymptoms} activeOpacity={0.8}>
                  <LinearGradient colors={['#d4b3e8','#c8a7e8']} style={styles.saveButton}>
                    {savingSymptoms ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Symptoms</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Bipolar Histogram ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Monthly Mood Chart</Text>
            {currentMonthData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="bar-chart-outline" size={48} color="#d4b3e8" />
                <Text style={styles.emptyText}>No entries this month yet{"\n"}Log a mood to start your chart</Text>
              </View>
            ) : (
              <View style={styles.histogramCard}>

                {/* Y-axis labels + bars */}
                <View style={[styles.chartArea, { height: CHART_H + 20 }]}>

                  {/* Y axis */}
                  <View style={styles.yAxis}>
                    {["Manic","Hypo","V.Happy","Pleasant","Normal","Sad","Depr","ExtDepr","Suicidal"].map((lbl, i) => {
                      const val = 4 - i; // 4 down to -4
                      const topPx = ZERO_Y - val * PX_PER_U - 8;
                      return (
                        <Text key={lbl} style={[styles.yLabel, { top: topPx, color: val >= 3 ? '#cc0000' : val <= -3 ? '#5e35b1' : '#9370db' }]}>
                          {lbl}
                        </Text>
                      );
                    })}
                  </View>

                  {/* Chart body */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    <View style={{ width: Math.max(currentMonthData.length * (barW + 6), SCREEN_WIDTH - 100), height: CHART_H + 20 }}>

                      {/* Zero line */}
                      <View style={[styles.zeroLine, { top: ZERO_Y }]} />

                      {/* Caution zones — top (mania ≥3) and bottom (depression ≤-3) */}
                      <View style={[styles.cautionZone, { top: 0, height: ZERO_Y - 2 * PX_PER_U, backgroundColor: 'rgba(220,50,50,0.08)' }]} />
                      <View style={[styles.cautionZone, { top: ZERO_Y + 2 * PX_PER_U, height: 2 * PX_PER_U, backgroundColor: 'rgba(94,53,177,0.10)' }]} />

                      {/* Grid lines at each unit */}
                      {[-3,-2,-1,1,2,3].map(v => (
                        <View key={v} style={[styles.gridLine, { top: ZERO_Y - v * PX_PER_U }]} />
                      ))}

                      {/* Bars */}
                      <View style={[styles.barsRow, { height: CHART_H }]}>
                        {currentMonthData.map(d => {
                          const val    = d.avg;
                          const barH   = Math.max(3, Math.abs(val) * PX_PER_U);
                          const isPos  = val >= 0;
                          const colors = getBarColors(val);
                          const day    = parseInt(d.dateKey.slice(8));
                          const ext    = isExtreme(val);

                          return (
                            <View key={d.dateKey} style={[styles.barWrapper, { width: barW + 6 }]}>
                              {/* Value label */}
                              <Text style={[styles.barVal, { color: ext ? (isPos ? '#cc0000' : '#5e35b1') : '#9370db' }]}>
                                {val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                              </Text>

                              {/* Positive bar (above zero) */}
                              {isPos ? (
                                <View style={{ height: ZERO_Y, justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <LinearGradient
                                    colors={colors}
                                    style={[styles.bar, { height: barH, width: barW, borderRadius: 5, borderTopLeftRadius: 5, borderTopRightRadius: 5 }]}
                                    start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }}
                                  />
                                </View>
                              ) : (
                                <View style={{ height: ZERO_Y }} />
                              )}

                              {/* Negative bar (below zero) */}
                              {!isPos ? (
                                <View style={{ height: ZERO_Y, justifyContent: 'flex-start', alignItems: 'center' }}>
                                  <LinearGradient
                                    colors={[colors[1], colors[0]]}
                                    style={[styles.bar, { height: barH, width: barW, borderRadius: 5, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }]}
                                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                                  />
                                </View>
                              ) : (
                                <View style={{ height: ZERO_Y }} />
                              )}

                              <Text style={[styles.barLabel, { color: ext ? (isPos ? '#cc0000' : '#5e35b1') : '#8b5a8e', fontWeight: ext ? '800' : '600' }]}>
                                {day}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>
                </View>

                {/* Legend */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#ff0000' }]} />
                    <Text style={styles.legendTxt}>⚠️ Mania zone</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#4dd0e1' }]} />
                    <Text style={styles.legendTxt}>Normal</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#311b92' }]} />
                    <Text style={styles.legendTxt}>⚠️ Crisis zone</Text>
                  </View>
                </View>
                <Text style={styles.chartNote}>Daily average plotted · Multiple entries allowed · Shaded = caution</Text>
              </View>
            )}
          </View>

          {/* Mood History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💜 Mood History</Text>
            {moodHistory.length === 0 ? (
              <View style={styles.emptyContainer}><Text style={styles.emptyText}>No mood entries yet</Text></View>
            ) : (
              <View style={styles.historyContainer}>
                {moodHistory.map((entry) => {
                  const sym: string[] = [];
                  if (entry.racing_thoughts) sym.push("Racing Thoughts");
                  if (entry.no_sleep)        sym.push("No Need of Sleep");
                  if (entry.over_interest)   sym.push("Overly Interested");
                  if (entry.lack_control)    sym.push("Lack of Control");
                  if (entry.anxiety)         sym.push("Anxiety");
                  if (entry.ordering)        sym.push("Ordering");
                  if (entry.over_planning)   sym.push("Over Planning");
                  if (entry.self_harm)       sym.push("Self Harm");
                  if (entry.angry)           sym.push("Angry");
                  if (entry.depressed_anxiety) sym.push("Anxious");
                  const val = MOOD_SCALE[entry.mood] ?? 0;
                  const ext = isExtreme(val);
                  return (
                    <View key={entry.id} style={[styles.historyItem, ext && styles.historyItemExtreme]}>
                      <View style={styles.historyHeader}>
                        <View style={styles.historyLeft}>
                          {ext && <Ionicons name="warning" size={16} color={val > 0 ? '#cc0000' : '#5e35b1'} style={{ marginRight: 4 }} />}
                          <Text style={[styles.historyMood, { color: val >= 3 ? '#cc0000' : val <= -3 ? '#5e35b1' : '#8b5a8e' }]}>{entry.mood}</Text>
                        </View>
                        <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                      </View>
                      {sym.length > 0 && (
                        <View style={styles.symptomsTagsContainer}>
                          {sym.map((s, i) => (
                            <LinearGradient key={i} colors={['#e6e6ff','#ffe6f0']} style={styles.symptomTag}>
                              <Text style={styles.symptomTagText}>{s}</Text>
                            </LinearGradient>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection:"row", alignItems:"center", padding:20, backgroundColor:'rgba(255,255,255,0.8)', borderBottomLeftRadius:24, borderBottomRightRadius:24 },
  backButton: { padding:8 },
  headerContent: { flexDirection:"row", alignItems:"center", gap:12, marginLeft:8 },
  headerIcon: { width:48, height:48, borderRadius:24, justifyContent:"center", alignItems:"center" },
  title: { fontSize:24, fontWeight:"800", color:"#8b5a8e" },
  scrollView: { flex:1 },
  section: { padding:16, marginTop:8 },
  sectionTitle: { fontSize:20, fontWeight:"700", color:"#8b5a8e", marginBottom:16 },
  moodGrid: { gap:10 },
  moodButton: { padding:18, borderRadius:14, alignItems:"center", shadowColor:"#000", shadowOffset:{width:0,height:3}, shadowOpacity:0.2, shadowRadius:6, elevation:4 },
  moodButtonText: { color:"#fff", fontSize:16, fontWeight:"700", textShadowColor:'rgba(0,0,0,0.3)', textShadowOffset:{width:0,height:1}, textShadowRadius:3 },
  loadingContainer: { padding:24, alignItems:"center" },
  symptomsContainer: { backgroundColor:"rgba(255,255,255,0.8)", borderRadius:16, padding:16, gap:12, borderWidth:2, borderColor:"#ffd1dc" },
  checkboxRow: { flexDirection:"row", alignItems:"center", padding:14, backgroundColor:"rgba(255,245,248,0.9)", borderRadius:12, gap:12 },
  checkboxLabel: { fontSize:16, color:"#6b5b8e", fontWeight:"500" },
  saveButton: { padding:16, borderRadius:12, alignItems:"center", marginTop:8 },
  saveButtonText: { color:"#fff", fontSize:17, fontWeight:"700" },
  // Histogram
  histogramCard: { backgroundColor:"rgba(255,255,255,0.85)", borderRadius:20, padding:14, borderWidth:2, borderColor:"#ffd1dc", shadowColor:"#ffb6d9", shadowOffset:{width:0,height:4}, shadowOpacity:0.15, shadowRadius:12, elevation:4 },
  chartArea: { flexDirection:"row" },
  yAxis: { width:52, position:"relative" },
  yLabel: { position:"absolute", fontSize:9, fontWeight:"600", right:4, textAlign:"right" },
  zeroLine: { position:"absolute", left:0, right:0, height:2, backgroundColor:"rgba(139,90,142,0.5)", zIndex:2 },
  cautionZone: { position:"absolute", left:0, right:0 },
  gridLine: { position:"absolute", left:0, right:0, height:1, backgroundColor:"rgba(180,150,200,0.2)" },
  barsRow: { flexDirection:"row", alignItems:"center" },
  barWrapper: { alignItems:"center" },
  barVal: { fontSize:8, fontWeight:"700", marginBottom:1 },
  bar: {},
  barLabel: { fontSize:9, marginTop:3 },
  legendRow: { flexDirection:"row", justifyContent:"space-around", marginTop:12, flexWrap:"wrap", gap:6 },
  legendItem: { flexDirection:"row", alignItems:"center", gap:4 },
  legendDot: { width:10, height:10, borderRadius:5 },
  legendTxt: { fontSize:10, color:"#8b5a8e", fontWeight:"600" },
  chartNote: { textAlign:"center", fontSize:10, color:"#b19cd9", marginTop:6, fontStyle:"italic" },
  // History
  historyContainer: { gap:12 },
  historyItem: { backgroundColor:"rgba(255,255,255,0.9)", padding:16, borderRadius:16, borderWidth:2, borderColor:"#ffd1dc" },
  historyItemExtreme: { borderColor:"#cc0000", backgroundColor:"rgba(255,240,240,0.95)" },
  historyHeader: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 },
  historyLeft: { flexDirection:"row", alignItems:"center" },
  historyMood: { fontSize:18, fontWeight:"700" },
  historyDate: { fontSize:13, color:"#9370db", fontWeight:"500" },
  symptomsTagsContainer: { flexDirection:"row", flexWrap:"wrap", gap:8, marginTop:8 },
  symptomTag: { paddingHorizontal:12, paddingVertical:6, borderRadius:16, borderWidth:1, borderColor:"#d4b3e8" },
  symptomTagText: { fontSize:13, color:"#8b5a8e", fontWeight:"600" },
  emptyContainer: { padding:32, alignItems:"center", gap:12 },
  emptyText: { textAlign:"center", color:"#9370db", fontSize:16, lineHeight:24 },
});
