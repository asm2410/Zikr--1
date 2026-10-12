import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Moon, MapPin } from 'lucide-react-native';
import type { ZikrCounterPeriod, ThemeColors } from '../../core/types';

interface StatusCardProps {
  period: ZikrCounterPeriod;
  needsLocationUpdate: boolean;
  language: 'ar' | 'en';
  colors: ThemeColors;
  onUpdateLocation: () => void;
  onBestPractice: () => void;
  onPressPeriod: () => void;
  bestPracticeSubtext: string | null;
  t: {
    updateLocation: string;
    periodMorning: string;
    periodEvening: string;
  };
}

export function StatusCard({
  period,
  needsLocationUpdate,
  language,
  colors,
  onUpdateLocation,
  onBestPractice,
  onPressPeriod,
  bestPracticeSubtext,
  t,
}: StatusCardProps) {
  const isArabic = language === 'ar';

  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.85, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.85, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]).start();
    };

    pulse();
    const interval = setInterval(pulse, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.wrapper, { marginTop: 80, marginBottom: 40 }]}>
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
          {bestPracticeSubtext ? (
            <View style={[styles.cardInnerRow, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={[styles.compartment, { borderRightColor: colors.accent + '20' }]}
                onPress={onBestPractice}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.bpGlow,
                    {
                      borderColor: colors.accent + '80',
                      shadowColor: colors.accent,
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.8],
                      }),
                    },
                  ]}
                  pointerEvents="none"
                />
                <View style={styles.compContent}>
                  <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                    {bestPracticeSubtext}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.compartment}
                onPress={needsLocationUpdate ? onUpdateLocation : onPressPeriod}
                activeOpacity={0.7}
              >
                {needsLocationUpdate ? (
                  <View style={styles.compContent}>
                    <MapPin size={18} stroke={colors.accent} />
                    <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                      {t.updateLocation}
                    </Text>
                    <Text style={[styles.subLabel, { color: colors.textLight }]} numberOfLines={1}>
                      {isArabic ? 'اضغط للتحديث' : 'Tap to update'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.compContent}>
                    {period === 'morning' ? (
                      <Sun size={18} stroke={colors.accent} />
                    ) : (
                      <Moon size={18} stroke={colors.accent} />
                    )}
                    <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                      {period === 'morning' ? t.periodMorning : t.periodEvening}
                    </Text>

                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.cardInnerFull, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={styles.compartmentFull}
                onPress={needsLocationUpdate ? onUpdateLocation : onPressPeriod}
                activeOpacity={0.7}
              >
                {needsLocationUpdate ? (
                  <View style={styles.compContent}>
                    <MapPin size={18} stroke={colors.accent} />
                    <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                      {t.updateLocation}
                    </Text>
                    <Text style={[styles.subLabel, { color: colors.textLight }]} numberOfLines={1}>
                      {isArabic ? 'اضغط للتحديث' : 'Tap to update'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.compContent}>
                    {period === 'morning' ? (
                      <Sun size={18} stroke={colors.accent} />
                    ) : (
                      <Moon size={18} stroke={colors.accent} />
                    )}
                    <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                      {period === 'morning' ? t.periodMorning : t.periodEvening}
                    </Text>

                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
  cardStack: {
    position: 'relative',
    alignItems: 'stretch',
  },
  cardBack1: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
    transform: [{ rotate: '2deg' }],
  },
  cardBack2: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
    transform: [{ rotate: '-2deg' }],
  },
  cardOuter: {
    padding: 3,
    borderRadius: 24,
  },
  cardInnerRow: {
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardInnerFull: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  compartment: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: 'transparent',
    justifyContent: 'center',
  },
  compartmentFull: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  compContent: {
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  bpGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 18,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 10,
  },
});
