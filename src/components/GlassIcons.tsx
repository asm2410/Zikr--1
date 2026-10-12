import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { GlassIconButton, GlassColorPreset } from './GlassIconButton';

export interface GlassIconsItem {
  id?: string | number;
  icon: ReactNode;
  label?: string;
  color?: GlassColorPreset | [string, string];
  onClick?: () => void;
  onPress?: () => void;
}

export interface GlassIconsProps {
  items: GlassIconsItem[];
  size?: number;
  gap?: number;
  plate?: 'tilt' | 'offset' | 'circle' | 'none';
  tilt?: number;
  isDark?: boolean;
  accentColor?: string;
  showLabels?: boolean;
  style?: ViewStyle;
}

export function GlassIcons({
  items = [],
  size = 72,
  gap = 16,
  plate = 'tilt',
  tilt = 18,
  isDark = true,
  accentColor,
  showLabels = true,
  style,
}: GlassIconsProps) {
  return (
    <View style={[styles.row, { gap }, style]}>
      {items.map((item, index) => {
        const itemTilt = index % 2 === 0 ? -Math.abs(tilt) : Math.abs(tilt);
        return (
          <GlassIconButton
            key={item.id ?? index}
            icon={item.icon}
            label={item.label}
            color={item.color || (index % 2 === 0 ? 'blue' : 'teal')}
            size={size}
            plate={plate}
            tilt={itemTilt}
            onPress={item.onPress || item.onClick}
            isDark={isDark}
            accentColor={accentColor}
            showLabel={showLabels}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
