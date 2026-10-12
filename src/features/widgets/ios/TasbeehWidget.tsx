import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import type { TasbeehProps } from '../data/widgetTypes';

function TasbeehWidget(props: TasbeehProps) {
  'widget';

  const countText = `${props.currentCount} / ${props.target}`;

  return (
    <VStack>
      <Text
        modifiers={[
          font({ size: 12, weight: 'medium' }),
          foregroundStyle(props.colors.textLightColor),
        ]}
      >
        {props.label}
      </Text>
      <Text
        modifiers={[
          font({ size: 24, weight: 'bold' }),
          foregroundStyle(props.colors.textColor),
        ]}
      >
        {countText}
      </Text>
      {props.isComplete ? (
        <Text
          modifiers={[
            font({ size: 32, weight: 'bold' }),
            foregroundStyle(props.colors.accentColor),
          ]}
        >
          ✓
        </Text>
      ) : null}
    </VStack>
  );
}

export default createWidget('TasbeehWidget', TasbeehWidget);
