import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

interface RoutineTask {
  id: string;
  taskName: string;
  points: number;
}

interface DailyScore {
  dateKey: string;  // YYYY-MM-DD
  total_points: number;
  score_date: string;
}

interface MonthlyData {
  [monthKey: string]: DailyScore[]; // key: "YYYY-MM"
}

const TASKS_KEY = "polarpath_tasks";
const MONTHLY_KEY = "polarpath_monthly_scores";
const MAX_SCORE = 100;
const SCREEN_WIDTH = Dimensions.get("window").width;

// ── Storage helpers ────────────────────────────────────────────
const load = (key: string, fallback: any = []) => {
  if (Platform.OS === "web") {
    try {
      const d = localStorage.getItem(key);
      return d ? JSON.parse(d) : fallback;
    } catch { return fallback; }
  }
  return fallback;
};

const save = (key: string, data: any) => {
  if (Platform.OS === "web") localStorage.setItem(key, JSON.stringify(data));
};

const getTodayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const getMonthKey = () => new Date().toISOString().slice(0, 7);  // YYYY-MM

// ── Histogram bar color based on score ────────────────────────
const getBarColor = (score: number): [string, string] => {
  if (score >= 80) return ['#a8edea', '#6ee7b7'];
  if (score >= 60) return ['#d4b3e8', '#c8a7e8'];
  if (score >= 40) return ['#ffecd2', '#fcb69f'];
  return ['#ffd1dc', '#ffb3c6'];
};

