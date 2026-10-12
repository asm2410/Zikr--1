import type { TimeOfDay, ZikrCounterPeriod } from '../types';
import { MORNING_CATEGORY_ID, EVENING_CATEGORY_ID, ABSOLUTE_CATEGORY_ID } from '../constants';
import { getCurrentPeriod, getPrayerTimes, getDuhaWindow, isDuhaTime, isQiyamTime, getQiyamWindow } from './prayerTimes';
export { getDuhaWindow, isDuhaTime, isQiyamTime, getQiyamWindow };

export function getCurrentTimeOfDay(date: Date = new Date()): TimeOfDay {
  const { timeOfDay } = getCurrentPeriod(date);
  return timeOfDay;
}

export function getZikrCounterPeriod(date: Date = new Date()): ZikrCounterPeriod {
  const { zikrPeriod } = getCurrentPeriod(date);
  return zikrPeriod;
}

export function getCategoryIdForTime(timeOfDay: TimeOfDay): number | null {
  if (timeOfDay === 'morning') return MORNING_CATEGORY_ID;
  if (timeOfDay === 'evening') return EVENING_CATEGORY_ID;
  return null;
}

export function getTimeBasedCategoryId(date?: Date): number {
  const timeOfDay = getCurrentTimeOfDay(date);
  const categoryId = getCategoryIdForTime(timeOfDay);
  return categoryId ?? ABSOLUTE_CATEGORY_ID;
}

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Day identity for daily azkar counters: a new day starts at Fajr. */
export function getZikrDayKey(date: Date = new Date()): string {
  const pt = getPrayerTimes(date);
  if (!pt) return localDateKey(date);
  if (date.getTime() < pt.fajr.getTime()) {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return localDateKey(yesterday);
  }
  return localDateKey(date);
}

export function getPreferredTimeFromCategoryId(categoryId: number): 'morning' | 'evening' | 'any' {
  if (categoryId === MORNING_CATEGORY_ID) return 'morning';
  if (categoryId === EVENING_CATEGORY_ID) return 'evening';
  return 'any';
}

export function getTodayPrayerTimes(): { fajr: Date; sunrise: Date; dhuhr: Date; asr: Date; maghrib: Date; isha: Date } | null {
  const pt = getPrayerTimes();
  if (!pt) return null;
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
}

export function isLastThirdOfNight(date: Date = new Date()): boolean {
  const pt = getPrayerTimes(date);
  if (!pt) return false;
  const now = date.getTime();
  const maghrib = pt.maghrib.getTime();
  const fajr = pt.fajr.getTime();

  if (now >= maghrib) {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const ptTomorrow = getPrayerTimes(tomorrow);
    if (!ptTomorrow) return false;
    const tomorrowFajr = ptTomorrow.fajr.getTime();
    const nightLength = tomorrowFajr - maghrib;
    if (nightLength <= 0) return false;
    const lastThirdStart = maghrib + (2 / 3) * nightLength;
    return now >= lastThirdStart && now < tomorrowFajr;
  }

  if (now < fajr) {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const ptYesterday = getPrayerTimes(yesterday);
    if (!ptYesterday) return false;
    const yesterdayMaghrib = ptYesterday.maghrib.getTime();
    const nightLength = fajr - yesterdayMaghrib;
    if (nightLength <= 0) return false;
    const lastThirdStart = yesterdayMaghrib + (2 / 3) * nightLength;
    return now >= lastThirdStart && now < fajr;
  }

  return false;
}

export function isFridayTime(date: Date = new Date()): boolean {
  const pt = getPrayerTimes(date);
  if (!pt) return false;
  const now = date.getTime();
  const maghrib = pt.maghrib.getTime();
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 5) {
    if (now < maghrib) return true;
    return false;
  }

  if (dayOfWeek === 4) {
    if (now >= maghrib) return true;
    return false;
  }

  return false;
}
