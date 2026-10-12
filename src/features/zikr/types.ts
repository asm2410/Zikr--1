import type { Zikr } from '../../core/types';

export interface ZikrCardProps {
  zikr: Zikr;
  count: number;
  targetCount: number | null;
  fontSize: number;
  onTap: () => void;
  onLongPress: () => void;
  onNext: () => void;
  onPrev: () => void;
  isDark: boolean;
  colors: {
    background: string;
    text: string;
    textLight: string;
    accent: string;
    card: string;
  };
  language: 'ar' | 'en';
  showArabic: boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
  slideDirection?: 'left' | 'right';
  isSaved: boolean;
  onToggleSave: () => void;
  onShare?: () => void;
  enableCelebration?: boolean;
  infiniteMode?: boolean;
}

export interface CounterProgressProps {
  count: number;
  target: number | null;
  accent: string;
  textLight: string;
  onPress?: () => void;
}
