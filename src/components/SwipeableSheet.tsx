import React, { useRef, useEffect, type ReactNode } from 'react';
import { View, TouchableOpacity, Animated, PanResponder, StyleSheet, Modal, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface SwipeableSheetProps {
  visible: boolean;
  onClose: () => void;
  colors: { background: string; card: string };
  children: ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;
const MIDDLE_OFFSET = SHEET_HEIGHT - SCREEN_HEIGHT * 0.5;
const HIDDEN_OFFSET = SHEET_HEIGHT + 50;

export function SwipeableSheet({ visible, onClose, colors, children }: SwipeableSheetProps) {
  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  const currentOffset = useRef(HIDDEN_OFFSET);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      currentOffset.current = MIDDLE_OFFSET;
      Animated.spring(translateY, {
        toValue: MIDDLE_OFFSET,
        friction: 9,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        const next = currentOffset.current + gesture.dy;
        translateY.setValue(Math.max(0, Math.min(HIDDEN_OFFSET, next)));
      },
      onPanResponderRelease: (_, gesture) => {
        const velocity = gesture.vy;
        const dy = gesture.dy;
        const isFull = currentOffset.current === 0;

        if (Math.abs(dy) < 10 && Math.abs(velocity) < 0.3) {
          Animated.timing(translateY, {
            toValue: HIDDEN_OFFSET,
            duration: 120,
            useNativeDriver: true,
          }).start(() => onCloseRef.current());
          return;
        }

        if (velocity > 0.5 || dy > 100) {
          Animated.timing(translateY, {
            toValue: HIDDEN_OFFSET,
            duration: 150,
            useNativeDriver: true,
          }).start(() => onCloseRef.current());
          return;
        }

        if (isFull && dy > 30) {
          currentOffset.current = MIDDLE_OFFSET;
          Animated.spring(translateY, {
            toValue: MIDDLE_OFFSET,
            friction: 9,
            tension: 80,
            useNativeDriver: true,
          }).start();
          return;
        }

        if (velocity < -0.5 || dy < -80) {
          currentOffset.current = 0;
          Animated.spring(translateY, {
            toValue: 0,
            friction: 9,
            tension: 80,
            useNativeDriver: true,
          }).start();
          return;
        }

        Animated.spring(translateY, {
          toValue: currentOffset.current,
          friction: 9,
          tension: 80,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.container}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, height: SHEET_HEIGHT, transform: [{ translateY }] },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={[styles.dragHandle, { backgroundColor: colors.background + '80' }]} />
          </View>
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  dragArea: { alignItems: 'center', paddingVertical: 10 },
  dragHandle: { width: 40, height: 4, borderRadius: 2 },
});
