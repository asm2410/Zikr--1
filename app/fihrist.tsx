import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated as RNAnimated } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bookmark, History, Infinity, Sparkles, Wand2, X, ArrowUpDown, Check, RotateCcw } from 'lucide-react-native';
import { ReorderableList } from '../src/components/ReorderableList';
import { useTheme } from '../src/providers/ThemeProvider';
import { useLanguage } from '../src/providers/LanguageProvider';
import { useCurrentZikr, useZikrSaved, useCustomOrder } from '../src/providers/ZikrProvider';
import { SearchBar } from '../src/features/drawer/SearchBar';
import { CategoryList } from '../src/features/drawer/CategoryList';
import { ZikrListItem } from '../src/features/drawer/ZikrListItem';
import { PressCard } from '../src/components/PressCard';
import { normalizeArabicForSearch } from '../src/core/utils/arabic';
import { applyCustomOrder, getCategoryCustomOrder, getDefaultOrderIds } from '../src/core/utils/ordering';
import { getAllCategories, getAllZikr } from '../src/database/database';
import { MORNING_CATEGORY_ID, EVENING_CATEGORY_ID, ABSOLUTE_CATEGORY_ID } from '../src/core/constants';
import type { Zikr, ZikrCategory } from '../src/core/types';
import type { ListRenderItemInfo } from 'react-native';
import { GlassIconButton } from '../src/components/GlassIconButton';

type ViewMode = 'index' | 'category' | 'saved' | 'custom' | 'absolute';

function keyExtractor(item: Zikr) {
  return `z-${item.id}`;
}

