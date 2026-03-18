import useTheme from "@/hooks/useTheme";
import { useAuth, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// PŘIDÁNO: Knihovna na kopírování do schránky
import * as Clipboard from "expo-clipboard";

const SettingsScreen = () => {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();

  const { user } = useUser();
  const { signOut } = useAuth();
  // PŘIDÁNO: Stav pro vizuální zpětnou vazbu po zkopírování
  const [isCopied, setIsCopied] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Chyba při odhlášení:", err);
    }
  };

  // PŘIDÁNO: Funkce pro zkopírování ID
  const copyToClipboard = async () => {
    if (user?.id) {
      await Clipboard.setStringAsync(user.id);
      setIsCopied(true);
      // Vrátí tlačítko zpět do stavu "Kopírovat" po 2 sekundách
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            MY ACCOUNT
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.headerBorderBottom,
              },
            ]}
          >
            <View
              style={[
                styles.settingRow,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.headerBorderBottom,
                },
              ]}
            >
              <View style={styles.settingLabelContainer}>
                <Text style={{ fontSize: 22, marginRight: 12 }}>
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color={colors.iconColor}
                  />
                </Text>
                <View>
                  <Text style={[styles.settingName, { color: colors.text }]}>
                    Signed in as
                  </Text>
                  <Text
                    style={[styles.settingDesc, { color: colors.textMuted }]}
                  >
                    {user?.primaryEmailAddress?.emailAddress || "Loading..."}
                  </Text>
                </View>
              </View>
            </View>

            {/* PŘIDÁNO: Zobrazení a kopírování ID pro spolupráci */}
            <View
              style={[
                styles.settingRow,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.headerBorderBottom,
                  paddingVertical: 12,
                },
              ]}
            >
              <View style={[styles.settingLabelContainer, { flex: 1 }]}>
                <Text style={{ fontSize: 22, marginRight: 12 }}>
                  <Feather name="share-2" size={24} color={colors.iconColor} />
                </Text>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.settingName, { color: colors.text }]}>
                    My collaboration ID
                  </Text>
                  <Text
                    style={[
                      styles.settingDesc,
                      { color: colors.textMuted, fontSize: 11 },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {user?.id || "Loading..."}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={copyToClipboard}
                style={{
                  backgroundColor: isCopied ? "#22c55e" : colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 12, fontWeight: "bold" }}
                >
                  {isCopied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
              <View style={styles.settingLabelContainer}>
                <Text style={{ fontSize: 22, marginRight: 12 }}>
                  <Ionicons
                    name="exit-outline"
                    size={24}
                    color={colors.iconColor}
                  />
                </Text>
                <View>
                  <Text style={[styles.settingName, { color: "#ef4444" }]}>
                    Sign out
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* SEKCE: VZHLED */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            APPEARANCE
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.headerBorderBottom,
              },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={{ fontSize: 22, marginRight: 12 }}>
                  {isDarkMode ? (
                    <Feather name="moon" size={24} color={colors.iconColor} />
                  ) : (
                    <AntDesign name="sun" size={24} color={colors.iconColor} />
                  )}
                </Text>
                <View>
                  <Text style={[styles.settingName, { color: colors.text }]}>
                    Dark mode
                  </Text>
                  <Text
                    style={[styles.settingDesc, { color: colors.textMuted }]}
                  >
                    Toggle between dark and light mode
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: "#d1d5db", true: colors.primary + "80" }}
                thumbColor={isDarkMode ? colors.primary : "#f3f4f6"}
                ios_backgroundColor="#d1d5db"
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold" },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLabelContainer: { flexDirection: "row", alignItems: "center" },
  settingName: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  settingDesc: { fontSize: 13 },
});

export default SettingsScreen;
