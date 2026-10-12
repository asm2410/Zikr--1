import { useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { NOTIFICATIONS_SCHEDULED_KEY } from '../../core/constants';
import { getTodayPrayerTimes } from '../../core/utils/time';
import { scheduleBestPracticeNotifications } from './bestPracticeNotifications';

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
      getPermissionsAsync: () => Notifications.getPermissionsAsync().catch(() => ({ status: 'denied' })),
      requestPermissionsAsync: () => Notifications.requestPermissionsAsync().catch(() => ({ status: 'denied' })),
      setNotificationChannelAsync: (...args: any[]) => Notifications.setNotificationChannelAsync(...args).catch(() => {}),
      cancelAllScheduledNotificationsAsync: () => Notifications.cancelAllScheduledNotificationsAsync().catch(() => {}),
      scheduleNotificationAsync: (...args: any[]) => Notifications.scheduleNotificationAsync(...args).catch(() => {}),
      AndroidImportance: Notifications.AndroidImportance || {},
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

function getNotificationTimes() {
  const pt = getTodayPrayerTimes();
  if (!pt) {
    return {
      morning: { hour: 5, minute: 0 },
      evening: { hour: 15, minute: 0 },
      sleep: { hour: 21, minute: 0 },
      maghrib: { hour: 18, minute: 0 },
    };
  }
  return {
    morning: getHourMinute(pt.fajr),
    evening: getHourMinute(pt.asr),
    sleep: getHourMinute(pt.isha),
    maghrib: getHourMinute(pt.maghrib),
  };
}

export function useNotifications(enabled: boolean, language?: 'ar' | 'en') {
  const requestPermissions = useCallback(async () => {
    try {
      const sn = getSafeNotifications();
      if (!sn) return false;
      const { status: existingStatus } = await sn.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await sn.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return false;
      if (Platform.OS === 'android') {
        const importance = sn.AndroidImportance?.HIGH ?? sn.AndroidImportance?.MAX ?? 4;
        await sn.setNotificationChannelAsync('zikr', {
          name: 'أذكار',
          importance,
          vibrationPattern: [0, 100, 100, 100],
        });
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const scheduleNotifications = useCallback(async () => {
    try {
      const sn = getSafeNotifications();
      if (!sn) return;
      await sn.cancelAllScheduledNotificationsAsync();

      const times = getNotificationTimes();
      const dailyType = sn.SchedulableTriggerInputTypes?.DAILY ?? sn.SchedulableTriggerInputTypes?.Daily ?? 'daily';
      const weeklyType = sn.SchedulableTriggerInputTypes?.WEEKLY ?? sn.SchedulableTriggerInputTypes?.Weekly ?? 'weekly';

      await sn.scheduleNotificationAsync({
        content: { title: 'أذكار الصباح', body: 'حان وقت أذكار الصباح', sound: true },
        trigger: { type: dailyType, hour: times.morning.hour, minute: times.morning.minute },
      }).catch(() => {});

      await sn.scheduleNotificationAsync({
        content: { title: 'أذكار المساء', body: 'حان وقت أذكار المساء', sound: true },
        trigger: { type: dailyType, hour: times.evening.hour, minute: times.evening.minute },
      }).catch(() => {});

      await sn.scheduleNotificationAsync({
        content: { title: 'أذكار النوم', body: 'لا تنس أذكار النوم', sound: true },
        trigger: { type: dailyType, hour: times.sleep.hour, minute: times.sleep.minute },
      }).catch(() => {});

      await sn.scheduleNotificationAsync({
        content: { title: 'تذكير بصيام الغد', body: 'غداً الاثنين - صيام سنة', data: { type: 'bestPractice' }, sound: true },
        trigger: { type: weeklyType, weekday: 1, hour: times.maghrib.hour, minute: times.maghrib.minute },
      }).catch(() => {});

      await sn.scheduleNotificationAsync({
        content: { title: 'تذكير بصيام الغد', body: 'غداً الخميس - صيام سنة', data: { type: 'bestPractice' }, sound: true },
        trigger: { type: weeklyType, weekday: 4, hour: times.maghrib.hour, minute: times.maghrib.minute },
      }).catch(() => {});

      scheduleBestPracticeNotifications(sn, language || 'ar');

      await AsyncStorage.setItem(NOTIFICATIONS_SCHEDULED_KEY, 'true').catch(() => {});
    } catch {}
  }, [language]);

  const cancelNotifications = useCallback(async () => {
    try {
      const sn = getSafeNotifications();
      if (!sn) return;
      await sn.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(NOTIFICATIONS_SCHEDULED_KEY, 'false').catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (enabled) {
      requestPermissions().then((granted) => {
        if (granted) scheduleNotifications();
      }).catch(() => {});
    } else {
      cancelNotifications().catch(() => {});
    }
  }, [enabled, scheduleNotifications]);
}
