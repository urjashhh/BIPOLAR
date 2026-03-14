import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="heart" size={48} color="#6366f1" />
          <Text style={styles.title}>Bipolar Wellness</Text>
          <Text style={styles.subtitle}>Track your journey to better mental health</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.moodsButton]}
            onPress={() => router.push("/moods")}
          >
            <Ionicons name="happy-outline" size={32} color="#fff" />
            <Text style={styles.buttonText}>MOODS</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.gratitudeButton]}
            onPress={() => router.push("/gratitude")}
          >
            <Ionicons name="journal-outline" size={32} color="#fff" />
            <Text style={styles.buttonText}>GRATITUDE JOURNAL</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.routineButton]}
            onPress={() => router.push("/routine")}
          >
            <Ionicons name="checkmark-circle-outline" size={32} color="#fff" />
            <Text style={styles.buttonText}>ROUTINE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
  },
  buttonsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  moodsButton: {
    backgroundColor: "#6366f1",
  },
  gratitudeButton: {
    backgroundColor: "#ec4899",
  },
  routineButton: {
    backgroundColor: "#10b981",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
