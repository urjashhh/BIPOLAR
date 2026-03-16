import { useState, useEffect, useRef } from "react";
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

interface ChatMessage {
  id: string;
  user_message: string;
  ai_response: string;
  timestamp: string;
}

const STORAGE_KEY = "polarpath_chat";

const loadMessages = (): ChatMessage[] => {
  if (Platform.OS === "web") {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }
  return [];
};

const saveMessages = (messages: ChatMessage[]) => {
  if (Platform.OS === "web") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }
};

// Smart response engine — keyword based
const getSmartResponse = (input: string, awaitingAnxietyLevel: boolean): { response: string; newState: string } => {
  const msg = input.toLowerCase().trim();

  // If we asked about anxiety level, handle the follow-up
  if (awaitingAnxietyLevel) {
    if (msg.includes("high") && !msg.includes("very") && !msg.includes("extremely")) {
      return {
        response: "Let's do the 5-4-3-2-1 grounding technique together 🌿\n\n👁 Name 5 things you can SEE\n✋ Name 4 things you can TOUCH\n👂 Name 3 things you can HEAR\n👃 Name 2 things you can SMELL\n👅 Name 1 thing you can TASTE\n\nTake your time. This will bring you back to the present moment.",
        newState: ""
      };
    }
    if (msg.includes("very") || msg.includes("v high")) {
      return {
        response: "Okay, let's act now 💧\n\nGo splash cold water on your face right now — cold water activates your body's calming reflex and can quickly reduce anxiety.\n\nDo it now, then come back and tell me how you feel.",
        newState: ""
      };
    }
    if (msg.includes("extreme") || msg.includes("extremely")) {
      return {
        response: "This is a high anxiety moment 🚨\n\nPlease take your SOS medicine now if you have it prescribed. This is exactly what it's there for.\n\nIf you don't have medicine, call someone you trust immediately. You don't have to go through this alone.",
        newState: ""
      };
    }
  }

  // Anxiety
  if (msg.includes("anxious") || msg.includes("anxiety") || msg.includes("panic") || msg.includes("panicking")) {
    return {
      response: "I hear you 💜 How anxious are you feeling right now?\n\n1️⃣ High\n2️⃣ Very High\n3️⃣ Extremely High\n\nJust tell me which one and I'll guide you through what to do.",
      newState: "awaiting_anxiety_level"
    };
  }

  // Scared of men / unsafe
  if (msg.includes("scared of men") || msg.includes("afraid of men") || msg.includes("fear of men") || msg.includes("men scare")) {
    return {
      response: "I acknowledge that some terrible, horrifying, scary things have happened in the past 💜\n\nBut you are safe right now. No matter how many men are around you, no one can harm you — because you can fight, you can protect yourself. And there are so many people around to protect you.\n\nYou are stronger than you know. You are safe.",
      newState: ""
    };
  }

  // Flashbacks / trauma
  if (msg.includes("flashback") || msg.includes("flashbacks") || msg.includes("trauma") || msg.includes("keep remembering") || msg.includes("can't stop thinking about")) {
    return {
      response: "I acknowledge that some terrible, horrifying, scary things have happened in the past 💜\n\nBut nothing is happening to you right now. You are here, you are safe, you are breathing.\n\nThere are very few chances of such things happening again. It was very painful — but it is gone now. The pain is gone. You survived it, and you are here.\n\nFocus on what you can feel right now — your breath, your feet on the ground.",
      newState: ""
    };
  }

  // Extremely depressed
  if ((msg.includes("extremely depressed") || msg.includes("very depressed") || msg.includes("deeply depressed") || msg.includes("so depressed"))) {
    return {
      response: "I hear you, and I know how heavy this feels 💜\n\nI want you to do one thing right now — go for a 10 minute run or cycle ride. Just 10 minutes.\n\nMovement releases endorphins that directly fight depression. You don't have to feel like doing it — just do it anyway. Come back and tell me how you feel after.",
      newState: ""
    };
  }

  // General depressed
  if (msg.includes("depressed") || msg.includes("depression") || msg.includes("hopeless") || msg.includes("empty")) {
    return {
      response: "I'm really glad you're talking to me 💜 Depression can make everything feel impossibly heavy.\n\nHave you tracked your mood today? Sometimes seeing patterns helps us understand what's going on.\n\nWhat's one small thing that brought you even a tiny bit of comfort recently?",
      newState: ""
    };
  }

  // Sad
  if (msg.includes("sad") || msg.includes("crying") || msg.includes("cry") || msg.includes("tears")) {
    return {
      response: "It's okay to cry 💜 Tears are your body's way of releasing pain.\n\nI'm here with you. Can you tell me more about what's making you feel this way?",
      newState: ""
    };
  }

  // Manic / racing thoughts
  if (msg.includes("manic") || msg.includes("racing thoughts") || msg.includes("can't sleep") || msg.includes("no sleep") || msg.includes("hyper")) {
    return {
      response: "It sounds like your mind is moving very fast right now 💜\n\nLet's try to slow things down. Can you:\n1. Sit somewhere quiet\n2. Take 5 slow deep breaths\n3. Write down the 3 most important thoughts racing through your mind\n\nThis can help separate urgent thoughts from the noise. Have you logged your mood today?",
      newState: ""
    };
  }

  // Suicidal
  if (msg.includes("suicid") || msg.includes("end my life") || msg.includes("don't want to live") || msg.includes("kill myself")) {
    return {
      response: "I'm really glad you told me this 💜 Please reach out to someone right now.\n\n🆘 iCall (India): 9152987821\n🆘 Vandrevala Foundation: 1860-2662-345 (24/7)\n\nYou matter. This pain is temporary even when it doesn't feel that way. Please call someone now.",
      newState: ""
    };
  }

  // Happy / good
  if (msg.includes("happy") || msg.includes("good") || msg.includes("great") || msg.includes("better") || msg.includes("okay")) {
    return {
      response: "That's really good to hear 💜 I'm glad you're feeling better.\n\nMake sure to log this mood — tracking the good days is just as important as tracking the hard ones. What's contributing to feeling good today?",
      newState: ""
    };
  }

  // Default fallback
  const fallbacks = [
    "I hear you 💜 It takes courage to share how you're feeling. Can you tell me more about what's going on?",
    "Thank you for opening up 💜 Your feelings are valid. What's been weighing on you most lately?",
    "I'm here with you 💜 Living with bipolar disorder is challenging, but you're showing real strength by tracking your wellness. How can I support you today?",
    "That sounds really difficult 💜 Remember that your mood episodes are temporary, even when they don't feel that way. What coping strategies have helped you in the past?",
  ];
  return {
    response: fallbacks[Math.floor(Math.random() * fallbacks.length)],
    newState: ""
  };
};

