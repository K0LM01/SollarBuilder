// components/modals/LightningRodFormModal.tsx
import { createRoofPlanStyles } from "@/assets/images/roofPlanStyles";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export const LightningRodFormModal = ({
  visible,
  onClose,
  onSave,
  colors,
}: any) => {
  const styles = createRoofPlanStyles(colors);

  const [edge, setEdge] = useState<"left" | "right" | "top" | "bottom">("left");
  const [clearanceZone, setClearanceZone] = useState("50");

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.menuContainer,
            { backgroundColor: colors.bg, width: 350, maxHeight: "90%" },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <TouchableOpacity activeOpacity={1}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Edge Wire Hromosvod
              </Text>

              <Text
                style={{
                  color: colors.text,
                  marginBottom: 8,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                Which edge does it run along?
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {(["left", "right", "top", "bottom"] as const).map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.orientButton,
                      { flex: 1, minWidth: "45%" },
                      edge === e && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setEdge(e)}
                  >
                    <Text
                      style={{
                        color: edge === e ? "#fff" : colors.text,
                        textTransform: "capitalize",
                      }}
                    >
                      {e}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={{
                  color: colors.text,
                  marginBottom: 8,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                Clearance zone (cm)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.headerBorderBottom,
                    backgroundColor: colors.bg,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. 50"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={clearanceZone}
                onChangeText={setClearanceZone}
              />

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 10,
                  marginBottom: 10,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.headerBorderBottom,
                      marginTop: 0,
                    },
                  ]}
                  onPress={onClose}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      flex: 1,
                      backgroundColor: clearanceZone
                        ? colors.primary
                        : colors.surface,
                      marginTop: 0,
                    },
                  ]}
                  onPress={() => {
                    if (!clearanceZone) return;

                    // ZDE JE OPRAVA PRO CONVEX: Posíláme přesně to, co Convex očekává
                    onSave({
                      type: "lightning_rod",
                      edge: edge,
                      clearanceZone: Number(clearanceZone),
                    });

                    onClose();
                  }}
                >
                  <Text
                    style={{
                      color: clearanceZone ? "#fff" : colors.textMuted,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    Add Wire
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
