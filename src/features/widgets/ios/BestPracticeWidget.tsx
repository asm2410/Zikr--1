import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import type { BestPracticeProps } from '../data/widgetTypes';

function BestPracticeWidget(props: BestPracticeProps) {
  'widget';

  return (
    <VStack>
      <Text
        modifiers={[
          font({ size: 18, weight: 'bold' }),
          foregroundStyle(props.colors.accentColor),
        ]}
      >
        {props.title}
      </Text>
      <Text
        modifiers={[
          font({ size: 12, weight: 'medium' }),
          foregroundStyle(props.colors.textColor),
        ]}
      >
        {props.hadith}
      </Text>
      <Text
        modifiers={[
          font({ size: 10, weight: 'regular' }),
          foregroundStyle(props.colors.textLightColor),
        ]}
      >
        {props.source}
      </Text>
    </VStack>
  );
}

export default createWidget('BestPracticeWidget', BestPracticeWidget);
