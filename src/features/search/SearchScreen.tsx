import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { SearchIcon } from '../../components/SearchIcon';
import { ZikrListItem } from '../drawer/ZikrListItem';
import { CategoryList } from '../drawer/CategoryList';
import { normalizeArabicForSearch } from '../../core/utils/arabic';
import { useSearchContext } from './SearchContext';
import type { Zikr, ZikrCategory } from '../../core/types';

interface SearchScreenProps {
  categories: ZikrCategory[];
  allZikr: Zikr[];
  currentZikr: Zikr | null;
  language: 'ar' | 'en';
  colors: { background: string; text: string; textLight: string; accent: string; card: string; header: string };
  onSelectZikr: (zikr: Zikr) => void;
  onBack: () => void;
  isDark: boolean;
}

function keyExtractor(_item: Zikr, index: number) {
  return `sz-${index}`;
}

export function SearchScreen({
  categories, allZikr, currentZikr, language, colors, onSelectZikr, onBack, isDark,
}: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { searchQuery, setSearchQuery } = useSearchContext();
  const inputRef = useRef<TextInput>(null);
  const inputWidth = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = React.useState(false);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  useEffect(() => {
    Animated.timing(inputWidth, {
      toValue: isFocused ? 1 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [isFocused, inputWidth]);

  const widthInterpolated = inputWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [240, 280],
  });

  const categoryMap = useMemo(() => {
    const map = new Map<number, ZikrCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const normalized = normalizeArabicForSearch(searchQuery);
    return allZikr.filter((zikr) => {
      const category = zikr.categoryId ? categoryMap.get(zikr.categoryId) : undefined;
      const categoryText = category ? `${category.subtitle} ${category.title}` : '';
      const haystack = normalizeArabicForSearch(
        `${zikr.title ?? ''} ${zikr.titleAr ?? ''} ${categoryText} ${zikr.arabic} ${zikr.transliteration ?? ''} ${zikr.translation} ${zikr.notes ?? ''}`
      );
      return haystack.includes(normalized);
    });
  }, [allZikr, searchQuery, categoryMap]);

  const matchedCategories = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const normalized = normalizeArabicForSearch(searchQuery);
    return categories.filter((c) => {
      const haystack = normalizeArabicForSearch(`${c.subtitle} ${c.title}`);
      return haystack.includes(normalized);
    });
  }, [categories, searchQuery]);

  const selectItem = useCallback((zikr: Zikr) => {
    onSelectZikr(zikr);
    onBack();
  }, [onSelectZikr, onBack]);

  const getIsActive = useCallback((zikr: Zikr) => currentZikr?.arabic === zikr.arabic, [currentZikr]);

  const renderItem = useCallback(({ item }: { item: Zikr }) => (
    <ZikrListItem
      zikr={item}
      isActive={getIsActive(item)}
      onSelect={selectItem}
      colors={colors}
      showArabic={language !== 'en'}
      showTransliteration={language === 'en'}
      showTranslation={language === 'en'}
    />
  ), [colors, language, selectItem, getIsActive]);

  const showResults = searchQuery.trim().length > 0;
  const hasResults = filteredItems.length > 0 || matchedCategories.length > 0;

  const glassBg = isDark
    ? 'rgba(50, 50, 60, 0.63)'
    : 'rgba(217, 217, 217, 0.63)';
  const textColor = isDark ? '#e0e0e0' : '#222222';
  const placeholderColor = isDark ? 'rgba(200,200,200,0.5)' : 'rgba(34,34,34,0.5)';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { borderColor: colors.accent }]}>
          <ArrowLeft size={18} stroke={colors.accent} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SearchIcon size={18} stroke={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {language === 'ar' ? 'بحث' : 'Search'}
          </Text>
        </View>
        <View style={styles.backBtnSpacer} />
      </View>

      {/* Search Input */}
      <View style={styles.inputContainer}>
        <Animated.View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: glassBg,
              width: widthInterpolated,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={language === 'ar' ? 'ابحث عن ذكر مثل: الصباح، المساء، النوم' : "Search for a dhikr like: morning, evening, sleep"}
            placeholderTextColor={placeholderColor}
            style={[styles.input, { color: textColor }]}
            returnKeyType="search"
            textAlign="center"
          />
        </Animated.View>
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={[styles.clearBtn, { backgroundColor: colors.textLight + '30' }]}
          >
            <Text style={[styles.clearBtnText, { color: colors.textLight }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {showResults ? (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={filteredItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={
            matchedCategories.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <CategoryList
                  categories={matchedCategories}
                  onSelect={(c) => {
                    setSearchQuery(c.subtitle || c.title);
                  }}
                  getLabel={(c) => language === 'ar' ? c.subtitle || c.title : c.title || c.subtitle}
                  getSubLabel={() => null}
                  adhkarCount={(id) => allZikr.filter((a) => a.categoryId === id).length}
                  colors={colors}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !hasResults ? (
              <View style={styles.emptyContainer}>
                <SearchIcon size={80} stroke={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textLight }]}>
                  {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <SearchIcon size={80} stroke={colors.textLight} />
          <Text style={[styles.emptySubText, { color: colors.textLight }]}>
            {language === 'ar' ? 'ابدأ بكتابة كلمة للبحث في الأذكار' : 'Start typing to search through ZIKR'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { width: 44, height: 44, borderWidth: 2, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  backBtnSpacer: { width: 44, height: 44 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  inputWrapper: {
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  input: {
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
    width: '100%',
    textAlign: 'center',
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: { fontSize: 12, fontWeight: '700' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  emptySubText: { fontSize: 13, fontWeight: '500', textAlign: 'center', paddingHorizontal: 40 },
});
