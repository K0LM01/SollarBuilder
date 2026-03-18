import { ThemeProvider } from "@/hooks/useTheme";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { ConvexReactClient } from "convex/react";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

// Clerk importy
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  useAuth,
  useSignIn,
  useSignUp,
} from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import * as SecureStore from "expo-secure-store";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local file",
  );
}

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch {
      return;
    }
  },
};

// ==========================================
// PŘIHLAŠOVACÍ & REGISTRAČNÍ OBRAZOVKA
// ==========================================
const SignInScreen = () => {
  const {
    signIn,
    setActive: setSignInActive,
    isLoaded: isSignInLoaded,
  } = useSignIn();
  const {
    signUp,
    setActive: setSignUpActive,
    isLoaded: isSignUpLoaded,
  } = useSignUp();

  const [isRegistering, setIsRegistering] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(""); // Pro kód z emailu
  const [errorText, setErrorText] = useState("");

  // NOVÉ: společný loading stav
  const [isLoading, setIsLoading] = useState(false);

  // KLASICKÉ PŘIHLÁŠENÍ (LOGIN)
  const onSignInPress = async () => {
    if (!isSignInLoaded || isLoading) return;
    try {
      setErrorText("");
      setIsLoading(true);

      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setSignInActive({ session: signInAttempt.createdSessionId });
      } else {
        console.error(signInAttempt);
        setErrorText(
          "Clerk status: " +
            signInAttempt.status +
            ". The account might need verification.",
        );
      }
    } catch (err: any) {
      setErrorText(err.errors?.[0]?.message || "Error while signing in.");
    } finally {
      setIsLoading(false);
    }
  };

  // REGISTRACE - KROK 1 (Odeslání emailu)
  const onSignUpPress = async () => {
    if (!isSignUpLoaded || isLoading) return;
    try {
      setErrorText("");
      setIsLoading(true);

      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setErrorText(err.errors?.[0]?.message || "Error while signing up.");
    } finally {
      setIsLoading(false);
    }
  };

  // REGISTRACE - KROK 2 (Ověření kódu z emailu)
  const onPressVerify = async () => {
    if (!isSignUpLoaded || isLoading) return;
    try {
      setErrorText("");
      setIsLoading(true);

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignUp.status === "complete") {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
      } else {
        console.error(completeSignUp);
        setErrorText("Verification failed.");
      }
    } catch (err: any) {
      setErrorText(err.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.loginTitle}>SolarPlanner</Text>

      {/* --- FORMULÁŘ PRO ZADÁNÍ KÓDU Z EMAILU --- */}
      {pendingVerification ? (
        <View>
          <Text
            style={{ color: "#fff", marginBottom: 15, textAlign: "center" }}
          >
            We sent a 6-digit code to your email. Enter it here:
          </Text>
          <TextInput
            value={code}
            placeholder="123456"
            onChangeText={setCode}
            style={styles.loginInput}
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            editable={!isLoading}
          />
          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
            onPress={onPressVerify}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? "Verifying..." : "Verify and continue"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* --- BĚŽNÝ FORMULÁŘ (Login nebo Registrace) --- */
        <View>
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Your email..."
            onChangeText={setEmailAddress}
            style={styles.loginInput}
            placeholderTextColor="#9ca3af"
            editable={!isLoading}
          />
          <TextInput
            value={password}
            placeholder="Password..."
            secureTextEntry={true}
            onChangeText={setPassword}
            style={styles.loginInput}
            placeholderTextColor="#9ca3af"
            editable={!isLoading}
          />

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          {isRegistering ? (
            <TouchableOpacity
              style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
              onPress={onSignUpPress}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Creating account..." : "Create account"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
              onPress={onSignInPress}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => {
              if (isLoading) return;
              setIsRegistering(!isRegistering);
              setErrorText("");
            }}
          >
            <Text style={styles.loginHint}>
              {isRegistering
                ? "Already have an account? Sign in here."
                : "Don't have an account yet? Register here."}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ==========================================
// HLAVNÍ LAYOUT
// ==========================================
export default function RootLayout() {
  // Globálně schováme systémový spodní bar na Androidu
  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");
    NavigationBar.setBehaviorAsync("overlay-swipe");

    return () => {
      NavigationBar.setVisibilityAsync("visible");
    };
  }, []);

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider>
          <ActionSheetProvider>
            <View style={{ flex: 1 }}>
              <SignedIn>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ title: "Home" }} />
                </Stack>
              </SignedIn>

              <SignedOut>
                <SignInScreen />
              </SignedOut>
            </View>
          </ActionSheetProvider>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

// STYLY...
const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#111827",
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 40,
  },
  loginInput: {
    backgroundColor: "#1f2937",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#374151",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 12,
    textAlign: "center",
  },
  loginHint: {
    color: "#60a5fa",
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
  },
});
