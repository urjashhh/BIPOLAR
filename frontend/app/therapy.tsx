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
import { LinearGradient } from 'expo-linear-gradient';

interface TherapyEntry {
  id: string;
  title: string;
  description: string;
  date: string;
}

const STORAGE_KEY = "polarpath_therapy";

const loadEntries = (): TherapyEntry[] => {
  if (Platform.OS === "web") {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }
  return [];
};

const saveEntries = (entries: TherapyEntry[]) => {
  if (Platform.OS === "web") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
};

export default function Therapy() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState<TherapyEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = loadEntries();
    setEntries([...stored].reverse());
  }, []);

  const handleSaveEntry = () => {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    const newEntry: TherapyEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      date: new Date().toISOString(),
    };
    const existing = loadEntries();
    const updated = [...existing, newEntry];
    saveEntries(updated);
    setEntries([...updated].reverse());
    setTitle("");
    setDescription("");
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <LinearGradient colors={['#ffeef8', '#e8f4fd', '#f0e6ff']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#8b5a8e" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <LinearGradient colors={['#b3d4f5', '#8ab4eb']} style={styles.headerIcon}>
                <Ionicons name="medkit" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.title}>Therapy Notes</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

            {/* New Entry Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 New Note</Text>
              <View style={styles.formCard}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="pencil-outline" size={18} color="#8ab4eb" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Session title or date..."
                    placeholderTextColor="#a8c4e0"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <Ionicons name="document-text-outline" size={18} color="#8ab4eb" style={[styles.inputIcon, { marginTop: 4 }]} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="What did you discuss? Key insights, breakthroughs, homework..."
                    placeholderTextColor="#a8c4e0"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSaveEntry}
                  disabled={loading || !title.trim() || !description.trim()}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={(!title.trim() || !description.trim()) ? ['#d0dce8', '#c4d4e4'] : ['#b3d4f5', '#8ab4eb']}
                    style={styles.saveButton}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Save Note</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🗂 Previous Notes</Text>
              {entries.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="medkit-outline" size={56} color="#b3d4f5" />
                  <Text style={styles.emptyText}>No therapy notes yet{"\n"}Start by adding your first note above</Text>
                </View>
              ) : (
                <View style={styles.entriesContainer}>
                  {entries.map((entry, index) => (
                    <View key={entry.id} style={styles.entryCard}>
                      <LinearGradient
                        colors={index % 2 === 0 ? ['#eef4fd', '#e8f0fb'] : ['#f0f4ff', '#eef4fd']}
                        style={styles.entryGradient}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.entryTopRow}>
                          <LinearGradient colors={['#b3d4f5', '#8ab4eb']} style={styles.entryDot} />
                          <Text style={styles.entryTitle}>{entry.title}</Text>
                        </View>
                        <Text style={styles.entryDescription}>{entry.description}</Text>
                        <View style={styles.entryFooter}>
                          <Ionicons name="time-outline" size={13} color="#8ab4eb" />
                          <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: { padding: 8 },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12, marginLeft: 8 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#4a7ab5" },
  scrollView: { flex: 1 },
  section: { padding: 16, marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#4a7ab5", marginBottom: 16 },
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: "#c8dff5",
    shadowColor: "#8ab4eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(240, 248, 255, 0.9)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#c0d8f0",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  textAreaWrapper: { alignItems: "flex-start", paddingVertical: 10 },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#3a5a8e",
    paddingVertical: 10,
    fontWeight: "500",
  },
  textArea: { minHeight: 120 },
  saveButton: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#8ab4eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  entriesContainer: { gap: 14 },
  entryCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#8ab4eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: "#c8dff5",
  },
  entryGradient: { padding: 18 },
  entryTopRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  entryDot: { width: 10, height: 10, borderRadius: 5 },
  entryTitle: { fontSize: 18, fontWeight: "700", color: "#4a7ab5", flex: 1 },
  entryDescription: { fontSize: 15, color: "#3a5a8e", lineHeight: 24, marginBottom: 12, fontWeight: "400" },
  entryFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
  entryDate: { fontSize: 12, color: "#8ab4eb", fontWeight: "500" },
  emptyContainer: { padding: 40, alignItems: "center", gap: 16 },
  emptyText: { textAlign: "center", color: "#6a9fd4", fontSize: 16, lineHeight: 24 },
});
