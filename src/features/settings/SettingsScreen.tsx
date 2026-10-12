import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated from 'react-native-reanimated';
import { ArrowLeft, RotateCcw } from 'lucide-react-native';
import { NotificationIcon, LocationIcon, AirplaneIcon, SoundIcon, HapticIcon, WidgetIcon } from './components/SettingsIcons';
import type { AppLanguage, ThemeMode } from '../../core/types';

interface SettingsScreenProps {
  language: AppLanguage;
  themeMode: ThemeMode;
  fontSize: number;
  notificationsEnabled: boolean;
  bestPracticeNotificationsEnabled?: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  travelerMode: boolean;
  savedCity: string;
  onSetLanguage: (lang: AppLanguage) => void;
  onSetThemeMode: (mode: ThemeMode) => void;
  onSetFontSize: (size: number) => void;
  onToggleNotifications: (enabled: boolean) => void;
  onToggleBestPracticeNotifications?: (enabled: boolean) => void;
  onToggleSound: (enabled: boolean) => void;
  onToggleHaptic: (enabled: boolean) => void;
  onToggleTravelerMode: (enabled: boolean) => void;
  onUpdateCity: () => void;
  onOpenWidgetSettings?: () => void;
  onClose: () => void;
  colors: { text: string; textLight: string; accent: string; card: string; header: string; background: string };
  t: any;
}

const DEFAULT_SIZE = 22;

