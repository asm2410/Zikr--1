import React, { useRef } from 'react';
import { TouchableOpacity, View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Check } from 'lucide-react-native';

interface CompletionCheckboxProps {
  checked: boolean;
  accent: string;
  textLight: string;
  onPress?: () => void;
}

const SIZE = 96;
const STROKE_WIDTH = 6;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;

export function CompletionCheckbox({ checked, accent, textLight, onPress }: CompletionCheckboxProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
        {checked ? (
          <LinearGradient
            colors={[accent, textLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.circle, styles.circleChecked]}
          >
            <Check size={40} stroke="#FFFFFF" strokeWidth={3.5} />
          </LinearGradient>
        ) : (
          <View style={styles.circle}>
            <Svg width={SIZE} height={SIZE}>
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={accent + '20'}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  circleChecked: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
