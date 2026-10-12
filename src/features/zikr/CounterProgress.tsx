import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import type { CounterProgressProps } from './types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CounterProgress({ count, target, accent, textLight, onPress }: CounterProgressProps) {
  const progress = target && target > 0 ? Math.min(count / target, 1) : 0;
  const hasTarget = target && target > 0;
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedOffset = useSharedValue(circumference);

  useEffect(() => {
    animatedOffset.value = withTiming(circumference * (1 - progress), { duration: 150 });
  }, [progress, circumference]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  const svgContent = (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={accent} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={accent} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={accent} />
          <Stop offset="100%" stopColor={textLight} />
        </LinearGradient>
      </Defs>
      {hasTarget && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={accent + '20'}
          strokeWidth={strokeWidth}
          fill="none"
        />
      )}
      {hasTarget && (
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
      )}
      <SvgText
        x={size / 2}
        y={size / 2 + 7}
        textAnchor="middle"
        fill="url(#textGrad)"
        fontSize={24}
        fontWeight="700"
      >
        {count}
      </SvgText>
    </Svg>
  );

  return (
    <View style={[styles.container, { shadowColor: accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchArea}>
        <View style={styles.circleRow}>
          {svgContent}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  touchArea: { padding: 6, alignItems: 'center', justifyContent: 'center' },
  circleRow: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
});
