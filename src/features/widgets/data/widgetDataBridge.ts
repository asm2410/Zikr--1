import { Platform } from 'react-native';
import type { Zikr } from '../../../core/types';
import type {
  WidgetSettings,
  SingleWidgetSettings,
  ResolvedWidgetColors,
  WidgetColor,
  DailyDhikrProps,
  TasbeehProps,
  ProgressProps,
  ProgressItem,
  BestPracticeProps,
} from './widgetTypes';

const THEME_COLORS: Record<string, { bg: `#${string}`; text: `#${string}`; accent: `#${string}`; textLight: `#${string}`; card: `#${string}` }> = {
  light: {
    bg: '#F2F2F7',
    text: '#1C1B1F',
    accent: '#6750A4',
    textLight: '#6F6A73',
    card: '#FFFFFF',
  },
  dark: {
    bg: '#121212',
    text: '#E6E1E5',
    accent: '#BB86FC',
    textLight: '#B0A8B9',
    card: '#242424',
  },
};

export function resolveColors(
  settings: SingleWidgetSettings,
  appThemeMode: 'light' | 'dark',
  systemIsDark: boolean,
): ResolvedWidgetColors {
  let mode: 'light' | 'dark';
  switch (settings.theme) {
    case 'light':
      mode = 'light';
      break;
    case 'dark':
      mode = 'dark';
      break;
    case 'app':
      mode = appThemeMode;
      break;
    case 'system':
    default:
      mode = systemIsDark ? 'dark' : 'light';
      break;
  }

  const base = THEME_COLORS[mode];
  const alpha = Math.max(0, Math.min(1, settings.opacity));
  const bgWithOpacity = hexToRgba(base.bg, alpha);

  return {
    bgColor: bgWithOpacity,
    textColor: base.text,
    accentColor: base.accent,
    textLightColor: base.textLight,
    cardColor: hexToRgba(base.card, Math.min(1, alpha + 0.2)),
  };
}

function hexToRgba(hex: `#${string}`, alpha: number): WidgetColor {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})` as WidgetColor;
}

export function buildDailyDhikrProps(
  adhkar: Zikr[],
  settings: SingleWidgetSettings,
  appThemeMode: 'light' | 'dark',
  systemIsDark: boolean,
): DailyDhikrProps[] {
  const colors = resolveColors(settings, appThemeMode, systemIsDark);
  return adhkar.slice(0, 20).map((z) => ({
    arabic: z.arabic,
    translation: z.translation,
    sourceReference: z.sourceReference || '',
    colors,
  }));
}

export function buildTasbeehProps(
  currentCount: number,
  target: number,
  label: string,
  settings: SingleWidgetSettings,
  appThemeMode: 'light' | 'dark',
  systemIsDark: boolean,
): TasbeehProps {
  return {
    currentCount,
    target,
    label,
    isComplete: target > 0 && currentCount >= target,
    colors: resolveColors(settings, appThemeMode, systemIsDark),
  };
}

export function buildProgressProps(
  adhkar: Zikr[],
  progress: Record<string, number>,
  settings: SingleWidgetSettings,
  appThemeMode: 'light' | 'dark',
  systemIsDark: boolean,
  title: string,
): ProgressProps {
  const items: ProgressItem[] = adhkar.map((z) => ({
    arabic: z.arabic,
    completed: (progress[z.arabic] || 0) >= (z.count || 1),
  }));

  return {
    title,
    items,
    colors: resolveColors(settings, appThemeMode, systemIsDark),
  };
}

export function buildBestPracticeProps(
  title: string,
  hadith: string,
  source: string,
  settings: SingleWidgetSettings,
  appThemeMode: 'light' | 'dark',
  systemIsDark: boolean,
): BestPracticeProps {
  return {
    title,
    hadith,
    source,
    colors: resolveColors(settings, appThemeMode, systemIsDark),
  };
}

export async function writeWidgetData(key: string, data: unknown): Promise<void> {
  if (Platform.OS === 'ios') {
    try {
      const userDefaults = require('@react-native-async-storage/async-storage').default;
      await userDefaults.setItem(key, JSON.stringify(data));
    } catch {}
  } else {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }
}
