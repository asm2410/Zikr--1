import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { TasbeehProps } from '../data/widgetTypes';

export function TasbeehWidget(props: TasbeehProps) {
  const countText = `${props.currentCount} / ${props.target}`;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: props.colors.bgColor,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
      }}
    >
      <TextWidget
        text={props.label}
        style={{
          fontSize: 12,
          color: props.colors.textLightColor,
          fontWeight: '500',
        }}
      />
      <TextWidget
        text={countText}
        style={{
          fontSize: 24,
          color: props.colors.textColor,
          fontWeight: '700',
          marginTop: 8,
        }}
      />
      {props.isComplete ? (
        <TextWidget
          text="✓"
          style={{
            fontSize: 36,
            color: props.colors.accentColor,
            fontWeight: '700',
            marginTop: 4,
          }}
        />
      ) : null}
    </FlexWidget>
  );
}
