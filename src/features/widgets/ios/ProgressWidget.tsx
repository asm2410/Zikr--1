import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { ProgressProps } from '../data/widgetTypes';

function ProgressWidget(props: ProgressProps, env: WidgetEnvironment) {
  'widget';

  const isLarge = env.widgetFamily === 'systemLarge';
  const maxItems = isLarge ? 20 : 6;
  const items = props.items.slice(0, maxItems);
  const completed = items.filter((i) => i.completed).length;

  return (
    <VStack>
      <Text
        modifiers={[
          font({ size: 14, weight: 'bold' }),
          foregroundStyle(props.colors.textColor),
        ]}
      >
        {props.title}
      </Text>
      <Text
        modifiers={[
          font({ size: 12 }),
          foregroundStyle(props.colors.accentColor),
        ]}
      >
        {completed} / {items.length}
      </Text>
      {items.map((item, index) => (
        <Text
          key={index}
          modifiers={[
            font({ size: 11 }),
            foregroundStyle(item.completed ? props.colors.accentColor : props.colors.textLightColor),
          ]}
        >
          {item.completed ? '✓ ' : '○ '}
          {item.arabic.length > 30 ? item.arabic.slice(0, 30) + '…' : item.arabic}
        </Text>
      ))}
    </VStack>
  );
}

export default createWidget('ProgressWidget', ProgressWidget);
