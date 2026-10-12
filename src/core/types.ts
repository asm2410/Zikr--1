export type AppLanguage = 'ar' | 'en';
export type ThemeMode = 'system' | 'light' | 'dark';
export type PlatformType = 'ios' | 'android';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'friday';
export type ZikrCounterPeriod = 'morning' | 'evening';
export type DrawerFilter = 'index' | 'category' | 'saved' | 'absolute' | 'custom' | 'morning' | 'evening';

export interface Zikr {
  id: number;
  categoryId: number;
  title: string | null;
  arabic: string;
  transliteration: string | null;
  translation: string;
  count: number;
  notes: string | null;
  sourceReference: string | null;
  fadl: string | null;
  sourceReferenceEn: string | null;
  fadlEn: string | null;
  orderIndex: number;
  tags: string[];
  titleAr: string | null;
}

export interface ZikrCategory {
  id: number;
  title: string;
  subtitle: string;
  orderIndex: number;
}

export interface ZikrData {
  seedVersion: number;
  categories: ZikrCategory[];
  adhkar: Zikr[];
}

export interface CountRecord {
  id: number;
  zikrArabic: string;
  count: number;
  target: number | null;
  recordedAt: string;
}

export interface ZikrResetDates {
  morning?: string;
  evening?: string;
}

export type CustomOrder = Record<number, number[]>;

export interface ThemeColors {
  background: string;
  header: string;
  card: string;
  accent: string;
  text: string;
  textLight: string;
}

export interface AppTheme {
  colors: ThemeColors;
  isDark: boolean;
}
