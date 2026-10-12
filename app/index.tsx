import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, AppState, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated as RNAnimated } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Search as SearchIcon, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/providers/ThemeProvider';
import { useLanguage } from '../src/providers/LanguageProvider';
import { useFontSize } from '../src/providers/FontSizeProvider';
import { useZikrCounter, useZikrState, useCustomOrder, useZikrHydrated } from '../src/providers/ZikrProvider';
import { useHaptic } from '../src/providers/HapticProvider';
import { useSound } from '../src/core/utils/sound';
import { ZikrCard } from '../src/features/zikr/ZikrCard';
import { FadlModal } from '../src/features/zikr/FadlModal';
import { DrawerLayout } from '../src/features/drawer/DrawerLayout';
import { captureAndShareRef, saveZikrToGallery, captureZikrCard } from '../src/features/export/useExport';
import { ZikrShareView } from '../src/features/export/ZikrShareView';
import { ShareSheet } from '../src/features/export/ShareSheet';
import { logger } from '../src/core/utils/logger';
import { useNotifications } from '../src/features/notifications/useNotifications';
import { checkAndNotifyBestPractice } from '../src/features/notifications/bestPracticeNotifications';
import { getHijriDate, getDayName, getGregorianDate } from '../src/core/utils/hijri';
import { getCurrentTimeOfDay, getCategoryIdForTime, getTimeBasedCategoryId, getZikrCounterPeriod, getTodayPrayerTimes, isLastThirdOfNight, isFridayTime, isDuhaTime, getDuhaWindow, isQiyamTime, getQiyamWindow } from '../src/core/utils/time';
import { resetDailyProgressIfNeeded, stripDailyCategoryProgress } from '../src/core/utils/progressReset';
import { getOrderedCategoryItems } from '../src/core/utils/ordering';
import { initLocation, detectTimezoneChange, getTravelerMode, updateLocationFromGPS, updateLocationFromIP } from '../src/core/utils/location';
import { getAllCategories, getAllZikr } from '../src/database/database';
import { MORNING_CATEGORY_ID, EVENING_CATEGORY_ID, ABSOLUTE_CATEGORY_ID, FONT_SIZE_STORAGE_KEY, XP_STORAGE_KEY, STREAK_STORAGE_KEY, NOTIFICATIONS_ENABLED_KEY } from '../src/core/constants';
import { GooeyMenu } from '../src/features/drawer/components/GooeyMenu';
import { useWidgetUpdater } from '../src/features/widgets/useWidgetUpdater';
import { StatusCard } from '../src/features/home/StatusCard';
import { BestPracticeModal } from '../src/features/home/BestPracticeModal';
import { PeriodModal } from '../src/features/home/PeriodModal';
import { GlassIconButton } from '../src/components/GlassIconButton';

import type { MenuActionId } from '../src/features/drawer/components/GooeyMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Zikr, ZikrCategory, DrawerFilter, ZikrCounterPeriod } from '../src/core/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

/** Subscribes to counter context (progress) and updates a shared ref so MainScreen doesn't need to */
const _progressRef: Record<string, number> = {};

function ProgressSyncer() {
  const { progress } = useZikrCounter();
  Object.assign(_progressRef, progress);
  return null;
}

