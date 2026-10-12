import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';
import type { TimeOfDay, ZikrCounterPeriod } from '../types';

const DEFAULT_LATITUDE = 30.0444;
const DEFAULT_LONGITUDE = 31.2357;

let currentLatitude = DEFAULT_LATITUDE;
let currentLongitude = DEFAULT_LONGITUDE;
let cachedDate: string | null = null;
let cachedPrayerTimes: AdhanPrayerTimes | null = null;

export function setCoordinates(latitude: number, longitude: number): void {
  currentLatitude = latitude;
  currentLongitude = longitude;
  cachedDate = null;
}

export function getPrayerTimes(date: Date = new Date()): AdhanPrayerTimes | null {
  try {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (cachedDate === dateKey && cachedPrayerTimes) return cachedPrayerTimes;

    const coords = new Coordinates(currentLatitude, currentLongitude);
    const params = CalculationMethod.Egyptian();
    const times = new AdhanPrayerTimes(coords, date, params);

    cachedDate = dateKey;
    cachedPrayerTimes = times;
    return times;
  } catch {
    return null;
  }
}

export function getCurrentPeriod(date: Date = new Date()): { timeOfDay: TimeOfDay; zikrPeriod: ZikrCounterPeriod } {
  const pt = getPrayerTimes(date);
  if (!pt) return { timeOfDay: 'morning', zikrPeriod: 'morning' };

  const now = date.getTime();

  const fajr = pt.fajr.getTime();
  const sunrise = pt.sunrise.getTime();
  const dhuhr = pt.dhuhr.getTime();
  const asr = pt.asr.getTime();
  const maghrib = pt.maghrib.getTime();
  const isha = pt.isha.getTime();

  let timeOfDay: TimeOfDay;
  if (now >= fajr && now < sunrise) {
    timeOfDay = 'morning';
  } else if (now >= sunrise && now < asr) {
    timeOfDay = 'afternoon';
  } else if (now >= asr && now < maghrib) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }

  let zikrPeriod: ZikrCounterPeriod;
  if (now >= fajr && now < asr) {
    zikrPeriod = 'morning';
  } else {
    zikrPeriod = 'evening';
  }

  return { timeOfDay, zikrPeriod };
}

export function getCategoryIdForPeriod(period: ZikrCounterPeriod): number | null {
  const { MORNING_CATEGORY_ID } = require('../constants');
  const { EVENING_CATEGORY_ID } = require('../constants');
  if (period === 'morning') return MORNING_CATEGORY_ID;
  if (period === 'evening') return EVENING_CATEGORY_ID;
  return null;
}

export function getDuhaWindow(date: Date = new Date()): { start: Date; end: Date } | null {
  const pt = getPrayerTimes(date);
  if (!pt) return null;
  const start = new Date(pt.sunrise.getTime() + 15 * 60 * 1000);
  const end = new Date(pt.dhuhr.getTime() - 15 * 60 * 1000);
  return { start, end };
}

export function isDuhaTime(date: Date = new Date()): boolean {
  const window = getDuhaWindow(date);
  if (!window) return false;
  const now = date.getTime();
  return now >= window.start.getTime() && now < window.end.getTime();
}

export function isQiyamTime(date: Date = new Date()): boolean {
  const pt = getPrayerTimes(date);
  if (!pt) return false;
  const now = date.getTime();
  const isha = pt.isha.getTime();
  const fajr = pt.fajr.getTime() - 15 * 60 * 1000;
  if (isha <= fajr) {
    return now >= isha && now < fajr;
  }
  return now >= isha || now < fajr;
}

export function getQiyamWindow(date: Date = new Date()): { start: Date; end: Date } | null {
  const pt = getPrayerTimes(date);
  if (!pt) return null;
  const isha = pt.isha;
  const end = new Date(pt.fajr.getTime() - 15 * 60 * 1000);
  return { start: isha, end };
}
