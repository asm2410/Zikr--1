import React, { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing, Pressable, TextInput, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { TASBEEH_COUNTERS_KEY } from '../../core/constants';
import { useHaptic } from '../../providers/HapticProvider';
import { useSound } from '../../core/utils/sound';

export interface TasbeehScreenHandle {
  openTargetPicker: () => void;
}

const AYAT = [
  { text: 'إِنَّ الْمُنَافِقِينَ يُخَادِعُونَ اللَّهَ وَهُوَ خَادِعُهُمْ وَإِذَا قَامُوا إِلَى الصَّلَاةِ قَامُوا كُسَالَىٰ يُرَاءُونَ النَّاسَ وَلَا يَذْكُرُونَ اللَّهَ إِلَّا قَلِيلًا', reference: 'سُورَةُ النِّسَاءِ: ١٤٢' },
  { text: 'إِنَّ الْمُسْلِمِينَ وَالْمُسْلِمَاتِ وَالْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ وَالْقَانِتِينَ وَالْقَانِتَاتِ وَالصَّادِقِينَ وَالصَّادِقَاتِ وَالصَّابِرِينَ وَالصَّابِرَاتِ وَالْخَاشِعِينَ وَالْخَاشِعَاتِ وَالْمُتَصَدِّقِينَ وَالْمُتَصَدِّقَاتِ وَالصَّائِمِينَ وَالصَّائِمَاتِ وَالْحَافِظِينَ فُرُوجَهُمْ وَالْحَافِظَاتِ وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا', reference: 'سُورَةُ الأَحْزَابِ: ٣٥' },
  { text: 'قَالَ رَبِّ اجْعَل لِّي آيَةً ۚ قَالَ آيَتُكَ أَلَّا تُكَلِّمَ النَّاسَ ثَلَاثَةَ أَيَّامٍ إِلَّا رَمْزًا ۗ وَاذْكُر رَّبَّكَ كَثِيرًا وَسَبِّحْ بِالْعَشِيِّ وَالْإِبْكَارِ', reference: 'سُورَةُ آلِ عِمْرَانَ: ٤١' },
  { text: 'وَاذْكُر رَّبَّكَ فِي نَفْسِكَ تَضَرُّعًا وَخِيفَةً وَدُونَ الْجَهْرِ مِنَ الْقَوْلِ بِالْغُدُوِّ وَالْآصَالِ وَلَا تَكُن مِّنَ الْغَافِلِينَ', reference: 'سُورَةُ الأَعْرَافِ: ٢٠٥' },
  { text: 'وَاذْكُرِ اسْمَ رَبِّكَ بُكْرَةً وَأَصِيلًا', reference: 'سُورَةُ الإِنْسَانِ: ٢٥' },
  { text: 'فَإِذَا قُضِيَتِ الصَّلَاةُ فَانتَشِرُوا فِي الْأَرْضِ وَابْتَغُوا مِن فَضْلِ اللَّهِ وَاذْكُرُوا اللَّهَ كَثِيرًا لَّعَلَّكُمْ تُفْلِحُونَ', reference: 'سُورَةُ الجُمُعَةِ: ١٠' },
  { text: 'إِلَّا أَن يَشَاءَ اللَّهُ ۚ وَاذْكُر رَّبَّكَ إِذَا نَسِيتَ وَقُلْ عَسَىٰ أَن يَهْدِيَنِ رَبِّي لِأَقْرَبَ مِنْ هَٰذَا رَشَدًا', reference: 'سُورَةُ الكَهْفِ: ٢٤' },
  { text: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ', reference: 'سُورَةُ البَقَرَةِ: ١٥٢' },
  { text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا', reference: 'سُورَةُ الأَحْزَابِ: ٤١' },
  { text: 'فَاصْبِرْ عَلَىٰ مَا يَقُولُونَ وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ غُرُوبِهَا ۖ وَمِنْ آنَاءِ اللَّيْلِ فَسَبِّحْ وَأَطْرَافَ النَّهَارِ لَعَلَّكَ تَرْضَىٰ', reference: 'سُورَةُ طه: ١٣٠' },
];

const TARGET_PRESETS = [
  { value: null, label: '∞' },
  { value: 33, label: '33' },
  { value: 99, label: '99' },
  { value: 100, label: '100' },
  { value: 300, label: '300' },
  { value: 1000, label: '1000' },
] as const;

const CIRCLE_SIZE = 220;
const PULSE_COUNT = 3;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_DIAG = Math.sqrt(SCREEN_WIDTH * SCREEN_WIDTH + SCREEN_HEIGHT * SCREEN_HEIGHT) * 1.2;

interface TasbeehScreenProps {
  colors: { background: string; text: string; textLight: string; accent: string; card: string };
  language: 'ar' | 'en';
  t: any;
}

export const TasbeehScreen = forwardRef<TasbeehScreenHandle, TasbeehScreenProps>(
function TasbeehScreen({ colors, language, t }, ref) {
  const [count, setCount] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { hapticEnabled, soundEnabled } = useHaptic();
  const { playTap } = useSound();
  const [target, setTarget] = useState<number | null>(null);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTargetText, setCustomTargetText] = useState('');
  const [completed, setCompleted] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnims = useRef(Array.from({ length: PULSE_COUNT }, () => new Animated.Value(0))).current;
  const pulseIdx = useRef(0);
  const countRef = useRef(0);
  const targetRef = useRef<number | null>(null);
  const hapticRef = useRef(true);
  const completedRef = useRef(false);
  const [ripples, setRipples] = useState<{ id: number; anim: Animated.Value }[]>([]);
  const rippleIdRef = useRef(0);
  const [ayah] = useState(() => AYAT[Math.floor(Math.random() * AYAT.length)]);

  useImperativeHandle(ref, () => ({
    openTargetPicker: openTargetPickerFn,
  }));

  countRef.current = count;
  targetRef.current = target;
  hapticRef.current = hapticEnabled;
  completedRef.current = completed;

  useEffect(() => {
    AsyncStorage.getItem(TASBEEH_COUNTERS_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const savedCount = parsed.count ?? 0;
          setCount(savedCount);
          countRef.current = savedCount;
          if (parsed.target !== undefined) {
            setTarget(parsed.target);
            targetRef.current = parsed.target;
          }
          if (savedCount > 0) {
            if (parsed.target !== null && parsed.target > 0 && savedCount % parsed.target === 0) {
              setCompleted(true);
              completedRef.current = true;
            }
            setShowDialog(true);
          }
        } catch {
          setCount(0);
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(TASBEEH_COUNTERS_KEY, JSON.stringify({ count, target })).catch(() => {});
  }, [count, target]);

  const handleContinue = useCallback(() => setShowDialog(false), []);
  const handleResetDialog = useCallback(() => {
    setCount(0);
    setShowDialog(false);
  }, []);

  const openTargetPickerFn = useCallback(() => {
    setShowCustomInput(false);
    setCustomTargetText('');
    setShowTargetPicker(true);
  }, []);
  const openTargetPickerRef = useRef(openTargetPickerFn);
  openTargetPickerRef.current = openTargetPickerFn;

  const triggerPulse = useCallback(() => {
    const anim = pulseAnims[pulseIdx.current];
    pulseIdx.current = (pulseIdx.current + 1) % PULSE_COUNT;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [pulseAnims]);

  const triggerRipple = useCallback(() => {
    const id = rippleIdRef.current++;
    const anim = new Animated.Value(0);
    setRipples((prev) => [...prev, { id, anim }]);
    Animated.timing(anim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    });
  }, []);

  const increment = useCallback(() => {
    if (completedRef.current) {
      openTargetPickerRef.current();
      return;
    }

    const nextCount = countRef.current + 1;
    setCount(nextCount);

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.12, friction: 4, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    triggerPulse();
    triggerRipple();

    if (Platform.OS !== 'web') {
      if (soundEnabled) {
        playTap();
      }
      if (hapticRef.current) {
        const tgt = targetRef.current;
        if (tgt !== null && nextCount % tgt === 0) {
          setCompleted(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      }
    }
  }, [scaleAnim, triggerPulse, soundEnabled, playTap]);

  const handleResetPress = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const confirmReset = useCallback(() => {
    setCount(0);
    setCompleted(false);
    setShowResetConfirm(false);
  }, []);

  const cancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  const handleSetTarget = useCallback((val: number | null) => {
    if (completedRef.current) {
      setCount(0);
      setCompleted(false);
    }
    setTarget(val);
    targetRef.current = val;
    setShowTargetPicker(false);
    setShowCustomInput(false);
    setCustomTargetText('');
  }, []);

  const handleCustomConfirm = useCallback(() => {
    const val = parseInt(customTargetText, 10);
    if (!isNaN(val) && val > 0) {
      handleSetTarget(val);
    }
  }, [customTargetText, handleSetTarget]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.accent, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {ripples.map((ripple) => (
        <Animated.View
          key={ripple.id}
          style={[
            styles.bgRipple,
            {
              width: SCREEN_DIAG,
              height: SCREEN_DIAG,
              borderRadius: SCREEN_DIAG / 2,
              backgroundColor: colors.accent,
              opacity: ripple.anim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0.15, 0.06, 0],
              }),
              transform: [
                {
                  scale: ripple.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      <Pressable onPress={increment} style={styles.pressable}>
        <View style={styles.centerContent}>
          <Animated.View style={[styles.circleWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.circleContainer, { width: CIRCLE_SIZE, height: CIRCLE_SIZE }]}>
              {pulseAnims.map((anim, i) => {
              const opacity = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 0],
              });
              const size = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [CIRCLE_SIZE, CIRCLE_SIZE * 1.8],
              });
              const borderRadius = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [CIRCLE_SIZE / 2, CIRCLE_SIZE * 1.8 / 2],
              });
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.pulseRing,
                    {
                      width: size,
                      height: size,
                      borderRadius,
                      borderColor: colors.accent,
                      opacity,
                    },
                  ]}
                />
              );
            })}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={increment}
              onLongPress={openTargetPickerFn}
              delayLongPress={400}
              style={[
                styles.circle,
                {
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  borderRadius: CIRCLE_SIZE / 2,
                  borderColor: colors.accent,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <Text style={[styles.countText, { color: completed ? colors.accent : colors.text }]}>
                {completed ? (language === 'ar' ? 'تم' : 'Done') : count}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleResetPress} style={[styles.resetBtn, { backgroundColor: colors.card }]}>
            <Text style={[styles.resetText, { color: colors.accent }]}>{t.reset}</Text>
          </TouchableOpacity>
          <View style={styles.ayahSection}>
            <Text style={[styles.ayahText, { color: colors.textLight }]}>{ayah.text}</Text>
            <Text style={[styles.ayahRef, { color: colors.accent }]}>{ayah.reference}</Text>
          </View>
        </View>
      </Pressable>

      {showDialog && (
        <View style={styles.overlay}>
          <View style={[styles.dialogCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.dialogMessage, { color: colors.text }]}>
              {language === 'ar' ? 'هل تريد متابعة التسبيح؟' : 'Continue counting?'}
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity onPress={handleContinue} style={[styles.dialogBtn, { backgroundColor: colors.accent }]}>
                <Text style={styles.dialogBtnText}>
                  {language === 'ar' ? 'متابعة' : 'Continue'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResetDialog} style={[styles.dialogBtnOutline, { borderColor: colors.accent }]}>
                <Text style={[styles.dialogBtnText, { color: colors.accent }]}>
                  {language === 'ar' ? 'إعادة' : 'Reset'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showResetConfirm && (
        <View style={styles.overlay}>
          <View style={[styles.dialogCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.dialogMessage, { color: colors.text }]}>
              {language === 'ar' ? 'هل أنت متأكد من إعادة التعيين؟' : 'Are you sure you want to reset?'}
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity onPress={confirmReset} style={[styles.dialogBtn, { backgroundColor: colors.accent }]}>
                <Text style={styles.dialogBtnText}>
                  {language === 'ar' ? 'نعم' : 'Yes'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelReset} style={[styles.dialogBtnOutline, { borderColor: colors.accent }]}>
                <Text style={[styles.dialogBtnText, { color: colors.accent }]}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showTargetPicker && (
        <Pressable onPress={() => setShowTargetPicker(false)} style={styles.overlay}>
          <Pressable onPress={() => {}} style={[styles.targetPickerCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.targetPickerTitle, { color: colors.text }]}>
              {language === 'ar' ? 'اختيار الهدف' : 'Set Target'}
            </Text>
            <View style={styles.targetGrid}>
              {TARGET_PRESETS.map((preset) => {
                const active = target === preset.value;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => handleSetTarget(preset.value)}
                    style={[
                      styles.targetPresetBtn,
                      {
                        backgroundColor: active ? colors.accent : colors.background,
                        borderColor: active ? colors.accent : colors.textLight + '50',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.targetPresetText,
                        { color: active ? '#fff' : colors.text },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setShowCustomInput((prev) => !prev)}
                style={[styles.targetPresetBtn, { backgroundColor: colors.background, borderColor: colors.accent, borderStyle: 'dashed' }]}
              >
                <Text style={[styles.targetPresetText, { color: colors.accent }]}>
                  {language === 'ar' ? '✏️ تخصيص' : '✏️ Custom'}
                </Text>
              </TouchableOpacity>
            </View>
            {showCustomInput && (
              <View style={styles.customInputRow}>
                <TextInput
                  style={[styles.customInput, { borderColor: colors.textLight, color: colors.text }]}
                  keyboardType="number-pad"
                  placeholder={language === 'ar' ? 'أدخل الرقم' : 'Enter number'}
                  placeholderTextColor={colors.textLight}
                  value={customTargetText}
                  onChangeText={setCustomTargetText}
                />
                <TouchableOpacity onPress={handleCustomConfirm} style={[styles.confirmBtn, { backgroundColor: colors.accent }]}>
                  <Text style={styles.confirmBtnText}>
                    {language === 'ar' ? 'تأكيد' : 'OK'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => setShowTargetPicker(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: colors.textLight }]}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  pressable: { flex: 1 },
  bgRipple: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - SCREEN_DIAG / 2,
    left: SCREEN_WIDTH / 2 - SCREEN_DIAG / 2,
    zIndex: 0,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 999,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  countText: {
    fontSize: 64,
    fontWeight: '700',
    fontFamily: 'Cairo_700Bold',
  },
  footer: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  resetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 24,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Cairo_600SemiBold',
  },
  ayahSection: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  ayahText: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'Cairo_400Regular',
  },
  ayahRef: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Cairo_600SemiBold',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  dialogCard: {
    marginHorizontal: 40,
    paddingVertical: 32,
    paddingHorizontal: 28,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
  },
  dialogMessage: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28,
    fontFamily: 'Cairo_600SemiBold',
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 14,
  },
  dialogBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  dialogBtnOutline: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1.5,
  },
  dialogBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Cairo_700Bold',
  },
  targetPickerCard: {
    marginHorizontal: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    maxWidth: 360,
  },
  targetPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    fontFamily: 'Cairo_700Bold',
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  targetPresetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    minWidth: 70,
    alignItems: 'center',
  },
  targetPresetText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Cairo_700Bold',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  customInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'Cairo_600SemiBold',
    textAlign: 'center',
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Cairo_700Bold',
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
  },
});

