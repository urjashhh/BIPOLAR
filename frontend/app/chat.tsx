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
      response: "I hear you 💜 Depression makes everything feel impossible.\n\nHere's what to do right now:\n\n1️⃣ Get up and drink a full glass of cold water\n2️⃣ Open a window or step outside for 2 minutes — fresh air shifts your brain chemistry\n3️⃣ Put on one song you love and just sit with it\n4️⃣ Text one person just 'hey' — connection breaks the isolation loop\n\nYou don't have to fix everything today. Just do these 4 things.",
      newState: ""
    };
  }

  // Sad / crying
  if (msg.includes("sad") || msg.includes("crying") || msg.includes("cry") || msg.includes("tears")) {
    return {
      response: "It's okay to cry 💜 Let it out completely — don't stop it.\n\nWhen you're ready, try this:\n\n🎵 Put on a song that matches exactly how you feel — not a happy song, one that gets it. Let the music hold what you're feeling.\n\n🛁 Then do something warm — a hot shower, a warm drink, wrap yourself in a blanket. Warmth physically calms your nervous system.\n\nYou're allowed to feel this. It will pass.",
      newState: ""
    };
  }

  // Manic / racing thoughts
  if (msg.includes("manic") || msg.includes("racing thoughts") || msg.includes("can't sleep") || msg.includes("no sleep") || msg.includes("hyper")) {
    return {
      response: "Your mind is running too fast right now 💜 Let's slow it down immediately.\n\nDo this right now:\n\n1️⃣ Sit on the floor — the floor grounds you physically\n2️⃣ Put both hands flat on a surface and press down hard for 10 seconds\n3️⃣ Take 4 slow breaths — breathe IN for 4 counts, HOLD for 4, OUT for 6\n4️⃣ Write down every thought in your head on paper — get them out of your mind and onto the page\n5️⃣ No screens for the next 30 minutes\n\nLog your mood now — mania needs to be tracked.",
      newState: ""
    };
  }

  // Anger / irritable
  if (msg.includes("angry") || msg.includes("anger") || msg.includes("furious") || msg.includes("rage") || msg.includes("irritable") || msg.includes("irritated") || msg.includes("frustrated")) {
    return {
      response: "That anger is real and valid 💜 Here's how to discharge it safely right now:\n\n🏃 Go for a fast 5 minute walk — anger is physical energy that needs to move\n🧊 Hold an ice cube in your fist for 30 seconds — the cold interrupts the anger circuit\n📝 Write down exactly what made you angry in full detail — don't hold back on paper\n🗣 Say out loud: 'I am angry because ___' — naming it reduces its power by 40%\n\nDon't make any big decisions or send any messages while angry. Wait 20 minutes first.",
      newState: ""
    };
  }

  // Loneliness
  if (msg.includes("lonely") || msg.includes("alone") || msg.includes("isolated") || msg.includes("no one") || msg.includes("nobody")) {
    return {
      response: "Loneliness is one of the hardest feelings 💜 Here's what actually helps:\n\n📱 Text or call one person right now — anyone. Even just 'thinking of you'\n☕ Go somewhere with people around — a café, a park — you don't have to talk to anyone, just be near humans\n🐾 If you have a pet, spend 10 minutes with them\n📖 Put on a podcast or audiobook — a human voice in the room changes the feeling\n\nYou are not as alone as it feels right now. This feeling lies to you.",
      newState: ""
    };
  }

  // Overwhelmed / stressed
  if (msg.includes("overwhelmed") || msg.includes("stressed") || msg.includes("stress") || msg.includes("too much") || msg.includes("can't cope") || msg.includes("cannot cope")) {
    return {
      response: "When everything feels like too much, your brain is overloaded 💜\n\nStop everything and do this:\n\n✍️ Write down EVERY single thing stressing you — get it all out on paper\n🔢 Now circle just ONE thing you can actually do today\n❌ Everything else doesn't exist until tomorrow\n\n🫁 Then do box breathing:\nIN for 4 → HOLD for 4 → OUT for 4 → HOLD for 4\nRepeat 4 times\n\nYou cannot do everything at once. One thing. That's all.",
      newState: ""
    };
  }

  // Sleep problems
  if (msg.includes("can't sleep") || msg.includes("insomnia") || msg.includes("not sleeping") || msg.includes("sleep") || msg.includes("awake at night")) {
    return {
      response: "Poor sleep makes everything harder 💜 Try this tonight:\n\n🌡️ Make your room cold — 18°C is ideal for sleep\n📱 No phone 30 mins before bed — blue light blocks melatonin\n🫁 Try 4-7-8 breathing: IN for 4, HOLD for 7, OUT for 8. Repeat 4 times — this activates your parasympathetic nervous system\n📝 Write tomorrow's to-do list before bed — empties your brain of planning thoughts\n🎧 Try brown noise or rain sounds\n\nIf it's a manic episode causing no sleep, please contact your doctor — sleep deprivation makes mania worse fast.",
      newState: ""
    };
  }

  // Motivation / can't do anything
  if (msg.includes("no motivation") || msg.includes("can't do anything") || msg.includes("can't move") || msg.includes("don't want to do anything") || msg.includes("lazy") || msg.includes("unmotivated")) {
    return {
      response: "Low motivation is a symptom, not a character flaw 💜\n\nThe trick is to make the first action so tiny it's impossible to say no:\n\n⚡ The 2-minute rule: just do 2 minutes of the thing. Set a timer. After 2 minutes you're allowed to stop — but usually you'll keep going\n\n🦷 Start with the easiest physical task — brush your teeth, wash your face. Physical action triggers mental action.\n\n🏆 Write down 3 tiny wins from today — even 'I got out of bed' counts\n\nMotivation follows action. It never comes before it. Start first, feel motivated second.",
      newState: ""
    };
  }

  // Relationship / people problems
  if (msg.includes("relationship") || msg.includes("boyfriend") || msg.includes("girlfriend") || msg.includes("partner") || msg.includes("fight") || msg.includes("argument") || msg.includes("broke up") || msg.includes("breakup")) {
    return {
      response: "Relationship pain is some of the deepest pain 💜\n\nRight now:\n🚶 Take a walk alone — don't reach out or respond to anything for 30 minutes\n📝 Write down how you feel without censoring yourself\n🧘 Remember: your mood disorder can amplify relationship pain significantly — what feels like a 10 might be a 6 without the bipolar lens\n\nBefore responding to the other person:\n✅ Wait until you're calm\n✅ Say how you feel using 'I feel' not 'you always'\n✅ Talk to your therapist about this at your next session\n\nYour feelings are valid. AND your reaction may be bigger than the situation. Both can be true.",
      newState: ""
    };
  }

  // Shame / guilt
  if (msg.includes("ashamed") || msg.includes("shame") || msg.includes("guilty") || msg.includes("guilt") || msg.includes("embarrassed") || msg.includes("worthless") || msg.includes("failure")) {
    return {
      response: "Shame is the most painful emotion humans feel 💜 And it lies constantly.\n\nHere's the truth:\n🧠 Many things you feel shame about happened during mood episodes — they were symptoms, not your true character\n💜 Every person carries things they're ashamed of. You are not uniquely broken.\n🔄 Guilt says 'I did something bad.' Shame says 'I AM bad.' Only the first one is sometimes true.\n\nRight now: put your hand on your chest and say out loud — 'I am doing the best I can with what I have.'\n\nThen write down one thing you're actually proud of. Even if it's small.",
      newState: ""
    };
  }

  // Eating / appetite
  if (msg.includes("not eating") || msg.includes("no appetite") || msg.includes("can't eat") || msg.includes("eating too much") || msg.includes("binge") || msg.includes("food")) {
    return {
      response: "Appetite changes are very common with bipolar 💜\n\nIf you're not eating:\n🍌 Start with something tiny — a banana, a few crackers, a spoon of peanut butter\n💧 Drink water first — sometimes thirst masks hunger\n⏰ Set an alarm for every 4 hours as an eating reminder\n\nIf you're eating too much:\n🥤 Drink a full glass of water before eating anything\n⏳ Wait 10 minutes before getting seconds — cravings peak then drop\n🚶 Replace one eating urge with a 5 minute walk\n\nYour body is trying to regulate itself. Be gentle with it.",
      newState: ""
    };
  }

  // Concentration / focus
  if (msg.includes("can't focus") || msg.includes("concentration") || msg.includes("distracted") || msg.includes("brain fog") || msg.includes("can't think") || msg.includes("confused")) {
    return {
      response: "Brain fog and poor concentration are real symptoms 💜\n\nTry this right now:\n\n⏱ The Pomodoro method: work for just 25 minutes on ONE thing, then take a 5 minute break. No multitasking.\n📵 Put your phone in another room — even face-down phones reduce focus by 20%\n💧 Drink water — dehydration is a major cause of brain fog\n🚶 Take a 10 minute walk — increases blood flow to prefrontal cortex immediately\n✍️ Write the ONE thing you need to do today at the top of a piece of paper and stare at it\n\nYour brain is not broken. It's overwhelmed.",
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
      response: "That's really good to hear 💜 Hold onto this feeling.\n\nOn good days, do these things to build your resilience bank:\n✅ Log this mood — good days are data too\n✅ Do your routine — consistency on good days makes bad days shorter\n✅ Note what made today good — was it sleep? Exercise? Social connection? Knowing your triggers works both ways.\n\nYou deserve good days. Keep going.",
      newState: ""
    };
  }

  // Feeling numb / disconnected
  if (msg.includes("numb") || msg.includes("disconnected") || msg.includes("empty inside") || msg.includes("don't feel anything") || msg.includes("nothing matters")) {
    return {
      response: "Emotional numbness is your nervous system protecting you 💜\n\nTo reconnect with your body right now:\n\n🧊 Hold ice cubes in both hands for 30 seconds — intense cold brings you back into your body fast\n🎵 Put on the loudest, most energetic song you know\n🚿 Take a cold shower for 30 seconds — shocking but incredibly effective\n💃 Jump up and down for 60 seconds — sounds silly, works every time\n\nNumbness is temporary. Your feelings are still there — they're just taking shelter.",
      newState: ""
    };
  }

  // Self harm urge
  if (msg.includes("want to hurt") || msg.includes("hurt myself") || msg.includes("self harm") || msg.includes("cutting") || msg.includes("punish myself")) {
    return {
      response: "I'm really glad you're talking instead of acting on this 💜\n\nRight now, try these instead:\n\n🧊 Hold ice cubes tightly — gives intense sensation without harm\n💪 Snap a rubber band on your wrist\n🖊️ Draw red lines on your skin with a marker where you feel the urge\n🏃 Run as fast as you can for 2 minutes — burns the adrenaline\n\nPlease call someone you trust right now. Or call iCall: 9152987821\n\nThis urge will pass. You've survived every urge before this one.",
      newState: ""
    };
  }

  // Grief / loss
  if (msg.includes("grief") || msg.includes("grieving") || msg.includes("lost someone") || msg.includes("someone died") || msg.includes("miss them") || msg.includes("loss")) {
    return {
      response: "Grief is love with nowhere to go 💜 There is no fixing this — only moving through it.\n\nWhat actually helps:\n📸 Look at a photo of who/what you lost and talk to them out loud — it sounds strange but it helps\n✍️ Write them a letter saying everything you didn't get to say\n🕯️ Light a candle and sit quietly for a few minutes — rituals help grief move\n👤 Tell one person today that you're grieving — don't carry it alone\n\nGrief has no timeline. Be gentle with yourself.",
      newState: ""
    };
  }

  // Overthinking / rumination
  if (msg.includes("overthinking") || msg.includes("can't stop thinking") || msg.includes("ruminating") || msg.includes("thoughts won't stop") || msg.includes("keep thinking about")) {
    return {
      response: "Overthinking is your brain trying to solve an emotional problem with logic 💜 It doesn't work — here's what does:\n\n⏰ Schedule worry time: give yourself 15 minutes at 5pm to worry. Outside that window, postpone every worry thought to that slot.\n\n📝 Write the thought down then ask: 'Is this definitely true? Can I know for certain?' — most overthinking is about uncertain futures\n\n🧩 Do a task that needs your hands AND your brain — puzzles, cooking, drawing — crowds out the loop\n\n🫁 4-7-8 breathing: IN for 4, HOLD for 7, OUT for 8 — physically slows racing thoughts",
      newState: ""
    };
  }

  // Medication
  if (msg.includes("medication") || msg.includes("medicine") || msg.includes("meds") || msg.includes("forgot to take") || msg.includes("side effects")) {
    return {
      response: "Medication consistency is one of the most important parts of managing bipolar 💜\n\nIf you forgot a dose:\n⚕️ Check your medication's instructions — some can be taken late, some should be skipped\n📅 Set a daily phone alarm at the same time every day\n💊 Keep your medication next to something you do every day — toothbrush, coffee\n\nIf you're having side effects:\n📋 Write down exactly what you're experiencing and when\n📞 Call your doctor — don't stop medication suddenly without guidance\n\nNever adjust your bipolar medication without your psychiatrist. I know that's not what you want to hear but it matters deeply.",
      newState: ""
    };
  }

  // Default — gives actual coping strategies instead of asking questions
  const defaults = [
    "I hear you 💜\n\nWhen things feel heavy and hard to name, try this right now:\n\n🫁 Take 3 deep breaths — in through nose for 4 counts, out through mouth for 6\n📝 Write down exactly what you're feeling in one sentence — don't overthink it\n🚶 Go for a 10 minute walk — movement processes emotions faster than thinking\n💧 Drink a full glass of cold water\n\nYou don't need to understand what you're feeling to start feeling better. Start with the body first.",
    "I'm here with you 💜\n\nTry the TIPP skill right now — it works on your body chemistry directly:\n\n🌡️ Temperature — splash cold water on your face (instantly resets your nervous system)\n🏃 Intense exercise — even 5 minutes of fast movement\n🫁 Paced breathing — breathe out longer than you breathe in\n🧘 Paired muscle relaxation — tense every muscle hard for 5 seconds, then release completely\n\nNo thinking required. Just do each one.",
    "Living with bipolar takes enormous strength and you are doing it 💜\n\nRight now try this:\n\n🎵 Put on music that matches exactly how you feel — let it meet you where you are\n🛁 Do something warm — hot shower, warm tea, heavy blanket\n📱 Send one message to one safe person — even just 'hey, thinking of you'\n⏰ Set a 20 minute timer. Let yourself fully feel this. When the timer goes off, get up and do one small physical thing.\n\nYou don't have to fix everything today.",
  ];
  return {
    response: defaults[Math.floor(Math.random() * defaults.length)],
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
