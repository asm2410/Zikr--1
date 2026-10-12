import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated from 'react-native-reanimated';
import { router } from 'expo-router';
import { ArrowLeft, Target } from 'lucide-react-native';
import { useTheme } from '../src/providers/ThemeProvider';
import { useLanguage } from '../src/providers/LanguageProvider';
import { TasbeehScreen, TasbeehScreenHandle } from '../src/features/tasbeeh/TasbeehScreen';
import { GlassIconButton } from '../src/components/GlassIconButton';

export default function TasbeehPage() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const tasbeehRef = useRef<TasbeehScreenHandle>(null);

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
          <Text style={[styles.title, { color: theme.colors.text }]}>{t.tasbeeh}</Text>
          <GlassIconButton
            icon={<Target size={20} stroke="#FFFFFF" />}
            label={language === 'ar' ? 'هدف' : 'Target'}
            color="teal"
            plate="tilt"
            tilt={15}
            size={48}
            onPress={() => tasbeehRef.current?.openTargetPicker()}
            isDark={theme.isDark}
            showLabel={false}
          />
        </Reanimated.View>
        <Reanimated.View sharedTransitionTag="screen.content" style={{ flex: 1 }}>
          <TasbeehScreen ref={tasbeehRef} colors={theme.colors} language={language} t={t} />
        </Reanimated.View>
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center', fontFamily: 'Cairo_700Bold' },
});
