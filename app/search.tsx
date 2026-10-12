import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTheme } from '../src/providers/ThemeProvider';
import { useLanguage } from '../src/providers/LanguageProvider';
import { useCurrentZikr } from '../src/providers/ZikrProvider';
import { SearchScreen } from '../src/features/search/SearchScreen';
import { getAllCategories, getAllZikr } from '../src/database/database';
import type { Zikr, ZikrCategory } from '../src/core/types';

export default function SearchPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { currentZikr, dispatch } = useCurrentZikr();
  const [categories, setCategories] = useState<ZikrCategory[]>([]);
  const [allZikr, setAllZikr] = useState<Zikr[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [cats, adhkar] = await Promise.all([getAllCategories(), getAllZikr()]);
        setCategories(cats);
        setAllZikr(adhkar);
      } catch {}
    })();
  }, []);

  const selectZikr = useCallback((zikr: Zikr) => {
    if (currentZikr && currentZikr.arabic !== zikr.arabic) {
      dispatch({ type: 'ADD_HISTORY', zikr: currentZikr });
    }
    dispatch({ type: 'SET_CURRENT_ZIKR', zikr });
  }, [currentZikr, dispatch]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <Reanimated.View sharedTransitionTag="screen.root" style={{ flex: 1 }}>
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <SearchScreen
          categories={categories}
          allZikr={allZikr}
          currentZikr={currentZikr}
          language={language}
          colors={theme.colors}
          isDark={theme.isDark}
          onSelectZikr={selectZikr}
          onBack={handleBack}
        />
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