export default function Chat() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatState, setChatState] = useState(""); // tracks conversation context
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || loading) return;
    const userMessage = message.trim();
    setMessage("");
    setLoading(true);

    // Small delay to feel natural
    setTimeout(() => {
      const { response: aiResponse, newState } = getSmartResponse(userMessage, chatState === "awaiting_anxiety_level");
      setChatState(newState);

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        user_message: userMessage,
        ai_response: aiResponse,
        timestamp: new Date().toISOString(),
      };

      const existing = loadMessages();
      const updated = [...existing, newMessage];
      saveMessages(updated);
      setMessages(updated);
      setLoading(false);
    }, 800);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <LinearGradient colors={['#ffeef8', '#e8f4fd', '#f0e6ff']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={0}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#8b5a8e" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <LinearGradient colors={['#d4b3e8', '#c8a7e8']} style={styles.headerIcon}>
                <Ionicons name="chatbubbles" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.title}>AI Companion</Text>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={72} color="#d4b3e8" />
                <Text style={styles.emptyTitle}>Start a conversation</Text>
                <Text style={styles.emptySubtitle}>Share how you're feeling, and I'll listen</Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View key={msg.id}>
                  <View style={styles.userMessageContainer}>
                    <LinearGradient colors={['#d4b3e8', '#c8a7e8']} style={styles.userBubble}>
                      <Text style={styles.userText}>{msg.user_message}</Text>
                      <Text style={styles.userTimestamp}>{formatTime(msg.timestamp)}</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.aiBubbleContainer}>
                    <View style={styles.aiBubble}>
                      <Text style={styles.aiText}>{msg.ai_response}</Text>
                      <Text style={styles.aiTimestamp}>{formatTime(msg.timestamp)}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
            {loading && (
              <View style={styles.aiBubbleContainer}>
                <View style={styles.aiBubble}>
                  <ActivityIndicator color="#9370db" />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.inputGradient}
            >
              <TextInput
                style={styles.input}
                placeholder="What's happening?"
                placeholderTextColor="#b19cd9"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.sendButtonContainer}
                onPress={handleSend}
                disabled={!message.trim() || loading}
              >
                <LinearGradient
                  colors={!message.trim() || loading ? ['#e0d0e0', '#d0c0d0'] : ['#d4b3e8', '#c8a7e8']}
                  style={styles.sendButton}
                >
                  <Ionicons name="send" size={22} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { padding: 8 },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12, marginLeft: 8 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#8b5a8e" },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 24, fontWeight: "700", color: "#8b5a8e", marginTop: 16 },
  emptySubtitle: { fontSize: 16, color: "#9370db", textAlign: "center" },
  userMessageContainer: { alignItems: "flex-end", marginBottom: 8 },
  userBubble: { borderRadius: 20, borderTopRightRadius: 6, padding: 16, maxWidth: "80%" },
  userText: { color: "#fff", fontSize: 16, lineHeight: 22, marginBottom: 4 },
  userTimestamp: { fontSize: 11, color: "rgba(255, 255, 255, 0.8)" },
  aiBubbleContainer: { alignItems: "flex-start", marginBottom: 8 },
  aiBubble: { backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: 20, borderTopLeftRadius: 6, padding: 16, maxWidth: "80%", borderWidth: 2, borderColor: "#ffd1dc" },
  aiText: { color: "#6b5b8e", fontSize: 16, lineHeight: 22, marginBottom: 4 },
  aiTimestamp: { fontSize: 11, color: "#b19cd9" },
  inputContainer: { padding: 16 },
  inputGradient: { flexDirection: "row", borderRadius: 28, padding: 8, gap: 8, alignItems: "flex-end", borderWidth: 2, borderColor: "#ffd1dc" },
  input: { flex: 1, fontSize: 16, color: "#6b5b8e", maxHeight: 100, paddingHorizontal: 16, paddingVertical: 8 },
  sendButtonContainer: { marginBottom: 4 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
});
