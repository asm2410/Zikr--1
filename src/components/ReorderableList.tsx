import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';

interface ReorderableListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, isActive: boolean) => React.ReactNode;
  onReorder: (newData: T[]) => void;
  itemHeight: number;
}

const ITEM_MARGIN = 8;
const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.8 };

export function ReorderableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  itemHeight,
}: ReorderableListProps<T>) {
  const [items, setItems] = useState(data);
  const [dragging, setDragging] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const draggingRef = useRef(false);
  const draggedKeyRef = useRef<string | null>(null);
  const itemsRef = useRef(data);
  const keyExtractorRef = useRef(keyExtractor);
  keyExtractorRef.current = keyExtractor;

  useEffect(() => {
    if (draggingRef.current) return;
    itemsRef.current = data;
    setItems(data);
  }, [data]);

  const activeIndex = useSharedValue(-1);
  const slotSize = itemHeight + ITEM_MARGIN;
  const containerHeight = items.length * slotSize;

  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const handleMoveTo = useCallback((to: number) => {
    const prev = itemsRef.current;
    const key = draggedKeyRef.current;
    if (!key) return;
    const from = prev.findIndex((item) => keyExtractorRef.current(item) === key);
    if (from === -1 || from === to || to < 0 || to >= prev.length) return;
    const next = [...prev];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    itemsRef.current = next;
    setItems(next);
  }, []);

  const beginDrag = useCallback((key: string) => {
    draggedKeyRef.current = key;
    draggingRef.current = true;
    setDraggedKey(key);
    setDragging(true);
  }, []);

  const endDrag = useCallback(() => {
    draggedKeyRef.current = null;
    draggingRef.current = false;
    setDraggedKey(null);
    setDragging(false);
    onReorderRef.current(itemsRef.current);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ height: containerHeight, paddingBottom: 24 }}
        scrollEnabled={!dragging}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item, index) => {
          const itemKey = keyExtractor(item);
          return (
            <ReorderableItem
              key={itemKey}
              item={item}
              itemKey={itemKey}
              index={index}
              totalItems={items.length}
              activeIndex={activeIndex}
              itemHeight={itemHeight}
              slotSize={slotSize}
              renderItem={renderItem}
              onMoveTo={handleMoveTo}
              onBeginDrag={beginDrag}
              onEndDrag={endDrag}
              isActive={draggedKey === itemKey}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

interface ReorderableItemProps<T> {
  item: T;
  itemKey: string;
  index: number;
  totalItems: number;
  activeIndex: ReturnType<typeof useSharedValue<number>>;
  itemHeight: number;
  slotSize: number;
  renderItem: (item: T, isActive: boolean) => React.ReactNode;
  onMoveTo: (to: number) => void;
  onBeginDrag: (key: string) => void;
  onEndDrag: () => void;
  isActive: boolean;
}

function ReorderableItem<T>({
  item,
  itemKey,
  index,
  totalItems,
  activeIndex,
  itemHeight,
  slotSize,
  renderItem,
  onMoveTo,
  onBeginDrag,
  onEndDrag,
  isActive,
}: ReorderableItemProps<T>) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const indexRef = useRef(index);
  const totalItemsRef = useRef(totalItems);
  const itemKeyRef = useRef(itemKey);
  indexRef.current = index;
  totalItemsRef.current = totalItems;
  itemKeyRef.current = itemKey;

  const startIndex = useSharedValue(index);
  const lastTarget = useSharedValue(index);
  const didStartRef = useRef(false);

  const markDragStart = useCallback((key: string) => {
    didStartRef.current = true;
    onBeginDrag(key);
  }, [onBeginDrag]);

  const markDragEnd = useCallback(() => {
    if (!didStartRef.current) return;
    didStartRef.current = false;
    onEndDrag();
  }, [onEndDrag]);

  const panGesture = useMemo(() =>
    Gesture.Pan()
      .activateAfterLongPress(200)
      .maxPointers(1)
      .shouldCancelWhenOutside(false)
      .onStart(() => {
        const idx = indexRef.current;
        activeIndex.value = idx;
        startIndex.value = idx;
        lastTarget.value = idx;
        scale.value = withSpring(1.05, SPRING_CONFIG);
        opacity.value = withTiming(0.9, { duration: 150 });
        runOnJS(markDragStart)(itemKeyRef.current);
      })
      .onUpdate((e) => {
        const start = startIndex.value;
        const currentTotal = totalItemsRef.current;
        const currentIdx = indexRef.current;
        const targetIndex = Math.max(0, Math.min(currentTotal - 1, start + Math.round(e.translationY / slotSize)));
        translateY.value = e.translationY - (currentIdx - start) * slotSize;

        if (targetIndex !== lastTarget.value) {
          lastTarget.value = targetIndex;
          runOnJS(onMoveTo)(targetIndex);
        }
      })
      .onFinalize(() => {
        translateY.value = withSpring(0, SPRING_CONFIG);
        scale.value = withSpring(1, SPRING_CONFIG);
        opacity.value = withTiming(1, { duration: 150 });
        activeIndex.value = -1;
        runOnJS(markDragEnd)();
      }),
    [activeIndex, translateY, scale, opacity, slotSize, onMoveTo, markDragStart, markDragEnd, startIndex, lastTarget],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: activeIndex.value === indexRef.current ? 100 : 0,
    elevation: activeIndex.value === indexRef.current ? 8 : 0,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            height: itemHeight,
            marginBottom: ITEM_MARGIN,
            position: 'absolute',
            top: index * slotSize,
            left: 0,
            right: 0,
          },
          animatedStyle,
        ]}
      >
        {renderItem(item, isActive)}
      </Animated.View>
    </GestureDetector>
  );
}