export function SettingsScreen({
  language, themeMode, fontSize, notificationsEnabled, bestPracticeNotificationsEnabled, soundEnabled, hapticEnabled, travelerMode, savedCity,
  onSetLanguage, onSetThemeMode, onSetFontSize, onToggleNotifications, onToggleBestPracticeNotifications,
  onToggleSound, onToggleHaptic, onToggleTravelerMode, onUpdateCity,
  onOpenWidgetSettings, onClose, colors, t,
}: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const isRtl = language === 'ar';

  const sampleArabic = 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ';
  const sampleTranslation = 'We have reached the morning and at this very time all sovereignty belongs to Allah.';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Reanimated.View sharedTransitionTag="screen.header" style={[styles.header, { backgroundColor: colors.header, paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { borderColor: colors.accent }]}>
            <ArrowLeft size={18} stroke={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t.settings}</Text>
          <View style={styles.backBtnSpacer} />
        </View>
      </Reanimated.View>

      <Reanimated.View sharedTransitionTag="screen.content" style={{ flex: 1 }}>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.language}</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                onPress={() => onSetLanguage('ar')}
                style={[styles.optionBtn, language === 'ar' && { backgroundColor: colors.accent + '30' }]}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>{t.languageArabic}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onSetLanguage('en')}
                style={[styles.optionBtn, language === 'en' && { backgroundColor: colors.accent + '30' }]}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>{t.languageEnglish}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.appTheme}</Text>
            <View style={styles.optionRow}>
              {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => onSetThemeMode(mode)}
                  style={[styles.optionBtn, themeMode === mode && { backgroundColor: colors.accent + '30' }]}
                >
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {mode === 'system' ? t.themeSystem : mode === 'light' ? t.themeLight : t.themeDark}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.fontSize}</Text>
              {fontSize !== DEFAULT_SIZE && (
                <TouchableOpacity
                  onPress={() => onSetFontSize(DEFAULT_SIZE)}
                  style={[styles.resetBtn, { borderColor: colors.accent + '40' }]}
                >
                  <RotateCcw size={12} stroke={colors.accent} />
                  <Text style={[styles.resetText, { color: colors.accent }]}>
                    {language === 'ar' ? 'إعادة ضبط' : 'Reset'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.fontSizeRow}>
              <TouchableOpacity
                onPress={() => onSetFontSize(Math.max(14, fontSize - 2))}
                disabled={fontSize <= 14}
                style={[
                  styles.fontSizeBtn,
                  { borderColor: colors.accent },
                  fontSize <= 14 && { opacity: 0.4 },
                ]}
              >
                <Text style={[styles.fontSizeBtnText, { color: colors.accent }]}>–</Text>
              </TouchableOpacity>

              <View style={styles.fontSizePreviewInfo}>
                <Text style={[styles.fontSizeValue, { color: colors.accent }]}>{fontSize} px</Text>
              </View>

              <TouchableOpacity
                onPress={() => onSetFontSize(Math.min(48, fontSize + 2))}
                disabled={fontSize >= 48}
                style={[
                  styles.fontSizeBtn,
                  { borderColor: colors.accent },
                  fontSize >= 48 && { opacity: 0.4 },
                ]}
              >
                <Text style={[styles.fontSizeBtnText, { color: colors.accent }]}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Live Sample Card */}
            <View style={[styles.sampleCard, { backgroundColor: colors.background, borderColor: colors.accent + '30' }]}>
              <Text
                style={[
                  styles.sampleArabicText,
                  {
                    color: colors.text,
                    fontSize: fontSize,
                    lineHeight: Math.round(fontSize * 1.6),
                    fontFamily: 'Cairo_700Bold',
                  },
                ]}
              >
                {sampleArabic}
              </Text>
              {language === 'en' && (
                <Text
                  style={[
                    styles.sampleTranslationText,
                    {
                      color: colors.textLight,
                      fontSize: Math.max(11, Math.round(13 * (fontSize / 22))),
                    },
                  ]}
                >
                  {sampleTranslation}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionTitleRow}>
              <LocationIcon color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'ar' ? 'المدينة' : 'City'}
              </Text>
            </View>
            <View style={styles.cityRow}>
              <Text style={[styles.cityText, { color: colors.text }]}>
                {savedCity || (language === 'ar' ? 'غير معروفة' : 'Unknown')}
              </Text>
              <TouchableOpacity onPress={onUpdateCity} style={[styles.updateCityBtn, { borderColor: colors.accent }]}>
                <Text style={[styles.updateCityText, { color: colors.accent }]}>
                  {language === 'ar' ? 'تحديث' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.sectionTitleRow}>
                  <AirplaneIcon color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {language === 'ar' ? 'وضع المسافر' : 'Traveler Mode'}
                  </Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.textLight }]}>
                  {language === 'ar'
                    ? 'التحديث التلقائي عند تغير المنطقة الزمنية'
                    : 'Auto-update location on timezone change'}
                </Text>
              </View>
              <Switch
                value={travelerMode}
                onValueChange={onToggleTravelerMode}
                trackColor={{ false: colors.textLight + '40', true: colors.accent + '60' }}
                thumbColor={travelerMode ? colors.accent : colors.textLight}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.sectionTitleRow}>
                  <SoundIcon color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.soundEffects}</Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.textLight }]}>
                  {t.soundDescription}
                </Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={onToggleSound}
                trackColor={{ false: colors.textLight + '40', true: colors.accent + '60' }}
                thumbColor={soundEnabled ? colors.accent : colors.textLight}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.sectionTitleRow}>
                  <HapticIcon color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.hapticFeedback}</Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.textLight }]}>
                  {t.hapticDescription}
                </Text>
              </View>
              <Switch
                value={hapticEnabled}
                onValueChange={onToggleHaptic}
                trackColor={{ false: colors.textLight + '40', true: colors.accent + '60' }}
                thumbColor={hapticEnabled ? colors.accent : colors.textLight}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.sectionTitleRow}>
                  <NotificationIcon color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.notifications}</Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.textLight }]}>
                  {language === 'ar' ? 'أذكار الصباح والمساء والنوم' : 'Morning, evening & sleep azkar'}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={onToggleNotifications}
                trackColor={{ false: colors.textLight + '40', true: colors.accent + '60' }}
                thumbColor={notificationsEnabled ? colors.accent : colors.textLight}
              />
            </View>
            {onToggleBestPracticeNotifications ? (
              <View style={[styles.switchRow, { marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionSub, { color: colors.text, fontWeight: '600' }]}>{t.bestPracticeNotifications}</Text>
                </View>
                <Switch
                  value={bestPracticeNotificationsEnabled ?? false}
                  onValueChange={onToggleBestPracticeNotifications}
                  trackColor={{ false: colors.textLight + '40', true: colors.accent + '60' }}
                  thumbColor={bestPracticeNotificationsEnabled ? colors.accent : colors.textLight}
                />
              </View>
            ) : null}
          </View>

          {onOpenWidgetSettings ? (
            <TouchableOpacity onPress={onOpenWidgetSettings} style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.sectionTitleRow}>
                <WidgetIcon color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {language === 'ar' ? 'إعدادات الـ Widgets' : 'Widget Settings'}
                </Text>
              </View>
              <Text style={[styles.sectionSub, { color: colors.textLight }]}>
                {language === 'ar' ? 'تخصيص الثيم والشفافية للـ Widgets' : 'Customize widget theme and opacity'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderWidth: 2, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  backBtnSpacer: { width: 44, height: 44 },
  title: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 16 },
  section: { borderRadius: 16, padding: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderRadius: 8 },
  resetText: { fontSize: 12, fontWeight: '600' },
  optionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  optionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  optionText: { fontSize: 14, fontWeight: '600' },
  fontSizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 12 },
  fontSizeBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  fontSizeBtnText: { fontSize: 22, fontWeight: '700', lineHeight: 24 },
  fontSizePreviewInfo: { minWidth: 70, alignItems: 'center' },
  fontSizeValue: { fontSize: 16, fontWeight: '700' },
  sampleCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 4, alignItems: 'center' },
  sampleArabicText: { textAlign: 'center', writingDirection: 'rtl' },
  sampleTranslationText: { textAlign: 'center', marginTop: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  cityText: { fontSize: 15, fontWeight: '600' },
  updateCityBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1.5 },
  updateCityText: { fontSize: 13, fontWeight: '700' },
  sectionSub: { fontSize: 12, fontWeight: '500', marginTop: 4 },
});
