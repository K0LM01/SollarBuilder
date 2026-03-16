import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
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
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
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
// 2. DRAGGABLE KOMPONENTA (BLOK PANELŮ S HRANICEMI)
// ==========================================
const DraggablePanelGroup = ({
  layout,
  scale,
  roofWidthPx,
  roofHeightPx,
}: {
  layout: any[];
  scale: number;
  roofWidthPx: number;
  roofHeightPx: number;
}) => {
  // Samotná hodnota, kterou taháme prstem
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Zde si PŘESNĚ pamatujeme, kde se zrovna blok nachází (bez ohledu na animace)
  const currentPos = useRef({ x: 0, y: 0 });

  // Vypočítáme fyzickou velikost celého vyskládaného bloku
  const boundingWidth = Math.max(...layout.map((p) => p.x + p.width)) * scale;
  const boundingHeight = Math.max(...layout.map((p) => p.y + p.height)) * scale;

  // Spočítáme maximální povolené hranice pro pohyb.
  // Občas uživatel přidá panely, které se nevejdou ani na střechu
  // V tom případě maxBounds nepustíme pod 0.
  // Přidáme ruční odečet 6px kvůli tloušťce čáry rámečku (borderWidth 3 * 2 strany)
  const maxAllowedX = Math.max(0, roofWidthPx - boundingWidth - 6);
  const maxAllowedY = Math.max(0, roofHeightPx - boundingHeight - 6);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        // Zafixujeme stávající pozici bloku
        pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (e, gestureState) => {
        // Cílová X pozice na plátně (kde chci být = výchozí pozice + pohyb prstu)
        let newX = currentPos.current.x + gestureState.dx;
        // Cílová Y pozice na plátně
        let newY = currentPos.current.y + gestureState.dy;

        // OMEZÍME ZLEVA A SHORA (nesmí pod nulu)
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;

        // OMEZÍME ZPRAVA A ZDOLA (nesmí přesáhnout okraj střechy minus velikost panelů)
        if (newX > maxAllowedX) newX = maxAllowedX;
        if (newY > maxAllowedY) newY = maxAllowedY;

        // Protože Pan.setValue se počítá OD AKTUALNÍHO OFFSETU,
        // musíme od cílové chráněné pozice zase ten offset odečíst
        pan.setValue({
          x: newX - currentPos.current.x,
          y: newY - currentPos.current.y,
        });
      },

      onPanResponderRelease: (e, gestureState) => {
        // Po puštění si do paměti uložíme FINÁLNÍ pozici,
        // ať při dalším chycení neuskočí
        pan.flattenOffset();

        // Z animated nodu vytáhneme finální reálné souřadnice
        currentPos.current.x = (pan.x as any)._value;
        currentPos.current.y = (pan.y as any)._value;
      },
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
        // Pomáhá se zvedáním dotyků
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        // !!! Přidali jsme overflow, aby žádný kousek nevykukoval !!!
        overflow: "hidden",
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
            borderRadius: 2, // Můžeme nechat jemné zakulacení
          }}
        />
      ))}
    </Animated.View>
  );
};

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
            placeholder="Count (e.g. 10)"
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

  const { name, width, height } = useLocalSearchParams();
  const realWidth = Number(width) || 1000;
  const realHeight = Number(height) || 1000;

  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isPanelFormVisible, setIsPanelFormVisible] = useState(false);

  // Zde ukládáme vykreslené panely!
  const [panelGroup, setPanelGroup] = useState<any[] | null>(null);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const handleSelectItem = (item: any) => {
    if (item.title.includes("Solar panels")) {
      setIsPanelFormVisible(true);
    }
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
    setPanelGroup(layout);
  };

  let pixelWidth = 0;
  let pixelHeight = 0;
  let scale = 1;

  if (boardSize.width > 0 && boardSize.height > 0) {
    const maxDrawWidth = boardSize.width - 50;
    const maxDrawHeight = boardSize.height - 50;
    const scaleW = maxDrawWidth / realWidth;
    const scaleH = maxDrawHeight / realHeight;
    scale = Math.min(scaleW, scaleH);

    if (realWidth > realHeight) {
      scale = (boardSize.width - 20) / realWidth;
      if (realHeight * scale > boardSize.height - 40) {
        scale = (boardSize.height - 40) / realHeight;
      }
    }
    pixelWidth = realWidth * scale;
    pixelHeight = realHeight * scale;
  }

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
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

        <View style={styles.planContainer}>
          <View
            style={[
              styles.blueprintBoard,
              {
                backgroundColor: colors.bg,
                borderColor: colors.headerBorderBottom,
              },
            ]}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setBoardSize({ width, height });
            }}
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
                  {/* ZDE VYKRESLUJEME BLOK PANELŮ */}
                  {panelGroup && panelGroup.length > 0 && (
                    <DraggablePanelGroup
                      layout={panelGroup}
                      scale={scale}
                      roofWidthPx={pixelWidth}
                      roofHeightPx={pixelHeight}
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

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
      </SafeAreaView>
    </LinearGradient>
  );
}

// ==========================================
// 5. STYLY
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
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
});
