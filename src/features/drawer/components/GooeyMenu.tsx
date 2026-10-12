import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Bookmark, Wand2, Settings, X, Menu, LayoutDashboard } from 'lucide-react-native';
import { GlassIconButton, type GlassColorPreset } from '../../../components/GlassIconButton';

const MENU_ITEMS = [
  { id: 'index', Icon: LayoutDashboard, label: 'Index', labelAr: 'الفهرس', color: 'blue' as GlassColorPreset },
  { id: 'saved', Icon: Bookmark, label: 'Saved', labelAr: 'المحفوظات', color: 'purple' as GlassColorPreset },
  { id: 'tasbeeh', Icon: Wand2, label: 'Tasbeeh', labelAr: 'مسبحة', color: 'emerald' as GlassColorPreset },
  { id: 'settings', Icon: Settings, label: 'Settings', labelAr: 'الإعدادات', color: 'gold' as GlassColorPreset },
] as const;

export type MenuActionId = (typeof MENU_ITEMS)[number]['id'];

const FAB_SIZE = 44;
const ITEM_AREA_H = 72;
const STAGGER_MS = 20;
const FAB_MARGIN = 10;
const ITEM_GAP = 2;

interface GooeyMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onAction: (action: MenuActionId) => void;
  colors: {
    accent: string;
    card: string;
    background: string;
    textLight: string;
  };
  language: 'ar' | 'en';
  topOffset: number;
  hapticEnabled?: boolean;
}

function MenuItem({
  item, isOpen, onPress,
  tx, index, total, itemW,
  fabLeft, fabTop,
  language,
}: {
  item: typeof MENU_ITEMS[number];
  isOpen: boolean;
  onPress: () => void;
  tx: number;
  index: number;
  total: number;
  itemW: number;
  fabLeft: number;
  fabTop: number;
  language: 'ar' | 'en';
}) {
  const anim = useSharedValue(0);

  useEffect(() => {
    const appear: Parameters<typeof withTiming>[1] = { duration: 220, easing: Easing.out(Easing.cubic) };
    const disappear: Parameters<typeof withTiming>[1] = { duration: 150, easing: Easing.in(Easing.cubic) };
    if (isOpen) {
      anim.value = withDelay(index * STAGGER_MS, withTiming(1, appear));
    } else {
      anim.value = withDelay((total - 1 - index) * STAGGER_MS, withTiming(0, disappear));
    }
  }, [isOpen, index, total]);

  const rStyle = useAnimatedStyle(() => {
    const p = anim.value;
    return {
      position: 'absolute',
      top: fabTop + FAB_SIZE / 2 - ITEM_AREA_H / 2 + 8,
      left: fabLeft + FAB_SIZE / 2 - itemW / 2,
      width: itemW,
      height: ITEM_AREA_H,
      alignItems: 'center',
      gap: 2,
      transform: [
        { translateX: interpolate(p, [0, 1], [0, tx], Extrapolation.CLAMP) },
        {
          scale: interpolate(p, [0, 1], [0.5, 1], Extrapolation.CLAMP),
        },
      ],
      opacity: interpolate(p, [0, 1], [0, 1], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={rStyle}>
      <GlassIconButton
        icon={<item.Icon size={20} stroke="#FFFFFF" />}
        color={item.color}
        plate="tilt"
        tilt={index % 2 === 0 ? -12 : 12}
        size={44}
        onPress={onPress}
        showLabel={false}
      />
      <Text
        style={styles.menuLabel}
        numberOfLines={1}
      >
        {language === 'ar' ? item.labelAr : item.label}
      </Text>
    </Animated.View>
  );
}

export function GooeyMenu({
  isOpen, onToggle, onAction,
  colors, language, topOffset, hapticEnabled = true,
}: GooeyMenuProps) {
  const backdropAnim = useSharedValue(0);

  useEffect(() => {
    backdropAnim.value = withTiming(isOpen ? 1 : 0, { duration: 200 });
    if (isOpen && Platform.OS !== 'web' && hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [isOpen]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(backdropAnim.value, [0, 1], [0, 0.6]),
  }));

  const fabLeft = FAB_MARGIN;
  const fabTop = topOffset;
  const total = MENU_ITEMS.length;

  const screenWidth = Dimensions.get('window').width;
  const leftBound = FAB_MARGIN + FAB_SIZE + FAB_MARGIN;
  const rightBound = screenWidth - FAB_MARGIN - FAB_SIZE - FAB_MARGIN;
  const availableWidth = Math.max(0, rightBound - leftBound);
  const itemW = Math.floor(Math.min((availableWidth - (total - 1) * ITEM_GAP) / total, 72));

  const fabCenterX = fabLeft + FAB_SIZE / 2;
  const startLeft = fabCenterX - itemW / 2;
  const totalItemsWidth = total * itemW + (total - 1) * ITEM_GAP;
  const firstTargetLeft = leftBound + (availableWidth - totalItemsWidth) / 2;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="box-none">
      {isOpen && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onToggle}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.backdrop,
              backdropStyle,
            ]}
          />
        </TouchableOpacity>
      )}

      {isOpen && MENU_ITEMS.map((item, i) => {
        const targetLeft = firstTargetLeft + i * (itemW + ITEM_GAP);
        const tx = targetLeft - startLeft;

        return (
          <MenuItem
            key={item.id}
            item={item}
            isOpen={isOpen}
            onPress={() => {
              if (Platform.OS !== 'web' && hapticEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              }
              onAction(item.id);
            }}
            tx={tx}
            index={i}
            total={total}
            itemW={itemW}
            fabLeft={fabLeft}
            fabTop={fabTop}
            language={language}
          />
        );
      })}

      <View style={{ position: 'absolute', top: fabTop, left: fabLeft }}>
        <GlassIconButton
          icon={isOpen ? <X size={20} stroke="#FFFFFF" /> : <Menu size={20} stroke="#FFFFFF" />}
          color={isOpen ? 'red' : 'blue'}
          plate="tilt"
          tilt={-15}
          size={44}
          onPress={onToggle}
          showLabel={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#000',
  },
  menuLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    color: '#FFFFFF',
    fontFamily: 'Cairo_700Bold',
  },
});
