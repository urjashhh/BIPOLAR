import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const MOOD_OPTIONS = [
  { label: "Manic", colors: ['#ff9a9e', '#fecfef'] },
  { label: "Hypomanic", colors: ['#ffd1ff', '#ffc4e8'] },
  { label: "Very Happy", colors: ['#fff9b0', '#ffeaa7'] },
  { label: "Pleasant", colors: ['#ffecd2', '#fcb69f'] },
  { label: "Normal", colors: ['#a8edea', '#fed6e3'] },
  { label: "Sad", colors: ['#c1dfc4', '#deecdd'] },
  { label: "Depressed", colors: ['#d4bfff', '#c8e0f5'] },
  { label: "Extremely Depressed", colors: ['#b5c6e0', '#d4d3dd'] },
  { label: "Extremely Suicidal", colors: ['#e0c3fc', '#8ec5fc'] },
];

const MANIA_SYMPTOMS = [
  { key: "racing_thoughts", label: "Racing Thoughts" },
  { key: "no_sleep", label: "No Need of Sleep" },
  { key: "over_interest", label: "Overly Interested in Things" },
  { key: "lack_control", label: "Lack of Physical Control" },
  { key: "anxiety", label: "Anxiety" },
  { key: "ordering", label: "Ordering" },
  { key: "over_planning", label: "Over Planning" },
];

const DEPRESSION_SYMPTOMS = [
  { key: "self_harm", label: "Self Harm" },
  { key: "angry", label: "Angry" },
  { key: "depressed_anxiety", label: "Anxious" },
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

export default function Moods() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentMoodId, setCurrentMoodId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<{[key: string]: boolean}>({});
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingSymptoms, setSavingSymptoms] = useState(false);

  useEffect(() => {
    fetchMoodHistory();
  }, []);

  const fetchMoodHistory = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/moods?user=default_user`);
      if (response.ok) {
        const data = await response.json();
        setMoodHistory(data);
      }
    } catch (error) {
      console.error("Error fetching mood history:", error);
    }
  };

  const handleMoodSelect = async (mood: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/moods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, user: "default_user" }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedMood(mood);
        setCurrentMoodId(data.id);
        setSymptoms({});
        fetchMoodHistory();
      }
    } catch (error) {
      console.error("Error creating mood entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSymptoms = async () => {
    if (!currentMoodId) return;
    
    setSavingSymptoms(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/moods/${currentMoodId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(symptoms),
      });

      if (response.ok) {
        setSelectedMood(null);
        setCurrentMoodId(null);
        setSymptoms({});
        fetchMoodHistory();
      }
    } catch (error) {
      console.error("Error saving symptoms:", error);
    } finally {
      setSavingSymptoms(false);
    }
  };

  const toggleSymptom = (key: string) => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showManiaSymptoms = selectedMood && ["Very Happy", "Hypomanic", "Manic"].includes(selectedMood);
  const showDepressionSymptoms = selectedMood && ["Depressed", "Extremely Depressed"].includes(selectedMood);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <LinearGradient
      colors={['#ffeef8', '#e8f4fd', '#f0e6ff']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#8b5a8e" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <LinearGradient
              colors={['#d4b3e8', '#c8a7e8']}
              style={styles.headerIcon}
            >
              <Ionicons name="happy-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Mood Tracking</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  onPress={() => handleMoodSelect(mood.label)}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={mood.colors}
                    style={styles.moodButton}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                  >
                    <Text style={styles.moodButtonText}>{mood.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9370db" />
            </View>
          )}

          {showManiaSymptoms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mania Symptoms</Text>
              <View style={styles.symptomsContainer}>
                {MANIA_SYMPTOMS.map((symptom) => (
                  <TouchableOpacity
                    key={symptom.key}
                    style={styles.checkboxRow}
                    onPress={() => toggleSymptom(symptom.key)}
                  >
                    <Ionicons
                      name={symptoms[symptom.key] ? "checkbox" : "square-outline"}
                      size={24}
                      color="#d4b3e8"
                    />
                    <Text style={styles.checkboxLabel}>{symptom.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={handleSaveSymptoms}
                  disabled={savingSymptoms}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#d4b3e8', '#c8a7e8']}
                    style={styles.saveButton}
                  >
                    {savingSymptoms ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Symptoms</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showDepressionSymptoms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Depression Symptoms</Text>
              <View style={styles.symptomsContainer}>
                {DEPRESSION_SYMPTOMS.map((symptom) => (
                  <TouchableOpacity
                    key={symptom.key}
                    style={styles.checkboxRow}
                    onPress={() => toggleSymptom(symptom.key)}
                  >
                    <Ionicons
                      name={symptoms[symptom.key] ? "checkbox" : "square-outline"}
                      size={24}
                      color="#d4b3e8"
                    />
                    <Text style={styles.checkboxLabel}>{symptom.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={handleSaveSymptoms}
                  disabled={savingSymptoms}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#d4b3e8', '#c8a7e8']}
                    style={styles.saveButton}
                  >
                    {savingSymptoms ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Symptoms</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood History</Text>
            {moodHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No mood entries yet</Text>
              </View>
            ) : (
              <View style={styles.historyContainer}>
                {moodHistory.map((entry) => {
                  const symptoms = [];
                  if (entry.racing_thoughts) symptoms.push("Racing Thoughts");
                  if (entry.no_sleep) symptoms.push("No Need of Sleep");
                  if (entry.over_interest) symptoms.push("Overly Interested");
                  if (entry.lack_control) symptoms.push("Lack of Control");
                  if (entry.anxiety) symptoms.push("Anxiety");
                  if (entry.ordering) symptoms.push("Ordering");
                  if (entry.over_planning) symptoms.push("Over Planning");
                  if (entry.self_harm) symptoms.push("Self Harm");
                  if (entry.angry) symptoms.push("Angry");
                  if (entry.depressed_anxiety) symptoms.push("Anxious");

                  return (
                    <View key={entry.id} style={styles.historyItem}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyMood}>{entry.mood}</Text>
                        <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                      </View>
                      {symptoms.length > 0 && (
                        <View style={styles.symptomsTagsContainer}>
                          {symptoms.map((s, index) => (
                            <LinearGradient
                              key={index}
                              colors={['#e6e6ff', '#ffe6f0']}
                              style={styles.symptomTag}
                            >
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
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 8,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#8b5a8e",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#8b5a8e",
    marginBottom: 16,
  },
  moodGrid: {
    gap: 12,
  },
  moodButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  moodButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },
  symptomsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: "#ffd1dc",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "rgba(255, 245, 248, 0.9)",
    borderRadius: 12,
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#6b5b8e",
    fontWeight: "500",
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#d4b3e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  historyContainer: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ffd1dc",
    shadowColor: "#ffb6d9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyMood: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8b5a8e",
  },
  historyDate: {
    fontSize: 14,
    color: "#9370db",
    fontWeight: "500",
  },
  symptomsTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  symptomTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4b3e8",
  },
  symptomTagText: {
    fontSize: 13,
    color: "#8b5a8e",
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#9370db",
    fontSize: 16,
  },
});