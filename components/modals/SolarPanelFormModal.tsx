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

export const SolarPanelFormModal = ({
  visible,
  onClose,
  onSave,
  colors,
}: any) => {
  const [count, setCount] = useState("");
  const [panelWidth, setPanelWidth] = useState("113");
  const [panelHeight, setPanelHeight] = useState("172");
  const [gap, setGap] = useState("2.5");
  const [orientation, setOrientation] = useState("portrait");

  // Vytáhneme si styly a předáme jim barvy z props
  const styles = createRoofPlanStyles(colors);

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
                Panel Settings
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
                placeholder="Count (e.g. 12)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={count}
                onChangeText={setCount}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      borderColor: colors.headerBorderBottom,
                      backgroundColor: colors.bg,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Width (cm)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={panelWidth}
                  onChangeText={setPanelWidth}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      borderColor: colors.headerBorderBottom,
                      backgroundColor: colors.bg,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Height (cm)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={panelHeight}
                  onChangeText={setPanelHeight}
                />
              </View>

              <Text
                style={{
                  color: colors.text,
                  marginBottom: 8,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                Mounting gap (cm)
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
                placeholder="Gap (e.g. 2.5)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={gap}
                onChangeText={setGap}
              />

              <Text
                style={{
                  color: colors.text,
                  marginTop: 10,
                  marginBottom: 8,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                Preferred orientation
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <TouchableOpacity
                  style={[
                    styles.orientButton,
                    orientation === "portrait" && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setOrientation("portrait")}
                >
                  <Text
                    style={{
                      color: orientation === "portrait" ? "#fff" : colors.text,
                    }}
                  >
                    Height
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.orientButton,
                    orientation === "landscape" && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setOrientation("landscape")}
                >
                  <Text
                    style={{
                      color: orientation === "landscape" ? "#fff" : colors.text,
                    }}
                  >
                    Width
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
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
                      backgroundColor: count ? colors.primary : colors.surface,
                      marginTop: 0,
                    },
                  ]}
                  onPress={() => {
                    if (!count) return;
                    onSave({
                      count: Number(count),
                      width: Number(panelWidth),
                      height: Number(panelHeight),
                      gap: Number(gap.replace(",", ".")),
                      orientation,
                    });
                    onClose();
                  }}
                >
                  <Text
                    style={{
                      color: count ? "#fff" : colors.textMuted,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    Draw
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
