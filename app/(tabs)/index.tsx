import { createHomeStyles } from "@/assets/images/home.styles";
import IndexHeader from "@/components/indexHeader";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { colors } = useTheme();
  const homeStyles = createHomeStyles(colors);
  const router = useRouter();

  const addRoof = useMutation(api.solars.addRoof);

  const [name, setName] = useState("");
  const [roofWidth, setRoofWidth] = useState("");
  const [roofHeight, setRoofHeight] = useState("");

  const handleAddRoof = async () => {
    // 1. Rychlá validace - pokud něco chybí, nepokračujeme dál
    if (!name || !roofWidth || !roofHeight) return;

    try {
      // 2. Uložíme data do databáze Convex a získáme vygenerované ID
      const newRoofId = await addRoof({
        name,
        roofWidth: Number(roofWidth),
        roofHeight: Number(roofHeight),
      });

      // 3. Po úspěšném uložení přesměrujeme na plánek
      router.push({
        pathname: "/roof-plan",
        params: {
          id: newRoofId,
          name: name,
          width: roofWidth,
          height: roofHeight,
        },
      });

      // 4. Nakonec vyčistíme inputy pro další zadání
      setName("");
      setRoofWidth("");
      setRoofHeight("");
    } catch (error) {
      console.error("Nepodařilo se uložit střechu:", error);
    }
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={homeStyles.container}
    >
      <SafeAreaView style={homeStyles.safeArea}>
        <IndexHeader />

        <View style={homeStyles.formWrapper}>
          <LinearGradient
            colors={colors.gradients.surface}
            style={homeStyles.formCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TextInput
              style={homeStyles.input}
              placeholder="Customer Name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={homeStyles.input}
              placeholder="Width (cm)"
              placeholderTextColor={colors.textMuted}
              value={roofWidth}
              onChangeText={setRoofWidth}
              keyboardType="numeric"
            />
            <TextInput
              style={homeStyles.input}
              placeholder="Height (cm)"
              placeholderTextColor={colors.textMuted}
              value={roofHeight}
              onChangeText={setRoofHeight}
              keyboardType="numeric"
            />
            <Pressable style={homeStyles.buttonInsert} onPress={handleAddRoof}>
              <Text style={homeStyles.buttonInsertText}>Save</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
