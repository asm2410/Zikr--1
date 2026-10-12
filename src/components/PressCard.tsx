import React, { useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';

interface PressCardProps {
  onPress: () => void;
  style?: any;
  containerStyle?: any;
  children: React.ReactNode;
}

export const PressCard = React.memo(function PressCard({ onPress, style, containerStyle, children }: PressCardProps) {
  const s = useRef(new Animated.Value(0)).current;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      onPressIn={() => Animated.timing(s, { toValue: 1, duration: 80, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(s, { toValue: 0, duration: 120, useNativeDriver: true }).start()}
      style={containerStyle}
    >
      <Animated.View style={[style, { transform: [{ scale: s.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});
