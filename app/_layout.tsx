import { ThemeProvider } from "@/hooks/useTheme";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";

// Vytvoření klienta (pokud používáte standardní pojmenování proměnných z instalace Convexu)
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <ActionSheetProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ title: "Home" }} />
          </Stack>
        </ActionSheetProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}
