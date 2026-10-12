import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Zikr, ThemeColors } from '../../core/types';
import { extractPreamble } from '../../core/utils/arabic';

const SHARE_WIDTH = 1080;
const SHARE_HEIGHT = 1920;

interface Props {
  zikr: Zikr;
  colors: ThemeColors;
  isDark: boolean;
  language: 'ar' | 'en';
  categoryTitle: string | null;
  categoryTitleAr: string | null;
}

export function ZikrShareView({ zikr, colors, language, categoryTitle, categoryTitleAr }: Props) {
  const { istiaadha, basmala, verseRef, remaining } = useMemo(() => extractPreamble(zikr.arabic), [zikr.arabic]);
  const isEnglish = language === 'en';

  const watermarkItems = useMemo(() => {
    const items: { x: number; y: number }[] = [];
    const cols = 6, rows = 14;
    const sw = 1080 / cols, sh = 1920 / rows;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        items.push({ x: c * sw + (r % 2) * (sw / 2), y: r * sh });
    return items;
  }, []);

  return (
    <View style={[styles.container, { borderColor: colors.accent, backgroundColor: colors.background }]}>
      {watermarkItems.map((pos, i) => (
        <Text key={i} style={[styles.watermarkItem, { left: pos.x, top: pos.y, color: colors.text + '12' }]}>
          <Text style={styles.watermarkArabic}>ذِكْر</Text>
          <Text style={styles.watermarkEnglish}> ZIKR</Text>
        </Text>
      ))}

      {zikr.count && zikr.count > 1 ? (
        <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.countText}>X{zikr.count}</Text>
        </View>
      ) : null}

      <View style={[styles.zikrCard, { backgroundColor: colors.card, opacity: 0.92 }]}>
        <View style={styles.titleWrapper}>
          {isEnglish ? (
            <>
              {categoryTitle ? (
                <Text style={[styles.titleText, { color: colors.accent }]}>{categoryTitle}</Text>
              ) : null}
              {categoryTitleAr ? (
                <Text style={[styles.subtitleText, { color: colors.accent + 'AA' }]}>{categoryTitleAr}</Text>
              ) : null}
            </>
          ) : (
            categoryTitleAr ? (
              <Text style={[styles.titleText, { color: colors.accent }]}>{categoryTitleAr}</Text>
            ) : null
          )}
        </View>
        <>
          {istiaadha && (
            <Text style={styles.preambleText}>
              {istiaadha}
            </Text>
          )}
          {basmala && (
            <Text style={styles.preambleText}>
              {basmala}
            </Text>
          )}
          <Text style={[styles.arabicText, { color: colors.text }]}>
            {remaining || zikr.arabic}
          </Text>
          {verseRef && (
            <Text style={[styles.verseRefText, { color: colors.accent }]}>
              {verseRef}
            </Text>
          )}
        </>
        {isEnglish && zikr.translation ? (
          <Text style={[styles.translationText, { color: colors.textLight }]}>
            {zikr.translation}
          </Text>
        ) : null}
        {isEnglish && zikr.transliteration ? (
          <Text style={[styles.transliterationText, { color: colors.textLight }]}>
            {zikr.transliteration}
          </Text>
        ) : null}
      </View>
      {(zikr.fadl || zikr.sourceReference) ? (
        <View style={styles.fadlWrapper}>
          {zikr.fadl ? (
            <View style={[styles.fadlCard, { backgroundColor: colors.card, opacity: 0.92 }]}>
              <Text style={[styles.fadlLabel, { color: colors.accent }]}>فضل الذكر</Text>
              <View style={[styles.fadlDivider, { backgroundColor: colors.textLight + '60' }]} />
              <Text style={[styles.fadlText, { color: colors.textLight }]}>{zikr.fadl}</Text>
            </View>
          ) : null}
          {zikr.sourceReference ? (
            <Text style={[styles.sourceText, { color: colors.textLight + '99' }]}>{zikr.sourceReference}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SHARE_WIDTH,
    height: SHARE_HEIGHT,
    borderWidth: 3,
    borderRadius: 40,
    overflow: 'hidden',
    paddingVertical: 80,
    paddingHorizontal: 64,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  watermarkItem: {
    position: 'absolute',
    fontSize: 30,
    transform: [{ rotate: '45deg' }],
  },
  watermarkArabic: {
    fontFamily: 'MadinetAlBat',
    fontSize: 30,
  },
  watermarkEnglish: {
    fontFamily: 'BIXIE',
    fontSize: 30,
  },
  countBadge: {
    position: 'absolute',
    top: 64,
    right: 64,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    zIndex: 3,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'Cairo_700Bold',
    textAlign: 'center',
  },
  zikrCard: {
    borderRadius: 28,
    paddingVertical: 48,
    paddingHorizontal: 44,
    alignItems: 'center',
    width: '100%',
    maxWidth: 920,
    marginBottom: 28,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 42,
    fontFamily: 'Cairo_700Bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.75,
  },
  subtitleText: {
    fontSize: 24,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 6,
    opacity: 0.6,
  },
  preambleText: {
    fontSize: 36,
    fontFamily: 'Cairo_700Bold',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 52,
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  verseRefText: {
    fontSize: 28,
    fontFamily: 'Cairo_700Bold',
    textAlign: 'center',
    lineHeight: 42,
    writingDirection: 'rtl',
    marginTop: 16,
  },
  arabicText: {
    fontSize: 64,
    fontFamily: 'Cairo_700Bold',
    textAlign: 'center',
    lineHeight: 90,
    writingDirection: 'rtl',
  },
  translationText: {
    fontSize: 40,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 56,
  },
  transliterationText: {
    fontSize: 28,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 36,
    fontStyle: 'italic',
  },
  fadlWrapper: {
    width: '100%',
    maxWidth: 920,
    alignItems: 'center',
  },
  fadlCard: {
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 36,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    width: '100%',
  },
  fadlLabel: {
    fontSize: 32,
    fontFamily: 'Cairo_700Bold',
    writingDirection: 'rtl',
    flexShrink: 0,
  },
  fadlDivider: {
    width: 3,
    height: 40,
    marginHorizontal: 20,
    borderRadius: 2,
    flexShrink: 0,
  },
  fadlText: {
    fontSize: 28,
    fontFamily: 'Cairo_400Regular',
    lineHeight: 42,
    writingDirection: 'rtl',
    flex: 1,
  },
  sourceText: {
    fontSize: 24,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
    marginTop: 16,
  },
});
