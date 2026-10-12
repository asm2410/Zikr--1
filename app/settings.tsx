import React, { useState, useEffect } from 'react';
import Reanimated from 'react-native-reanimated';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/providers/ThemeProvider';
import { useLanguage } from '../src/providers/LanguageProvider';
import { useHaptic } from '../src/providers/HapticProvider';
import { useFontSize } from '../src/providers/FontSizeProvider';
import { SettingsScreen } from '../src/features/settings/SettingsScreen';
import { BEST_PRACTICE_NOTIF_ENABLED_KEY, NOTIFICATIONS_ENABLED_KEY } from '../src/core/constants';
import { getSavedCity, getTravelerMode, setTravelerMode, updateLocationFromGPS } from '../src/core/utils/location';

export default function SettingsPage() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { hapticEnabled, setHapticEnabled, soundEnabled, setSoundEnabled } = useHaptic();
  const { fontSize, setFontSize } = useFontSize();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [bestPracticeNotificationsEnabled, setBestPracticeNotificationsEnabled] = useState(false);
  const [travelerMode, setTravelerModeState] = useState(false);
  const [savedCity, setSavedCity] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const c = await getSavedCity();
        if (c) setSavedCity(c);
      } catch {}
      try {
        const v = await getTravelerMode();
        setTravelerModeState(v);
      } catch {}
      try {
        const v = await AsyncStorage.getItem(BEST_PRACTICE_NOTIF_ENABLED_KEY);
        if (v === 'true') setBestPracticeNotificationsEnabled(true);
      } catch {}
      try {
        const v = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        if (v === 'true') setNotificationsEnabled(true);
      } catch {}
    })();
  }, []);

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
  };

  const handleTravelerToggle = (enabled: boolean) => {
    setTravelerModeState(enabled);
    setTravelerMode(enabled);
    if (enabled) {
      updateLocationFromGPS();
    }
  };

  return (
    <Reanimated.View sharedTransitionTag="screen.root" style={{ flex: 1 }}>
      <SettingsScreen
        language={language}
        themeMode={themeMode}
        fontSize={fontSize}
        notificationsEnabled={notificationsEnabled}
        bestPracticeNotificationsEnabled={bestPracticeNotificationsEnabled}
        soundEnabled={soundEnabled}
        hapticEnabled={hapticEnabled}
        travelerMode={travelerMode}
        savedCity={savedCity}
        onSetLanguage={setLanguage}
        onSetThemeMode={setThemeMode}
        onSetFontSize={setFontSize}
        onToggleNotifications={(v) => {
          setNotificationsEnabled(v);
          AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, v ? 'true' : 'false').catch(() => {});
        }}
        onToggleBestPracticeNotifications={(v) => {
          setBestPracticeNotificationsEnabled(v);
          AsyncStorage.setItem(BEST_PRACTICE_NOTIF_ENABLED_KEY, v ? 'true' : 'false').catch(() => {});
        }}
        onToggleSound={handleSoundToggle}
        onToggleHaptic={setHapticEnabled}
        onToggleTravelerMode={handleTravelerToggle}
        onUpdateCity={() => {
          updateLocationFromGPS().then(() => {
            getSavedCity().then((c) => { if (c) setSavedCity(c); });
          });
        }}
        onOpenWidgetSettings={() => router.push('/widget-settings')}
        onClose={() => router.back()}
        colors={theme.colors}
        t={t}
      />
    </Reanimated.View>
  );
}
