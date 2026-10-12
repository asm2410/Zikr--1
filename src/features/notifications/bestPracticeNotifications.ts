import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BEST_PRACTICE_NOTIFIED_KEY } from '../../core/constants';
import { getTodayPrayerTimes } from '../../core/utils/time';

let safeNotifications: any | null | undefined = undefined;

function isExpoGo(): boolean {
  if (Platform.OS === 'web') return true;
  try {
    const ConstantsModule = require('expo-constants');
    const Constants = ConstantsModule?.default ?? ConstantsModule;
    if (
      Constants?.appOwnership === 'expo' ||
      Constants?.executionEnvironment === 'storeClient' ||
      Constants?.expoConfig?.executionEnvironment === 'storeClient' ||
      Constants?.manifest?.executionEnvironment === 'storeClient'
    ) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

function getSafeNotifications() {
  if (safeNotifications !== undefined) return safeNotifications;
  if (isExpoGo()) {
    safeNotifications = null;
    return null;
  }
  try {
    const Notifications = require('expo-notifications');
    if (!Notifications?.scheduleNotificationAsync) {
      safeNotifications = null;
      return null;
    }
    safeNotifications = {
      scheduleNotificationAsync: (...args: any[]) => Notifications.scheduleNotificationAsync(...args).catch(() => {}),
      SchedulableTriggerInputTypes: Notifications.SchedulableTriggerInputTypes || {},
    };
  } catch {
    safeNotifications = null;
  }
  return safeNotifications;
}

function getHourMinute(date: Date): { hour: number; minute: number } {
  return { hour: date.getHours(), minute: date.getMinutes() };
}

export function getLastNotifiedBestPracticeIds(): Promise<string[]> {
  return AsyncStorage.getItem(BEST_PRACTICE_NOTIFIED_KEY).then((s) => (s ? JSON.parse(s) : [])).catch(() => []);
}

export function setLastNotifiedBestPracticeIds(ids: string[]): Promise<void> {
  return AsyncStorage.setItem(BEST_PRACTICE_NOTIFIED_KEY, JSON.stringify(ids)).catch(() => {});
}

export function sendBestPracticeNotification(
  sn: any,
  deed: { id: string; title: string; subtext: string; conciseVirtue: string },
) {
  try {
    sn.scheduleNotificationAsync({
      content: {
        title: deed.title,
        body: deed.subtext,
        data: { type: 'bestPractice', deedId: deed.id },
        sound: true,
      },
      trigger: null,
    }).catch(() => {});
  } catch {}
}

export async function checkAndNotifyBestPractice(
  activeDeeds: { id: string; title: string; titleEn: string; subtext: string; subtextEn: string; conciseVirtue: string; conciseVirtueEn: string }[],
  language: 'ar' | 'en',
) {
  try {
    const sn = getSafeNotifications();
    if (!sn || activeDeeds.length === 0) return;

    const lastNotifiedIds = await getLastNotifiedBestPracticeIds();
    const currentIds = activeDeeds.map((d) => d.id);
    const hasNew = currentIds.some((id) => !lastNotifiedIds.includes(id));

    if (!hasNew) return;

    const deed = activeDeeds[0];
    sendBestPracticeNotification(sn, {
      id: deed.id,
      title: language === 'ar' ? deed.title : deed.titleEn,
      subtext: language === 'ar' ? deed.subtext : deed.subtextEn,
      conciseVirtue: language === 'ar' ? deed.conciseVirtue : deed.conciseVirtueEn,
    });

    await setLastNotifiedBestPracticeIds(currentIds);
  } catch {}
}

export function getBestPracticeNotificationTimes() {
  const pt = getTodayPrayerTimes();
  if (!pt) {
    return {
      duha: { hour: 8, minute: 0 },
      qiyam: { hour: 21, minute: 0 },
      maghrib: { hour: 18, minute: 0 },
    };
  }
  const sunrise = new Date(pt.sunrise.getTime());
  sunrise.setHours(sunrise.getHours() + 1);
  const duhaTime = getHourMinute(sunrise);
  const qiyamTime = getHourMinute(pt.isha);
  const maghribTime = getHourMinute(pt.maghrib);
  return { duha: duhaTime, qiyam: qiyamTime, maghrib: maghribTime };
}

export function scheduleBestPracticeNotifications(sn: any, language: 'ar' | 'en') {
  try {
    if (!sn?.SchedulableTriggerInputTypes) return;

    const times = getBestPracticeNotificationTimes();
    const dailyType = sn.SchedulableTriggerInputTypes?.DAILY ?? sn.SchedulableTriggerInputTypes?.Daily ?? 'daily';
    const weeklyType = sn.SchedulableTriggerInputTypes?.WEEKLY ?? sn.SchedulableTriggerInputTypes?.Weekly ?? 'weekly';

    sn.scheduleNotificationAsync({
      content: {
        title: language === 'ar' ? 'أفضل عمل: صلاة الضحى' : 'Best Practice: Duha Prayer',
        body: language === 'ar' ? 'حان وقت صلاة الضحى — سنة مؤكدة' : 'Time for Duha prayer — a confirmed sunnah',
        data: { type: 'bestPractice', deedId: 'duha' },
        sound: true,
      },
      trigger: {
        type: dailyType,
        hour: times.duha.hour,
        minute: times.duha.minute,
      },
    }).catch(() => {});

    sn.scheduleNotificationAsync({
      content: {
        title: language === 'ar' ? 'أفضل عمل: قيام الليل' : 'Best Practice: Night Prayer',
        body: language === 'ar' ? 'لا تنس قيام الليل — أفضل الصلاة بعد الفريضة' : "Don't forget night prayer — the best prayer after obligatory ones",
        data: { type: 'bestPractice', deedId: 'qiyam' },
        sound: true,
      },
      trigger: {
        type: dailyType,
        hour: times.qiyam.hour,
        minute: times.qiyam.minute,
      },
    }).catch(() => {});

    sn.scheduleNotificationAsync({
      content: {
        title: language === 'ar' ? 'أفضل عمل: الجمعة' : 'Best Practice: Friday',
        body: language === 'ar' ? 'غداً الجمعة — لا تنس قراءة سورة الكهف والإكثار من الصلاة على النبي ﷺ' : "Tomorrow is Friday — don't forget to read Surat Al-Kahf and send blessings upon the Prophet ﷺ",
        data: { type: 'bestPractice', deedId: 'friday' },
        sound: true,
      },
      trigger: {
        type: weeklyType,
        weekday: 5,
        hour: times.maghrib.hour,
        minute: times.maghrib.minute,
      },
    }).catch(() => {});
  } catch {}
}
