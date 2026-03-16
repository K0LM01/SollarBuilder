import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

// ==========================================
// 0. MATEMATIKA: Algoritmus pro panely
// ==========================================
const calculatePanelLayout = (
  roofW: number,
  roofH: number,
  panelW: number,
  panelH: number,
  count: number,
  preferredOrientation: string,
) => {
  const layouts = [];
  let placedCount = 0;
  const mainPW = preferredOrientation === "portrait" ? panelW : panelH;
  const mainPH = preferredOrientation === "portrait" ? panelH : panelW;
  const cols = Math.floor(roofW / mainPW);
  const rows = Math.floor(roofH / mainPH);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (placedCount >= count) return layouts;
      layouts.push({
        x: c * mainPW,
        y: r * mainPH,
        width: mainPW,
        height: mainPH,
        rotated: false,
      });
      placedCount++;
    }
  }

  if (placedCount < count) {
    const altPW = mainPH;
    const altPH = mainPW;
    const usedWidth = cols * mainPW;
    const remainingWidth = roofW - usedWidth;
    if (remainingWidth >= altPW) {
      const altCols = Math.floor(remainingWidth / altPW);
      const altRows = Math.floor(roofH / altPH);
      for (let r = 0; r < altRows; r++) {
        for (let c = 0; c < altCols; c++) {
          if (placedCount >= count) return layouts;
          layouts.push({
            x: usedWidth + c * altPW,
            y: r * altPH,
            width: altPW,
            height: altPH,
            rotated: true,
          });
          placedCount++;
        }
      }
    }
    const usedHeight = rows * mainPH;
    const remainingHeight = roofH - usedHeight;
    if (remainingHeight >= altPH) {
      const altCols = Math.floor(roofW / altPW);
      const altRows = Math.floor(remainingHeight / altPH);
      for (let r = 0; r < altRows; r++) {
        for (let c = 0; c < altCols; c++) {
          if (placedCount >= count) return layouts;
          layouts.push({
            x: c * altPW,
            y: usedHeight + r * altPH,
            width: altPW,
            height: altPH,
            rotated: true,
          });
          placedCount++;
        }
      }
    }
  }
  return layouts;
};

