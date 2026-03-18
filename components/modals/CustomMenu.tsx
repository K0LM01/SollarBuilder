import { createRoofPlanStyles } from "@/assets/images/roofPlanStyles";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

export const CustomMenu = ({ visible, onClose, onSelect, colors }: any) => {
  const styles = createRoofPlanStyles(colors);

  const menuItems = [
    { id: 1, title: "Solar panels" },
    { id: 2, title: "Chimney" },
    { id: 3, title: "Skylight" },
    { id: 4, title: "Lightning conductor" },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: colors.bg,
                borderColor: colors.headerBorderBottom,
              },
            ]}
          >
            <Text style={[styles.menuTitle, { color: colors.text }]}>
              What to add?
            </Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index !== menuItems.length - 1 && {
                    borderBottomColor: colors.headerBorderBottom,
                    borderBottomWidth: 1,
                  },
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "500",
                  }}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  textAlign: "center",
                  fontSize: 16,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
