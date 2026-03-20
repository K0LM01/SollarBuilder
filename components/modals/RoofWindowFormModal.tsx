// components/modals/RoofWindowFormModal.tsx
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

export const RoofWindowFormModal = ({
  visible,
  onClose,
  onSave,
  colors,
}: any) => {
  const styles = createRoofPlanStyles(colors);

  const [measuredFromX, setMeasuredFromX] = useState<"left" | "right">("left");
  const [distanceX, setDistanceX] = useState("");

  const [measuredFromY, setMeasuredFromY] = useState<"top" | "bottom">("top");
  const [distanceY, setDistanceY] = useState("");

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [clearanceZone, setClearanceZone] = useState("30"); // Výchozí clearance pro okno třeba 30

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true} // <-- PŘIDÁNO: Zabraňuje trhání modalu při zobrazení klávesnice
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS === "ios"} // <-- PŘIDÁNO: Vypíná AvoidingView na Androidu
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
            {
              backgroundColor: colors.bg,
              width: 350,
              maxHeight: "90%",
              paddingBottom: Platform.OS === "android" ? 20 : 0, // Lehké odsazení zdola pro lepší prostor
            },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <TouchableOpacity activeOpacity={1}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Add Roof Window
              </Text>

              {/* ----- POZICE X ----- */}
              <Text
                style={{
                  color: colors.text,
                  marginBottom: 8,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                X Position (from which edge?)
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                {(["left", "right"] as const).map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.orientButton,
                      measuredFromX === e && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setMeasuredFromX(e)}
                  >
                    <Text
                      style={{
                        color: measuredFromX === e ? "#fff" : colors.text,
                        textTransform: "capitalize",
                      }}
                    >
                      {e}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.headerBorderBottom,
                    backgroundColor: colors.bg,
                    color: colors.text,
                  },
                ]}
                placeholder="Distance X (cm)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={distanceX}
                onChangeText={setDistanceX}
              />

              {/* ----- POZICE Y ----- */}
              <Text
                style={{
                  color: colors.text,
                  marginBottom: 8,
                  fontWeight: "600",
                  fontSize: 13,
                  marginTop: 10,
                }}
              >
                Y Position (from which edge?)
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                {(["top", "bottom"] as const).map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.orientButton,
                      measuredFromY === e && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setMeasuredFromY(e)}
                  >
                    <Text
                      style={{
                        color: measuredFromY === e ? "#fff" : colors.text,
                        textTransform: "capitalize",
                      }}
                    >
                      {e}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.headerBorderBottom,
                    backgroundColor: colors.bg,
                    color: colors.text,
                  },
                ]}
                placeholder="Distance Y (cm)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={distanceY}
                onChangeText={setDistanceY}
              />

              {/* ----- ROZMĚRY A ZÓNA ----- */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      marginBottom: 8,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    Width (cm)
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
                    placeholder="80"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={width}
                    onChangeText={setWidth}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      marginBottom: 8,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    Height (cm)
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
                    placeholder="120"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={height}
                    onChangeText={setHeight}
                  />
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text
                  style={{
                    color: colors.text,
                    marginBottom: 8,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Clearance Zone (cm)
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
                  placeholder="30"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={clearanceZone}
                  onChangeText={setClearanceZone}
                />
              </View>

              {/* ----- TLAČÍTKA ----- */}
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
                      backgroundColor:
                        distanceX &&
                        distanceY &&
                        width &&
                        height &&
                        clearanceZone
                          ? colors.primary
                          : colors.surface,
                      marginTop: 0,
                    },
                  ]}
                  onPress={() => {
                    if (
                      !distanceX ||
                      !distanceY ||
                      !width ||
                      !height ||
                      !clearanceZone
                    )
                      return;

                    onSave({
                      type: "roof_window", // Tohle musí sedět s názvem ve tvém Convex schématu!
                      positionX: {
                        measuredFrom: measuredFromX,
                        distance: Number(distanceX),
                      },
                      positionY: {
                        measuredFrom: measuredFromY,
                        distance: Number(distanceY),
                      },
                      width: Number(width),
                      height: Number(height),
                      clearanceZone: Number(clearanceZone),
                    });
                    onClose();
                  }}
                >
                  <Text
                    style={{
                      color:
                        distanceX &&
                        distanceY &&
                        width &&
                        height &&
                        clearanceZone
                          ? "#fff"
                          : colors.textMuted,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    Add Window
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
