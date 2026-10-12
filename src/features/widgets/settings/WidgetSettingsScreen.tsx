import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated from 'react-native-reanimated';
import { loadWidgetSettings, saveWidgetSettings } from '../data/widgetSettings';
import type { WidgetSettings, SingleWidgetSettings } from '../data/widgetTypes';
import { useLanguage } from '../../../providers/LanguageProvider';
import { useTheme } from '../../../providers/ThemeProvider';

interface WidgetSettingsScreenProps {
  onClose: () => void;
}

const WIDGET_KEYS: Array<{ key: keyof WidgetSettings; titleKey: string; descKey: string }> = [
  { key: 'dhikr', titleKey: 'dailyDhikrWidget', descKey: 'widgetSettingsDescription' },
  { key: 'tasbeeh', titleKey: 'tasbeehWidget', descKey: 'widgetSettingsDescription' },
  { key: 'progress', titleKey: 'progressWidget', descKey: 'widgetSettingsDescription' },
  { key: 'bestPractice', titleKey: 'bestPracticeWidget', descKey: 'widgetSettingsDescription' },
];

const THEME_OPTIONS: Array<{ value: SingleWidgetSettings['theme']; labelKey: string }> = [
  { value: 'system', labelKey: 'widgetThemeSystem' },
  { value: 'app', labelKey: 'widgetThemeApp' },
  { value: 'light', labelKey: 'widgetThemeLight' },
  { value: 'dark', labelKey: 'widgetThemeDark' },
];

const OPACITY_STEPS = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

export function WidgetSettingsScreen({ onClose }: WidgetSettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [settings, setSettings] = useState<WidgetSettings | null>(null);

  useEffect(() => {
    loadWidgetSettings().then(setSettings);
  }, []);

  const updateWidget = (widget: keyof WidgetSettings, update: Partial<SingleWidgetSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings };
    const target = newSettings[widget] as SingleWidgetSettings;
    Object.assign(target, update);
    setSettings(newSettings);
    saveWidgetSettings(newSettings);
  };

  if (!settings) return null;

  const isRtl = language === 'ar';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Reanimated.View sharedTransitionTag="screen.header" style={[styles.header, { backgroundColor: theme.colors.header, paddingTop: insets.top + 16 }]}>
        <View style={[styles.headerRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t.widgetSettings}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeIcon, { color: theme.colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.description, { color: theme.colors.textLight }]}>
          {t.widgetSettingsDescription}
        </Text>
      </Reanimated.View>

      <Reanimated.View sharedTransitionTag="screen.content" style={{ flex: 1 }}>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {WIDGET_KEYS.map(({ key, titleKey }) => {
            const widget = settings[key] as SingleWidgetSettings;
            return (
              <View key={key} style={[styles.section, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {t[titleKey as keyof typeof t] as string}
                </Text>

                <Text style={[styles.label, { color: theme.colors.textLight }]}>
                  {t.widgetTheme}
                </Text>
                <View style={[styles.optionRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  {THEME_OPTIONS.map(({ value, labelKey }) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => updateWidget(key, { theme: value })}
                      style={[
                        styles.optionBtn,
                        widget.theme === value && { backgroundColor: theme.colors.accent + '30' },
                      ]}
                    >
                      <Text style={[styles.optionText, { color: widget.theme === value ? theme.colors.accent : theme.colors.text }]}>
                        {t[labelKey as keyof typeof t] as string}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: theme.colors.textLight, marginTop: 12 }]}>
                  {t.widgetOpacity}
                </Text>
                <Text style={[styles.labelSub, { color: theme.colors.textLight }]}>
                  {t.widgetOpacityDescription}
                </Text>
                <View style={[styles.opacityRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  {OPACITY_STEPS.map((opacity) => (
                    <TouchableOpacity
                      key={opacity}
                      onPress={() => updateWidget(key, { opacity })}
                      style={[
                        styles.opacityDot,
                        {
                          backgroundColor: theme.colors.accent,
                          opacity: Math.max(0.2, opacity || 0.1),
                          borderWidth: Math.abs(widget.opacity - opacity) < 0.01 ? 3 : 0,
                          borderColor: theme.colors.accent,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.opacityValue, { color: theme.colors.accent }]}>
                  {Math.round(widget.opacity * 100)}%
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  closeIcon: { fontSize: 22, fontWeight: '700' },
  description: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 16 },
  section: { borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  labelSub: { fontSize: 11, fontWeight: '500', marginBottom: 8 },
  optionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  optionText: { fontSize: 13, fontWeight: '600' },
  opacityRow: { flexDirection: 'row', gap: 4, alignItems: 'center', flexWrap: 'wrap' },
  opacityDot: { width: 20, height: 20, borderRadius: 10 },
  opacityValue: { fontSize: 14, fontWeight: '700', marginTop: 8, textAlign: 'center' },
});
