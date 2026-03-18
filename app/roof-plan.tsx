import { createRoofPlanStyles } from "@/assets/images/roofPlanStyles";
import { DraggableObstacleWrapper } from "@/components/canvas/DraggableObstacleWrapper";
import {
  DraggablePanelGroup,
  DraggablePanelGroupRef,
} from "@/components/canvas/DraggablePanelGroup";
import { GridBackground } from "@/components/canvas/GridBackground";
import { ChimneyFormModal } from "@/components/modals/ChimneyFormModal";
import { CustomMenu } from "@/components/modals/CustomMenu";
import { LightningRodFormModal } from "@/components/modals/LightningRodFormModal";
import { RoofWindowFormModal } from "@/components/modals/RoofWindowFormModal";
import { SolarPanelFormModal } from "@/components/modals/SolarPanelFormModal";
import useTheme from "@/hooks/useTheme";
import { calculatePanelLayout } from "@/utils/solarMath";
import AntDesign from "@expo/vector-icons/AntDesign";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Fontisto from "@expo/vector-icons/Fontisto";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useRef, useState } from "react";
// PŘIDÁNO: Modal a TextInput pro sdílení
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

// ==========================================
// 4. HLAVNÍ OBRAZOVKA PLÁNKU
// ==========================================
export default function RoofPlanScreen() {
  const { colors } = useTheme();
  const styles = createRoofPlanStyles(colors);
  const router = useRouter();

  const { id, name, width, height } = useLocalSearchParams();
  const roofId = (Array.isArray(id) ? id[0] : id) as any;
  const realWidth = Number(width) || 1000;
  const realHeight = Number(height) || 1000;

  const roofs = useQuery(api.solars.getSolars);
  const updatePanelsMutation = useMutation(api.solars.updatePanels);
  const removeObstacleMutation = useMutation(api.solars.removeObstacle);
  const addObstacleMutation = useMutation(api.solars.addObstacle);

  // PŘIDÁNO: Mutace pro sdílení
  const shareRoofMutation = useMutation(api.solars.shareRoof);

  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isPanelFormVisible, setIsPanelFormVisible] = useState(false);
  const [isLightningRodFormVisible, setIsLightningRodFormVisible] =
    useState(false);

  const [isTrashActive, setIsTrashActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // STAV PRO EDIT MODE
  const [isEditMode, setIsEditMode] = useState(false);

  // PŘIDÁNO: Stavy pro sdílecí modál
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [colleagueId, setColleagueId] = useState("");

  const [isLoaded, setIsLoaded] = useState(false);
  const [panelGroup, setPanelGroup] = useState<any[] | null>(null);
  const [panelConfig, setPanelConfig] = useState<any>(null);
  const [savedPosition, setSavedPosition] = useState({ x: 0, y: 0 });
  const [obstacles, setObstacles] = useState<any[]>([]);

  const [isChimneyFormVisible, setIsChimneyFormVisible] = useState(false);
  const [isRoofWindowFormVisible, setIsRoofWindowFormVisible] = useState(false);

  const trashActiveRef = useRef(false);
  const draggableGroupRef = useRef<DraggablePanelGroupRef>(null);
  const statsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  useEffect(() => {
    if (roofs && roofId) {
      const currentRoof = roofs.find((r: any) => r._id === roofId);
      if (currentRoof) {
        setObstacles(currentRoof.obstacles || []);
        if (!isLoaded) {
          setPanelConfig(currentRoof.panelConfig || null);
          setPanelGroup(currentRoof.panelLayout || null);
          setSavedPosition(currentRoof.savedPosition || { x: 0, y: 0 });
          setIsLoaded(true);
        }
      }
    } else if (roofs && !roofId) {
      setIsLoaded(true);
    }
  }, [roofs, roofId, isLoaded]);

  const savePlanToDatabase = (
    config: any,
    layout: any,
    position: { x: number; y: number },
  ) => {
    if (!roofId) return;
    updatePanelsMutation({
      roofId: roofId,
      panelConfig: config || undefined,
      panelLayout: layout || undefined,
      savedPosition: position,
    }).catch((err) => console.error("DB ERROR:", err));
  };

  // PŘIDÁNO: Funkce pro sdílení střechy
  const handleShareProject = async () => {
    if (!colleagueId.trim()) {
      Alert.alert("Error", "Please enter a valid User ID");
      return;
    }

    try {
      await shareRoofMutation({
        roofId: roofId,
        collaboratorEmail: "unknown@colleague.com", // Zatím natvrdo
        collaboratorId: colleagueId.trim(),
      });

      Alert.alert("Success", "Project shared successfully!");
      setIsShareModalVisible(false);
      setColleagueId("");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to share project. Are you the owner?");
    }
  };

  const triggerStatsFadeOut = () => {
    statsOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(4000),
      Animated.timing(statsOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSelectItem = (item: any) => {
    if (item.title.includes("Solar panels")) setIsPanelFormVisible(true);
    if (item.title.includes("Lightning conductor"))
      setIsLightningRodFormVisible(true);
    if (item.title.includes("Chimney")) setIsChimneyFormVisible(true);
    if (item.title.includes("Skylight")) setIsRoofWindowFormVisible(true);
  };

  const handleAddObstacle = (obstacleData: any) => {
    setObstacles([...obstacles, obstacleData]);
    if (roofId) {
      addObstacleMutation({ roofId, newObstacle: obstacleData }).catch((err) =>
        console.error("DB error", err),
      );
    }
  };

  const handleDeleteObstacle = (index: number) => {
    setObstacles((prev) => prev.filter((_, i) => i !== index));

    if (roofId) {
      removeObstacleMutation({ roofId, obstacleIndex: index }).catch((err) =>
        console.error("Error while deleting obstacle in DB", err),
      );
    }
  };

  const handleGeneratePanels = (panelData: any) => {
    let availableWidth = realWidth;
    let availableHeight = realHeight;

    obstacles.forEach((obs) => {
      if (obs.type === "lightning_rod") {
        if (obs.edge === "left" || obs.edge === "right")
          availableWidth -= obs.clearanceZone;
        if (obs.edge === "top" || obs.edge === "bottom")
          availableHeight -= obs.clearanceZone;
      }
    });

    const layout = calculatePanelLayout(
      availableWidth,
      availableHeight,
      panelData.width,
      panelData.height,
      panelData.count,
      panelData.orientation,
      panelData.gap,
    );

    setPanelConfig(panelData);
    setPanelGroup(layout);

    let startX = 0;
    let startY = 0;
    obstacles.forEach((obs) => {
      if (obs.type === "lightning_rod") {
        if (obs.edge === "left") startX = obs.clearanceZone;
        if (obs.edge === "top") startY = obs.clearanceZone;
      }
    });

    setSavedPosition({ x: startX, y: startY });
    savePlanToDatabase(panelData, layout, { x: startX, y: startY });
    triggerStatsFadeOut();
  };

  const handleAddSinglePanel = () => {
    if (!panelGroup || panelGroup.length === 0 || !panelConfig) return;

    const gap = panelConfig.gap || 2.5;
    const sampleWidth = panelConfig.width;
    const sampleHeight = panelConfig.height;

    const boundingW = Math.max(...panelGroup.map((p) => p.x + p.width));
    const boundingH = Math.max(...panelGroup.map((p) => p.y + p.height));

    const slotW = sampleWidth + gap;
    const slotH = sampleHeight + gap;

    const cols = Math.max(1, Math.round(boundingW / slotW));
    let rows = Math.max(1, Math.round(boundingH / slotH));

    let newX = -1;
    let newY = -1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const testX = c * slotW;
        const testY = r * slotH;

        const isOccupied = panelGroup.some(
          (p) => Math.abs(p.x - testX) < 1 && Math.abs(p.y - testY) < 1,
        );

        if (!isOccupied) {
          newX = testX;
          newY = testY;
          break;
        }
      }
      if (newX !== -1) break;
    }

    if (newX === -1) {
      newX = 0;
      newY = rows * slotH;
    }

    const newBoundingW = Math.max(boundingW, newX + sampleWidth);
    const newBoundingH = Math.max(boundingH, newY + sampleHeight);

    let leftLimit = 0;
    let rightLimit = 0;
    let topLimit = 0;
    let bottomLimit = 0;

    obstacles.forEach((obs) => {
      if (obs.type === "lightning_rod") {
        if (obs.edge === "left")
          leftLimit = Math.max(leftLimit, obs.clearanceZone);
        if (obs.edge === "right")
          rightLimit = Math.max(rightLimit, obs.clearanceZone);
        if (obs.edge === "top")
          topLimit = Math.max(topLimit, obs.clearanceZone);
        if (obs.edge === "bottom")
          bottomLimit = Math.max(bottomLimit, obs.clearanceZone);
      }
    });

    const maxAllowedWidth = realWidth - leftLimit - rightLimit;
    const maxAllowedHeight = realHeight - topLimit - bottomLimit;

    if (newBoundingW > maxAllowedWidth || newBoundingH > maxAllowedHeight) {
      alert("No more panels can fit on the roof!");
      return;
    }

    const newPanel = {
      x: newX,
      y: newY,
      width: sampleWidth,
      height: sampleHeight,
      rotated: panelGroup[0]?.rotated || false,
      isActive: true,
    };

    const newGroup = [...panelGroup, newPanel];
    const newConfig = { ...panelConfig, count: panelConfig.count + 1 };

    setPanelGroup(newGroup);
    setPanelConfig(newConfig);

    savePlanToDatabase(newConfig, newGroup, savedPosition);
  };

  if (!isLoaded) {
    return (
      <LinearGradient
        colors={colors.gradients.background}
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.text, fontWeight: "bold" }}>
          Loading from database...
        </Text>
      </LinearGradient>
    );
  }

  let pixelWidth = 0;
  let pixelHeight = 0;
  let scale = 1;
  if (boardSize.width > 0 && boardSize.height > 0) {
    const maxDrawWidth = boardSize.width - 50;
    const maxDrawHeight = boardSize.height - 70;
    const scaleW = maxDrawWidth / realWidth;
    const scaleH = maxDrawHeight / realHeight;
    scale = Math.min(scaleW, scaleH);
    if (realWidth > realHeight) {
      scale = (boardSize.width - 20) / realWidth;
      if (realHeight * scale > boardSize.height - 70)
        scale = (boardSize.height - 70) / realHeight;
    }
    pixelWidth = realWidth * scale;
    pixelHeight = realHeight * scale;
  }

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.headerBorderBottom },
          ]}
        >
          {/* ŘÁDEK 1: ZPĚT + NÁZEV */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              marginBottom: 4,
            }}
          >
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                ← Back
              </Text>
            </Pressable>
            <Text
              style={[styles.title, { color: colors.text, flexShrink: 1 }]}
              numberOfLines={1}
            >
              Blueprint: {name}
            </Text>
          </View>

          {/* ŘÁDEK 2: OVLÁDACÍ TLAČÍTKA */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {/* Share */}
            <Pressable
              onPress={() => setIsShareModalVisible(true)}
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.headerBorderBottom,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#3b82f6", fontWeight: "bold", marginRight: 4 }}
              >
                <FontAwesome
                  name="handshake-o"
                  size={15}
                  color={colors.iconColor}
                />
              </Text>
              <Text style={{ color: "#3b82f6", fontWeight: "bold" }}>
                Share
              </Text>
            </Pressable>

            {/* Edit / Move */}
            {panelGroup && panelGroup.length > 0 && (
              <Pressable
                onPress={() => setIsEditMode(!isEditMode)}
                style={{
                  backgroundColor: isEditMode ? colors.primary : colors.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isEditMode
                    ? colors.primary
                    : colors.headerBorderBottom,
                }}
              >
                <Text
                  style={{
                    color: isEditMode ? "#fff" : colors.text,
                    fontWeight: "bold",
                  }}
                >
                  {isEditMode ? (
                    <Text>
                      <FontAwesome
                        name="hand-stop-o"
                        size={12}
                        color={colors.iconColor}
                      />{" "}
                      Move
                    </Text>
                  ) : (
                    <Text>
                      <EvilIcons
                        name="pencil"
                        size={17}
                        color={colors.iconColor}
                      />{" "}
                      Edit
                    </Text>
                  )}
                </Text>
              </Pressable>
            )}

            {/* Center */}
            {panelGroup && panelGroup.length > 0 && !isEditMode && (
              <Pressable
                onPress={() => draggableGroupRef.current?.center()}
                style={{
                  backgroundColor: colors.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.headerBorderBottom,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "bold" }}>
                  <AntDesign name="aim" size={12} color={colors.iconColor} />{" "}
                  Center
                </Text>
              </Pressable>
            )}

            {/* +1 Panel */}
            {panelGroup && panelGroup.length > 0 && !isEditMode && (
              <Pressable
                onPress={handleAddSinglePanel}
                style={{
                  backgroundColor: colors.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.headerBorderBottom,
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                  +1 panel
                </Text>
              </Pressable>
            )}

            {/* + Add object */}
            <Pressable
              onPress={() => setIsMenuVisible(true)}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                + Add object
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.planContainer}>
          <View
            style={[
              styles.blueprintBoard,
              {
                backgroundColor: colors.bg,
                borderColor: colors.headerBorderBottom,
              },
            ]}
            onLayout={(event) =>
              setBoardSize({
                width: event.nativeEvent.layout.width,
                height: event.nativeEvent.layout.height,
              })
            }
          >
            <GridBackground color={colors.textMuted + "20"} />
            {boardSize.width > 0 && (
              <View style={styles.centerWrapper}>
                <View
                  style={[
                    styles.roofRectangle,
                    {
                      width: pixelWidth,
                      height: pixelHeight,
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + "33",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.measurementText,
                      styles.measureHeight,
                      { color: colors.text },
                    ]}
                  >
                    {realHeight}cm
                  </Text>
                  <Text
                    style={[
                      styles.measurementText,
                      styles.measureWidth,
                      { color: colors.text },
                    ]}
                  >
                    {realWidth}cm
                  </Text>

                  {obstacles.map((obs, index) => {
                    if (obs.type === "lightning_rod") {
                      const clearancePx = obs.clearanceZone * scale;

                      let stylePosition: any = {};
                      if (obs.edge === "left") {
                        stylePosition = {
                          top: 0,
                          bottom: 0,
                          left: 0,
                          width: clearancePx,
                        };
                      } else if (obs.edge === "right") {
                        stylePosition = {
                          top: 0,
                          bottom: 0,
                          right: 0,
                          width: clearancePx,
                        };
                      } else if (obs.edge === "top") {
                        stylePosition = {
                          left: 0,
                          right: 0,
                          top: 0,
                          height: clearancePx,
                        };
                      } else if (obs.edge === "bottom") {
                        stylePosition = {
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: clearancePx,
                        };
                      }

                      return (
                        <View
                          key={`obs-${index}`}
                          style={{
                            position: "absolute",
                            ...stylePosition,
                            zIndex: 10,
                          }}
                        >
                          <DraggableObstacleWrapper
                            onDragStart={() => setIsDragging(true)}
                            onDragMove={(pageX: number, pageY: number) => {
                              const screenH = Dimensions.get("window").height;
                              const screenW = Dimensions.get("window").width;
                              if (
                                pageY > screenH - 150 &&
                                pageX > screenW - 150
                              ) {
                                setIsTrashActive(true);
                                trashActiveRef.current = true;
                              } else {
                                setIsTrashActive(false);
                                trashActiveRef.current = false;
                              }
                            }}
                            onDragEnd={() => {
                              setIsDragging(false);
                              if (trashActiveRef.current === true) {
                                handleDeleteObstacle(index);
                                setIsTrashActive(false);
                                trashActiveRef.current = false;
                              }
                            }}
                          >
                            <View
                              style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "rgba(239, 68, 68, 0.2)",
                                borderColor: "rgba(239, 68, 68, 0.8)",
                                borderWidth: 2,
                                borderStyle: "dashed",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: "#ef4444",
                                  fontWeight: "bold",
                                  opacity: 0.5,
                                  letterSpacing: 2,
                                  transform: [
                                    {
                                      rotate:
                                        obs.edge === "left" ||
                                        obs.edge === "right"
                                          ? "-90deg"
                                          : "0deg",
                                    },
                                  ],
                                }}
                              >
                                <AntDesign
                                  name="thunderbolt"
                                  size={24}
                                  color={colors.inactive}
                                />{" "}
                                ZONE{" "}
                                <AntDesign
                                  name="thunderbolt"
                                  size={24}
                                  color={colors.inactive}
                                />
                              </Text>
                            </View>
                          </DraggableObstacleWrapper>
                        </View>
                      );
                    }

                    if (obs.type === "chimney") {
                      const totalSizeCm = obs.size + obs.clearanceZone * 2;
                      const sizePx = totalSizeCm * scale;

                      let leftPx = 0;
                      if (obs.positionX.measuredFrom === "left") {
                        leftPx =
                          (obs.positionX.distance - obs.clearanceZone) * scale;
                      } else {
                        leftPx =
                          pixelWidth -
                          (obs.positionX.distance +
                            obs.size +
                            obs.clearanceZone) *
                            scale;
                      }

                      let topPx = 0;
                      if (obs.positionY.measuredFrom === "top") {
                        topPx =
                          (obs.positionY.distance - obs.clearanceZone) * scale;
                      } else {
                        topPx =
                          pixelHeight -
                          (obs.positionY.distance +
                            obs.size +
                            obs.clearanceZone) *
                            scale;
                      }

                      return (
                        <View
                          key={`obs-${index}`}
                          style={{
                            position: "absolute",
                            left: leftPx,
                            top: topPx,
                            width: sizePx,
                            height: sizePx,
                            zIndex: 10,
                          }}
                        >
                          <DraggableObstacleWrapper
                            onDragStart={() => setIsDragging(true)}
                            onDragMove={(pageX: number, pageY: number) => {
                              const screenH = Dimensions.get("window").height;
                              const screenW = Dimensions.get("window").width;
                              if (
                                pageY > screenH - 150 &&
                                pageX > screenW - 150
                              ) {
                                setIsTrashActive(true);
                                trashActiveRef.current = true;
                              } else {
                                setIsTrashActive(false);
                                trashActiveRef.current = false;
                              }
                            }}
                            onDragEnd={() => {
                              setIsDragging(false);
                              if (trashActiveRef.current === true) {
                                handleDeleteObstacle(index);
                                setIsTrashActive(false);
                                trashActiveRef.current = false;
                              }
                            }}
                          >
                            <View
                              style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "rgba(239, 68, 68, 0.2)",
                                borderColor: "rgba(239, 68, 68, 0.8)",
                                borderWidth: 2,
                                borderStyle: "dashed",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  width: obs.size * scale,
                                  height: obs.size * scale,
                                  backgroundColor: "#475569",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <Text style={{ fontSize: 10, color: "white" }}>
                                  <Fontisto
                                    name="rectangle"
                                    size={24}
                                    color={colors.iconColor}
                                  />
                                </Text>
                              </View>
                            </View>
                          </DraggableObstacleWrapper>
                        </View>
                      );
                    }

                    if (obs.type === "roof_window") {
                      const totalWidthCm = obs.width + obs.clearanceZone * 2;
                      const totalHeightCm = obs.height + obs.clearanceZone * 2;
                      const widthPx = totalWidthCm * scale;
                      const heightPx = totalHeightCm * scale;

                      let leftPx = 0;
                      if (obs.positionX.measuredFrom === "left") {
                        leftPx =
                          (obs.positionX.distance - obs.clearanceZone) * scale;
                      } else {
                        leftPx =
                          pixelWidth -
                          (obs.positionX.distance +
                            obs.width +
                            obs.clearanceZone) *
                            scale;
                      }

                      let topPx = 0;
                      if (obs.positionY.measuredFrom === "top") {
                        topPx =
                          (obs.positionY.distance - obs.clearanceZone) * scale;
                      } else {
                        topPx =
                          pixelHeight -
                          (obs.positionY.distance +
                            obs.height +
                            obs.clearanceZone) *
                            scale;
                      }

                      return (
                        <View
                          key={`obs-${index}`}
                          style={{
                            position: "absolute",
                            left: leftPx,
                            top: topPx,
                            width: widthPx,
                            height: heightPx,
                            zIndex: 10,
                          }}
                        >
                          <DraggableObstacleWrapper
                            onDragStart={() => setIsDragging(true)}
                            onDragMove={(pageX: number, pageY: number) => {
                              const screenH = Dimensions.get("window").height;
                              const screenW = Dimensions.get("window").width;
                              if (
                                pageY > screenH - 150 &&
                                pageX > screenW - 150
                              ) {
                                setIsTrashActive(true);
                                trashActiveRef.current = true;
                              } else {
                                setIsTrashActive(false);
                                trashActiveRef.current = false;
                              }
                            }}
                            onDragEnd={() => {
                              setIsDragging(false);
                              if (trashActiveRef.current === true) {
                                handleDeleteObstacle(index);
                                setIsTrashActive(false);
                                trashActiveRef.current = false;
                              }
                            }}
                          >
                            <View
                              style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                borderColor: "rgba(59, 130, 246, 0.8)",
                                borderWidth: 2,
                                borderStyle: "dashed",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  width: obs.width * scale,
                                  height: obs.height * scale,
                                  backgroundColor: "#93c5fd",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  borderWidth: 1,
                                  borderColor: "#3b82f6",
                                }}
                              >
                                <Text style={{ fontSize: 10, color: "white" }}>
                                  <FontAwesome5
                                    name="solar-panel"
                                    size={24}
                                    color={colors.iconColor}
                                  />
                                </Text>
                              </View>
                            </View>
                          </DraggableObstacleWrapper>
                        </View>
                      );
                    }

                    return null;
                  })}

                  {panelGroup && panelGroup.length > 0 && (
                    <DraggablePanelGroup
                      ref={draggableGroupRef}
                      key={`panels-${panelGroup.length}-${savedPosition.x}-${savedPosition.y}`}
                      layout={panelGroup}
                      isEditMode={isEditMode}
                      onTogglePanel={(index) => {
                        const newGroup = [...panelGroup];
                        newGroup[index] = {
                          ...newGroup[index],
                          isActive: !newGroup[index].isActive,
                        };
                        setPanelGroup(newGroup);
                        savePlanToDatabase(
                          panelConfig,
                          newGroup,
                          savedPosition,
                        );
                      }}
                      scale={scale}
                      roofWidthPx={pixelWidth}
                      roofHeightPx={pixelHeight}
                      realRoofWidth={realWidth}
                      realRoofHeight={realHeight}
                      initialPosition={savedPosition}
                      obstacles={obstacles}
                      onDragStart={() => setIsDragging(true)}
                      onDragMove={(pageX, pageY) => {
                        const screenHeight = Dimensions.get("window").height;
                        const screenWidth = Dimensions.get("window").width;
                        if (
                          pageY > screenHeight - 150 &&
                          pageX > screenWidth - 150
                        ) {
                          setIsTrashActive(true);
                          trashActiveRef.current = true;
                        } else {
                          setIsTrashActive(false);
                          trashActiveRef.current = false;
                        }
                      }}
                      onDragEnd={(finalX, finalY) => {
                        setIsDragging(false);
                        if (trashActiveRef.current === true) {
                          setPanelGroup(null);
                          setPanelConfig(null);
                          setIsTrashActive(false);
                          trashActiveRef.current = false;
                          savePlanToDatabase(null, null, { x: 0, y: 0 });
                        } else {
                          triggerStatsFadeOut();
                          setSavedPosition({ x: finalX, y: finalY });
                          savePlanToDatabase(panelConfig, panelGroup, {
                            x: finalX,
                            y: finalY,
                          });
                        }
                      }}
                      onPositionChange={(targetX, targetY) => {
                        setSavedPosition({ x: targetX, y: targetY });
                        savePlanToDatabase(panelConfig, panelGroup, {
                          x: targetX,
                          y: targetY,
                        });
                      }}
                    />
                  )}
                </View>
              </View>
            )}
            {panelGroup && panelConfig && (
              <Animated.View
                style={[
                  styles.statsBadge,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.headerBorderBottom,
                    opacity: statsOpacity,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  <AntDesign name="sun" size={24} color={colors.iconColor} />{" "}
                  {panelGroup.filter((p) => p.isActive !== false).length} /{" "}
                  {panelConfig.count} panels on roof
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      </SafeAreaView>

      {isDragging && (
        <View
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            width: isTrashActive ? 80 : 60,
            height: isTrashActive ? 80 : 60,
            borderRadius: 40,
            backgroundColor: isTrashActive ? "#ef4444" : "rgba(0,0,0,0.8)",
            borderWidth: 3,
            borderColor: isTrashActive ? "#fff" : "#ff4444",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            elevation: 100,
          }}
        >
          <Text style={{ fontSize: isTrashActive ? 32 : 24 }}>
            <FontAwesome5 name="trash-alt" size={24} color={colors.iconColor} />
          </Text>
        </View>
      )}

      {/* PŘIDÁNO: Sdílecí Modál */}
      <Modal visible={isShareModalVisible} transparent animationType="fade">
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
              width: "70%",
              borderColor: colors.headerBorderBottom,
              borderWidth: 1,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Share project
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textMuted,
                marginBottom: 20,
              }}
            >
              Enter your colleague's Clerk ID to let them edit this roof plan
              with you in real time.
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.headerBorderBottom,
                backgroundColor: colors.bg,
                color: colors.text,
                padding: 12,
                marginBottom: 20,
                borderRadius: 8,
                fontSize: 16,
              }}
              placeholder="e.g. user_2bXyZ..."
              placeholderTextColor={colors.textMuted}
              value={colleagueId}
              onChangeText={setColleagueId}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <Pressable
                onPress={() => setIsShareModalVisible(false)}
                style={{ paddingHorizontal: 16, paddingVertical: 10 }}
              >
                <Text style={{ color: colors.textMuted, fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShareProject}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>Share</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <CustomMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onSelect={handleSelectItem}
        colors={colors}
      />
      <SolarPanelFormModal
        visible={isPanelFormVisible}
        onClose={() => setIsPanelFormVisible(false)}
        onSave={handleGeneratePanels}
        colors={colors}
      />
      <LightningRodFormModal
        visible={isLightningRodFormVisible}
        onClose={() => setIsLightningRodFormVisible(false)}
        onSave={handleAddObstacle}
        colors={colors}
      />
      <ChimneyFormModal
        visible={isChimneyFormVisible}
        onClose={() => setIsChimneyFormVisible(false)}
        onSave={handleAddObstacle}
        colors={colors}
      />
      <RoofWindowFormModal
        visible={isRoofWindowFormVisible}
        onClose={() => setIsRoofWindowFormVisible(false)}
        onSave={handleAddObstacle}
        colors={colors}
      />
    </LinearGradient>
  );
}
