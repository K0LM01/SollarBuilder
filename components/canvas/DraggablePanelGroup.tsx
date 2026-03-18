// components/canvas/DraggablePanelGroup.tsx
import { createRoofPlanStyles } from "@/assets/images/roofPlanStyles";
import useTheme from "@/hooks/useTheme";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Animated, PanResponder, Pressable, Text, View } from "react-native";

export type DraggableProps = {
  layout: any[];
  scale: number;
  roofWidthPx: number;
  roofHeightPx: number;
  realRoofWidth: number;
  realRoofHeight: number;
  initialPosition: { x: number; y: number };
  obstacles: any[];
  // NOVÉ PROPS PRO EDIT MODE
  isEditMode?: boolean;
  onTogglePanel?: (index: number) => void;
  // FUNKCE PRO MOVE MODE
  onDragStart: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onPositionChange: (x: number, y: number) => void;
};

export interface DraggablePanelGroupRef {
  center: () => void;
}

export const DraggablePanelGroup = forwardRef<
  DraggablePanelGroupRef,
  DraggableProps
>(
  (
    {
      layout,
      scale,
      roofWidthPx,
      roofHeightPx,
      realRoofWidth,
      realRoofHeight,
      initialPosition,
      obstacles,
      isEditMode = false,
      onTogglePanel,
      onDragStart,
      onDragMove,
      onDragEnd,
      onPositionChange,
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const styles = createRoofPlanStyles(colors);

    // Vypočítáme přesnou šířku a výšku obsahu (nezaokrouhlenou)
    const maxPanelRight = Math.max(...layout.map((p) => p.x + p.width));
    const maxPanelBottom = Math.max(...layout.map((p) => p.y + p.height));

    const boundingWidth = maxPanelRight * scale;
    const boundingHeight = maxPanelBottom * scale;

    // 1. Zjistíme limity (odsazení od krajů v pixelech) podle hromosvodů
    let limitLeftPx = 0;
    let limitRightPx = 0;
    let limitTopPx = 0;
    let limitBottomPx = 0;

    obstacles.forEach((obs) => {
      if (obs.type === "lightning_rod") {
        const clearancePx = obs.clearanceZone * scale;
        if (obs.edge === "left" && clearancePx > limitLeftPx)
          limitLeftPx = clearancePx;
        if (obs.edge === "right" && clearancePx > limitRightPx)
          limitRightPx = clearancePx;
        if (obs.edge === "top" && clearancePx > limitTopPx)
          limitTopPx = clearancePx;
        if (obs.edge === "bottom" && clearancePx > limitBottomPx)
          limitBottomPx = clearancePx;
      }
    });

    // Tloušťka hrany střechy + 1 pixel jistoty, aby se čáry nepřekrývaly.
    // Můžeš to zvednout, pokud máš u střechy ještě silnější border.
    const ROOF_BORDER_WIDTH = 4;

    // 2. Vypočítáme maximální a minimální POVOLENÉ souřadnice
    const minAllowedX = limitLeftPx;
    const minAllowedY = limitTopPx;

    const maxAllowedX = Math.max(
      minAllowedX,
      roofWidthPx - boundingWidth - limitRightPx - ROOF_BORDER_WIDTH,
    );
    const maxAllowedY = Math.max(
      minAllowedY,
      roofHeightPx - boundingHeight - limitBottomPx - ROOF_BORDER_WIDTH,
    );

    const startX = initialPosition
      ? Math.max(minAllowedX, Math.min(initialPosition.x, maxAllowedX))
      : minAllowedX;
    const startY = initialPosition
      ? Math.max(minAllowedY, Math.min(initialPosition.y, maxAllowedY))
      : minAllowedY;

    const pan = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;
    const currentPos = useRef({ x: startX, y: startY });
    const [isDraggingLocal, setIsDraggingLocal] = useState(false);

    const [dragPulse, setDragPulse] = useState(0);

    const realBoundW = boundingWidth / scale;
    const realBoundH = boundingHeight / scale;

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

    const panResponder = useRef(
      PanResponder.create({
        // POKUD JE EDIT MODE, ZABLOKUJEME PAN RESPONDER
        onStartShouldSetPanResponder: () => !isEditMode,
        onMoveShouldSetPanResponder: () => !isEditMode,
        onPanResponderGrant: () => {
          setIsDraggingLocal(true);
          pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
          pan.setValue({ x: 0, y: 0 });
          callbacks.current.onDragStart();
        },
        onPanResponderMove: (e, gestureState) => {
          let rawX = currentPos.current.x + gestureState.dx;
          let rawY = currentPos.current.y + gestureState.dy;

          if (rawX < minAllowedX) rawX = minAllowedX;
          if (rawX > maxAllowedX) rawX = maxAllowedX;
          if (rawY < minAllowedY) rawY = minAllowedY;
          if (rawY > maxAllowedY) rawY = maxAllowedY;

          let rawCmX = rawX / scale;
          let rawCmY = rawY / scale;

          let snappedCmX = Math.round(rawCmX / 5) * 5;
          let snappedCmY = Math.round(rawCmY / 5) * 5;

          let finalX = snappedCmX * scale;
          let finalY = snappedCmY * scale;

          if (finalX < minAllowedX) finalX = minAllowedX;
          if (finalX > maxAllowedX) finalX = maxAllowedX;
          if (finalY < minAllowedY) finalY = minAllowedY;
          if (finalY > maxAllowedY) finalY = maxAllowedY;

          pan.setValue({
            x: finalX - currentPos.current.x,
            y: finalY - currentPos.current.y,
          });

          setDragPulse((prev) => prev + 1);
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

    useImperativeHandle(ref, () => ({
      center: () => {
        const leftLimitCm = limitLeftPx / scale;
        const rightLimitCm = limitRightPx / scale;
        const topLimitCm = limitTopPx / scale;
        const bottomLimitCm = limitBottomPx / scale;

        const freeWidthCm = realRoofWidth - leftLimitCm - rightLimitCm;
        const freeHeightCm = realRoofHeight - topLimitCm - bottomLimitCm;

        const leftoverWidthCm = Math.max(0, freeWidthCm - realBoundW);
        const leftoverHeightCm = Math.max(0, freeHeightCm - realBoundH);

        const centerCmX = leftLimitCm + leftoverWidthCm / 2;
        const centerCmY = topLimitCm + leftoverHeightCm / 2;

        let targetCmX = Math.round(centerCmX / 5) * 5;
        let targetCmY = Math.round(centerCmY / 5) * 5;

        let targetX = targetCmX * scale;
        let targetY = targetCmY * scale;

        if (targetX < minAllowedX) targetX = minAllowedX;
        if (targetX > maxAllowedX) targetX = maxAllowedX;
        if (targetY < minAllowedY) targetY = minAllowedY;
        if (targetY > maxAllowedY) targetY = maxAllowedY;

        setIsDraggingLocal(true);
        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: false,
          friction: 6,
        }).start(() => {
          currentPos.current = { x: targetX, y: targetY };
          setTimeout(() => setIsDraggingLocal(false), 600);
          callbacks.current.onPositionChange(targetX, targetY);
          setDragPulse((prev) => prev + 1);
        });
      },
    }));

    useEffect(() => {
      const listenerId = pan.addListener((value) => {
        let rawLeftCm = value.x / scale;
        let rawTopCm = value.y / scale;

        // Odečítáme hrubou tloušťku borderu, takže pokud jsme kousek od kraje "před tlustou čárou",
        // cm se vynulují.
        const borderFixCm = ROOF_BORDER_WIDTH / scale;

        let rawRightCm =
          (roofWidthPx - value.x - boundingWidth) / scale - borderFixCm;
        let rawBottomCm =
          (roofHeightPx - value.y - boundingHeight) / scale - borderFixCm;

        setDistances({
          left: Math.max(0, Math.round(rawLeftCm)),
          top: Math.max(0, Math.round(rawTopCm)),
          right: Math.max(0, rawRightCm < 1 ? 0 : Math.round(rawRightCm)),
          bottom: Math.max(0, rawBottomCm < 1 ? 0 : Math.round(rawBottomCm)),
        });
      });
      return () => pan.removeListener(listenerId);
    }, [pan, scale, roofWidthPx, roofHeightPx, boundingWidth, boundingHeight]);

    return (
      <Animated.View
        // Tady přidáme podmínku - pokud jsme v Edit Mode, PanHandlers se neaplikují
        {...(isEditMode ? {} : panResponder.panHandlers)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: boundingWidth,
          height: boundingHeight,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          // V Edit modu nedáváme mřížce to modré pozadí, ať to neruší
          backgroundColor: isEditMode
            ? "transparent"
            : "rgba(59, 130, 246, 0.15)",
        }}
      >
        {layout.map((panel, index) => {
          const currentGridX = pan.x as any;
          const currentGridY = pan.y as any;
          const actualX =
            (currentGridX._value !== undefined ? currentGridX._value : 0) +
            (currentGridX._offset || 0);
          const actualY =
            (currentGridY._value !== undefined ? currentGridY._value : 0) +
            (currentGridY._offset || 0);

          const panelAbsX = actualX + panel.x * scale;
          const panelAbsY = actualY + panel.y * scale;
          const panelAbsW = panel.width * scale;
          const panelAbsH = panel.height * scale;

          let isColliding = false;

          for (const obs of obstacles) {
            // KOLIZE PRO KOMÍN
            if (obs.type === "chimney") {
              const totalSizeCm = obs.size + obs.clearanceZone * 2;
              const sizePx = totalSizeCm * scale;

              let obsLeftPx = 0;
              if (obs.positionX.measuredFrom === "left") {
                obsLeftPx =
                  (obs.positionX.distance - obs.clearanceZone) * scale;
              } else {
                obsLeftPx =
                  realRoofWidth * scale -
                  (obs.positionX.distance + obs.size + obs.clearanceZone) *
                    scale;
              }

              let obsTopPx = 0;
              if (obs.positionY.measuredFrom === "top") {
                obsTopPx = (obs.positionY.distance - obs.clearanceZone) * scale;
              } else {
                obsTopPx =
                  realRoofHeight * scale -
                  (obs.positionY.distance + obs.size + obs.clearanceZone) *
                    scale;
              }

              if (
                panelAbsX < obsLeftPx + sizePx - 1 &&
                panelAbsX + panelAbsW > obsLeftPx + 1 &&
                panelAbsY < obsTopPx + sizePx - 1 &&
                panelAbsY + panelAbsH > obsTopPx + 1
              ) {
                isColliding = true;
                break;
              }
            }

            // KOLIZE PRO STŘEŠNÍ OKNO (SKYLIGHT)
            else if (obs.type === "roof_window") {
              const totalWidthCm = obs.width + obs.clearanceZone * 2;
              const totalHeightCm = obs.height + obs.clearanceZone * 2;
              const widthPx = totalWidthCm * scale;
              const heightPx = totalHeightCm * scale;

              let obsLeftPx = 0;
              if (obs.positionX.measuredFrom === "left") {
                obsLeftPx =
                  (obs.positionX.distance - obs.clearanceZone) * scale;
              } else {
                obsLeftPx =
                  realRoofWidth * scale -
                  (obs.positionX.distance + obs.width + obs.clearanceZone) *
                    scale;
              }

              let obsTopPx = 0;
              if (obs.positionY.measuredFrom === "top") {
                obsTopPx = (obs.positionY.distance - obs.clearanceZone) * scale;
              } else {
                obsTopPx =
                  realRoofHeight * scale -
                  (obs.positionY.distance + obs.height + obs.clearanceZone) *
                    scale;
              }

              if (
                panelAbsX < obsLeftPx + widthPx - 1 &&
                panelAbsX + panelAbsW > obsLeftPx + 1 &&
                panelAbsY < obsTopPx + heightPx - 1 &&
                panelAbsY + panelAbsH > obsTopPx + 1
              ) {
                isColliding = true;
                break;
              }
            }
          }

          if (isColliding) return null;

          // Kontrola, zda je panel aktivní (vykreslujeme jako plný) nebo ne (poloprůhledný)
          const isActive = panel.isActive !== false;

          return (
            <Pressable
              key={index}
              // Kliknutí funguje POUZE v Edit módu
              disabled={!isEditMode}
              onPress={() => {
                if (isEditMode && onTogglePanel) {
                  onTogglePanel(index);
                }
              }}
              style={{
                position: "absolute",
                left: panel.x * scale,
                top: panel.y * scale,
                width: panel.width * scale,
                height: panel.height * scale,
                // Když není aktivní, uděláme ho průhlednější a méně výrazný
                backgroundColor: isActive
                  ? "#1e3a8a"
                  : "rgba(30, 58, 138, 0.15)",
                borderWidth: 1,
                borderColor: isActive ? "#60a5fa" : "rgba(96, 165, 250, 0.3)",
                borderRadius: 2,
              }}
            >
              {/* Malý indikátor plus/mínus při edit módu pro lepší UX */}
              {isEditMode && (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? "#fff" : "#60a5fa",
                      fontSize: 16,
                      opacity: 0.5,
                    }}
                  >
                    {isActive ? "−" : "+"}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}

        {isDraggingLocal && !isEditMode && (
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
