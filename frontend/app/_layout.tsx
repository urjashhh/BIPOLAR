import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="moods" />
      <Stack.Screen name="gratitude" />
      <Stack.Screen name="routine" />
    </Stack>
  );
}
