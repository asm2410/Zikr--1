import AsyncStorage from '@react-native-async-storage/async-storage';
import { MORNING_CATEGORY_ID, EVENING_CATEGORY_ID, ABSOLUTE_CATEGORY_ID, PROGRESS_DAY_STORAGE_KEY } from '../constants';
import { getZikrDayKey } from './time';
import type { Zikr } from '../types';

const DAILY_CATEGORY_IDS = new Set([
  MORNING_CATEGORY_ID,
  EVENING_CATEGORY_ID,
  ABSOLUTE_CATEGORY_ID,
]);

export function stripDailyCategoryProgress(
  progress: Record<string, number>,
  allZikr: Zikr[],
): Record<string, number> {
  const dailyArabic = new Set(
    allZikr
      .filter((z) => DAILY_CATEGORY_IDS.has(Number(z.categoryId)))
      .map((z) => z.arabic),
  );
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(progress)) {
    if (!dailyArabic.has(key)) next[key] = value;
  }
  return next;
}

export async function resetDailyProgressIfNeeded(
  allZikr: Zikr[],
  progress: Record<string, number>,
): Promise<Record<string, number> | null> {
  if (allZikr.length === 0) return null;
  const dayKey = getZikrDayKey();
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(PROGRESS_DAY_STORAGE_KEY);
  } catch {
    stored = null;
  }
  if (stored === dayKey) return null;
  try {
    await AsyncStorage.setItem(PROGRESS_DAY_STORAGE_KEY, dayKey);
  } catch {}
  return stripDailyCategoryProgress(progress, allZikr);
}
