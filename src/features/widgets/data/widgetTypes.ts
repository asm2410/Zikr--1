export type WidgetThemeMode = 'system' | 'app' | 'light' | 'dark';

export interface SingleWidgetSettings {
  theme: WidgetThemeMode;
  opacity: number;
}

export interface WidgetSettings {
  dhikr: SingleWidgetSettings;
  tasbeeh: SingleWidgetSettings;
  progress: SingleWidgetSettings;
  bestPractice: SingleWidgetSettings;
  version: number;
}

export const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  dhikr: { theme: 'system', opacity: 0.3 },
  tasbeeh: { theme: 'system', opacity: 0.3 },
  progress: { theme: 'system', opacity: 0.3 },
  bestPractice: { theme: 'system', opacity: 0.3 },
  version: 2,
};

export type WidgetColor = `#${string}` | `rgba(${number}, ${number}, ${number}, ${number})`;

export interface ResolvedWidgetColors {
  bgColor: WidgetColor;
  textColor: WidgetColor;
  accentColor: WidgetColor;
  textLightColor: WidgetColor;
  cardColor: WidgetColor;
}

export interface DailyDhikrProps {
  arabic: string;
  translation: string;
  sourceReference: string;
  colors: ResolvedWidgetColors;
}

export interface TasbeehProps {
  currentCount: number;
  target: number;
  label: string;
  isComplete: boolean;
  colors: ResolvedWidgetColors;
}

export interface ProgressItem {
  arabic: string;
  completed: boolean;
}

export interface ProgressProps {
  title: string;
  items: ProgressItem[];
  colors: ResolvedWidgetColors;
}

export interface BestPracticeProps {
  title: string;
  hadith: string;
  source: string;
  colors: ResolvedWidgetColors;
}

export const WIDGET_SETTINGS_KEY = 'widgetSettings';
export const WIDGET_DAILY_DHIKR_KEY = 'widgetDailyDhikrData';
export const WIDGET_TASBEEH_KEY = 'widgetTasbeehData';
export const WIDGET_PROGRESS_KEY = 'widgetProgressData';
export const WIDGET_BEST_PRACTICE_KEY = 'widgetBestPracticeData';
