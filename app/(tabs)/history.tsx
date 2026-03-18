import { createHistoryStyles } from "@/assets/images/history.styles";
import EmptyState from "@/components/EmptyState";
import HistoryHeader from "@/components/historyHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import useTheme from "@/hooks/useTheme";
import { useUser } from "@clerk/clerk-expo";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Roof = Doc<"roofs">;

export default function HistoryScreen() {
  const { colors } = useTheme();
  const historyStyles = createHistoryStyles(colors);
  const router = useRouter();
  const { user } = useUser();

  const roofs = useQuery(api.solars.getSolars);
  const isLoading = roofs === undefined;

  // MUTACE
  const deleteRoofMutation = useMutation(api.solars.deleteRoof);
  const updateRoofDimensionsMutation = useMutation(
    api.solars.updateRoofDimensions,
  );
  const revokeSharingMutation = useMutation(api.solars.revokeSharing);
  const leaveSharedRoofMutation = useMutation(api.solars.leaveSharedRoof);

  // STAVY PRO MENU (3 tečky)
  const [selectedRoof, setSelectedRoof] = useState<Roof | null>(null);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);

  // STAVY PRO EDITACI ROZMĚRŮ
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editWidth, setEditWidth] = useState("");
  const [editHeight, setEditHeight] = useState("");

  if (isLoading) return <LoadingSpinner />;

  const isOwner = (roof: Roof | null, userId?: string | null) =>
    !!roof && !!userId && roof.ownerId === userId;

  const isCollaborator = (roof: Roof | null, userId?: string | null) =>
    !!roof &&
    !!userId &&
    roof.ownerId !== userId &&
    (roof.sharedWith ?? []).includes(userId);

  // Otevření plánku
  const handleToggleRoof = (item: Roof) => {
    try {
      router.push({
        pathname: "/roof-plan",
        params: {
          id: item._id,
          name: item.name,
          width: item.roofWidth,
          height: item.roofHeight,
        },
      });
    } catch {
      Alert.alert("Error", "Failed to open roof plan");
    }
  };

  // Otevření menu (3 tečky)
  const openActionMenu = (item: Roof) => {
    setSelectedRoof(item);
    setIsActionMenuVisible(true);
  };

  // Smazání střechy (jen vlastník)
  const handleDeleteRoof = () => {
    if (!selectedRoof) return;

    if (!isOwner(selectedRoof, user?.id)) {
      Alert.alert("Error", "Only the owner can delete this project.");
      return;
    }

    Alert.alert(
      "Delete project?",
      `Are you sure you want to delete project "${selectedRoof.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoofMutation({ roofId: selectedRoof._id });
              setIsActionMenuVisible(false);
            } catch {
              Alert.alert(
                "Error",
                "Failed to delete. Are you the owner of this project?",
              );
            }
          },
        },
      ],
    );
  };

  // Zrušení sdílení (jen vlastník, smaže všechny spolupracovníky)
  const handleRevokeSharing = () => {
    if (!selectedRoof) return;

    if (!isOwner(selectedRoof, user?.id)) {
      Alert.alert("Error", "Only the owner can revoke collaboration.");
      return;
    }

    Alert.alert(
      "Revoke collaboration?",
      "This will remove access to this roof for all collaborators.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove access",
          style: "destructive",
          onPress: async () => {
            try {
              await revokeSharingMutation({ roofId: selectedRoof._id });
              setIsActionMenuVisible(false);
            } catch {
              Alert.alert("Error", "Failed to revoke collaboration.");
            }
          },
        },
      ],
    );
  };

  // Spolupracovník: odejde z projektu (odebere sám sebe ze sharedWith)
  const handleLeaveSharedRoof = () => {
    if (!selectedRoof) return;

    if (!isCollaborator(selectedRoof, user?.id)) {
      Alert.alert("Error", "You are not a collaborator on this project.");
      return;
    }

    Alert.alert(
      "Leave project?",
      "You will no longer see this project in the list.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveSharedRoofMutation({ roofId: selectedRoof._id });
              setIsActionMenuVisible(false);
            } catch {
              Alert.alert("Error", "Failed to leave this project.");
            }
          },
        },
      ],
    );
  };

  // Uložení změny rozměrů
  const handleSaveEdit = async () => {
    if (!selectedRoof) return;

    const w = parseFloat(editWidth);
    const h = parseFloat(editHeight);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      Alert.alert("Error", "Please enter valid dimensions in cm.");
      return;
    }

    try {
      await updateRoofDimensionsMutation({
        roofId: selectedRoof._id,
        roofWidth: w,
        roofHeight: h,
      });
      setIsEditModalVisible(false);
      setSelectedRoof(null);
    } catch {
      Alert.alert("Error", "Failed to edit roof.");
    }
  };

  const renderRoofItem = ({ item }: { item: Roof }) => {
    const owner = isOwner(item, user?.id);
    const collaborator = isCollaborator(item, user?.id);

    return (
      <View style={historyStyles.roofItemWrapper}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleToggleRoof(item)}
        >
          <LinearGradient
            colors={colors.gradients.surface}
            style={historyStyles.roofItem}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View
              style={[
                historyStyles.roofTextContainer,
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Text style={historyStyles.itemName}>{item.name}</Text>
                  {owner && (
                    <Text style={{ fontSize: 12 }}>
                      <Feather name="home" size={15} color={colors.iconColor} />
                    </Text>
                  )}
                  {collaborator && (
                    <Text style={{ fontSize: 12 }}>
                      <FontAwesome
                        name="handshake-o"
                        size={15}
                        color={colors.iconColor}
                      />
                    </Text>
                  )}
                </View>

                <View style={historyStyles.dimensionsRow}>
                  <Text style={historyStyles.dimensionLabel}>
                    Height:{" "}
                    <Text style={historyStyles.dimensionValue}>
                      {item.roofHeight}
                    </Text>
                  </Text>
                  <Text style={historyStyles.dimensionLabel}>
                    Width:{" "}
                    <Text style={historyStyles.dimensionValue}>
                      {item.roofWidth}
                    </Text>
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={{ padding: 10 }}
                onPress={() => openActionMenu(item)}
              >
                <Text style={{ fontSize: 20, color: colors.textMuted }}>⋮</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={historyStyles.container}
    >
      <SafeAreaView style={historyStyles.safeArea}>
        <HistoryHeader />

        <FlatList
          data={roofs ?? []}
          renderItem={renderRoofItem}
          keyExtractor={(item) => item._id}
          style={historyStyles.roofList}
          contentContainerStyle={historyStyles.roofListContent}
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
        />

        {/* MODAL: Menu akcí */}
        <Modal visible={isActionMenuVisible} transparent animationType="fade">
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={1}
            onPress={() => setIsActionMenuVisible(false)}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                width: "80%",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.headerBorderBottom,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  Project: {selectedRoof?.name}
                </Text>
              </View>

              {/* Upravit rozměry – dovolíme jen vlastníkovi */}
              {selectedRoof && isOwner(selectedRoof, user?.id) && (
                <TouchableOpacity
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.headerBorderBottom,
                  }}
                  onPress={() => {
                    setIsActionMenuVisible(false);
                    setEditWidth(selectedRoof.roofWidth.toString());
                    setEditHeight(selectedRoof.roofHeight.toString());
                    setIsEditModalVisible(true);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                      textAlign: "center",
                    }}
                  >
                    <FontAwesome
                      name="pencil"
                      size={24}
                      color={colors.iconColor}
                    />
                    {"  "}
                    Edit dimensions
                  </Text>
                </TouchableOpacity>
              )}

              {/* Vlastník: zrušit spolupráci */}
              {selectedRoof &&
                isOwner(selectedRoof, user?.id) &&
                (selectedRoof.sharedWith?.length ?? 0) > 0 && (
                  <TouchableOpacity
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.headerBorderBottom,
                    }}
                    onPress={handleRevokeSharing}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#f59e0b",
                        textAlign: "center",
                      }}
                    >
                      <MaterialIcons
                        name="cancel"
                        size={24}
                        color={colors.iconColor}
                      />
                      {"  "} Revoke collaboration
                    </Text>
                  </TouchableOpacity>
                )}

              {/* Spolupracovník: odejít z projektu */}
              {selectedRoof && isCollaborator(selectedRoof, user?.id) && (
                <TouchableOpacity
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.headerBorderBottom,
                  }}
                  onPress={handleLeaveSharedRoof}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#f97316",
                      textAlign: "center",
                    }}
                  >
                    <FontAwesome5
                      name="door-closed"
                      size={24}
                      color={colors.iconColor}
                    />
                    {"  "} Leave project
                  </Text>
                </TouchableOpacity>
              )}

              {/* Smazat projekt – jen vlastník */}
              {selectedRoof && isOwner(selectedRoof, user?.id) && (
                <TouchableOpacity
                  style={{ padding: 16 }}
                  onPress={handleDeleteRoof}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#ef4444",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    <EvilIcons
                      name="trash"
                      size={24}
                      color={colors.iconColor}
                    />
                    {"  "} Delete project
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* MODAL: Editace rozměrů */}
        <Modal visible={isEditModalVisible} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                padding: 24,
                borderRadius: 16,
                width: "80%",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: colors.text,
                  marginBottom: 16,
                }}
              >
                Edit project
              </Text>

              <Text style={{ color: colors.textMuted, marginBottom: 4 }}>
                Roof width (cm):
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.headerBorderBottom,
                  color: colors.text,
                  padding: 12,
                  marginBottom: 16,
                  borderRadius: 8,
                }}
                value={editWidth}
                onChangeText={setEditWidth}
                keyboardType="numeric"
              />

              <Text style={{ color: colors.textMuted, marginBottom: 4 }}>
                Roof height (cm):
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.headerBorderBottom,
                  color: colors.text,
                  padding: 12,
                  marginBottom: 24,
                  borderRadius: 8,
                }}
                value={editHeight}
                onChangeText={setEditHeight}
                keyboardType="numeric"
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <TouchableOpacity
                  onPress={() => setIsEditModalVisible(false)}
                  style={{ padding: 12 }}
                >
                  <Text style={{ color: colors.textMuted, fontWeight: "600" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  style={{
                    backgroundColor: colors.primary,
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