export default function FihristScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { currentZikr, dispatch } = useCurrentZikr();
  const { savedZikr, savedCategoryIds } = useZikrSaved();
  const { customOrder, dispatch: orderDispatch } = useCustomOrder();

  const savedZikrRef = useRef(savedZikr);
  savedZikrRef.current = savedZikr;
  const savedCategoryIdsRef = useRef(savedCategoryIds);
  savedCategoryIdsRef.current = savedCategoryIds;

  const [categories, setCategories] = useState<ZikrCategory[]>([]);
  const [allZikr, setAllZikr] = useState<Zikr[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('index');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderData, setReorderData] = useState<Zikr[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [cats, adhkar] = await Promise.all([getAllCategories(), getAllZikr()]);
        setCategories(cats);
        setAllZikr(adhkar);
      } catch {}
    })();
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<number, ZikrCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const regularCategories = useMemo(
    () => categories.filter((c) => c.id !== 1 && c.id !== 2 && c.id !== ABSOLUTE_CATEGORY_ID && c.id !== 135),
    [categories],
  );

  const customCategories = useMemo(
    () => categories
      .filter((c) => c.id !== 135)
      .sort((a, b) => {
        if (a.id === 1) return -1;
        if (b.id === 1) return 1;
        if (a.id === 2) return -1;
        if (b.id === 2) return 1;
        if (a.id === ABSOLUTE_CATEGORY_ID) return -1;
        if (b.id === ABSOLUTE_CATEGORY_ID) return 1;
        return a.orderIndex - b.orderIndex;
      }),
    [categories],
  );

  const isSavedCategoryMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    savedCategoryIds.forEach((id) => { map[id] = true; });
    return map;
  }, [savedCategoryIds]);

  const savedCategories = useMemo(
    () => categories.filter((c) => savedCategoryIds.includes(c.id)),
    [categories, savedCategoryIds],
  );

  const rawBaseData = useMemo(() => {
    switch (viewMode) {
      case 'category':
        return selectedCategoryId ? allZikr.filter((a) => a.categoryId === selectedCategoryId) : [];
      case 'saved':
        return savedZikr;
      case 'custom':
        return allZikr;
      case 'absolute':
        return allZikr.filter((a) => a.categoryId === ABSOLUTE_CATEGORY_ID);
      default:
        return allZikr;
    }
  }, [viewMode, selectedCategoryId, allZikr, viewMode === 'saved' ? savedZikr : null]);

  const baseData = useMemo(() => {
    if (viewMode === 'category' && selectedCategoryId) {
      const sorted = [...rawBaseData].sort((a, b) => a.orderIndex - b.orderIndex);
      return applyCustomOrder(sorted, getCategoryCustomOrder(customOrder, selectedCategoryId));
    }
    return rawBaseData;
  }, [rawBaseData, viewMode, selectedCategoryId, customOrder]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return baseData;
    const normalized = normalizeArabicForSearch(searchQuery);
    return baseData.filter((zikr) => {
      const category = zikr.categoryId ? categoryMap.get(zikr.categoryId) : undefined;
      const categoryText = category ? `${category.subtitle} ${category.title}` : '';
      const haystack = normalizeArabicForSearch(
        `${zikr.title ?? ''} ${zikr.titleAr ?? ''} ${categoryText} ${zikr.arabic} ${zikr.transliteration ?? ''} ${zikr.translation} ${zikr.notes ?? ''}`
      );
      return haystack.includes(normalized);
    });
  }, [baseData, searchQuery, categoryMap]);

  const matchedCategories = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const normalized = normalizeArabicForSearch(searchQuery);
    return categories.filter((c) => {
      const haystack = normalizeArabicForSearch(`${c.subtitle} ${c.title}`);
      return haystack.includes(normalized);
    });
  }, [categories, searchQuery]);

  const activeZikr = currentZikr;

  const canReorder = viewMode === 'category' && (selectedCategoryId === MORNING_CATEGORY_ID || selectedCategoryId === EVENING_CATEGORY_ID);

  const enterReorderMode = useCallback(() => {
    setReorderData([...filteredItems]);
    setReorderMode(true);
  }, [filteredItems]);

  const exitReorderMode = useCallback(() => {
    setReorderMode(false);
    setReorderData([]);
  }, []);

  const saveReorder = useCallback(() => {
    if (selectedCategoryId !== null && reorderData.length > 0) {
      const orderIds = reorderData.map((z) => Number(z.id));
      const defaultIds = getDefaultOrderIds(allZikr.filter((z) => z.categoryId === selectedCategoryId));
      const isDefault = orderIds.length === defaultIds.length && orderIds.every((id, i) => id === defaultIds[i]);
      if (isDefault) {
        orderDispatch({ type: 'RESET_CUSTOM_ORDER', categoryId: selectedCategoryId });
      } else {
        orderDispatch({ type: 'UPDATE_CUSTOM_ORDER', categoryId: selectedCategoryId, order: orderIds });
      }
    }
    setReorderMode(false);
    setReorderData([]);
  }, [reorderData, selectedCategoryId, allZikr, orderDispatch]);

  const resetReorder = useCallback(() => {
    const defaultItems = allZikr
      .filter((z) => z.categoryId === selectedCategoryId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    setReorderData(defaultItems);
  }, [selectedCategoryId, allZikr]);

  const handleSelectZikr = useCallback((zikr: Zikr) => {
    if (activeZikr && activeZikr.arabic !== zikr.arabic) {
      dispatch({ type: 'ADD_HISTORY', zikr: activeZikr });
    }
    dispatch({ type: 'SET_CURRENT_ZIKR', zikr });
    router.back();
  }, [dispatch, activeZikr]);

  const handleSelectCategory = useCallback((id: number) => {
    setSelectedCategoryId(id);
    setViewMode('category');
    setSearchQuery('');
    setReorderMode(false);
  }, []);

  const handleBackToIndex = useCallback(() => {
    setViewMode('index');
    setSelectedCategoryId(null);
    setSearchQuery('');
    setReorderMode(false);
  }, []);

  const getIsActive = useCallback((zikr: Zikr) => activeZikr?.arabic === zikr.arabic, [activeZikr]);

  const selectItem = useCallback((zikr: Zikr) => handleSelectZikr(zikr), [handleSelectZikr]);

  const handleToggleSaveItem = useCallback((zikr: Zikr) => {
    const isItemSaved = savedZikrRef.current.some((s) => s.arabic === zikr.arabic);
    if (isItemSaved) {
      dispatch({ type: 'REMOVE_SAVED', arabic: zikr.arabic });
    } else {
      dispatch({ type: 'SAVE_ZIKR', zikr });
    }
  }, [dispatch]);

  const handleToggleSaveCategory = useCallback((category: ZikrCategory) => {
    if (savedCategoryIdsRef.current.includes(category.id)) {
      dispatch({ type: 'REMOVE_SAVED_CATEGORY', categoryId: category.id });
    } else {
      dispatch({ type: 'SAVE_CATEGORY', categoryId: category.id });
    }
  }, [dispatch]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<Zikr>) => (
    <ZikrListItem
      zikr={item}
      isActive={getIsActive(item)}
      onSelect={selectItem}
      colors={theme.colors}
      showArabic={language !== 'en'}
      showTransliteration={language === 'en'}
      showTranslation={language === 'en'}
      showTitle={viewMode === 'custom'}
      isSaved={savedZikrRef.current.some((s) => s.arabic === item.arabic)}
      onToggleSave={handleToggleSaveItem}
    />
  ), [theme.colors, language, selectItem, getIsActive, viewMode, handleToggleSaveItem]);

  const renderDragItem = useCallback((item: Zikr, isActive: boolean) => (
    <View
      style={[
        styles.dragItem,
        { backgroundColor: isActive ? theme.colors.accent + '30' : theme.colors.card, borderColor: theme.colors.accent + '40' },
      ]}
    >
      <View style={styles.dragHandle}>
        <Text style={{ color: theme.colors.textLight, fontSize: 18 }}>⠿</Text>
      </View>
      <View style={{ flex: 1 }}>
        {language !== 'en' && (
          <Text style={[styles.dragArabic, { color: theme.colors.text }]} numberOfLines={2}>{item.arabic}</Text>
        )}
        {language === 'en' && item.translation && (
          <Text style={[styles.dragTranslation, { color: theme.colors.textLight }]} numberOfLines={2}>{item.translation}</Text>
        )}
        {item.count > 1 && (
          <Text style={[styles.dragBadge, { color: theme.colors.accent }]}>×{item.count}</Text>
        )}
      </View>
    </View>
  ), [theme.colors, language]);

  const handleNavigateHistory = useCallback(() => {
    router.push('/history');
  }, []);

  const handleNavigateTasbeeh = useCallback(() => {
    router.push('/tasbeeh');
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  const screenTitle = viewMode === 'category' && selectedCategoryId
    ? (() => {
        const cat = categories.find((c) => c.id === selectedCategoryId);
        return cat ? (language === 'ar' ? cat.subtitle || cat.title : cat.title || cat.subtitle) : '';
      })()
    : viewMode === 'saved'
      ? (language === 'ar' ? 'الأذكار المحفوظة' : 'Saved ZIKR')
    : viewMode === 'custom'
      ? (language === 'ar' ? 'الأذكار المخصصة' : 'Custom ZIKR')
    : viewMode === 'absolute'
      ? (language === 'ar' ? 'الأذكار المطلقة' : 'Absolute ZIKR')
      : (language === 'ar' ? 'فهرس الأذكار' : 'ZIKR Index');

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.header, paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              {viewMode !== 'index' && (
                <GlassIconButton
                  icon={<ArrowLeft size={20} stroke="#FFFFFF" />}
                  color="blue"
                  plate="tilt"
                  tilt={-15}
                  size={42}
                  onPress={handleBackToIndex}
                  isDark={theme.isDark}
                  showLabel={false}
                />
              )}
              <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                {reorderMode ? (language === 'ar' ? 'ترتيب الأذكار' : 'Reorder ZIKR') : screenTitle}
              </Text>
            </View>
            {reorderMode ? (
              <View style={styles.reorderActions}>
                <GlassIconButton
                  icon={<RotateCcw size={16} stroke="#FFFFFF" />}
                  color="orange"
                  plate="tilt"
                  tilt={-10}
                  size={38}
                  onPress={resetReorder}
                  isDark={theme.isDark}
                  showLabel={false}
                />
                <GlassIconButton
                  icon={<X size={16} stroke="#FFFFFF" />}
                  color="red"
                  plate="tilt"
                  tilt={10}
                  size={38}
                  onPress={exitReorderMode}
                  isDark={theme.isDark}
                  showLabel={false}
                />
                <GlassIconButton
                  icon={<Check size={16} stroke="#FFFFFF" />}
                  color="teal"
                  plate="tilt"
                  tilt={15}
                  size={38}
                  onPress={saveReorder}
                  isDark={theme.isDark}
                  showLabel={false}
                />
              </View>
            ) : (
              <GlassIconButton
                icon={<X size={20} stroke="#FFFFFF" />}
                color="red"
                plate="tilt"
                tilt={15}
                size={42}
                onPress={() => router.back()}
                isDark={theme.isDark}
                showLabel={false}
              />
            )}
          </View>
          {reorderMode ? (
            <Text style={[styles.reorderHint, { color: theme.colors.textLight }]}>
              {language === 'ar' ? 'اضغط مطولاً ثم اسحب الأذكار لإعادة ترتيبها' : 'Press and hold, then drag azkar to reorder them'}
            </Text>
          ) : (
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={language === 'ar' ? 'ابحث عن ذكر مثل: الصباح، المساء، النوم' : "Search like: morning, evening, sleep"}
              colors={theme.colors}
            />
          )}
        </View>

        <View style={{ flex: 1 }}>
          {reorderMode ? (
            <ReorderableList
              data={reorderData}
              keyExtractor={keyExtractor}
              renderItem={renderDragItem}
              onReorder={setReorderData}
              itemHeight={80}
            />
          ) : isSearching ? (
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
                      onSelect={(c) => { handleSelectCategory(c.id); }}
                      getLabel={(c) => language === 'ar' ? c.subtitle || c.title : c.title || c.subtitle}
                      getSubLabel={() => null}
                      adhkarCount={(id) => allZikr.filter((a) => a.categoryId === id).length}
                      colors={theme.colors}
                      isSavedMap={isSavedCategoryMap}
                      onToggleSave={handleToggleSaveCategory}
                    />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                matchedCategories.length === 0 && filteredItems.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>
                    {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                  </Text>
                ) : null
              }
            />
          ) : viewMode === 'custom' ? (
            <RNAnimated.ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              <CategoryList
                categories={customCategories}
                onSelect={(c) => handleSelectCategory(c.id)}
                getLabel={(c) => language === 'ar' ? c.subtitle || c.title : c.title || c.subtitle}
                getSubLabel={() => null}
                adhkarCount={(id) => allZikr.filter((a) => a.categoryId === id).length}
                colors={theme.colors}
                isSavedMap={isSavedCategoryMap}
                onToggleSave={handleToggleSaveCategory}
              />
            </RNAnimated.ScrollView>
          ) : viewMode !== 'index' ? (
            <View style={{ flex: 1 }}>
              {canReorder && (
                <TouchableOpacity
                  onPress={enterReorderMode}
                  style={[styles.reorderToggleBtn, { backgroundColor: theme.colors.accent + '15', borderColor: theme.colors.accent + '40' }]}
                >
                  <ArrowUpDown size={16} stroke={theme.colors.accent} />
                  <Text style={[styles.reorderToggleText, { color: theme.colors.accent }]}>
                    {language === 'ar' ? 'ترتيب الأذكار' : 'Reorder ZIKR'}
                  </Text>
                </TouchableOpacity>
              )}
              <FlatList
                style={styles.list}
                contentContainerStyle={styles.listContent}
                data={filteredItems}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListHeaderComponent={
                  viewMode === 'saved' && savedCategories.length > 0 ? (
                    <View style={{ marginBottom: 16 }}>
                      <CategoryList
                        categories={savedCategories}
                        onSelect={(c) => handleSelectCategory(c.id)}
                        getLabel={(c) => language === 'ar' ? c.subtitle || c.title : c.title || c.subtitle}
                        getSubLabel={() => null}
                        adhkarCount={(id) => allZikr.filter((a) => a.categoryId === id).length}
                        colors={theme.colors}
                        isSavedMap={isSavedCategoryMap}
                        onToggleSave={handleToggleSaveCategory}
                      />
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  filteredItems.length === 0 && savedCategories.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>
                      {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                    </Text>
                  ) : null
                }
              />
            </View>
          ) : (
            <RNAnimated.ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.grid}>
                <View style={{ width: '100%', padding: 5 }}>
                  <PressCard onPress={() => { setViewMode('saved'); setSearchQuery(''); }}>
                    <View style={[styles.gridCardInner, { backgroundColor: theme.colors.card, borderColor: theme.colors.accent + '60' }]}>
                      <View style={styles.gridIconWrap}>
                        <Bookmark size={28} stroke={theme.colors.accent} fill={theme.colors.accent + '40'} />
                      </View>
                      <Text style={[styles.gridLabel, { color: theme.colors.text }]} numberOfLines={1}>
                        {language === 'ar' ? 'الأذكار المحفوظة' : 'Saved ZIKR'}
                      </Text>
                      <View style={[styles.gridCountBadge, { backgroundColor: theme.colors.accent, position: 'absolute', top: -6, right: 8 }]}>
                        <Text style={styles.gridCountText}>{savedZikr.length}</Text>
                      </View>
                    </View>
                  </PressCard>
                </View>
                <View style={{ width: '50%', padding: 5 }}>
                  <PressCard onPress={handleNavigateHistory}>
                    <View style={[styles.gridCardInner, { backgroundColor: theme.colors.card, borderColor: theme.colors.accent + '60' }]}>
                      <View style={styles.gridIconWrap}>
                        <History size={22} stroke={theme.colors.accent} />
                      </View>
                      <Text style={[styles.gridLabel, { color: theme.colors.text }]} numberOfLines={1}>
                        {language === 'ar' ? 'السجل' : 'History'}
                      </Text>
                    </View>
                  </PressCard>
                </View>
                <View style={{ width: '50%', padding: 5 }}>
                  <PressCard onPress={handleNavigateTasbeeh}>
                    <View style={[styles.gridCardInner, { backgroundColor: theme.colors.card, borderColor: theme.colors.accent + '60' }]}>
                      <View style={styles.gridIconWrap}>
                        <Wand2 size={22} stroke={theme.colors.accent} />
                      </View>
                      <Text style={[styles.gridLabel, { color: theme.colors.text }]} numberOfLines={1}>
                        {language === 'ar' ? 'مسبحة' : 'Tasbeeh'}
                      </Text>
                    </View>
                  </PressCard>
                </View>
                <View style={{ width: '50%', padding: 5 }}>
                  <PressCard onPress={() => { setViewMode('custom'); setSearchQuery(''); }}>
                    <View style={[styles.gridCardInner, { backgroundColor: theme.colors.card, borderColor: theme.colors.accent + '60' }]}>
                      <View style={styles.gridIconWrap}>
                        <Sparkles size={22} stroke={theme.colors.accent} />
                      </View>
                      <Text style={[styles.gridLabel, { color: theme.colors.text }]} numberOfLines={1}>
                        {language === 'ar' ? 'الأذكار المخصصة' : 'Custom Adhkar'}
                      </Text>
                    </View>
                  </PressCard>
                </View>
                <View style={{ width: '50%', padding: 5 }}>
                  <PressCard onPress={() => { setViewMode('absolute'); setSearchQuery(''); }}>
                    <View style={[styles.gridCardInner, { backgroundColor: theme.colors.card, borderColor: theme.colors.accent + '60' }]}>
                      <View style={styles.gridIconWrap}>
                        <Infinity size={22} stroke={theme.colors.accent} />
                      </View>
                      <Text style={[styles.gridLabel, { color: theme.colors.text }]} numberOfLines={1}>
                        {language === 'ar' ? 'الأذكار المطلقة' : 'Absolute ZIKR'}
                      </Text>
                    </View>
                  </PressCard>
                </View>
              </View>

              {regularCategories.length > 0 && (
                <>
                  <View style={styles.sectionSeparator}>
                    <View style={[styles.separatorLine, { backgroundColor: theme.colors.accent + '30' }]} />
                    <Text style={[styles.separatorText, { color: theme.colors.textLight }]}>
                      {language === 'ar' ? 'جميع الأذكار' : 'All ZIKR'}
                    </Text>
                    <View style={[styles.separatorLine, { backgroundColor: theme.colors.accent + '30' }]} />
                  </View>
                  <CategoryList
                    categories={regularCategories}
                    onSelect={(c) => handleSelectCategory(c.id)}
                    getLabel={(c) => language === 'ar' ? c.subtitle || c.title : c.title || c.subtitle}
                    getSubLabel={() => null}
                    adhkarCount={(id) => allZikr.filter((a) => a.categoryId === id).length}
                    colors={theme.colors}
                    isSavedMap={isSavedCategoryMap}
                    onToggleSave={handleToggleSaveCategory}
                  />
                </>
              )}
            </RNAnimated.ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  backBtn: { width: 44, height: 44, borderWidth: 2, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 44, height: 44, borderWidth: 2, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  reorderBtn: { width: 36, height: 36, borderWidth: 2, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reorderActions: { flexDirection: 'row', gap: 6 },
  reorderHint: { fontSize: 13, textAlign: 'center' },
  reorderToggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginTop: 8, marginBottom: 4, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  reorderToggleText: { fontSize: 14, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },
  emptyText: { textAlign: 'center', paddingVertical: 32, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCardInner: { borderRadius: 18, borderWidth: 1.5, padding: 16, height: 130, alignItems: 'center', justifyContent: 'flex-start', gap: 4, paddingTop: 16 },
  gridIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  gridLabel: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  gridCountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, zIndex: 10, elevation: 4 },
  gridCountText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  sectionSeparator: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  separatorLine: { flex: 1, height: 1 },
  separatorText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  dragItem: { flex: 1, paddingHorizontal: 12, borderRadius: 16, borderRightWidth: 4, flexDirection: 'row', alignItems: 'center' },
  dragHandle: { width: 32, alignItems: 'center', justifyContent: 'center' },
  dragArabic: { fontSize: 14, fontWeight: '600' },
  dragTranslation: { fontSize: 13 },
  dragBadge: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});
