// components/canvas/GridBackground.tsx
import React from "react";
import { StyleSheet, View } from "react-native";

export const GridBackground = ({ color }: { color: string }) => {
  const lines = Array.from({ length: 100 });
  const gridSize = 30;
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden", zIndex: -1 }]}>
      {lines.map((_, i) => (
        <View
          key={`h-${i}`}
          style={{
            position: "absolute",
            top: i * gridSize,
            width: "100%",
            height: 1,
            backgroundColor: color,
          }}
        />
      ))}
      {lines.map((_, i) => (
        <View
          key={`v-${i}`}
          style={{
            position: "absolute",
            left: i * gridSize,
            width: 1,
            height: "100%",
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
};
