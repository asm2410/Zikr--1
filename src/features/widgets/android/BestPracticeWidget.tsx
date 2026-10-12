import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { BestPracticeProps } from '../data/widgetTypes';

export function BestPracticeWidget(props: BestPracticeProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: props.colors.bgColor,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
      }}
    >
      <TextWidget
        text={props.title}
        style={{
          fontSize: 18,
          color: props.colors.accentColor,
          fontWeight: '700',
          textAlign: 'center',
        }}
      />
      <TextWidget
        text={props.hadith}
        style={{
          fontSize: 12,
          color: props.colors.textColor,
          fontWeight: '500',
          textAlign: 'center',
          marginTop: 8,
        }}
      />
      <TextWidget
        text={props.source}
        style={{
          fontSize: 10,
          color: props.colors.textLightColor,
          fontWeight: '400',
          textAlign: 'center',
          marginTop: 6,
        }}
      />
    </FlexWidget>
  );
}
