import { ColorScheme } from "@/hooks/useTheme";
import { StyleSheet } from "react-native";

export const createHistoryStyles = (colors: ColorScheme) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 24,
      paddingVertical: 32,
      paddingBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.headerBorderBottom,
    },
    titleTextContainer: {
      flex: 1,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    subtitle: {
      fontSize: 17,
      fontWeight: "500",
      color: colors.textMuted,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      letterSpacing: -1,
      marginBottom: 4,
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 20,
      fontSize: 18,
      fontWeight: "500",
      color: colors.text,
    },
    emptyListContainer: {
      flexGrow: 1,
      justifyContent: "center",
    },
    roofItemWrapper: {
      marginVertical: 12,
    },
    roofItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 20,
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
    roofTextContainer: {
      flex: 1,
    },
    roofText: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: "500",
      marginBottom: 16,
      color: colors.text,
    },
    roofList: {
      flex: 1,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
    },
    emptyText: {
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 8,
      color: colors.text,
    },
    emptySubtext: {
      fontSize: 17,
      textAlign: "center",
      paddingHorizontal: 40,
      lineHeight: 24,
      color: colors.textMuted,
    },
    roofListContent: {
      paddingHorizontal: 24,
      paddingBottom: 100,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    itemName: {
      fontWeight: "bold",
      fontSize: 25,
      textAlign: "center",
      color: colors.text,
      marginBottom: 8,
    },
    dimensionsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 16,
    },
    dimensionLabel: {
      fontSize: 14,
      color: colors.text,
    },
    dimensionValue: {
      fontWeight: "600",
      color: colors.text,
    },
  });
  return styles;
};
