import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { DailyDhikrWidget } from './DailyDhikrWidget';
import { TasbeehWidget } from './TasbeehWidget';
import { ProgressWidget } from './ProgressWidget';
import { WIDGET_DAILY_DHIKR_KEY, WIDGET_TASBEEH_KEY, WIDGET_PROGRESS_KEY } from '../data/widgetTypes';

const widgetMap: Record<string, { storageKey: string; Component: React.ComponentType<any> }> = {
  DailyDhikrWidget: { storageKey: WIDGET_DAILY_DHIKR_KEY, Component: DailyDhikrWidget },
  TasbeehWidget: { storageKey: WIDGET_TASBEEH_KEY, Component: TasbeehWidget },
  ProgressWidget: { storageKey: WIDGET_PROGRESS_KEY, Component: ProgressWidget },
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget } = props;
  const entry = widgetMap[widgetInfo.widgetName];
  if (!entry) return;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      try {
        const raw = await AsyncStorage.getItem(entry.storageKey);
        if (raw) {
          const data = JSON.parse(raw);
          renderWidget(<entry.Component {...data} />);
        }
      } catch {}
      break;
    }
    case 'WIDGET_DELETED':
    case 'WIDGET_CLICK':
      break;
  }
}