// ==========================================
// 1. MŘÍŽKA NA POZADÍ
// ==========================================
const GridBackground = ({ color }: { color: string }) => {
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
// ==========================================
// 2. DRAGGABLE KOMPONENTA (S PERFEKTNÍ MATEMATIKOU A PŘISÁVÁNÍM)
// ==========================================
type DraggableProps = {
  layout: any[];
  scale: number;
  roofWidthPx: number;
  roofHeightPx: number;
  realRoofWidth: number;
  realRoofHeight: number;
  initialPosition: { x: number; y: number };
  onDragStart: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onPositionChange: (x: number, y: number) => void;
};
export interface DraggablePanelGroupRef {
  center: () => void;
}

const DraggablePanelGroup = forwardRef<DraggablePanelGroupRef, DraggableProps>(
  (
    {
      layout,
      scale,
      roofWidthPx,
      roofHeightPx,
      realRoofWidth,
      realRoofHeight,
      initialPosition,
      onDragStart,
      onDragMove,
      onDragEnd,
      onPositionChange,
    },
    ref,
  ) => {
    const boundingWidth = Math.max(...layout.map((p) => p.x + p.width)) * scale;
    const boundingHeight =
      Math.max(...layout.map((p) => p.y + p.height)) * scale;

    const maxAllowedX = Math.max(0, roofWidthPx - boundingWidth - 6);
    const maxAllowedY = Math.max(0, roofHeightPx - boundingHeight - 6);

    const startX = initialPosition
      ? Math.min(initialPosition.x, maxAllowedX)
      : 0;
    const startY = initialPosition
      ? Math.min(initialPosition.y, maxAllowedY)
      : 0;

    const pan = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;
    const currentPos = useRef({ x: startX, y: startY });
    const [isDraggingLocal, setIsDraggingLocal] = useState(false);

    // Čistá matematika (maximální pohyb v cm)
    const realBoundW = Math.round(boundingWidth / scale);
    const realBoundH = Math.round(boundingHeight / scale);
    const maxMoveCmX = Math.max(0, realRoofWidth - realBoundW);
    const maxMoveCmY = Math.max(0, realRoofHeight - realBoundH);

    const callbacks = useRef({
      onDragEnd,
      onPositionChange,
      onDragStart,
      onDragMove,
    });
    useEffect(() => {
      callbacks.current = {
        onDragEnd,
        onPositionChange,
        onDragStart,
        onDragMove,
      };
    }, [onDragEnd, onPositionChange, onDragStart, onDragMove]);

    const [distances, setDistances] = useState({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    });

    useImperativeHandle(ref, () => ({
      center: () => {
        // Centrování s přihlédnutím k 5cm mřížce
        let targetCmX = Math.round(maxMoveCmX / 2 / 5) * 5;
        let targetCmY = Math.round(maxMoveCmY / 2 / 5) * 5;

        let targetX =
          maxMoveCmX > 0 ? (targetCmX / maxMoveCmX) * maxAllowedX : 0;
        let targetY =
          maxMoveCmY > 0 ? (targetCmY / maxMoveCmY) * maxAllowedY : 0;

        setIsDraggingLocal(true);
        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: false,
          friction: 6,
        }).start(() => {
          currentPos.current = { x: targetX, y: targetY };
          setTimeout(() => setIsDraggingLocal(false), 600);
          callbacks.current.onPositionChange(targetX, targetY);
        });
      },
    }));

    // Kóty už se počítají procentuálně = absolutní přesnost na okrajích (0 cm!)
    useEffect(() => {
      const listenerId = pan.addListener((value) => {
        let percentX =
          maxAllowedX > 0 ? Math.max(0, Math.min(1, value.x / maxAllowedX)) : 0;
        let percentY =
          maxAllowedY > 0 ? Math.max(0, Math.min(1, value.y / maxAllowedY)) : 0;

        let leftCm = Math.round(percentX * maxMoveCmX);
        let topCm = Math.round(percentY * maxMoveCmY);

        setDistances({
          left: leftCm,
          top: topCm,
          right: Math.max(0, maxMoveCmX - leftCm),
          bottom: Math.max(0, maxMoveCmY - topCm),
        });
      });
      return () => pan.removeListener(listenerId);
    }, [pan, maxAllowedX, maxAllowedY, maxMoveCmX, maxMoveCmY]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsDraggingLocal(true);
          pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
          pan.setValue({ x: 0, y: 0 });
          callbacks.current.onDragStart();
        },
        onPanResponderMove: (e, gestureState) => {
          let rawX = currentPos.current.x + gestureState.dx;
          let rawY = currentPos.current.y + gestureState.dy;

          // Krok 1: Kde jsme procentuálně na obrazovce?
          let percentX = maxAllowedX > 0 ? rawX / maxAllowedX : 0;
          let percentY = maxAllowedY > 0 ? rawY / maxAllowedY : 0;

          // Krok 2: Jaká je to hodnota v reálných centimetrech?
          let rawCmX = percentX * maxMoveCmX;
          let rawCmY = percentY * maxMoveCmY;

          // Krok 3: Přisajeme k nejbližším 5 cm
          let snappedCmX = Math.round(rawCmX / 5) * 5;
          let snappedCmY = Math.round(rawCmY / 5) * 5;

          // Krok 4: Zabráníme přejetí okrajů
          if (snappedCmX < 0) snappedCmX = 0;
          if (snappedCmY < 0) snappedCmY = 0;
          if (snappedCmX > maxMoveCmX) snappedCmX = maxMoveCmX;
          if (snappedCmY > maxMoveCmY) snappedCmY = maxMoveCmY;

          // Krok 5: Převedeme cm zpět na fyzické pixely pro animaci
          let finalX =
            maxMoveCmX > 0 ? (snappedCmX / maxMoveCmX) * maxAllowedX : 0;
          let finalY =
            maxMoveCmY > 0 ? (snappedCmY / maxMoveCmY) * maxAllowedY : 0;

          pan.setValue({
            x: finalX - currentPos.current.x,
            y: finalY - currentPos.current.y,
          });
          callbacks.current.onDragMove(gestureState.moveX, gestureState.moveY);
        },
        onPanResponderRelease: () => {
          setIsDraggingLocal(false);
          pan.flattenOffset();
          const finalX = (pan.x as any)._value;
          const finalY = (pan.y as any)._value;
          currentPos.current.x = finalX;
          currentPos.current.y = finalY;
          callbacks.current.onDragEnd(finalX, finalY);
        },
        onPanResponderTerminate: () => setIsDraggingLocal(false),
      }),
    ).current;

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: boundingWidth,
          height: boundingHeight,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          backgroundColor: "rgba(59, 130, 246, 0.15)",
        }}
      >
        {layout.map((panel, index) => (
          <View
            key={index}
            style={{
              position: "absolute",
              left: panel.x * scale,
              top: panel.y * scale,
              width: panel.width * scale,
              height: panel.height * scale,
              backgroundColor: "#1e3a8a",
              borderWidth: 1,
              borderColor: "#60a5fa",
              borderRadius: 2,
            }}
          />
        ))}
        {isDraggingLocal && (
          <>
            <View
              style={{
                position: "absolute",
                top: -32,
                width: "100%",
                alignItems: "center",
              }}
            >
              <View style={styles.dimensionBadge}>
                <Text style={styles.dimensionBadgeText}>
                  {distances.top} cm
                </Text>
              </View>
            </View>
            <View
              style={{
                position: "absolute",
                bottom: -32,
                width: "100%",
                alignItems: "center",
              }}
            >
              <View style={styles.dimensionBadge}>
                <Text style={styles.dimensionBadgeText}>
                  {distances.bottom} cm
                </Text>
              </View>
            </View>
            <View
              style={{
                position: "absolute",
                left: -55,
                top: 0,
                height: "100%",
                justifyContent: "center",
              }}
            >
              <View style={styles.dimensionBadge}>
                <Text style={styles.dimensionBadgeText}>
                  {distances.left} cm
                </Text>
              </View>
            </View>
            <View
              style={{
                position: "absolute",
                right: -55,
                top: 0,
                height: "100%",
                justifyContent: "center",
              }}
            >
              <View style={styles.dimensionBadge}>
                <Text style={styles.dimensionBadgeText}>
                  {distances.right} cm
                </Text>
              </View>
            </View>
          </>
        )}
      </Animated.View>
    );
  },
);

