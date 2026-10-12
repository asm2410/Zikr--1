import DailyDhikrWidget from './ios/DailyDhikrWidget';
import TasbeehWidget from './ios/TasbeehWidget';
import ProgressWidget from './ios/ProgressWidget';
import type { WidgetSettings } from './data/widgetTypes';
import { buildDailyDhikrProps, buildProgressProps, buildTasbeehProps } from './data/widgetDataBridge';
import type { Zikr } from '../../core/types';

export async function updateWidgets(
  settings: WidgetSettings,
  allZikr: Zikr[],
  progress: Record<string, number>,
  morningAdhkar: Zikr[],
  eveningAdhkar: Zikr[],
  tasbeehCount: number,
  tasbeehTarget: number,
  appThemeMode: 'light' | 'dark',
  systemIsDark: boolean,
): Promise<void> {
  const dhikrProps = buildDailyDhikrProps(allZikr, settings.dhikr, appThemeMode, systemIsDark);
  if (dhikrProps.length > 0) {
    const timeline = dhikrProps.map((props, i) => ({
      date: new Date(Date.now() + i * 3600000),
      props,
    }));
    DailyDhikrWidget.updateTimeline(timeline);
  }

  const tProps = buildTasbeehProps(tasbeehCount, tasbeehTarget, 'التسبيح', settings.tasbeeh, appThemeMode, systemIsDark);
  TasbeehWidget.updateSnapshot(tProps);

  const morningProps = buildProgressProps(morningAdhkar, progress, settings.progress, appThemeMode, systemIsDark, 'أذكار الصباح');
  ProgressWidget.updateSnapshot(morningProps);
}
