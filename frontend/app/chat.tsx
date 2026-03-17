import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform } from "react-native";
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

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const hasShownPopupToday = (): boolean => {
  if (Platform.OS === "web") {
    const lastShown = localStorage.getItem("polarpath_calorie_popup_date");
    return lastShown === getTodayKey();
  }
  return false;
};

const markPopupShownToday = () => {
  if (Platform.OS === "web") {
    localStorage.setItem("polarpath_calorie_popup_date", getTodayKey());
  }
};

export default function Index() {
  const router = useRouter();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupResponse, setPopupResponse] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) =>
        (prevIndex + 1) % MOTIVATIONAL_QUOTES.length
      );
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show popup once per day
    const timer = setTimeout(() => {
      if (!hasShownPopupToday()) {
        setShowPopup(true);
      }
    }, 800); // slight delay so app loads first
    return () => clearTimeout(timer);
  }, []);

  const handlePopupYes = () => {
    setPopupResponse("yes");
    markPopupShownToday();
    setTimeout(() => {
      setShowPopup(false);
      setPopupResponse(null);
    }, 2500);
  };

  const handlePopupNo = () => {
    setPopupResponse("no");
    markPopupShownToday();
    setTimeout(() => {
      setShowPopup(false);
      setPopupResponse(null);
    }, 2500);
  };

  return (
    <LinearGradient colors={['#ffeef8', '#e8f4fd', '#f0e6ff']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>

        {/* Calorie Check Popup */}
        <Modal visible={showPopup} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <LinearGradient colors={['#ffeef8', '#f0e6ff']} style={styles.modalGradient}>

                {popupResponse === null && (
                  <>
                    <Text style={styles.modalEmoji}>🔥</Text>
                    <Text style={styles.modalTitle}>Daily Check-in!</Text>
                    <Text style={styles.modalQuestion}>Did you burn 300 calories today?</Text>
                    <View style={styles.modalButtons}>
                      <TouchableOpacity onPress={handlePopupYes} activeOpacity={0.8} style={styles.modalBtnWrapper}>
                        <LinearGradient colors={['#a8edea', '#6ee7b7']} style={styles.modalBtn}>
                          <Text style={styles.modalBtnText}>✅ Yes!</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handlePopupNo} activeOpacity={0.8} style={styles.modalBtnWrapper}>
                        <LinearGradient colors={['#ffb6d9', '#ff8fa3']} style={styles.modalBtn}>
                          <Text style={styles.modalBtnText}>❌ Not yet</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {popupResponse === "yes" && (
                  <>
                    <Text style={styles.modalEmoji}>🏆</Text>
                    <Text style={styles.modalTitle}>Amazing!</Text>
                    <Text style={styles.modalMessage}>
                      We are one step closer to our goal! 💪{"\n\n"}Every calorie burned is a victory. Keep showing up for yourself — your body and mind thank you for it. See you tomorrow! 🌟
                    </Text>
                  </>
                )}

                {popupResponse === "no" && (
                  <>
                    <Text style={styles.modalEmoji}>💪</Text>
                    <Text style={styles.modalTitle}>Buckle up, buddy!</Text>
                    <Text style={styles.modalMessage}>
                      We have a long way to go! 🚀{"\n\n"}But every journey starts with one step. Even a 10 minute walk counts. Put those shoes on — your future self is waiting! Let's get moving! 🔥
                    </Text>
                  </>
                )}

              </LinearGradient>
            </View>
          </View>
        </Modal>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient colors={['#ff9a9e', '#fecfef', '#b19cd9']} style={styles.iconGradient}>
                <Ionicons name="heart" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>POLARPATH</Text>
            <Text style={styles.subtitle}>Your journey to wellness ✨</Text>
          </View>

          {/* Quote */}
          <View style={styles.quoteCard}>
            <LinearGradient colors={['#fff9e6', '#ffe6f0']} style={styles.quoteGradient}>
              <Ionicons name="trophy" size={28} color="#f59e0b" style={styles.quoteIcon} />
              <Text style={styles.quoteText}>"{MOTIVATIONAL_QUOTES[currentQuoteIndex]}"</Text>
            </LinearGradient>
          </View>

          {/* Chat */}
          <TouchableOpacity style={styles.chatCard} onPress={() => router.push("/chat")} activeOpacity={0.8}>
            <LinearGradient
              colors={['#f3e5f5', '#e1bee7', '#e8eaf6']}
              start={{x: 0, y: 0}} end={{x: 1, y: 1}}
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

          {/* Feature Buttons */}
          <View style={styles.buttonsContainer}>

            <TouchableOpacity onPress={() => router.push("/moods")} activeOpacity={0.8}>
              <LinearGradient
                colors={['#d4b3e8', '#c8a7e8', '#b19cd9']}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                style={styles.featureButton}
              >
                <Ionicons name="happy-outline" size={32} color="#fff" />
                <Text style={styles.buttonText}>MOODS</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/gratitude")} activeOpacity={0.8}>
              <LinearGradient
                colors={['#ffb6d9', '#ffc4e8', '#ffd1e8']}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                style={styles.featureButton}
              >
                <Ionicons name="journal-outline" size={32} color="#fff" />
                <Text style={styles.buttonText}>GRATITUDE JOURNAL</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/routine")} activeOpacity={0.8}>
              <LinearGradient
                colors={['#a8e6cf', '#98d8c8', '#88d4c0']}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                style={styles.featureButton}
              >
                <Ionicons name="checkmark-circle-outline" size={32} color="#fff" />
                <Text style={styles.buttonText}>ROUTINE</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/therapy")} activeOpacity={0.8}>
              <LinearGradient
                colors={['#b3d4f5', '#a0c4f0', '#8ab4eb']}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                style={styles.featureButton}
              >
                <Ionicons name="medkit-outline" size={32} color="#fff" />
                <Text style={styles.buttonText}>THERAPY NOTES</Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24, marginTop: 20 },
  iconContainer: { marginBottom: 16, shadowColor: "#ff9a9e", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  iconGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 42, fontWeight: "800", color: "#8b5a8e", marginBottom: 8, letterSpacing: 3, textShadowColor: 'rgba(139, 90, 142, 0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  subtitle: { fontSize: 17, color: "#9370db", fontWeight: "600" },
  quoteCard: { marginBottom: 24, borderRadius: 24, overflow: 'hidden', shadowColor: "#ffc0cb", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  quoteGradient: { padding: 24, minHeight: 140, justifyContent: "center", alignItems: "center" },
  quoteIcon: { marginBottom: 12 },
  quoteText: { fontSize: 17, fontWeight: "700", color: "#c27ba0", textAlign: "center", lineHeight: 26, fontStyle: "italic" },
  chatCard: { marginBottom: 24, borderRadius: 24, overflow: 'hidden', shadowColor: "#9370db", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  chatGradient: { flexDirection: "row", alignItems: "center", padding: 24, gap: 16 },
  chatIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.6)', justifyContent: "center", alignItems: "center" },
  chatContent: { flex: 1 },
  chatTitle: { fontSize: 22, fontWeight: "800", color: "#8b5a8e", marginBottom: 4 },
  chatSubtitle: { fontSize: 15, color: "#9370db", fontWeight: "500" },
  buttonsContainer: { gap: 16 },
  featureButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 24, borderRadius: 24, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 1, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  // Popup modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCard: { width: '100%', borderRadius: 28, overflow: 'hidden', shadowColor: '#d4b3e8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  modalGradient: { padding: 32, alignItems: 'center' },
  modalEmoji: { fontSize: 56, marginBottom: 12 },
  modalTitle: { fontSize: 26, fontWeight: '800', color: '#8b5a8e', marginBottom: 12, textAlign: 'center' },
  modalQuestion: { fontSize: 18, fontWeight: '600', color: '#6b5b8e', textAlign: 'center', marginBottom: 28, lineHeight: 26 },
  modalMessage: { fontSize: 16, fontWeight: '500', color: '#6b5b8e', textAlign: 'center', lineHeight: 26 },
  modalButtons: { flexDirection: 'row', gap: 16, width: '100%' },
  modalBtnWrapper: { flex: 1 },
  modalBtn: { padding: 16, borderRadius: 16, alignItems: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
