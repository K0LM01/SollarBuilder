// components/canvas/DraggableObstacleWrapper.tsx
import React, { useRef } from "react";
import { Animated, PanResponder } from "react-native";

export const DraggableObstacleWrapper = ({
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
}: any) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
        onDragStart();
      },
      onPanResponderMove: (e, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        onDragMove(gestureState.moveX, gestureState.moveY);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        onDragEnd();
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        flex: 1,
        transform: [{ translateX: pan.x }, { translateY: pan.y }],
      }}
    >
      {children}
    </Animated.View>
  );
};
