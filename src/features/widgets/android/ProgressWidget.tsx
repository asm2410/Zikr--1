import React from 'react';
import { FlexWidget, ListWidget, TextWidget } from 'react-native-android-widget';
import type { ProgressProps } from '../data/widgetTypes';

export function ProgressWidget(props: ProgressProps) {
  const completed = props.items.filter((i) => i.completed).length;
  const maxItems = 10;
  const items = props.items.slice(0, maxItems);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: props.colors.bgColor,
        padding: 12,
        flexDirection: 'column',
        borderRadius: 16,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text={props.title}
          style={{
            fontSize: 14,
            color: props.colors.textColor,
            fontWeight: '700',
          }}
        />
        <TextWidget
          text={`${completed} / ${items.length}`}
          style={{
            fontSize: 12,
            color: props.colors.accentColor,
            fontWeight: '600',
          }}
        />
      </FlexWidget>

      <ListWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
        }}
      >
        {items.map((item, index) => (
          <FlexWidget
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 2,
            }}
          >
            <TextWidget
              text={item.completed ? '✓' : '○'}
              style={{
                fontSize: 12,
                color: item.completed ? props.colors.accentColor : props.colors.textLightColor,
                marginRight: 6,
              }}
            />
            <TextWidget
              text={item.arabic.length > 30 ? item.arabic.slice(0, 30) + '…' : item.arabic}
              style={{
                fontSize: 11,
                color: item.completed ? props.colors.accentColor : props.colors.textLightColor,
              }}
            />
          </FlexWidget>
        ))}
      </ListWidget>
    </FlexWidget>
  );
}