// ==========================================
// 3. VYSKAKOVACÍ MENU A FORMULÁŘE
// ==========================================
const CustomMenu = ({ visible, onClose, onSelect, colors }: any) => {
  const menuItems = [
    { id: 1, title: "☀️ Solar panels" },
    { id: 2, title: "🧱 Chimney" },
    { id: 3, title: "🏠 Skylight" },
    { id: 4, title: "⚡ Lightning conductor" },
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

const SolarPanelFormModal = ({ visible, onClose, onSave, colors }: any) => {
  const [count, setCount] = useState("10");
  const [panelWidth, setPanelWidth] = useState("113");
  const [panelHeight, setPanelHeight] = useState("172");
  const [orientation, setOrientation] = useState("portrait");
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.menuContainer,
            { backgroundColor: colors.bg, width: 350 },
          ]}
        >
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
            placeholder="Count"
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
              placeholder="Width"
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
              placeholder="Height"
              keyboardType="numeric"
              value={panelHeight}
              onChangeText={setPanelHeight}
            />
          </View>
          <Text
            style={{
              color: colors.text,
              marginTop: 10,
              marginBottom: 8,
              fontWeight: "600",
            }}
          >
            Preferred orientation:
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
                Height ↕️
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
                Width ↔️
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
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
                { flex: 1, backgroundColor: colors.primary, marginTop: 0 },
              ]}
              onPress={() => {
                onSave({
                  count: Number(count),
                  width: Number(panelWidth),
                  height: Number(panelHeight),
                  orientation,
                });
                onClose();
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Draw
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ==========================================
// 4. HLAVNÍ OBRAZOVKA PLÁNKU
// ==========================================
export default function RoofPlanScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { id, name, width, height } = useLocalSearchParams();
  const roofId = (Array.isArray(id) ? id[0] : id) as any;
  const realWidth = Number(width) || 1000;
  const realHeight = Number(height) || 1000;

  const roofs = useQuery(api.solars.getSolars);
  const updatePanelsMutation = useMutation(api.solars.updatePanels);

  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isPanelFormVisible, setIsPanelFormVisible] = useState(false);
  const [isTrashActive, setIsTrashActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [panelGroup, setPanelGroup] = useState<any[] | null>(null);
  const [panelConfig, setPanelConfig] = useState<any>(null);
  const [savedPosition, setSavedPosition] = useState({ x: 0, y: 0 });

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
    if (roofs && !isLoaded && roofId) {
      const currentRoof = roofs.find((r: any) => r._id === roofId);
      if (currentRoof && currentRoof.panelLayout) {
        setPanelConfig(currentRoof.panelConfig);
        setPanelGroup(currentRoof.panelLayout);
        setSavedPosition(currentRoof.savedPosition || { x: 0, y: 0 });
      }
      setIsLoaded(true);
    } else if (roofs && !roofId) {
      setIsLoaded(true);
    }
  }, [roofs, isLoaded, roofId]);

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
    }).catch((err) => console.error("DB CHYBA:", err));
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
  };

  const handleGeneratePanels = (panelData: any) => {
    const layout = calculatePanelLayout(
      realWidth,
      realHeight,
      panelData.width,
      panelData.height,
      panelData.count,
      panelData.orientation,
    );
    setPanelConfig(panelData);
    setPanelGroup(layout);
    setSavedPosition({ x: 0, y: 0 });

    savePlanToDatabase(panelData, layout, { x: 0, y: 0 });
    triggerStatsFadeOut();
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
          Načítám z databáze...
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
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
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
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              Blueprint: {name}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {panelGroup && panelGroup.length > 0 && (
              <Pressable
                onPress={() => draggableGroupRef.current?.center()}
                style={{
                  backgroundColor: colors.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.headerBorderBottom,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "bold" }}>
                  ⌖ Center
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setIsMenuVisible(true)}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
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

                  {panelGroup && panelGroup.length > 0 && (
                    <DraggablePanelGroup
                      ref={draggableGroupRef}
                      key={`panels-${panelGroup.length}-${savedPosition.x}-${savedPosition.y}`}
                      layout={panelGroup}
                      scale={scale}
                      roofWidthPx={pixelWidth}
                      roofHeightPx={pixelHeight}
                      realRoofWidth={realWidth}
                      realRoofHeight={realHeight}
                      initialPosition={savedPosition}
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
                  ☀️ {panelGroup.length} / {panelConfig.count} panels on roof
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
          <Text style={{ fontSize: isTrashActive ? 32 : 24 }}>🗑️</Text>
        </View>
      )}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
