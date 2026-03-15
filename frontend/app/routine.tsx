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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface RoutineTask {
  id: string;
  taskName: string;
  points: number;
}

interface DailyScore {
  id: string;
  total_points: number;
  score_date: string;
}

const TASKS_KEY = "polarpath_tasks";
const SCORES_KEY = "polarpath_scores";

const loadFromStorage = (key: string) => {
  if (Platform.OS === "web") {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }
  return [];
};

const saveToStorage = (key: string, data: any) => {
  if (Platform.OS === "web") {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export default function Routine() {
  const router = useRouter();
  const [taskName, setTaskName] = useState("");
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<DailyScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    setTasks(loadFromStorage(TASKS_KEY));
    setScores(loadFromStorage(SCORES_KEY));
  }, []);

  const handleAddTask = () => {
    if (!taskName.trim()) return;
    setLoading(true);
    const newTask: RoutineTask = {
      id: Date.now().toString(),
      taskName: taskName.trim(),
      points: 10,
    };
    const updated = [...tasks, newTask];
    saveToStorage(TASKS_KEY, updated);
    setTasks(updated);
    setTaskName("");
    setLoading(false);
  };

  const toggleTask = (taskId: string) => {
    setCheckedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSaveDailyScore = () => {
    const totalPoints = checkedTasks.size * 10;
    setSavingScore(true);
    const newScore: DailyScore = {
      id: Date.now().toString(),
      total_points: totalPoints,
      score_date: new Date().toISOString(),
    };
    const updated = [...scores, newScore];
    saveToStorage(SCORES_KEY, updated);
    setScores(updated);
    setCheckedTasks(new Set());
    setSavingScore(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Routine Tracker</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add New Task</Text>
            <View style={styles.addTaskContainer}>
              <TextInput
                style={styles.input}
                placeholder="Task Name"
                placeholderTextColor="#94a3b8"
                value={taskName}
                onChangeText={setTaskName}
              />
              <TouchableOpacity
                style={[styles.addButton, !taskName.trim() && styles.addButtonDisabled]}
                onPress={handleAddTask}
                disabled={loading || !taskName.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Add Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks yet. Add your first task above!</Text>
            ) : (
              <View style={styles.tasksContainer}>
                {tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskRow}
                    onPress={() => toggleTask(task.id)}
                  >
                    <Ionicons
                      name={checkedTasks.has(task.id) ? "checkbox" : "square-outline"}
                      size={24}
                      color="#10b981"
                    />
                    <Text style={styles.taskName}>{task.taskName}</Text>
                    <Text style={styles.taskPoints}>{task.points} points</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {tasks.length > 0 && (
              <View style={styles.scoreSection}>
                <Text style={styles.currentScore}>Current Score: {checkedTasks.size * 10} points</Text>
                <TouchableOpacity
                  style={styles.saveScoreButton}
                  onPress={handleSaveDailyScore}
                  disabled={savingScore}
                >
                  {savingScore ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveScoreButtonText}>Save Daily Routine Score</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Routine Score History</Text>
            {scores.length === 0 ? (
              <Text style={styles.emptyText}>No scores saved yet</Text>
            ) : (
              <View style={styles.scoresContainer}>
                {[...scores].reverse().map((score) => (
                  <View key={score.id} style={styles.scoreCard}>
                    <Text style={styles.scorePoints}>{score.total_points} points</Text>
                    <Text style={styles.scoreDate}>{formatDate(score.score_date)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  keyboardView: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1e293b", marginLeft: 8 },
  scrollView: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1e293b", marginBottom: 16 },
  addTaskContainer: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 12 },
  input: { backgroundColor: "#f8fafc", borderRadius: 8, padding: 16, fontSize: 16, color: "#1e293b", borderWidth: 1, borderColor: "#e2e8f0" },
  addButton: { backgroundColor: "#10b981", padding: 16, borderRadius: 8, alignItems: "center" },
  addButtonDisabled: { backgroundColor: "#cbd5e1" },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  tasksContainer: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  taskRow: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 12 },
  taskName: { flex: 1, fontSize: 16, color: "#1e293b" },
  taskPoints: { fontSize: 14, color: "#10b981", fontWeight: "600" },
  scoreSection: { marginTop: 16, backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 12 },
  currentScore: { fontSize: 18, fontWeight: "600", color: "#1e293b", textAlign: "center" },
  saveScoreButton: { backgroundColor: "#10b981", padding: 16, borderRadius: 8, alignItems: "center" },
  saveScoreButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  scoresContainer: { gap: 12 },
  scoreCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderLeftWidth: 4, borderLeftColor: "#10b981" },
  scorePoints: { fontSize: 18, fontWeight: "600", color: "#10b981" },
  scoreDate: { fontSize: 14, color: "#64748b" },
  emptyText: { textAlign: "center", color: "#64748b", fontSize: 14, padding: 24 },
});
