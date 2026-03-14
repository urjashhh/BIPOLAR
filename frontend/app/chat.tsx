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
    // Scroll to bottom when messages change
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons name="chatbubbles" size={24} color="#8b5cf6" />
            <Text style={styles.title}>AI Companion</Text>
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {initialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptySubtitle}>
                Share how you're feeling, and I'll listen
              </Text>
            </View>
          ) : (
            messages.map((msg) => (
              <View key={msg.id}>
                <View style={styles.userMessageContainer}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{msg.user_message}</Text>
                    <Text style={styles.timestamp}>{formatTime(msg.timestamp)}</Text>
                  </View>
                </View>
                <View style={styles.aiBubbleContainer}>
                  <View style={styles.aiBubble}>
                    <Text style={styles.aiText}>{msg.ai_response}</Text>
                    <Text style={styles.timestamp}>{formatTime(msg.timestamp)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
          {loading && (
            <View style={styles.aiBubbleContainer}>
              <View style={styles.aiBubble}>
                <ActivityIndicator color="#8b5cf6" />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="What's happening?"
            placeholderTextColor="#94a3b8"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!message.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || loading}
          >
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
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
    fontSize: 20,
    fontWeight: "600",
    color: "#475569",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  userMessageContainer: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: "#8b5cf6",
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 12,
    maxWidth: "80%",
  },
  userText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
  aiBubbleContainer: {
    alignItems: "flex-start",
    marginBottom: 8,
  },
  aiBubble: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    maxWidth: "80%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  aiText: {
    color: "#1e293b",
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 12,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1e293b",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sendButton: {
    backgroundColor: "#8b5cf6",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
});
