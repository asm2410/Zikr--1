import type { AppLanguage } from './types';
import { ar } from './ar';
import { en } from './en';

export type { AppLanguage, UiStrings } from './types';

export const DEFAULT_LANGUAGE: AppLanguage = 'ar';

const strings = { ar, en } as const;

export function getUiStrings(language: AppLanguage) {
  return strings[language];
}

export function getCategoryLabel(
  title: string,
  subtitle: string,
  language: AppLanguage,
): string {
  return language === 'ar' ? subtitle || title : title || subtitle;
}

export function getCategorySubLabel(
  title: string,
  subtitle: string,
  language: AppLanguage,
): string | null {
  if (language === 'ar') return null;
  if (subtitle && title) return subtitle;
  return null;
}
