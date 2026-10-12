import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type WidgetSettings,
  type SingleWidgetSettings,
  DEFAULT_WIDGET_SETTINGS,
  WIDGET_SETTINGS_KEY,
} from './widgetTypes';

export async function loadWidgetSettings(): Promise<WidgetSettings> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WidgetSettings;
      if (parsed.version === DEFAULT_WIDGET_SETTINGS.version) {
        return parsed;
      }
    }
  } catch {}
  return { ...DEFAULT_WIDGET_SETTINGS };
}

export async function saveWidgetSettings(settings: WidgetSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export async function updateSingleWidgetSetting(
  widget: keyof WidgetSettings,
  update: Partial<SingleWidgetSettings>,
): Promise<WidgetSettings> {
  const settings = await loadWidgetSettings();
  const target = settings[widget] as SingleWidgetSettings;
  Object.assign(target, update);
  await saveWidgetSettings(settings);
  return settings;
}
