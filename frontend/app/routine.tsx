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
import { LineChart } from "react-native-gifted-charts";

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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

export default function Routine() {
  const router = useRouter();
  const [taskName, setTaskName] = useState("");
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<DailyScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchScores();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/routine/tasks?user=default_user`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchScores = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/routine/scores?user=default_user`);
      if (response.ok) {
        const data = await response.json();
        setScores(data);
      }
    } catch (error) {
      console.error("Error fetching scores:", error);
    }
  };

  const handleAddTask = async () => {
    if (!taskName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/routine/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskName: taskName.trim(),
          user: "default_user",
        }),
      });

      if (response.ok) {
        setTaskName("");
        fetchTasks();
      }
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setLoading(false);
    }
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

  const handleSaveDailyScore = async () => {
    const totalPoints = checkedTasks.size * 10;
    
    setSavingScore(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/routine/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_points: totalPoints,
          user: "default_user",
        }),
      });

      if (response.ok) {
        setCheckedTasks(new Set());
        fetchScores();
      }
    } catch (error) {
      console.error("Error saving score:", error);
    } finally {
      setSavingScore(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const prepareScoreChartData = () => {
    if (scores.length === 0) return [];
    
    const chartData = scores
      .slice(0, 10)
      .reverse()
      .map((score, index) => ({
        value: score.total_points,
        label: new Date(score.score_date).getDate().toString(),
        dataPointColor: "#10b981",
        dataPointRadius: 5,
      }));
    
    return chartData;
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

          {scores.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Score Progress (Last 10 Entries)</Text>
              <View style={styles.chartContainer}>
                <LineChart
                  data={prepareScoreChartData()}
                  width={Dimensions.get('window').width - 64}
                  height={200}
                  color="#10b981"
                  thickness={3}
                  dataPointsColor="#10b981"
                  startFillColor="rgba(16, 185, 129, 0.3)"
                  endFillColor="rgba(16, 185, 129, 0.05)"
                  startOpacity={0.9}
                  endOpacity={0.2}
                  curved
                  areaChart
                  hideRules
                  hideYAxisText
                  yAxisColor="#e2e8f0"
                  xAxisColor="#e2e8f0"
                  yAxisThickness={0}
                  xAxisThickness={1}
                  noOfSections={4}
                  pointerConfig={{
                    pointerStripHeight: 160,
                    pointerStripColor: '#10b981',
                    pointerStripWidth: 2,
                    pointerColor: '#10b981',
                    radius: 6,
                    pointerLabelWidth: 100,
                    pointerLabelHeight: 90,
                    activatePointersOnLongPress: false,
                    autoAdjustPointerLabelPosition: false,
                    pointerLabelComponent: (items: any) => {
                      return (
                        <View style={styles.tooltipContainer}>
                          <Text style={styles.tooltipText}>{items[0]?.value || 0} points</Text>
                        </View>
                      );
                    },
                  }}
                />
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Routine Score History</Text>
            {scores.length === 0 ? (
              <Text style={styles.emptyText}>No scores saved yet</Text>
            ) : (
              <View style={styles.scoresContainer}>
                {scores.map((score) => (
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
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  addTaskContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addButton: {
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tasksContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  taskName: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  taskPoints: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  scoreSection: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  currentScore: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
  saveScoreButton: {
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveScoreButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scoresContainer: {
    gap: 12,
  },
  scoreCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  scorePoints: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10b981",
  },
  scoreDate: {
    fontSize: 14,
    color: "#64748b",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    padding: 24,
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  tooltipContainer: {
    backgroundColor: "#1e293b",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
