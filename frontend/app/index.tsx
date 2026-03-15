import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';

const MOTIVATIONAL_QUOTES = [
  "DISCIPLINE Trumps motivation",
  "Success is not final, failure is not fatal: it is the courage to continue that counts",
  "The only way to do great work is to love what you do",
  "Your limitation—it's only your imagination",
  "Push yourself, because no one else is going to do it for you",
  "Great things never come from comfort zones",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it",
  "The harder you work for something, the greater you'll feel when you achieve it",
  "Don't stop when you're tired. Stop when you're done",
  "Wake up with determination. Go to bed with satisfaction",
  "Do something today that your future self will thank you for",
  "Little things make big days",
  "It's going to be hard, but hard does not mean impossible",
  "Don't wait for opportunity. Create it",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths",
  "The key to success is to focus on goals, not obstacles",
  "Dream bigger. Do bigger",
  "Don't tell people your plans. Show them your results",
  "Work hard in silence, let your success be the noise",
  "The struggle you're in today is developing the strength you need tomorrow",
  "Perseverance is not a long race; it is many short races one after the other",
  "Fall seven times, stand up eight",
  "It does not matter how slowly you go as long as you do not stop",
  "Mental toughness is not an option—it's a necessity for success",
];

export default function Index() {
  const router = useRouter();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => 
        (prevIndex + 1) % MOTIVATIONAL_QUOTES.length
      );
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient
      colors={['#ffeef8', '#e8f4fd', '#f0e6ff']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#ff9a9e', '#fecfef', '#b19cd9']}
                style={styles.iconGradient}
              >
                <Ionicons name="heart" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>POLARPATH</Text>
            <Text style={styles.subtitle}>Your journey to wellness ✨</Text>
          </View>

          <View style={styles.quoteCard}>
            <LinearGradient
              colors={['#fff9e6', '#ffe6f0']}
              style={styles.quoteGradient}
            >
              <Ionicons name="trophy" size={28} color="#f59e0b" style={styles.quoteIcon} />
              <Text style={styles.quoteText}>"{MOTIVATIONAL_QUOTES[currentQuoteIndex]}"</Text>
            </LinearGradient>
          </View>

          <TouchableOpacity 
            style={styles.chatCard}
            onPress={() => router.push("/chat")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f3e5f5', '#e1bee7', '#e8eaf6']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.chatGradient}
            >
              <View style={styles.chatIconContainer}>
                <Ionicons name="chatbubbles" size={32} color="#9370db" />
              </View>
              <View style={styles.chatContent}>
                <Text style={styles.chatTitle}>What's happening?</Text>
                <Text style={styles.chatSubtitle}>Talk to your AI companion</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#9370db" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              onPress={() => router.push("/moods")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#d4b3e8', '#c8a7e8', '#b19cd9']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.featureButton}
              >
                <Ionicons name="happy-outline" size={32} color="#fff" />
                <Text style={styles.buttonText}>MOODS</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push("/gratitude")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ffb6d9', '#ffc4e8', '#ffd1e8']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.featureButton}
              >
                <Ionicons name="journal-outline" size={32} color="#fff" />
                <Text style={styles.buttonText}>GRATITUDE JOURNAL</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push("/routine")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#a8e6cf', '#98d8c8', '#88d4c0']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.featureButton}
              >
                <Ionicons name="checkmark-circle-outline" size={32} color="#fff" />
                <Text style={styles.buttonText}>ROUTINE</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  iconContainer: {
    marginBottom: 16,
    shadowColor: "#ff9a9e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#8b5a8e",
    marginBottom: 8,
    letterSpacing: 3,
    textShadowColor: 'rgba(139, 90, 142, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 17,
    color: "#9370db",
    fontWeight: "600",
  },
  quoteCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#ffc0cb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  quoteGradient: {
    padding: 24,
    minHeight: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  quoteIcon: {
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#c27ba0",
    textAlign: "center",
    lineHeight: 26,
    fontStyle: "italic",
  },
  chatCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#9370db",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  chatGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  chatIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: "center",
    alignItems: "center",
  },
  chatContent: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#8b5a8e",
    marginBottom: 4,
  },
  chatSubtitle: {
    fontSize: 15,
    color: "#9370db",
    fontWeight: "500",
  },
  buttonsContainer: {
    gap: 16,
  },
  featureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
