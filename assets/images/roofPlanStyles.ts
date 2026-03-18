// RoofPlanStyles.ts (nebo např. styles/RoofPlanStyles.ts)
import { StyleSheet } from "react-native";

export const createRoofPlanStyles = (colors: any) => {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      // DŮLEŽITÉ: sloupcové rozložení, ne řádkové
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
    },

    backButton: { marginRight: 16, padding: 8, marginLeft: -8 },
    title: { fontSize: 20, fontWeight: "bold" },
    planContainer: { flex: 1, padding: 16 },
    blueprintBoard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 2,
      overflow: "hidden",
      position: "relative",
    },
    centerWrapper: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
    },
    roofRectangle: {
      borderWidth: 3,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 6,
    },
    measurementText: {
      position: "absolute",
      fontSize: 14,
      fontWeight: "bold",
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      overflow: "hidden",
    },
    measureHeight: { left: -65 },
    measureWidth: { bottom: -25 },

    // Modals & Menu
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    menuContainer: {
      width: 320,
      borderRadius: 24,
      borderWidth: 1,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    menuTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 16,
      textAlign: "center",
    },
    menuItem: { paddingVertical: 16, paddingHorizontal: 12 },
    cancelButton: {
      marginTop: 20,
      paddingVertical: 14,
      borderRadius: 16,
      justifyContent: "center",
    },
    input: {
      height: 50,
      borderRadius: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      marginBottom: 12,
    },
    orientButton: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },

    // Stats & Badges
    statsBadge: {
      position: "absolute",
      bottom: 16,
      left: 16,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    dimensionBadge: {
      backgroundColor: "#f59e0b",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4,
    },
    dimensionBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  });
};
