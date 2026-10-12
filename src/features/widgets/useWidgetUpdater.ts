import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { loadWidgetSettings } from './data/widgetSettings';
import type { WidgetSettings } from './data/widgetTypes';
import type { Zikr } from '../../core/types';

type UpdateWidgetsFn = (
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
) => Promise<void>;

let updateWidgetsImpl: UpdateWidgetsFn | null = null;

function getUpdateWidgets(): UpdateWidgetsFn {
  if (!updateWidgetsImpl) {
    if (Platform.OS === 'ios') {
      const ios = require('./platformUpdater.ios');
      updateWidgetsImpl = ios.updateWidgets;
    } else {
      const android = require('./platformUpdater.android');
      updateWidgetsImpl = android.updateWidgets;
    }
  }
  return updateWidgetsImpl!;
}

export function useWidgetUpdater() {
  const lastUpdateRef = useRef(0);

  const updateAllWidgets = useCallback(async (
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
  ) => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

    const now = Date.now();
    if (now - lastUpdateRef.current < 5000) return;
    lastUpdateRef.current = now;

    try {
      const settings = await loadWidgetSettings();
      await getUpdateWidgets()(
        settings, allZikr, progress, morningAdhkar, eveningAdhkar,
        tasbeehCount, tasbeehTarget, appThemeMode, systemIsDark,
        bestPracticeTitle, bestPracticeHadith, bestPracticeSource,
      );
    } catch {}
  }, []);

  return { updateAllWidgets };
}
