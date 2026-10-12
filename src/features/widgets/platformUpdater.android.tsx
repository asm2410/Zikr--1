import { requestWidgetUpdate } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyDhikrWidget } from './android/DailyDhikrWidget';
import { TasbeehWidget } from './android/TasbeehWidget';
import { ProgressWidget } from './android/ProgressWidget';
import { BestPracticeWidget } from './android/BestPracticeWidget';
import type { WidgetSettings, DailyDhikrProps, TasbeehProps, ProgressProps, BestPracticeProps } from './data/widgetTypes';
import { WIDGET_DAILY_DHIKR_KEY, WIDGET_TASBEEH_KEY, WIDGET_PROGRESS_KEY, WIDGET_BEST_PRACTICE_KEY } from './data/widgetTypes';
import { buildDailyDhikrProps, buildProgressProps, buildTasbeehProps, buildBestPracticeProps } from './data/widgetDataBridge';
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
  bestPracticeTitle?: string,
  bestPracticeHadith?: string,
  bestPracticeSource?: string,
): Promise<void> {
  const dhikrProps = buildDailyDhikrProps(allZikr, settings.dhikr, appThemeMode, systemIsDark);
  if (dhikrProps.length > 0) {
    await AsyncStorage.setItem(WIDGET_DAILY_DHIKR_KEY, JSON.stringify(dhikrProps[0]));
    requestWidgetUpdate({
      widgetName: 'DailyDhikrWidget',
      renderWidget: () => <DailyDhikrWidget {...dhikrProps[0]} />,
    });
  }

  const tProps = buildTasbeehProps(tasbeehCount, tasbeehTarget, 'التسبيح', settings.tasbeeh, appThemeMode, systemIsDark);
  await AsyncStorage.setItem(WIDGET_TASBEEH_KEY, JSON.stringify(tProps));
  requestWidgetUpdate({
    widgetName: 'TasbeehWidget',
    renderWidget: () => <TasbeehWidget {...tProps} />,
  });

  const morningProps = buildProgressProps(morningAdhkar, progress, settings.progress, appThemeMode, systemIsDark, 'أذكار الصباح');
  await AsyncStorage.setItem(WIDGET_PROGRESS_KEY, JSON.stringify(morningProps));
  requestWidgetUpdate({
    widgetName: 'ProgressWidget',
    renderWidget: () => <ProgressWidget {...morningProps} />,
  });

  if (bestPracticeTitle && bestPracticeHadith) {
    const bpProps = buildBestPracticeProps(
      bestPracticeTitle, bestPracticeHadith, bestPracticeSource || '',
      settings.bestPractice, appThemeMode, systemIsDark,
    );
    await AsyncStorage.setItem(WIDGET_BEST_PRACTICE_KEY, JSON.stringify(bpProps));
    requestWidgetUpdate({
      widgetName: 'BestPracticeWidget',
      renderWidget: () => <BestPracticeWidget {...bpProps} />,
    });
  }
}
