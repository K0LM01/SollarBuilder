import { ColorScheme } from "@/hooks/useTheme";
import { StyleSheet } from "react-native";

export const createHomeStyles = (colors: ColorScheme) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    formWrapper: {
      marginHorizontal: 24,
      marginTop: 24,
    },
    formCard: {
      padding: 24,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    input: {
      width: "100%",
      height: 54,
      borderRadius: 16,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      // V dark módu tmavý rámeček, v light módu světle šedý rámeček
      borderColor: colors.headerBorderBottom,
      // V dark módu hodně tmavé pozadí, v light módu čistě bílé
      backgroundColor: colors.bg,
      color: colors.text,
      fontSize: 16,
    },
    buttonInsert: {
      width: "100%",
      height: 54,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      // V dark módu modrá (#60a5fa), v light módu šedá (#e2e8f0)
      backgroundColor: colors.primary,
      marginTop: 8,
    },
    buttonInsertText: {
      fontSize: 16,
      fontWeight: "bold",
      // Text se přizpůsobí tématu, aby byl dobře čitelný
      color: colors.text,
    },
  });

  return styles;
};
