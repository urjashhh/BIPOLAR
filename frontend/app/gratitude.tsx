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

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface GratitudeEntry {
  id: string;
  title: string;
  description: string;
  date: string;
}

export default function Gratitude() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/gratitude?user=default_user`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching gratitude entries:", error);
    }
  };

  const handleSaveEntry = async () => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/gratitude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          user: "default_user",
        }),
      });

      if (response.ok) {
        setTitle("");
        setDescription("");
        fetchEntries();
      }
    } catch (error) {
      console.error("Error saving gratitude entry:", error);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>Gratitude Journal</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>New Entry</Text>
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What are you grateful for today?"
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.saveButton, (!title.trim() || !description.trim()) && styles.saveButtonDisabled]}
                onPress={handleSaveEntry}
                disabled={loading || !title.trim() || !description.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Gratitude History</Text>
            {entries.length === 0 ? (
              <Text style={styles.emptyText}>No gratitude entries yet</Text>
            ) : (
              <View style={styles.entriesContainer}>
                {entries.map((entry) => (
                  <View key={entry.id} style={styles.entryCard}>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    <Text style={styles.entryDescription}>{entry.description}</Text>
                    <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
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
  formSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 16,
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
  textArea: {
    minHeight: 120,
  },
  saveButton: {
    backgroundColor: "#ec4899",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  historySection: {
    padding: 16,
  },
  entriesContainer: {
    gap: 16,
  },
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#ec4899",
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  entryDescription: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    color: "#94a3b8",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    padding: 24,
  },
});
