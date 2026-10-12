import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Share2 } from 'lucide-react-native';
import { PrevIcon, NextIcon } from '../../components/NavIcons';
import { GlassIconButton } from '../../components/GlassIconButton';
import type { ZikrCardProps } from './types';
import { CounterProgress } from './CounterProgress';
import { CompletionCheckbox } from './CompletionCheckbox';
import { extractPreamble } from '../../core/utils/arabic';
import { logger } from '../../core/utils/logger';

export function ZikrCard({
  zikr, count, targetCount, fontSize,
  onTap, onLongPress, onNext, onPrev,
  isDark, colors, language, showArabic, showTransliteration, showTranslation,
  slideDirection, isSaved, onToggleSave, onShare,
  enableCelebration = true,
  infiniteMode = false,
}: ZikrCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const targetReached = typeof targetCount === 'number' && count >= targetCount;
  const prevZikrId = useRef(zikr.id);
  const longPressTriggered = useRef(false);

  const { istiaadha, basmala, verseRef, remaining } = useMemo(() => extractPreamble(zikr.arabic), [zikr.arabic]);

  useEffect(() => {
    if (prevZikrId.current !== zikr.id && slideDirection) {
      slideAnim.setValue(slideDirection === 'right' ? 1 : -1);
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
      prevZikrId.current = zikr.id;
    }
  }, [zikr.id, slideDirection, slideAnim]);

  const effectiveFontSize = useMemo(() => {
    const len = (remaining || zikr.arabic).length;
    let factor = 1.0;
    if (len > 300) factor = 0.78;
    else if (len > 180) factor = 0.85;
    else if (len > 80) factor = 0.92;

    return Math.max(12, Math.round(fontSize * factor));
  }, [remaining, zikr.arabic, fontSize]);

  const preambleFontSize = useMemo(() => Math.max(12, Math.round(effectiveFontSize * 0.75)), [effectiveFontSize]);
  const translationFontSize = useMemo(() => Math.max(11, Math.round(13 * (fontSize / 22))), [fontSize]);
  const transliterationFontSize = useMemo(() => Math.max(12, Math.round(14 * (fontSize / 22))), [fontSize]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  const textContent = (
    <>
      {showArabic && (
        <View style={styles.arabicContainer}>
          {istiaadha && (
            <Text style={[styles.preambleText, { color: colors.textLight, fontSize: preambleFontSize, lineHeight: Math.round(preambleFontSize * 1.6), fontFamily: 'Cairo_700Bold' }]}>
              {istiaadha}
            </Text>
          )}
          {basmala && (
            <Text style={[styles.preambleText, { color: colors.textLight, fontSize: preambleFontSize, lineHeight: Math.round(preambleFontSize * 1.6), fontFamily: 'Cairo_700Bold' }]}>
              {basmala}
            </Text>
          )}
          <Text
            style={[
              styles.arabicText,
              { color: colors.text, fontSize: effectiveFontSize, lineHeight: Math.round(effectiveFontSize * 1.65), fontFamily: 'Cairo_700Bold' },
              targetReached && styles.targetReached,
            ]}
          >
            {remaining || zikr.arabic}
          </Text>
          {verseRef && (
            <Text style={[styles.verseRefText, { color: colors.textLight, fontFamily: 'Cairo_700Bold' }]}>
              {verseRef}
            </Text>
          )}
        </View>
      )}

      {showTranslation && zikr.translation && (
        <Text style={[styles.translation, { color: colors.textLight, fontSize: translationFontSize, lineHeight: Math.round(translationFontSize * 1.45) }]}>
          {zikr.translation}
        </Text>
      )}

      {showTransliteration && zikr.transliteration && (
        <Text style={[styles.transliteration, { color: colors.textLight, fontSize: transliterationFontSize, lineHeight: Math.round(transliterationFontSize * 1.45) }]}>
          {zikr.transliteration}
        </Text>
      )}
    </>
  );

  const handleCardPress = useCallback(() => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    logger.info('ZikrCard tapped (full area)', { zikrId: zikr.id });
    onTap();
  }, [onTap, zikr.id]);

  const handleLongPressWrapper = useCallback(() => {
    longPressTriggered.current = true;
    onLongPress?.();
  }, [onLongPress]);

  const cardContent = (
    <Animated.View style={{ transform: [{ translateX: slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-100, 0, 100] }) }], opacity: slideAnim.interpolate({ inputRange: [-1, -0.3, 0, 0.3, 1], outputRange: [0, 0.7, 1, 0.7, 0] }) }}>
      <View style={styles.cardStack}>
        <LinearGradient
          colors={[colors.accent, colors.textLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBack1}
        />
        <LinearGradient
          colors={[colors.textLight, colors.accent]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBack2}
        />
        <LinearGradient
          colors={[colors.accent, colors.textLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardOuter}
        >
          <Pressable
            onPress={handleCardPress}
            onLongPress={handleLongPressWrapper}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            delayLongPress={400}
          >
            <Animated.View style={[styles.cardInner, { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.textContainer}>
                {textContent}
              </View>
              {!infiniteMode && (
                <LinearGradient colors={[colors.accent, colors.textLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.countBadgeCentered}>
                  <Text style={styles.countBadgeText}>×{zikr.count}</Text>
                </LinearGradient>
              )}
              <TouchableOpacity onPress={onToggleSave} style={[styles.saveButton, { backgroundColor: colors.accent }]}>
                <Bookmark size={16} stroke="#FFFFFF" fill={isSaved ? '#FFFFFF' : 'transparent'} />
              </TouchableOpacity>
              {onShare && (
                <TouchableOpacity onPress={onShare} style={[styles.shareButton, { backgroundColor: colors.accent }]}>
                  <Share2 size={16} stroke="#FFFFFF" />
                </TouchableOpacity>
              )}
            </Animated.View>
          </Pressable>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[
          styles.scrollContentContainer,
          { paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator
      >
        <View style={styles.content}>
          {cardContent}
        </View>
      </ScrollView>
      <View style={styles.navButtonsRow}>
        <GlassIconButton
          icon={<PrevIcon color="#FFFFFF" />}
          label={language === 'ar' ? 'السابق' : 'Prev'}
          color="blue"
          plate="tilt"
          tilt={-18}
          size={72}
          onPress={onPrev}
          isDark={isDark}
          accentColor={colors.accent}
          showLabel={false}
        />
        {infiniteMode ? (
          <CounterProgress count={count} target={10} accent={colors.accent} textLight={colors.textLight} onPress={onTap} />
        ) : targetReached ? (
          <CompletionCheckbox checked={true} accent={colors.accent} textLight={colors.textLight} onPress={onTap} />
        ) : targetCount !== null && targetCount > 1 ? (
          <CounterProgress count={count} target={targetCount} accent={colors.accent} textLight={colors.textLight} onPress={onTap} />
        ) : (
          <CompletionCheckbox checked={false} accent={colors.accent} textLight={colors.textLight} onPress={onTap} />
        )}
        <GlassIconButton
          icon={<NextIcon color="#FFFFFF" />}
          label={language === 'ar' ? 'التالي' : 'Next'}
          color="teal"
          plate="tilt"
          tilt={18}
          size={72}
          onPress={onNext}
          isDark={isDark}
          accentColor={colors.accent}
          showLabel={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flex: 1, zIndex: 12, elevation: 13 },
  scrollContentContainer: { flexGrow: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24 },
  cardStack: { position: 'relative', alignItems: 'stretch' },
  cardBack1: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24, transform: [{ rotate: '2deg' }],
  },
  cardBack2: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24, transform: [{ rotate: '-2deg' }],
  },
  cardOuter: { padding: 5, borderRadius: 24 },
  cardInner: {
    borderRadius: 20,
    padding: 24,
  },
  textContainer: { alignItems: 'center', paddingTop: 20 },
  arabicContainer: { alignItems: 'center' },
  preambleText: { textAlign: 'center', marginBottom: 4, writingDirection: 'rtl' },
  verseRefText: { textAlign: 'center', marginTop: 8, fontSize: 14, writingDirection: 'rtl' },
  arabicText: { textAlign: 'center', lineHeight: undefined, writingDirection: 'rtl' },
  targetReached: { opacity: 0.6 },
  transliteration: { fontSize: 14, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  translation: { fontSize: 13, textAlign: 'center', marginTop: 8 },
  saveButton: {
    position: 'absolute', top: 12, left: 12,
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  shareButton: {
    position: 'absolute', top: 12, right: 12,
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  countBadgeCentered: {
    alignItems: 'center', alignSelf: 'center', marginTop: 16,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 4,
  },
  countBadgeText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  navButtonsRow: {
    position: 'absolute', left: 0, right: 0, bottom: 60,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, zIndex: 13, elevation: 14,
  },
  navButton: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
    elevation: 4,
  },
  infiniteCounter: {
    width: 96, height: 96,
    alignItems: 'center', justifyContent: 'center',
  },
  infiniteCountText: {
    fontSize: 32, fontWeight: '700',
  },
  infiniteLabel: {
    fontSize: 11, fontWeight: '600', marginTop: 2,
  },
});
