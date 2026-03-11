import useTheme from "@/hooks/useTheme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SettingsScreen = () => {
  const { toggleDarkMode } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity style={styles.button} onPress={toggleDarkMode}>
        <Text style={styles.buttonText}>Toggle dark mode</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Kontejner zabere celou obrazovku
    justifyContent: "center", // Vystředí vše vertikálně
    alignItems: "center", // Vystředí vše horizontálně
    gap: 20, // Vytvoří mezeru mezi nadpisem a tlačítkem (funguje od React Native 0.71)
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  button: {
    // Zde můžete tlačítku přidat barvu, padding atd.
    padding: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    // Barvu textu můžete upravit podle potřeby
  },
});

export default SettingsScreen;
