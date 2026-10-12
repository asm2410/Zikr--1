import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { DailyDhikrProps } from '../data/widgetTypes';

export function DailyDhikrWidget(props: DailyDhikrProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: props.colors.bgColor,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: 16,
      }}
    >
      <TextWidget
        text={props.arabic}
        style={{
          fontSize: 18,
          color: props.colors.textColor,
          fontWeight: '700',
        }}
      />
      <TextWidget
        text={props.translation}
        style={{
          fontSize: 12,
          color: props.colors.textLightColor,
          marginTop: 8,
        }}
      />
    </FlexWidget>
  );
}
