import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { DailyDhikrProps } from '../data/widgetTypes';

function DailyDhikrWidget(props: DailyDhikrProps, env: WidgetEnvironment) {
  'widget';

  const isSmall = env.widgetFamily === 'systemSmall';

  return (
    <VStack>
      <Text
        modifiers={[
          font({ size: isSmall ? 14 : 18, weight: 'bold' }),
          foregroundStyle(props.colors.textColor),
        ]}
      >
        {props.arabic}
      </Text>
      {!isSmall && props.translation ? (
        <Text
          modifiers={[
            font({ size: 12 }),
            foregroundStyle(props.colors.textLightColor),
          ]}
        >
          {props.translation}
        </Text>
      ) : null}
      {!isSmall && props.sourceReference ? (
        <Text
          modifiers={[
            font({ size: 10 }),
            foregroundStyle(props.colors.accentColor),
          ]}
        >
          {props.sourceReference}
        </Text>
      ) : null}
    </VStack>
  );
}

export default createWidget('DailyDhikrWidget', DailyDhikrWidget);