export default function MainScreen() {
  const insets = useSafeAreaInsets();
  const { theme, themeMode, setThemeMode, platform } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { state, dispatch } = useZikrState();
  const zikrHydrated = useZikrHydrated();
  const { customOrder, dispatch: orderDispatch } = useCustomOrder();
  const params = useLocalSearchParams<{ saved?: string; openBestPractice?: string }>();
  const shareRef = useRef<View>(null);

  const [categories, setCategories] = useState<ZikrCategory[]>([]);
  const [allZikr, setAllZikr] = useState<Zikr[]>([]);
  const { fontSize } = useFontSize();
  const [drawerOpen, setDrawerOpen] = useState(params.saved === 'true');
  const [gooeyOpen, setGooeyOpen] = useState(false);
  const [drawerFilter, setDrawerFilter] = useState<DrawerFilter>(params.saved === 'true' ? 'saved' : 'index');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showFadl, setShowFadl] = useState(false);
  const [showBestPracticeFadl, setShowBestPracticeFadl] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const fadlOpenedAt = useRef(0);
  const [frozenBestPracticeContent, setFrozenBestPracticeContent] = useState<{ title: string; conciseVirtue: string; fullVirtue: string; source: string } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const hijriInfo = useMemo(() => {
    const hijri = getHijriDate(language);
    const dayName = getDayName(language);
    return {
      full: `${dayName} ${hijri.fullDate}`,
      day: String(hijri.day),
      month: hijri.month,
      year: language === 'en' ? `AH ${hijri.year}` : `${hijri.year} هـ`,
    };
  }, [language]);
  const gregorian = useMemo(() => getGregorianDate(language), [language]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakLoaded, setStreakLoaded] = useState(false);
  const { hapticEnabled, soundEnabled } = useHaptic();
  const { playTap, playComplete, playMenu, playSave } = useSound();
  const [needsLocationUpdate, setNeedsLocationUpdate] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | undefined>(undefined);
  const [period, setPeriod] = useState<ZikrCounterPeriod>('morning');

  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [timeBannerMessage, setTimeBannerMessage] = useState<string | null>(null);

  const activeDeeds = getActiveDeeds();
  const [currentDeedIdx, setCurrentDeedIdx] = useState(0);

  useEffect(() => {
    if (activeDeeds.length <= 1) return;
    const id = setInterval(() => setCurrentDeedIdx((i) => (i + 1) % activeDeeds.length), 30000);
    return () => clearInterval(id);
  }, [activeDeeds.length]);

  const currentDeed = activeDeeds.length > 0
    ? activeDeeds[Math.min(currentDeedIdx, activeDeeds.length - 1)]
    : null;

  const bestPracticeModalContent = currentDeed
    ? {
        title: language === 'ar' ? currentDeed.title : currentDeed.titleEn,
        conciseVirtue: language === 'ar' ? currentDeed.conciseVirtue : currentDeed.conciseVirtueEn,
        fullVirtue: language === 'ar' ? currentDeed.fullVirtue : currentDeed.fullVirtueEn,
        source: language === 'ar' ? currentDeed.source : currentDeed.sourceEn,
      }
    : null;

  const bestPracticeModalContentRef = useRef(bestPracticeModalContent);
  bestPracticeModalContentRef.current = bestPracticeModalContent;

  const { updateAllWidgets } = useWidgetUpdater();
  const allZikrRef = useRef<Zikr[]>([]);
  allZikrRef.current = allZikr;
  const savedZikrRef = useRef(state.savedZikr);
  savedZikrRef.current = state.savedZikr;
  const savedCategoryIdsRef = useRef(state.savedCategoryIds);
  savedCategoryIdsRef.current = state.savedCategoryIds;
  const timeBasedCategoryRef = useRef<number | null>(null);
  const currentZikrRef = useRef<Zikr | null>(null);

  const level = useMemo(() => Math.floor(xp / 100) + 1, [xp]);
  const xpProgress = xp % 100;

  useNotifications(notificationsEnabled, language);

  const drawerAnim = useRef(new RNAnimated.Value(0)).current;

  const heartbeatHaptic = useCallback(async () => {
    const pattern = [
      { s: Haptics.ImpactFeedbackStyle.Medium, d: 0 },
      { s: Haptics.ImpactFeedbackStyle.Light, d: 100 },
      { s: Haptics.ImpactFeedbackStyle.Medium, d: 150 },
      { s: Haptics.ImpactFeedbackStyle.Light, d: 100 },
    ];
    for (const p of pattern) {
      await new Promise((r) => setTimeout(r, p.d));
      Haptics.impactAsync(p.s).catch(() => {});
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(XP_STORAGE_KEY);
        if (v) setXp(parseInt(v));
      } catch {}
      try {
        const v = await AsyncStorage.getItem(STREAK_STORAGE_KEY);
        if (v) setStreak(parseInt(v));
      } catch {}
      try {
        const v = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        if (v === 'true') setNotificationsEnabled(true);
      } catch {}
      setStreakLoaded(true);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const v = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
          setNotificationsEnabled(v === 'true');
        } catch {}
      })();
    }, [])
  );

  useEffect(() => {
    if (!streakLoaded) return;
    AsyncStorage.setItem(STREAK_STORAGE_KEY, String(streak)).catch(() => {});
  }, [streak, streakLoaded]);

  useEffect(() => {
    (async () => {
      await initLocation();
      const { changed } = await detectTimezoneChange();
      if (changed) {
        const traveler = await getTravelerMode();
        if (traveler) {
          const ok = await updateLocationFromGPS();
          if (ok) {
            await updateLocationFromIP();
          }
        } else {
          setNeedsLocationUpdate(true);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (params.openBestPractice === 'true') {
      setFrozenBestPracticeContent(bestPracticeModalContentRef.current);
      setShowBestPracticeFadl(true);
    }
  }, [params.openBestPractice]);

  useEffect(() => {
    if (params.saved === 'true') {
      setDrawerFilter('saved');
      setDrawerOpen(true);
      router.setParams({ saved: undefined });
    }
  }, [params.saved]);

  useFocusEffect(
    useCallback(() => {
      setGooeyOpen(false);
      if (params.saved !== 'true') {
        setDrawerOpen(false);
      }
    }, [params.saved]),
  );

  useEffect(() => {
    (async () => {
      try {
        const [cats, adhkar] = await Promise.all([getAllCategories(), getAllZikr()]);
        setCategories(cats);
        setAllZikr(adhkar);

        const timeOfDay = getCurrentTimeOfDay();
        setPeriod(getZikrCounterPeriod());
        let categoryId = getCategoryIdForTime(timeOfDay);
        if (!categoryId) categoryId = ABSOLUTE_CATEGORY_ID;
        if (categoryId && adhkar.length > 0 && !state.currentZikr) {
          let firstItems = getOrderedCategoryItems(adhkar, categoryId, customOrder);

          if (categoryId === ABSOLUTE_CATEGORY_ID) {
            if (isLastThirdOfNight()) {
              const istighfarIdx = firstItems.findIndex((a) => a.id === 295);
              if (istighfarIdx > 0) {
                const item = firstItems.splice(istighfarIdx, 1)[0];
                firstItems.unshift(item);
              }
            }
            if (isFridayTime()) {
              const fridayIdx = firstItems.findIndex((a) => a.id === 299);
              if (fridayIdx > 0) {
                const item = firstItems.splice(fridayIdx, 1)[0];
                firstItems.unshift(item);
              }
            }
          }

          const first = firstItems[0];
          if (first) dispatch({ type: 'SET_CURRENT_ZIKR', zikr: first });
        }

        const morningZikr = getOrderedCategoryItems(adhkar, MORNING_CATEGORY_ID, customOrder);
        const eveningZikr = getOrderedCategoryItems(adhkar, EVENING_CATEGORY_ID, customOrder);
        const bpDeed = activeDeeds[0];
        const bpHadith = bpDeed ? (language === 'ar' ? bpDeed.conciseVirtue : bpDeed.conciseVirtueEn) : '';
        const bpSource = bpDeed ? (language === 'ar' ? bpDeed.source : bpDeed.sourceEn) : '';
        const bpTitle = bpDeed ? (language === 'ar' ? bpDeed.subtext : bpDeed.subtextEn) : '';
        updateAllWidgets(adhkar, state.progress, morningZikr, eveningZikr, state.count, 0, theme.isDark ? 'dark' : 'light', theme.isDark, bpTitle, bpHadith, bpSource);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (allZikr.length > 0 && Object.keys(state.progress).length > 0) {
      const morningZikr = getOrderedCategoryItems(allZikr, MORNING_CATEGORY_ID, customOrder);
      const eveningZikr = getOrderedCategoryItems(allZikr, EVENING_CATEGORY_ID, customOrder);
      const tc = state.currentZikr
        ? (state.currentZikr.id === 299 && isFridayTime() ? null : (state.currentZikr.count > 0 ? state.currentZikr.count : getTargetCount(state.count)))
        : null;
      const bpDeed = activeDeeds[0];
      const bpHadith = bpDeed ? (language === 'ar' ? bpDeed.conciseVirtue : bpDeed.conciseVirtueEn) : '';
      const bpSource = bpDeed ? (language === 'ar' ? bpDeed.source : bpDeed.sourceEn) : '';
      const bpTitle = bpDeed ? (language === 'ar' ? bpDeed.subtext : bpDeed.subtextEn) : '';
      updateAllWidgets(allZikr, state.progress, morningZikr, eveningZikr, state.count, tc ?? 0, theme.isDark ? 'dark' : 'light', theme.isDark, bpTitle, bpHadith, bpSource);
    }
  }, [state.progress, state.count, customOrder, allZikr, language, theme.isDark]);

  useEffect(() => {
    if (allZikr.length === 0) return;

    timeBasedCategoryRef.current = getTimeBasedCategoryId();

    const checkTimePeriod = () => {
      const newCategoryId = getTimeBasedCategoryId();
      const oldCategoryId = timeBasedCategoryRef.current;
      if (oldCategoryId === null || newCategoryId === oldCategoryId) return;

      timeBasedCategoryRef.current = newCategoryId;
      setPeriod(getZikrCounterPeriod());

      const adhkar = allZikrRef.current;
      const categoryToClear =
        newCategoryId === MORNING_CATEGORY_ID ||
        newCategoryId === EVENING_CATEGORY_ID ||
        newCategoryId === ABSOLUTE_CATEGORY_ID
          ? newCategoryId
          : null;
      if (categoryToClear !== null) {
        const arabicSet = new Set(
          adhkar.filter((a) => Number(a.categoryId) === categoryToClear).map((a) => a.arabic),
        );
        const filtered: Record<string, number> = {};
        for (const [key, val] of Object.entries(_progressRef)) {
          if (!arabicSet.has(key)) filtered[key] = val;
        }
        dispatch({ type: 'SET_PROGRESS', progress: filtered });
      }

      // Update drawer filter to match new time
      setDrawerFilter(
        newCategoryId === MORNING_CATEGORY_ID ? 'morning'
        : newCategoryId === EVENING_CATEGORY_ID ? 'evening'
        : 'absolute',
      );

      // Show banner
      setTimeBannerMessage(
        newCategoryId === MORNING_CATEGORY_ID
          ? (language === 'ar' ? '🔄 حان وقت أذكار الصباح' : '🔄 Morning ZIKR time')
          : newCategoryId === EVENING_CATEGORY_ID
          ? (language === 'ar' ? '🔄 حان وقت أذكار المساء' : '🔄 Evening ZIKR time')
          : (language === 'ar' ? '🔄 تجددت الأذكار المطلقة' : '🔄 Absolute ZIKR renewed'),
      );
      setTimeout(() => setTimeBannerMessage(null), 3000);
      checkAndNotifyBestPractice(activeDeeds, language);
    };

    const interval = setInterval(checkTimePeriod, 60000);
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkTimePeriod();
        checkAndNotifyBestPractice(activeDeeds, language);
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [allZikr.length, dispatch, language]);

  useEffect(() => {
    checkAndNotifyBestPractice(activeDeeds, language);
  }, [activeDeeds.map((d) => d.id).join(','), language]);

  useLayoutEffect(() => {
    RNAnimated.timing(drawerAnim, {
      toValue: drawerOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen]);

  const currentZikr = state.currentZikr;
  currentZikrRef.current = currentZikr;
  const count = state.count;
  const currentCategory = useMemo(() => {
    if (!currentZikr) return null;
    return categories.find((c) => c.id === currentZikr.categoryId) || null;
  }, [currentZikr, categories]);
  const isTimeBasedZikr = currentZikr && (
    currentZikr.categoryId === MORNING_CATEGORY_ID ||
    currentZikr.categoryId === EVENING_CATEGORY_ID ||
    currentZikr.categoryId === ABSOLUTE_CATEGORY_ID
  );
  const isFridaySalawat = currentZikr && currentZikr.id === 299 && isFridayTime();
  const fridayDisplayZikr = isFridaySalawat && currentZikr ? {
    ...currentZikr,
    arabic: 'اللَّهُمَّ صَلِّ وسَلِّمْ على نَبَيِّنَا محمدٍ.',
    transliteration: "Allaahumma salli wa sallim 'alaa Nabiyyinaa Muhammadin",
    translation: "'O Allaah, send prayers and peace upon our Prophet Muhammad.'",
    title: 'O Allaah, send prayers and peace upon our...',
    titleAr: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    sourceReference: 'أخرجه الطبراني بإسنادين أحدهما جيد. انظر: مجمع الزوائد 10/120، وصحيح الترغيب والترهيب 1/273 برقم 656.',
    sourceReferenceEn: 'Al-Tabarani with two chains, one of which is good. See: Majma\' al-Zawa\'id 10/120, and Sahih al-Targhib wa al-Tarhib 1/273, no. 656.',
    fadl: 'من صلّى عليَّ حين يصبح عشراً، وحين يمسي عشراً، أدركته شفاعتي يوم القيامة',
    fadlEn: 'Whoever sends blessings upon me ten times in the morning and ten times in the evening, my intercession will reach him on the Day of Resurrection',
    count: 10,
  } : undefined;
  const targetCount = currentZikr
    ? (isFridaySalawat ? null : (currentZikr.count > 0 ? currentZikr.count : getTargetCount(count)))
    : null;

  const handleTap = useCallback(() => {
    if (!currentZikr) return;

    const isFridaySpecial = currentZikr.id === 299 && isFridayTime();
    const target = isFridaySpecial ? null : (currentZikr.count > 0 ? currentZikr.count : getTargetCount(count));
    if (!isFridaySpecial && typeof target === 'number' && count >= target) return;

    const newCount = count + 1;
    const halfWay = typeof target === 'number' && newCount === Math.ceil(target / 2);
    const isMilestone = isFridaySpecial && newCount % 10 === 0;

    if (Platform.OS !== 'web') {
      if (soundEnabled) {
        if (isMilestone) {
          playComplete();
        } else if (typeof target === 'number' && newCount === target) {
          playComplete();
        } else {
          playTap();
        }
      }
      if (hapticEnabled) {
        if (halfWay || isMilestone) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      }
    }

    dispatch({ type: 'INCREMENT_COUNT', arabic: currentZikr.arabic });

    if (isMilestone || (typeof target === 'number' && newCount === target)) {
      dispatch({
        type: 'ADD_RECORD',
        record: { id: Date.now(), zikrArabic: currentZikr.arabic, count: newCount, target: isMilestone ? 10 : target, recordedAt: new Date().toISOString() },
      });
      if (isTimeBasedZikr) {
        setXp((prev) => {
          const newXp = prev + 10;
          AsyncStorage.setItem(XP_STORAGE_KEY, String(newXp)).catch(() => {});
          return newXp;
        });
        if (Platform.OS !== 'web' && hapticEnabled) {
          heartbeatHaptic();
        }
      }
    }
  }, [currentZikr, count, dispatch, xp, hapticEnabled, soundEnabled, playTap, playComplete, playMenu, playSave, isTimeBasedZikr]);

  const isSaved = useMemo(() =>
    currentZikr ? state.savedZikr.some((s) => s.arabic === currentZikr.arabic) : false,
    [currentZikr, state.savedZikr],
  );

  const handleToggleSave = useCallback(() => {
    if (!currentZikr) return;
    if (isSaved) {
      dispatch({ type: 'REMOVE_SAVED', arabic: currentZikr.arabic });
    } else {
      if (Platform.OS !== 'web' && soundEnabled) {
        playSave();
      }
      dispatch({ type: 'SAVE_ZIKR', zikr: currentZikr });
    }
  }, [currentZikr, isSaved, dispatch, soundEnabled, playSave]);

  const handleToggleSaveItem = useCallback((zikr: Zikr) => {
    const isItemSaved = savedZikrRef.current.some((s) => s.arabic === zikr.arabic);
    if (isItemSaved) {
      dispatch({ type: 'REMOVE_SAVED', arabic: zikr.arabic });
    } else {
      if (Platform.OS !== 'web' && soundEnabled) {
        playSave();
      }
      dispatch({ type: 'SAVE_ZIKR', zikr });
    }
  }, [dispatch, soundEnabled, playSave]);

  const handleToggleSaveCategory = useCallback((category: ZikrCategory) => {
    if (savedCategoryIdsRef.current.includes(category.id)) {
      dispatch({ type: 'REMOVE_SAVED_CATEGORY', categoryId: category.id });
    } else {
      dispatch({ type: 'SAVE_CATEGORY', categoryId: category.id });
    }
  }, [dispatch]);

  const handleLongPress = useCallback(() => {
    fadlOpenedAt.current = Date.now();
    setShowFadl(true);
  }, []);

  const handleCloseFadl = useCallback(() => {
    if (Date.now() - fadlOpenedAt.current < 400) return;
    setShowFadl(false);
  }, []);

  const handleOpenShareSheet = useCallback(() => {
    if (!currentZikr) return;
    setShowShareSheet(true);
  }, [currentZikr]);

  const handleShareImage = useCallback(async () => {
    if (!currentZikr) return;
    setShareLoading(true);
    await captureAndShareRef(shareRef, currentZikr);
    setShareLoading(false);
    setShowShareSheet(false);
  }, [currentZikr]);

  const handleSaveToDevice = useCallback(async () => {
    if (!currentZikr) return;
    setShareLoading(true);
    try {
      const uri = await captureZikrCard(shareRef);
      if (!uri) {
        Alert.alert('خطأ', language === 'ar' ? 'فشل التقاط صورة الذكر' : 'Failed to capture dhikr card');
        return;
      }
      const success = await saveZikrToGallery(uri);
      if (success) {
        setShowShareSheet(false);
        Alert.alert(
          language === 'ar' ? 'تم الحفظ' : 'Saved',
          language === 'ar' ? 'تم حفظ الصورة في معرض الجهاز' : 'Image saved to device gallery',
        );
      }
    } catch (err) {
      logger.error('Handle save to device error', err);
      Alert.alert('خطأ', language === 'ar' ? 'حدث خطأ أثناء حفظ الصورة' : 'Error saving image');
    } finally {
      setShareLoading(false);
      setShowShareSheet(false);
    }
  }, [currentZikr, language]);

  const navigateTo = useCallback((dir: 'prev' | 'next') => {
    const zikr = currentZikrRef.current;
    if (!zikr) return;

    // If current zikr is from a time-based category that no longer matches active time, jump to new time category
    const activeTimeCategory = timeBasedCategoryRef.current;
    const isTimeCategory = zikr.categoryId === MORNING_CATEGORY_ID
      || zikr.categoryId === EVENING_CATEGORY_ID
      || zikr.categoryId === ABSOLUTE_CATEGORY_ID;
    if (isTimeCategory && activeTimeCategory !== null && zikr.categoryId !== activeTimeCategory) {
      const newItems = getOrderedCategoryItems(allZikr, activeTimeCategory, customOrder);
      if (newItems.length > 0) {
        dispatch({ type: 'ADD_HISTORY', zikr });
        dispatch({ type: 'SET_CURRENT_ZIKR', zikr: newItems[0] });
        setSlideDirection(dir === 'next' ? 'right' : 'left');
        setTimeout(() => setSlideDirection(undefined), 400);
        return;
      }
    }

    const categoryItems = getOrderedCategoryItems(allZikr, Number(zikr.categoryId), customOrder);
    const idx = categoryItems.findIndex((a) => Number(a.id) === Number(zikr.id));
    if (idx === -1) return;

    const nextIdx = dir === 'next'
      ? (idx + 1) % categoryItems.length
      : (idx - 1 + categoryItems.length) % categoryItems.length;

    dispatch({ type: 'ADD_HISTORY', zikr });
    dispatch({ type: 'SET_CURRENT_ZIKR', zikr: categoryItems[nextIdx] });
    setSlideDirection(dir === 'next' ? 'right' : 'left');
    setTimeout(() => setSlideDirection(undefined), 400);
  }, [allZikr, dispatch, customOrder]);

  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);

  const selectZikr = useCallback((zikr: Zikr) => {
    const prevZikr = currentZikrRef.current;
    if (prevZikr && prevZikr.arabic !== zikr.arabic) {
      dispatch({ type: 'ADD_HISTORY', zikr: prevZikr });
    }
    dispatch({ type: 'SET_CURRENT_ZIKR', zikr });
    setDrawerOpen(false);
  }, [dispatch]);

  const handleNavigateHistory = useCallback(() => {
    setDrawerOpen(false);
    setTimeout(() => router.push('/history'), 350);
  }, []);

  const handleNavigateTasbeeh = useCallback(() => {
    setDrawerOpen(false);
    setTimeout(() => router.push('/tasbeeh'), 350);
  }, []);

  const headerBarPaddingTop = insets.top + (Platform.OS === 'ios' ? 12 : 16);
  const headerHeight = headerBarPaddingTop + 68;

  const handleUpdateLocation = useCallback(async () => {
    setNeedsLocationUpdate(false);
    await updateLocationFromGPS();
  }, []);

  const handleBestPractice = useCallback(() => {
    setFrozenBestPracticeContent(bestPracticeModalContentRef.current);
    setShowBestPracticeFadl(true);
  }, []);

  const handleCloseBestPracticeFadl = useCallback(() => {
    setShowBestPracticeFadl(false);
    setFrozenBestPracticeContent(null);
  }, []);

  const bestPracticeSubtext = currentDeed
    ? (language === 'ar' ? currentDeed.subtext : currentDeed.subtextEn)
    : null;

  const handlePressPeriod = useCallback(() => {
    setShowPeriodModal(true);
  }, []);

  const handleGooeyAction = useCallback((action: MenuActionId) => {
    switch (action) {
      case 'index':
        setGooeyOpen(false);
        setTimeout(() => router.push('/fihrist'), 350);
        return;
      case 'saved':
        setDrawerOpen(true);
        setDrawerFilter('saved');
        setSelectedCategoryId(null);
        break;
      case 'tasbeeh':
        setGooeyOpen(false);
        setTimeout(() => router.push('/tasbeeh'), 350);
        return;
      case 'settings':
        setGooeyOpen(false);
        setTimeout(() => router.push('/settings'), 350);
        return;
    }
    setGooeyOpen(false);
  }, []);

  return (
    <Reanimated.View sharedTransitionTag="screen.root" style={{ flex: 1 }}>
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <Reanimated.View sharedTransitionTag="screen.header" style={[styles.header, { backgroundColor: theme.colors.header, justifyContent: 'center', paddingTop: headerBarPaddingTop }]}>
          <View style={[styles.headerCenter, { flexDirection: language === 'ar' ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.hijriText, { color: theme.colors.text, fontFamily: language === 'en' ? 'Poppins_800ExtraBold' : 'MadinetAlBat' }]} numberOfLines={1}>
              {splitTextAndNumbers(hijriInfo.full).map((segment, i) =>
                segment.type === 'number' ? (
                  <Text key={i} style={{ fontFamily: language === 'en' ? 'Poppins_800ExtraBold' : 'Cairo_900Black', fontWeight: '900' }}>
                    {segment.value}
                  </Text>
                ) : (
                  <Text key={i} style={language === 'en' ? { fontWeight: 'bold' } : undefined}>{segment.value}</Text>
                )
              )}
            </Text>
            <View style={styles.headerMeta}>
              {streak > 0 && (
                <Text style={[styles.streakBadge, { color: theme.colors.accent }]}>
                  🔥 {streak}
                </Text>
              )}
              <View style={[styles.levelBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                <Zap size={10} stroke={theme.colors.accent} fill={theme.colors.accent} />
                <Text style={[styles.levelText, { color: theme.colors.accent }]}>{level}</Text>
              </View>
            </View>
          </View>
        </Reanimated.View>

        {/* Time change banner */}
        {timeBannerMessage && (
          <View style={[styles.timeBanner, { backgroundColor: theme.colors.accent }]}>
            <Text style={styles.timeBannerText}>{timeBannerMessage}</Text>
          </View>
        )}

        {/* Status Card */}
        <StatusCard
          period={period}
          needsLocationUpdate={needsLocationUpdate}
          language={language}
          colors={theme.colors}
          onUpdateLocation={handleUpdateLocation}
          onBestPractice={handleBestPractice}
          onPressPeriod={handlePressPeriod}
          bestPracticeSubtext={bestPracticeSubtext}
          t={{
            updateLocation: t.updateLocation,
            periodMorning: t.periodMorning,
            periodEvening: t.periodEvening,
          }}
        />

        {/* Main Zikr Card */}
        <Reanimated.View sharedTransitionTag="screen.content" style={{ flex: 1 }}>
          {currentZikr ? (
            <ZikrCard
              zikr={fridayDisplayZikr || currentZikr}
              count={count}
              targetCount={targetCount}
              fontSize={fontSize}
              onTap={handleTap}
              onLongPress={handleLongPress}
              onNext={() => navigateTo('next')}
              onPrev={() => navigateTo('prev')}
              isDark={theme.isDark}
              colors={theme.colors}
              language={language}
              showArabic={language === 'ar'}
              showTransliteration={language === 'en'}
              showTranslation={language === 'en'}
              slideDirection={slideDirection}
              isSaved={isSaved}
              onToggleSave={handleToggleSave}
              onShare={handleOpenShareSheet}
              enableCelebration={!!isTimeBasedZikr}
              infiniteMode={!!isFridaySalawat}
            />
          ) : (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </Text>
            </View>
          )}
        </Reanimated.View>

        {/* Fadl Modal */}
        <FadlModal
          visible={showFadl}
          onClose={handleCloseFadl}
          zikr={currentZikr ? { fadl: (fridayDisplayZikr || currentZikr).fadl, sourceReference: (fridayDisplayZikr || currentZikr).sourceReference, fadlEn: (fridayDisplayZikr || currentZikr).fadlEn, sourceReferenceEn: (fridayDisplayZikr || currentZikr).sourceReferenceEn, notes: (fridayDisplayZikr || currentZikr).notes } : null}
          colors={theme.colors}
          language={language}
        />

        {/* Best Practice Fadl Modal */}
        <BestPracticeModal
          visible={showBestPracticeFadl}
          onClose={handleCloseBestPracticeFadl}
          colors={theme.colors}
          language={language}
          {...(frozenBestPracticeContent ?? {})}
        />

        {/* Share Sheet */}
        <ShareSheet
          visible={showShareSheet}
          onClose={() => setShowShareSheet(false)}
          onShare={handleShareImage}
          onSaveToDevice={handleSaveToDevice}
          loading={shareLoading}
          colors={theme.colors}
          language={language}
        />

        {/* Period Modal */}
        <PeriodModal
          visible={showPeriodModal}
          onClose={() => setShowPeriodModal(false)}
          period={period}
          allZikr={allZikr}
          currentZikr={currentZikr}
          onSelectZikr={selectZikr}
          colors={theme.colors}
          language={language}
          t={{
            periodMorning: t.periodMorning,
            periodEvening: t.periodEvening,
          }}
          customOrder={customOrder}
          dispatch={orderDispatch}
        />

        {/* Drawer Overlay */}
        <View
          style={styles.drawerOverlay}
          pointerEvents={drawerOpen ? 'auto' : 'none'}
        >
          <RNAnimated.View
            style={[styles.drawerBackdrop, { opacity: drawerAnim }]}
          >
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleCloseDrawer} />
          </RNAnimated.View>
          <RNAnimated.View
            style={[
              styles.drawer,
              { backgroundColor: theme.colors.background, transform: [{ translateX: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_WIDTH, 0] }) }] },
            ]}
          >
              {drawerOpen && (
              <DrawerLayout
                categories={categories}
                allZikr={allZikr}
                savedZikr={state.savedZikr}
                savedCategoryIds={state.savedCategoryIds}
                currentZikr={currentZikr}
                filter={drawerFilter}
                selectedCategoryId={selectedCategoryId}
                language={language}
                colors={theme.colors}
                onSelectZikr={selectZikr}
                onSelectCategory={(id) => { setSelectedCategoryId(id); setDrawerFilter('category'); }}
                onSetFilter={(f) => { setDrawerFilter(f); if (f === 'index') setSelectedCategoryId(null); }}
                onToggleSave={handleToggleSaveItem}
                onToggleSaveCategory={handleToggleSaveCategory}
                onClose={handleCloseDrawer}
                onNavigateHistory={handleNavigateHistory}
                onNavigateTasbeeh={handleNavigateTasbeeh}
                customOrder={customOrder}
                dispatch={orderDispatch}
              />
            )}
          </RNAnimated.View>
        </View>

        {/* Gooey Floating Menu & Search — hidden when drawer is open */}
        {!drawerOpen && (
          <>
            <GooeyMenu
              isOpen={gooeyOpen}
              onToggle={() => {
                const willOpen = !gooeyOpen;
                setDrawerOpen(false);
                setGooeyOpen(willOpen);
                if (Platform.OS !== 'web' && soundEnabled && willOpen) {
                  playMenu();
                }
              }}
              onAction={handleGooeyAction}
              colors={theme.colors}
              language={language}
              topOffset={headerHeight}
              hapticEnabled={hapticEnabled}
            />

            <View
              style={{
                position: 'absolute',
                top: headerHeight,
                right: 10,
                zIndex: 101,
              }}
            >
              <GlassIconButton
                icon={<SearchIcon size={20} stroke="#FFFFFF" />}
                color="teal"
                plate="tilt"
                tilt={15}
                size={44}
                onPress={() => {
                  setGooeyOpen(false);
                  setTimeout(() => router.push('/search'), 350);
                }}
                isDark={theme.isDark}
                showLabel={false}
              />
            </View>
          </>
        )}

        {/* Hidden share view for PNG capture */}
        <View ref={shareRef} collapsable={false} style={styles.shareHidden}>
          {currentZikr && (
            <ZikrShareView
              zikr={currentZikr}
              colors={theme.colors}
              isDark={theme.isDark}
              language={language as 'ar' | 'en'}
              categoryTitle={currentCategory?.title ?? null}
              categoryTitleAr={currentCategory?.subtitle ?? null}
            />
          )}
        </View>
        <ProgressSyncer />
      </View>
    </Reanimated.View>
  );
}

function splitTextAndNumbers(text: string): Array<{ type: 'text' | 'number'; value: string }> {
  const parts: Array<{ type: 'text' | 'number'; value: string }> = [];
  const regex = /[\d\u0660-\u0669]+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'number', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return parts;
}

function isAshuraPeriod(): boolean {
  const hijri = getHijriDate();
  return hijri.monthIndex === 0 && hijri.day >= 8 && hijri.day <= 10;
}

interface BestPracticeDeed {
  id: string;
  title: string;
  titleEn: string;
  subtext: string;
  subtextEn: string;
  conciseVirtue: string;
  conciseVirtueEn: string;
  fullVirtue: string;
  fullVirtueEn: string;
  source: string;
  sourceEn: string;
}

function isArafahPeriod(): boolean {
  const hijri = getHijriDate();
  return hijri.monthIndex === 11 && (hijri.day === 8 || hijri.day === 9);
}

function isWhiteDaysPeriod(): boolean {
  const hijri = getHijriDate();
  return hijri.day >= 12 && hijri.day <= 15;
}

function isFastingRestricted(): boolean {
  const hijri = getHijriDate();
  const month = hijri.monthIndex + 1;
  const hDay = hijri.day;
  if (month === 9) return true;
  if (month === 10 && hDay === 1) return true;
  if (month === 12 && hDay >= 10 && hDay <= 13) return true;
  return false;
}

function isMonThuActive(): boolean {
  const day = new Date().getDay();
  let targetDay: 1 | 4 | null = null;
  let isToday = false;
  if (day === 0) { targetDay = 1; isToday = false; }
  else if (day === 1) { targetDay = 1; isToday = true; }
  else if (day === 3) { targetDay = 4; isToday = false; }
  else if (day === 4) { targetDay = 4; isToday = true; }
  else return false;
  if (isToday) {
    const pt = getTodayPrayerTimes();
    const now = new Date().getTime();
    if (pt && now >= pt.fajr.getTime()) return false;
  }
  return true;
}

function buildAshuraDeed(): BestPracticeDeed {
  const hijri = getHijriDate();
  const isAshura = hijri.day === 10;
  return {
    id: 'ashura',
    title: 'فضل صيام عاشوراء',
    titleEn: 'Virtue of Fasting Ashura',
    subtext: isAshura ? 'اليوم عاشوراء - صيام' : 'صيام عاشوراء',
    subtextEn: isAshura ? 'Today is Ashura - Fast' : 'Fast Ashura',
    conciseVirtue: 'صوم يوم عاشوراء سنة، قال رسول الله ﷺ: «إن هذا يوم عاشوراء ولم يكتب عليكم صيامه، وأنا صائم، فمن شاء صامه، ومن شاء فليفطر» (رواه البخاري ومسلم).',
    conciseVirtueEn: 'Fasting on Ashura is a Sunnah. The Messenger of Allah (ﷺ) said: "This is the day of Ashura, and Allah has not made fasting it obligatory upon you, but I am fasting. Whoever wishes to fast, let him do so, and whoever wishes to break his fast, let him do so." (Narrated by Bukhari and Muslim).',
    fullVirtue: 'صوم يوم عاشوراء سنة لما ورد في الصحيحين عن معاوية رضي الله عنه أن رسول الله صلى الله عليه وسلم قال: إن هذا يوم عاشوراء ولم يكتب عليكم صيامه، وأنا صائم، فمن شاء صامه، ومن شاء فليفطر.\n\nقال أهل العلم: ومراتب صيام عاشوراء ثلاثة: أكملها أن يصام قبله يوم وبعده يوم، ويلي ذلك أن يصام التاسع والعاشر، وأقل ما تحصل به السنة صيام العاشر وحده.\n\nوأما جزاء صيامه فهو يكفر السنة الماضية، كما جاء في صحيح مسلم أن النبي صلى الله عليه وسلم سئل عن صوم يوم عاشوراء فقال: «يكفر السنة الماضية».',
    fullVirtueEn: 'Fasting on Ashura is a Sunnah as narrated in Sahih Bukhari and Muslim from Mu\'awiyah (RA) that the Messenger of Allah (ﷺ) said: "This is the day of Ashura, and Allah has not made fasting it obligatory upon you, but I am fasting. Whoever wishes to fast, let him do so, and whoever wishes to break his fast, let him do so."\n\nThe scholars said: The levels of fasting Ashura are three: The most complete is to fast a day before it and a day after it; next is to fast the 9th and 10th; and the minimum by which the Sunnah is fulfilled is to fast the 10th alone.\n\nAs for its reward, it expiates the previous year, as narrated in Sahih Muslim that the Prophet (ﷺ) was asked about fasting on Ashura and said: "It expiates the previous year."',
    source: 'الحديث الأول: رواه البخاري (2003) ومسلم (1131)\nحديث التكفير: رواه مسلم (1162)',
    sourceEn: 'First hadith: Narrated by Bukhari (2003) and Muslim (1131)\nHadith of expiation: Narrated by Muslim (1162)',
  };
}

function buildArafahDeed(): BestPracticeDeed {
  const hijri = getHijriDate();
  const isArafah = hijri.day === 9;
  return {
    id: 'arafah',
    title: 'فضل صيام يوم عرفة',
    titleEn: 'Virtue of Fasting the Day of Arafah',
    subtext: isArafah ? 'اليوم عرفة - صيام' : 'صيام يوم عرفة',
    subtextEn: isArafah ? 'Today is Arafah - Fast' : 'Fast the Day of Arafah',
    conciseVirtue: 'قال رسول الله ﷺ: «صيام يوم عرفة أحتسب على الله أن يكفر السنة التي قبله والسنة التي بعده» (رواه مسلم).',
    conciseVirtueEn: 'The Messenger of Allah (ﷺ) said: "Fasting on the day of Arafah, I hope from Allah, expiates the sins of the year before and the year after." (Narrated by Muslim).',
    fullVirtue: 'صيام يوم عرفة سنة مؤكدة عن النبي صلى الله عليه وسلم، وهو يوم التاسع من ذي الحجة. قال رسول الله ﷺ: «صيام يوم عرفة أحتسب على الله أن يكفر السنة التي قبله والسنة التي بعده» رواه مسلم.\n\nوهو أفضل أيام الدنيا، فعن جابر رضي الله عنه أن النبي صلى الله عليه وسلم قال: «ما من يوم أفضل عند الله من يوم عرفة» (رواه ابن حبان).\n\nويستحب الإكثار من الدعاء والذكر والتلبية في هذا اليوم العظيم.',
    fullVirtueEn: 'Fasting on the day of Arafah is an emphatic Sunnah of the Prophet (ﷺ). It falls on the 9th of Dhul Hijjah. The Messenger of Allah (ﷺ) said: "Fasting on the day of Arafah, I hope from Allah, expiates the sins of the year before and the year after." (Narrated by Muslim).\n\nIt is the best day of this world. Jabir (RA) narrated that the Prophet (ﷺ) said: "There is no day better in the sight of Allah than the day of Arafah." (Narrated by Ibn Hibban).\n\nIt is recommended to increase in supplication, remembrance, and talbiyah on this great day.',
    source: 'حديث صيام عرفة: رواه مسلم (1162)\nحديث أفضل الأيام: رواه ابن حبان',
    sourceEn: 'Hadith of fasting Arafah: Narrated by Muslim (1162)\nHadith of best day: Narrated by Ibn Hibban',
  };
}

function buildFridayDeed(): BestPracticeDeed {
  return {
    id: 'friday',
    title: 'فضل قراءة سورة الكهف يوم الجمعة',
    titleEn: 'Virtue of Reading Surah Al-Kahf on Friday',
    subtext: 'قراءة سورة الكهف',
    subtextEn: 'Read Surah Al-Kahf',
    conciseVirtue: 'أخرج الحاكم وصححه من حديث أبي سعيد أن النبي ﷺ قال: «من قرأ سورة الكهف في يوم الجمعة، أضاء له من النور ما بين الجمعتين». وأخرجه البيهقي أيضاً في السنن من هذا الوجه، ومن وجه آخر.',
    conciseVirtueEn: 'Al-Hakim narrated and authenticated on the authority of Abu Saeed that the Prophet (ﷺ) said: "Whoever reads Surah Al-Kahf on Friday, a light will shine for him between the two Fridays." Al-Bayhaqi also reported it in Al-Sunan.',
    fullVirtue: 'وأخرج ابن مردويه عن ابن عمر قال: قال رسول الله ﷺ: «من قرأ سورة الكهف في يوم الجمعة، سطع له نور من تحت قدمه إلى عنان السماء، يضيء له يوم القيامة، وغفر له ما بين الجمعتين». وأخرج ابن مردويه عن عائشة قالت: قال رسول الله ﷺ: «ألا أخبركم بسورة ملأ عظمتها ما بين السماء والأرض، ولكاتبها من الأجر مثل ذلك، ومن قرأها يوم الجمعة، غفر له ما بينه وبين الجمعة الأخرى، وزيادة ثلاثة أيام، ومن قرأ الخمس الأواخر منها عند نومه، بعثه الله من أي الليل شاء؟» قالوا: بلى يا رسول الله، قال: «سورة أصحاب الكهف».',
    fullVirtueEn: 'Ibn Mardawayh narrated from Ibn Umar that the Messenger of Allah (ﷺ) said: "Whoever reads Surah Al-Kahf on Friday, a light will radiate from beneath his feet to the heavens, illuminating for him on the Day of Resurrection, and he will be forgiven between the two Fridays." Ibn Mardawayh also narrated from Aisha that the Messenger of Allah (ﷺ) said: "Shall I tell you of a surah whose greatness fills the heavens and the earth, and for the one who writes it there is a reward like that? Whoever reads it on Friday will be forgiven between that Friday and the next, plus three extra days..." They said: "Yes, O Messenger of Allah." He said: "Surah Al-Kahf."',
    source: 'الحديث الأول: رواه الحاكم وصححه، والبيهقي في السنن\nالحديث الثاني: رواه ابن مردويه عن ابن عمر\nالحديث الثالث: رواه ابن مردويه عن عائشة',
    sourceEn: 'First hadith: Narrated by Al-Hakim (authenticated) and Al-Bayhaqi in Al-Sunan\nSecond hadith: Narrated by Ibn Mardawayh from Ibn Umar\nThird hadith: Narrated by Ibn Mardawayh from Aisha',
  };
}

function buildWhiteDaysDeed(): BestPracticeDeed {
  return {
    id: 'white-days',
    title: 'فضل صيام الأيام البيض',
    titleEn: 'Virtue of Fasting the White Days',
    subtext: 'صيام الأيام البيض',
    subtextEn: 'Fast the White Days',
    conciseVirtue: 'قال رسول الله ﷺ: «صيام ثلاثة أيام من كل شهر صيام الدهر» (رواه البخاري ومسلم). والأيام البيض هي الثالث عشر والرابع عشر والخامس عشر من كل شهر هجري.',
    conciseVirtueEn: 'The Messenger of Allah (ﷺ) said: "Fasting three days of every month is like fasting the whole lifetime." (Narrated by Bukhari and Muslim). The White Days are the 13th, 14th, and 15th of each Hijri month.',
    fullVirtue: 'الأيام البيض هي الثالث عشر والرابع عشر والخامس عشر من كل شهر هجري، وقد حث النبي ﷺ على صيامها. عن أبي هريرة رضي الله عنه قال: «أوصاني خليلي ﷺ بثلاث: صيام ثلاثة أيام من كل شهر، وركعتي الضحى، وأن أوتر قبل أن أنام» (رواه البخاري ومسلم).\n\nوفي حديث آخر قال رسول الله ﷺ: «إن من كل شهر صيام ثلاثة أيام، وذلك صيام الدهر» (رواه البخاري).\n\nوقال ﷺ: «صيام ثلاثة أيام من كل شهر صيام الدهر» (رواه البخاري ومسلم).\n\nومعنى صيام الدهر: أن الحسنة بعشر أمثالها، فصيام ثلاثة أيام من كل شهر كصيام ثلاثين يوماً، وهو صيام شهر كامل، فكأنه صام الدهر كله بفضل الله تعالى.',
    fullVirtueEn: 'The White Days are the 13th, 14th, and 15th of each Hijri month. The Prophet (ﷺ) encouraged fasting them. Abu Hurairah (RA) said: "My close friend (ﷺ) advised me to do three things: fast three days every month, pray two rak\'ahs of Duha, and pray Witr before sleeping." (Narrated by Bukhari and Muslim).\n\nIn another hadith, the Messenger of Allah (ﷺ) said: "Fasting three days of every month is like fasting the whole lifetime." (Narrated by Bukhari and Muslim).\n\nThe meaning of "fasting the whole lifetime": A good deed is rewarded tenfold, so fasting three days each month is like fasting thirty days, which is a full month, and thus it is as if one has fasted the entire year.',
    source: 'حديث أبي هريرة: رواه البخاري (1981) ومسلم (1159)\nحديث صيام الدهر: رواه البخاري (1979) ومسلم (1159)',
    sourceEn: 'Hadith of Abu Hurairah: Narrated by Bukhari (1981) and Muslim (1159)\nHadith of fasting lifetime: Narrated by Bukhari (1979) and Muslim (1159)',
  };
}

function buildMonThuDeed(): BestPracticeDeed {
  const day = new Date().getDay();
  const isMonday = day === 0 || day === 1;
  const isToday = day === 1 || day === 4;

  const subAr = isMonday
    ? (isToday ? 'صيام اليوم الاثنين' : 'صيام غداً الاثنين')
    : (isToday ? 'صيام اليوم الخميس' : 'صيام غداً الخميس');
  const subEn = isMonday
    ? (isToday ? 'Fast today (Mon)' : 'Fast tomorrow (Mon)')
    : (isToday ? 'Fast today (Thu)' : 'Fast tomorrow (Thu)');

  return {
    id: 'mon-thu',
    title: 'فضل صيام الاثنين والخميس',
    titleEn: 'Virtue of Fasting Monday and Thursday',
    subtext: subAr,
    subtextEn: subEn,
    conciseVirtue: 'قال رسول الله ﷺ: «تُعْرَضُ الْأَعْمَالُ يَوْمَ الِاثْنَيْنِ وَالْخَمِيسِ، فَأُحِبُّ أَنْ يُعْرَضَ عَمَلِي وَأَنَا صَائِمٌ» (رواه الترمذي وصححه الألباني).',
    conciseVirtueEn: 'The Messenger of Allah (ﷺ) said: "Deeds are presented (to Allah) on Mondays and Thursdays, and I love that my deeds be presented while I am fasting." (Reported by Tirmidhi, authenticated by Al-Albani).',
    fullVirtue: 'أجر صيام يومي الاثنين والخميس، فإن أجر الصيام بصفة عامة لا يعلمه إلا الله سبحانه وتعالى، ففي الحديث القدسي أن الله سبحانه وتعالى يقول: كل عمل ابن آدم له إلا الصوم، فإنه لي وأنا أجزي به. متفق عليه، وقد علل النبي صلى الله عليه وسلم سبب اختيار صيام هذين اليومين دون باقي أيام الأسبوع بأن الأعمال تعرض فيهما على الله عز وجل، ويحب أن يعرض عمله وهو صائم، فقد روى الترمذي وغيره عن أبي هريرة أن رسول الله صلى الله عليه وسلم قال: تعرض الأعمال يوم الاثنين والخميس، فأحب أن يعرض عملي وأنا صائم. والحديث صححه الألباني رحمه الله تعالى.',
    fullVirtueEn: 'The reward for fasting on Monday and Thursday is immense. In general, the reward for fasting is known only to Allah Almighty. In a sacred hadith, Allah says: "Every deed of the son of Adam is for him, except fasting; it is for Me, and I shall reward it." (Agreed upon). The Prophet (ﷺ) explained that he chose these two days because deeds are presented to Allah on them, and he loves to have his deeds presented while he is fasting. Abu Hurairah reported that the Messenger of Allah (ﷺ) said: "Deeds are presented (to Allah) on Mondays and Thursdays, and I love that my deeds be presented while I am fasting." (Reported by Tirmidhi and others, authenticated by Al-Albani, may Allah have mercy on him).',
    source: 'الحديث القدسي: رواه البخاري (1904) ومسلم (1151)\nالحديث: رواه الترمذي (747) وغيره، وصححه الألباني في صحيح الترغيب والترهيب',
    sourceEn: 'Sacred Hadith: Narrated by Bukhari (1904) and Muslim (1151)\nHadith: Narrated by Tirmidhi (747) and others, authenticated by Al-Albani in Sahih Al-Targhib wa Al-Tarhib',
  };
}

function formatTimeWindow(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const h12 = h % 12 || 12;
  const amPm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m).padStart(2, '0')} ${amPm}`;
}

function formatTimeWindowAr(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildDuhaDeed(): BestPracticeDeed {
  const window = getDuhaWindow();
  const timeStart = window ? formatTimeWindow(window.start) : '';
  const timeEnd = window ? formatTimeWindow(window.end) : '';
  const timeStartAr = window ? formatTimeWindowAr(window.start) : '';
  const timeEndAr = window ? formatTimeWindowAr(window.end) : '';
  return {
    id: 'duha',
    title: 'فضل صلاة الضحى',
    titleEn: 'Virtue of Duha Prayer',
    subtext: 'صلاة الضحى',
    subtextEn: 'Duha Prayer',
    conciseVirtue: `🕐 وقت صلاة الضحى: ${timeStartAr} – ${timeEndAr}\n\nقال رسول الله ﷺ: «يصبح على كل سلامى من أحدكم صدقة... ويجزئ من ذلك ركعتان يركعهما من الضحى» (رواه مسلم).`,
    conciseVirtueEn: `🕐 Duha prayer time: ${timeStart} – ${timeEnd}\n\nThe Messenger of Allah (ﷺ) said: "In the morning, charity is due from every joint of the body... and two rak'ahs of Duha prayer suffice for all of that." (Narrated by Muslim).`,
    fullVirtue: `🕐 وقت صلاة الضحى: من ${timeStartAr} إلى ${timeEndAr}\n\nصلاة الضحى سنة مؤكدة عن النبي ﷺ. عن أبي الدرداء رضي الله عنه قال: قال رسول الله ﷺ: «من ركع ركعتي الضحى غفر له ذنوبه وإن كانت مثل زبد البحر» (رواه ابن ماجه وغيره).\n\nوعن أبي هريرة رضي الله عنه قال: «أوصاني خليلي ﷺ بثلاث: صيام ثلاثة أيام من كل شهر، وركعتي الضحى، وأن أوتر قبل أن أنام» (رواه البخاري ومسلم).\n\nووقتها: من ارتفاع الشمس قيد رمح إلى قبيل الزوال، وأفضلها حين ترمض الفصال (أي حين يشتد الحر). وأقلها ركعتان، وأكثرها ثماني ركعات عند الجمهور.`,
    fullVirtueEn: `🕐 Duha prayer time: ${timeStart} – ${timeEnd}\n\nDuha prayer is an emphatic Sunnah of the Prophet (ﷺ). Abu Al-Darda (RA) reported that the Messenger of Allah (ﷺ) said: "Whoever prays two rak'ahs of Duha, his sins will be forgiven even if they be like the foam of the sea." (Narrated by Ibn Majah and others).\n\nAbu Hurairah (RA) said: "My close friend (ﷺ) advised me to do three things: fast three days every month, pray two rak'ahs of Duha, and pray Witr before sleeping." (Narrated by Bukhari and Muslim).\n\nIts time: from when the sun has risen a spear's length until just before noon. The best time is when the sun is hot (mid-morning). The minimum is two rak'ahs, and the maximum is eight rak'ahs according to the majority of scholars.`,
    source: 'حديث الصدقة: رواه مسلم (720)\nحديث أبي الدرداء: رواه ابن ماجه (1382) وحسنه الألباني\nحديث أبي هريرة: رواه البخاري (1981) ومسلم (1159)',
    sourceEn: 'Hadith of charity: Narrated by Muslim (720)\nHadith of Abu Al-Darda: Narrated by Ibn Majah (1382), classed as Hasan by Al-Albani\nHadith of Abu Hurairah: Narrated by Bukhari (1981) and Muslim (1159)',
  };
}

function buildQiyamDeed(): BestPracticeDeed {
  const window = getQiyamWindow();
  const start = window ? formatTimeWindow(window.start) : '';
  const end = window ? formatTimeWindow(window.end) : '';
  const startAr = window ? formatTimeWindowAr(window.start) : '';
  const endAr = window ? formatTimeWindowAr(window.end) : '';
  return {
    id: 'qiyam',
    title: 'فضل قيام الليل',
    titleEn: 'Virtue of Night Prayer',
    subtext: 'قيام الليل',
    subtextEn: 'Night Prayer',
    conciseVirtue: `🕐 وقت قيام الليل: من ${startAr} إلى ${endAr}\n\nقال رسول الله ﷺ: «أفضل الصلاة بعد الفريضة صلاة الليل» (رواه مسلم).`,
    conciseVirtueEn: `🕐 Night prayer time: ${start} – ${end}\n\nThe Messenger of Allah (ﷺ) said: "The best prayer after the obligatory prayers is the night prayer." (Narrated by Muslim).`,
    fullVirtue: `🕐 وقت قيام الليل: من ${startAr} إلى ${endAr}\n\nقيام الليل من أفضل القربات وأعظم الطاعات. قال رسول الله ﷺ: «أفضل الصلاة بعد الفريضة صلاة الليل» (رواه مسلم).\n\nوقال ﷺ: «عليكم بقيام الليل فإنه دأب الصالحين قبلكم، وقربة إلى ربكم، ومكفرة للسيئات، ومنهاة عن الإثم» (رواه الترمذي).\n\nوقال ﷺ: «ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر، فيقول: من يدعوني فأستجيب له، من يسألني فأعطيه، من يستغفرني فأغفر له» (رواه البخاري ومسلم).\n\nوأقل القيام ركعة الوتر، وأكثره غير محدود.`,
    fullVirtueEn: `🕐 Night prayer time: ${start} – ${end}\n\nNight prayer is one of the best acts of worship. The Messenger of Allah (ﷺ) said: "The best prayer after the obligatory prayers is the night prayer." (Narrated by Muslim).\n\nHe also said: "Observe the night prayer, for it was the practice of the righteous before you, a means of closeness to your Lord, an expiation of evil deeds, and a deterrent from sin." (Narrated by Tirmidhi).\n\nAnd he said: "Our Lord descends to the lowest heaven every night when the last third of the night remains, saying: Who supplicates Me so that I may answer him? Who asks of Me so that I may give him? Who seeks My forgiveness so that I may forgive him?" (Narrated by Bukhari and Muslim).\n\nThe minimum is one rak\'ah of Witr, and the maximum is unlimited.`,
    source: 'حديث أفضل الصلاة: رواه مسلم (1163)\nحديث عليكم بقيام الليل: رواه الترمذي (3549) وحسنه الألباني\nحديث النزول: رواه البخاري (1145) ومسلم (758)',
    sourceEn: 'Hadith of best prayer: Narrated by Muslim (1163)\nHadith of observe night prayer: Narrated by Tirmidhi (3549), classed as Hasan by Al-Albani\nHadith of descent: Narrated by Bukhari (1145) and Muslim (758)',
  };
}

function getActiveDeeds(): BestPracticeDeed[] {
  if (isAshuraPeriod()) return [buildAshuraDeed()];

  const deeds: BestPracticeDeed[] = [];

  if (isArafahPeriod()) deeds.push(buildArafahDeed());

  if (isFridayTime()) deeds.push(buildFridayDeed());

  if (!isFastingRestricted()) {
    if (isWhiteDaysPeriod()) deeds.push(buildWhiteDaysDeed());
    if (isMonThuActive()) deeds.push(buildMonThuDeed());
  }

  if (deeds.length === 0) {
    if (isDuhaTime()) deeds.push(buildDuhaDeed());
    if (isQiyamTime()) deeds.push(buildQiyamDeed());
  }

  return deeds;
}

function getTargetCount(currentCount: number): number | null {
  if (currentCount < 10) return 10;
  if (currentCount < 100) return 100;
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hijriText: { fontSize: 18, fontWeight: '600' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakBadge: { fontSize: 12, fontWeight: '700' },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  levelText: { fontSize: 11, fontWeight: '700' },


  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16 },
  drawerOverlay: { ...StyleSheet.absoluteFill, zIndex: 100, flexDirection: 'row' },
  drawerBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: { width: '85%', maxWidth: 400 },
  shareHidden: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: 1080,
    height: 1920,
    opacity: 0.01,
  },
  timeBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  timeBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchFab: {
    position: 'absolute',
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});


