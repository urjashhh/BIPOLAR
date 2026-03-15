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

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ChatMessage {
  id: string;
  user_message: string;
  ai_response: string;
  timestamp: string;
}

export default function Chat() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/chat?user=default_user`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          user: "default_user",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <LinearGradient
      colors={['#ffeef8', '#e8f4fd', '#f0e6ff']}
      style={styles.gradient}
    >
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
              <LinearGradient
                colors={['#d4b3e8', '#c8a7e8']}
                style={styles.headerIcon}
              >
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
            {initialLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9370db" />
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={72} color="#d4b3e8" />
                <Text style={styles.emptyTitle}>Start a conversation</Text>
                <Text style={styles.emptySubtitle}>
                  Share how you're feeling, and I'll listen
                </Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View key={msg.id}>
                  <View style={styles.userMessageContainer}>
                    <LinearGradient
                      colors={['#d4b3e8', '#c8a7e8']}
                      style={styles.userBubble}
                    >
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
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8b5a8e",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#9370db",
    textAlign: "center",
  },
  userMessageContainer: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  userBubble: {
    borderRadius: 20,
    borderTopRightRadius: 6,
    padding: 16,
    maxWidth: "80%",
    shadowColor: "#d4b3e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  userText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userTimestamp: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
  },
  aiBubbleContainer: {
    alignItems: "flex-start",
    marginBottom: 8,
  },
  aiBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    borderTopLeftRadius: 6,
    padding: 16,
    maxWidth: "80%",
    borderWidth: 2,
    borderColor: "#ffd1dc",
    shadowColor: "#ffb6d9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  aiText: {
    color: "#6b5b8e",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  aiTimestamp: {
    fontSize: 11,
    color: "#b19cd9",
  },
  inputContainer: {
    padding: 16,
  },
  inputGradient: {
    flexDirection: "row",
    borderRadius: 28,
    padding: 8,
    gap: 8,
    alignItems: "flex-end",
    borderWidth: 2,
    borderColor: "#ffd1dc",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#6b5b8e",
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonContainer: {
    marginBottom: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});