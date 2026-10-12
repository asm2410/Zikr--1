import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export type GlassColorPreset =
  | 'blue'
  | 'purple'
  | 'red'
  | 'indigo'
  | 'orange'
  | 'green'
  | 'teal'
  | 'pink'
  | 'graphite'
  | 'silver'
  | 'gold'
  | 'emerald';

export interface GlassIconButtonProps {
  icon: ReactNode;
  label?: string;
  color?: GlassColorPreset | [string, string];
  size?: number;
  plate?: 'tilt' | 'offset' | 'circle' | 'none';
  tilt?: number;
  spread?: number;
  onPress?: () => void;
  isDark?: boolean;
  accentColor?: string;
  showLabel?: boolean;
}

const GRADIENTS: Record<GlassColorPreset, [string, string]> = {
  blue: ['#60A5FA', '#1D4ED8'],
  purple: ['#C084FC', '#6D28D9'],
  red: ['#F87171', '#BE123C'],
  indigo: ['#818CF8', '#4338CA'],
  orange: ['#FBBF24', '#EA580C'],
  green: ['#4ADE80', '#047857'],
  emerald: ['#34D399', '#059669'],
  teal: ['#2DD4BF', '#0F766E'],
  pink: ['#F472B6', '#BE185D'],
  graphite: ['#6B7280', '#1F2937'],
  silver: ['#E5E7EB', '#9CA3AF'],
  gold: ['#FDE047', '#B45309'],
};

export function GlassIconButton({
  icon,
  label,
  color = 'blue',
  size = 72,
  plate = 'tilt',
  tilt = 18,
  spread = 0.5,
  onPress,
  isDark = true,
  accentColor,
  showLabel = true,
}: GlassIconButtonProps) {
  const pressed = useSharedValue(0);

  const gradientColors: [string, string] = Array.isArray(color)
    ? color
    : accentColor
    ? [accentColor, accentColor]
    : GRADIENTS[color] || GRADIENTS.blue;

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 12, stiffness: 220 });
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 16, stiffness: 200 });
  };

  const glassAnimatedStyle = useAnimatedStyle(() => {
    const scale = 1 - pressed.value * 0.08;
    const translateY = pressed.value * 4;
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const plateAnimatedStyle = useAnimatedStyle(() => {
    const plateScale = 1 - pressed.value * 0.04;
    const plateRotate = tilt * (1 + pressed.value * 0.12);
    const plateShiftX = (tilt > 0 ? 1 : -1) * (1 - pressed.value * 0.25) * 2;
    return {
      transform: [
        { rotate: `${plateRotate}deg` },
        { scale: plateScale },
        { translateX: plateShiftX },
      ],
    };
  });

  const borderRadius = Math.round(size * 0.35);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.container}
      >
        <View style={[{ width: size, height: size }, styles.iconBox]}>
          {/* Back Plate / Card */}
          {plate !== 'none' && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: plate === 'circle' ? size / 2 : borderRadius },
                styles.plateContainer,
                plateAnimatedStyle,
              ]}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  StyleSheet.absoluteFill,
                  { borderRadius: plate === 'circle' ? size / 2 : borderRadius },
                ]}
              />
            </Animated.View>
          )}

          {/* Front Glass Cover */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius,
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(255, 255, 255, 0.65)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.35)'
                  : 'rgba(255, 255, 255, 0.85)',
              },
              styles.glassCover,
              glassAnimatedStyle,
            ]}
          >
            {/* Glass Reflection Highlight */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.55)',
                'rgba(255, 255, 255, 0.12)',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.9, y: 0.9 }}
              style={[
                StyleSheet.absoluteFill,
                { borderRadius },
              ]}
            />

            {/* Top Shine Arc Line */}
            <View style={styles.topShine} />

            {/* Icon Glyph Center */}
            <View style={styles.iconCenter}>
              {icon}
            </View>
          </Animated.View>
        </View>

        {/* Label */}
        {showLabel && label ? (
          <Text
            style={[
              styles.label,
              { color: isDark ? 'rgba(244, 244, 245, 0.88)' : 'rgba(24, 24, 27, 0.82)' },
            ]}
          >
            {label}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  glassCover: {
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 7,
  },
  topShine: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 1,
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Cairo_700Bold',
  },
});
