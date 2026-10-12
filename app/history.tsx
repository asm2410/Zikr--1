import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated from 'react-native-reanimated';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../src/providers/ThemeProvider';
import { useLanguage } from '../src/providers/LanguageProvider';
import { useCurrentZikr, useZikrSaved } from '../src/providers/ZikrProvider';
import { HistoryScreen } from '../src/features/history/HistoryScreen';
import { getAllZikr } from '../src/database/database';
import { GlassIconButton } from '../src/components/GlassIconButton';

export default function HistoryPage() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const { dispatch } = useCurrentZikr();
  const { savedZikr, countRecords, history } = useZikrSaved();

  const selectZikr = async (arabicText: string) => {
    const all = await getAllZikr();
    const zikr = all.find((a) => a.arabic === arabicText);
    if (zikr) {
      dispatch({ type: 'SET_CURRENT_ZIKR', zikr });
      router.back();
    }
  };

  const removeSaved = (arabic: string) => {
    dispatch({ type: 'REMOVE_SAVED', arabic });
  };

  return (
    <Reanimated.View sharedTransitionTag="screen.root" style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Reanimated.View sharedTransitionTag="screen.header" style={[styles.header, { backgroundColor: theme.colors.header, paddingTop: insets.top + 16 }]}>
          <GlassIconButton
            icon={<ArrowLeft size={22} stroke={theme.colors.text} />}
            color="blue"
            plate="tilt"
            tilt={-15}
            size={48}
            onPress={() => router.back()}
            isDark={theme.isDark}
            showLabel={false}
          />
        </Reanimated.View>
        <Reanimated.View sharedTransitionTag="screen.content" style={{ flex: 1 }}>
          <HistoryScreen
            history={history}
            savedZikr={savedZikr}
            countRecords={countRecords}
            onSelectZikr={(zikr) => {
              dispatch({ type: 'SET_CURRENT_ZIKR', zikr });
              router.back();
            }}
            onRemoveSaved={removeSaved}
            colors={theme.colors}
            language={language}
            t={t}
          />
        </Reanimated.View>
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingVertical: 12,
  },
});