export default function Routine() {
  const router = useRouter();
  const [taskName, setTaskName] = useState("");
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [loading, setLoading] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [savedToday, setSavedToday] = useState(false);

  useEffect(() => {
    const t = load(TASKS_KEY, []);
    const m = load(MONTHLY_KEY, {});
    setTasks(t);
    setMonthlyData(m);
    // Check if already saved today
    const todayKey = getTodayKey();
    const monthKey = getMonthKey();
    if (m[monthKey]?.some((s: DailyScore) => s.dateKey === todayKey)) {
      setSavedToday(true);
    }
  }, []);

  // Current month's scores sorted by date
  const currentMonthScores: DailyScore[] = (() => {
    const monthKey = getMonthKey();
    const scores = monthlyData[monthKey] || [];
    return [...scores].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  })();

  const handleAddTask = () => {
    if (!taskName.trim()) return;
    setLoading(true);
    const newTask: RoutineTask = { id: Date.now().toString(), taskName: taskName.trim(), points: 10 };
    const updated = [...tasks, newTask];
    save(TASKS_KEY, updated);
    setTasks(updated);
    setTaskName("");
    setLoading(false);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    save(TASKS_KEY, updated);
    setTasks(updated);
  };

  const toggleTask = (taskId: string) => {
    setCheckedTasks(prev => {
      const s = new Set(prev);
      s.has(taskId) ? s.delete(taskId) : s.add(taskId);
      return s;
    });
  };

  const handleSaveDailyScore = () => {
    const totalPoints = Math.min(checkedTasks.size * 10, MAX_SCORE);
    setSavingScore(true);

    const todayKey = getTodayKey();
    const monthKey = getMonthKey();
    const newEntry: DailyScore = {
      dateKey: todayKey,
      total_points: totalPoints,
      score_date: new Date().toISOString(),
    };

    const updated: MonthlyData = { ...monthlyData };
    if (!updated[monthKey]) updated[monthKey] = [];

    // Replace existing entry for today if exists
    const idx = updated[monthKey].findIndex(s => s.dateKey === todayKey);
    if (idx >= 0) {
      updated[monthKey][idx] = newEntry;
    } else {
      updated[monthKey] = [...updated[monthKey], newEntry];
    }

    save(MONTHLY_KEY, updated);
    setMonthlyData(updated);
    setCheckedTasks(new Set());
    setSavingScore(false);
    setSavedToday(true);
  };

  const currentScore = Math.min(checkedTasks.size * 10, MAX_SCORE);
  const barWidth = Math.max(18, Math.min(32, (SCREEN_WIDTH - 64) / Math.max(currentMonthScores.length, 1) - 4));

  return (
    <LinearGradient colors={['#ffeef8', '#e8f4fd', '#f0e6ff']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#8b5a8e" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <LinearGradient colors={['#a8edea', '#d4b3e8']} style={styles.headerIcon}>
                <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.title}>Routine Tracker</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

            {/* Add Task */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>➕ Add New Task</Text>
              <View style={styles.formCard}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="create-outline" size={18} color="#d4b3e8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Task name..."
                    placeholderTextColor="#c4a8d4"
                    value={taskName}
                    onChangeText={setTaskName}
                  />
                </View>
                <TouchableOpacity onPress={handleAddTask} disabled={loading || !taskName.trim()} activeOpacity={0.8}>
                  <LinearGradient
                    colors={!taskName.trim() ? ['#e0d0e8', '#d4c4e0'] : ['#a8edea', '#d4b3e8']}
                    style={styles.addButton}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        <Text style={styles.addButtonText}>Add Task</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Today's Tasks */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Today's Tasks</Text>
              {tasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="clipboard-outline" size={48} color="#d4b3e8" />
                  <Text style={styles.emptyText}>No tasks yet{"\n"}Add your first task above!</Text>
                </View>
              ) : (
                <View style={styles.tasksCard}>
                  {tasks.map((task, index) => (
                    <View key={task.id} style={[styles.taskRow, index < tasks.length - 1 && styles.taskBorder]}>
                      <TouchableOpacity onPress={() => toggleTask(task.id)} style={styles.taskLeft}>
                        <LinearGradient
                          colors={checkedTasks.has(task.id) ? ['#a8edea', '#6ee7b7'] : ['#f0e6ff', '#ffeef8']}
                          style={styles.checkbox}
                        >
                          <Ionicons
                            name={checkedTasks.has(task.id) ? "checkmark" : ""}
                            size={14}
                            color="#fff"
                          />
                        </LinearGradient>
                        <Text style={[styles.taskName, checkedTasks.has(task.id) && styles.taskNameDone]}>
                          {task.taskName}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.taskRight}>
                        <View style={styles.pointsBadge}>
                          <Text style={styles.taskPoints}>10 pts</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteTask(task.id)} style={styles.deleteBtn}>
                          <Ionicons name="trash-outline" size={16} color="#ffb3c6" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {tasks.length > 0 && (
                <View style={styles.scoreCard}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Today's Score</Text>
                    <Text style={styles.scoreValue}>{currentScore} / {MAX_SCORE}</Text>
                  </View>
                  {/* Score bar */}
                  <View style={styles.scoreBarBg}>
                    <LinearGradient
                      colors={getBarColor(currentScore)}
                      style={[styles.scoreBarFill, { width: `${currentScore}%` as any }]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <TouchableOpacity onPress={handleSaveDailyScore} disabled={savingScore} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#a8edea', '#d4b3e8']}
                      style={styles.saveButton}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      {savingScore ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Ionicons name="save-outline" size={20} color="#fff" />
                          <Text style={styles.saveButtonText}>
                            {savedToday ? "Update Today's Score" : "Save Daily Score"}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  {savedToday && (
                    <Text style={styles.savedNote}>✓ Score logged today — saving again will replace it</Text>
                  )}
                </View>
              )}
            </View>

            {/* Histogram */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 This Month's Progress</Text>
              {currentMonthScores.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="bar-chart-outline" size={48} color="#d4b3e8" />
                  <Text style={styles.emptyText}>No scores this month yet{"\n"}Start logging your daily routine!</Text>
                </View>
              ) : (
                <View style={styles.histogramCard}>
                  {/* Y axis labels */}
                  <View style={styles.histogramInner}>
                    <View style={styles.yAxis}>
                      {[100, 75, 50, 25, 0].map(v => (
                        <Text key={v} style={styles.yLabel}>{v}</Text>
                      ))}
                    </View>
                    {/* Bars */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.barsScroll}>
                      <View style={styles.barsContainer}>
                        {/* Grid lines */}
                        {[75, 50, 25].map(v => (
                          <View key={v} style={[styles.gridLine, { bottom: `${v}%` as any }]} />
                        ))}
                        {currentMonthScores.map((score) => {
                          const pct = Math.min((score.total_points / MAX_SCORE) * 100, 100);
                          const day = new Date(score.dateKey).getDate();
                          return (
                            <View key={score.dateKey} style={[styles.barWrapper, { width: barWidth + 8 }]}>
                              <Text style={styles.barScore}>{score.total_points}</Text>
                              <View style={styles.barTrack}>
                                <LinearGradient
                                  colors={getBarColor(score.total_points)}
                                  style={[styles.bar, { height: `${pct}%` as any, width: barWidth }]}
                                  start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }}
                                />
                              </View>
                              <Text style={styles.barLabel}>{day}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                  {/* Legend */}
                  <View style={styles.legend}>
                    {[
                      { colors: ['#a8edea', '#6ee7b7'] as [string,string], label: '80-100' },
                      { colors: ['#d4b3e8', '#c8a7e8'] as [string,string], label: '60-79' },
                      { colors: ['#ffecd2', '#fcb69f'] as [string,string], label: '40-59' },
                      { colors: ['#ffd1dc', '#ffb3c6'] as [string,string], label: '0-39' },
                    ].map(item => (
                      <View key={item.label} style={styles.legendItem}>
                        <LinearGradient colors={item.colors} style={styles.legendDot} />
                        <Text style={styles.legendLabel}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: 'rgba(255,255,255,0.8)', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { padding: 8 },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12, marginLeft: 8 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#8b5a8e" },
  scrollView: { flex: 1 },
  section: { padding: 16, marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#8b5a8e", marginBottom: 14 },
  formCard: { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 20, padding: 16, gap: 12, borderWidth: 2, borderColor: "#ffd1dc", shadowColor: "#ffb6d9", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,245,250,0.9)", borderRadius: 14, borderWidth: 1.5, borderColor: "#f0d0e8", paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: "#6b5b8e", paddingVertical: 12, fontWeight: "500" },
  addButton: { padding: 14, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  tasksCard: { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 20, overflow: "hidden", borderWidth: 2, borderColor: "#ffd1dc" },
  taskRow: { flexDirection: "row", alignItems: "center", padding: 14, justifyContent: "space-between" },
  taskBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,209,220,0.5)" },
  taskLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  checkbox: { width: 26, height: 26, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  taskName: { fontSize: 16, color: "#6b5b8e", fontWeight: "500", flex: 1 },
  taskNameDone: { textDecorationLine: "line-through", color: "#b19cd9" },
  taskRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  pointsBadge: { backgroundColor: "rgba(168,237,234,0.3)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  taskPoints: { fontSize: 12, color: "#6ee7b7", fontWeight: "700" },
  deleteBtn: { padding: 4 },
  scoreCard: { marginTop: 14, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 20, padding: 16, gap: 12, borderWidth: 2, borderColor: "#ffd1dc" },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreLabel: { fontSize: 17, fontWeight: "700", color: "#8b5a8e" },
  scoreValue: { fontSize: 22, fontWeight: "800", color: "#8b5a8e" },
  scoreBarBg: { height: 12, backgroundColor: "rgba(240,230,255,0.8)", borderRadius: 6, overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 6 },
  saveButton: { padding: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  savedNote: { textAlign: "center", fontSize: 12, color: "#b19cd9", fontStyle: "italic" },
  histogramCard: { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 20, padding: 16, borderWidth: 2, borderColor: "#ffd1dc" },
  histogramInner: { flexDirection: "row", height: 200 },
  yAxis: { width: 30, justifyContent: "space-between", alignItems: "flex-end", paddingRight: 6, paddingVertical: 4 },
  yLabel: { fontSize: 10, color: "#b19cd9", fontWeight: "600" },
  barsScroll: { flex: 1 },
  barsContainer: { flexDirection: "row", alignItems: "flex-end", height: 180, paddingBottom: 0, position: "relative" },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(209,180,220,0.25)" },
  barWrapper: { alignItems: "center", justifyContent: "flex-end", height: 180 },
  barScore: { fontSize: 9, color: "#9370db", fontWeight: "700", marginBottom: 2 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end", alignItems: "center" },
  bar: { borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 10, color: "#8b5a8e", fontWeight: "600", marginTop: 4 },
  legend: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 12, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: "#9370db", fontWeight: "600" },
  emptyContainer: { padding: 32, alignItems: "center", gap: 12 },
  emptyText: { textAlign: "center", color: "#9370db", fontSize: 15, lineHeight: 24 },
});
