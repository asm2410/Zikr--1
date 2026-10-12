import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ArrowLeft, Bookmark, History, Infinity, Sparkles, Wand2, ArrowUpDown, Check, RotateCcw } from 'lucide-react-native';
import { ReorderableList } from '../../components/ReorderableList';
import { SearchBar } from './SearchBar';
import { CategoryList } from './CategoryList';
import { ZikrListItem } from './ZikrListItem';
import { PressCard } from '../../components/PressCard';
import { normalizeArabicForSearch } from '../../core/utils/arabic';
import { applyCustomOrder, getCategoryCustomOrder, getDefaultOrderIds } from '../../core/utils/ordering';
import { MORNING_CATEGORY_ID, EVENING_CATEGORY_ID, ABSOLUTE_CATEGORY_ID } from '../../core/constants';
import type { Zikr, ZikrCategory, CustomOrder } from '../../core/types';
import type { DrawerFilter } from '../../core/types';
import type { ListRenderItemInfo } from 'react-native';

interface DrawerLayoutProps {
  categories: ZikrCategory[];
  allZikr: Zikr[];
  savedZikr: Zikr[];
  savedCategoryIds: number[];
  currentZikr: Zikr | null;
  filter: DrawerFilter;
  selectedCategoryId: number | null;
  language: 'ar' | 'en';
  colors: { background: string; text: string; textLight: string; accent: string; card: string; header: string };
  onSelectZikr: (zikr: Zikr) => void;
  onSelectCategory: (id: number) => void;
  onSetFilter: (filter: DrawerFilter) => void;
  onToggleSave: (zikr: Zikr) => void;
  onToggleSaveCategory: (category: ZikrCategory) => void;
  onClose: () => void;
  onNavigateHistory: () => void;
  onNavigateTasbeeh: () => void;
  customOrder: CustomOrder;
  dispatch: React.Dispatch<any>;
}

function keyExtractor(item: Zikr) {
  return `z-${item.id}`;
}

export const DrawerLayout = React.memo(function DrawerLayout({
  categories, allZikr, savedZikr, savedCategoryIds, currentZikr,
  filter, selectedCategoryId,
  language, colors,
  onSelectZikr, onSelectCategory, onSetFilter, onToggleSave, onToggleSaveCategory, onClose, onNavigateHistory, onNavigateTasbeeh,
  customOrder, dispatch,
}: DrawerLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderData, setReorderData] = useState<Zikr[]>([]);
  const insets = useSafeAreaInsets();

  const categoryMap = useMemo(() => {
    const map = new Map<number, ZikrCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const isSavedCategoryMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    savedCategoryIds.forEach((id) => { map[id] = true; });
    return map;
  }, [savedCategoryIds]);

  const savedCategories = useMemo(
    () => categories.filter((c) => savedCategoryIds.includes(c.id)),
    [categories, savedCategoryIds],
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

  const rawFilteredItems = useMemo(() => {
    const items = getItemsForFilter(filter, selectedCategoryId, categories, allZikr, savedZikr);
    const categoryId =
      filter === 'morning' ? MORNING_CATEGORY_ID
      : filter === 'evening' ? EVENING_CATEGORY_ID
      : filter === 'category' ? selectedCategoryId
      : null;
    if (categoryId !== null) {
      return applyCustomOrder(
        [...items].sort((a, b) => a.orderIndex - b.orderIndex),
        getCategoryCustomOrder(customOrder, categoryId),
      );
    }
    return items;
  }, [filter, selectedCategoryId, categories, allZikr, savedZikr, customOrder]);

  const filteredItems = useMemo(() => {
    if (searchQuery.trim()) {
      const normalized = normalizeArabicForSearch(searchQuery);
      return rawFilteredItems.filter((zikr) => {
        const category = zikr.categoryId ? categoryMap.get(zikr.categoryId) : undefined;
        const categoryText = category ? `${category.subtitle} ${category.title}` : '';
        const haystack = normalizeArabicForSearch(
          `${zikr.title ?? ''} ${zikr.titleAr ?? ''} ${categoryText} ${zikr.arabic} ${zikr.transliteration ?? ''} ${zikr.translation} ${zikr.notes ?? ''}`
        );
        return haystack.includes(normalized);
      });
    }
    return rawFilteredItems;
  }, [rawFilteredItems, searchQuery, categoryMap]);

  const matchedCategories = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const normalized = normalizeArabicForSearch(searchQuery);
    return categories.filter((c) => {
      const haystack = normalizeArabicForSearch(`${c.subtitle} ${c.title}`);
      return haystack.includes(normalized);
    });
  }, [categories, searchQuery]);

  const isIndexView = filter === 'index';
  const isSearching = searchQuery.trim().length > 0;
  const showBack = !isIndexView;
  const activeCategoryId =
    filter === 'morning' ? MORNING_CATEGORY_ID
    : filter === 'evening' ? EVENING_CATEGORY_ID
    : filter === 'category' ? selectedCategoryId
    : null;
  const canReorder = activeCategoryId === MORNING_CATEGORY_ID || activeCategoryId === EVENING_CATEGORY_ID;

  const enterReorderMode = useCallback(() => {
    setReorderData([...filteredItems]);
    setReorderMode(true);
  }, [filteredItems]);

  const exitReorderMode = useCallback(() => {
    setReorderMode(false);
    setReorderData([]);
  }, []);

  const saveReorder = useCallback(() => {
    if (activeCategoryId !== null && reorderData.length > 0) {
      const orderIds = reorderData.map((z) => Number(z.id));
      const defaultIds = getDefaultOrderIds(allZikr.filter((z) => z.categoryId === activeCategoryId));
      const isDefault = orderIds.length === defaultIds.length && orderIds.every((id, i) => id === defaultIds[i]);
      if (isDefault) {
        dispatch({ type: 'RESET_CUSTOM_ORDER', categoryId: activeCategoryId });
      } else {
        dispatch({ type: 'UPDATE_CUSTOM_ORDER', categoryId: activeCategoryId, order: orderIds });
      }
    }
    setReorderMode(false);
    setReorderData([]);
  }, [reorderData, activeCategoryId, allZikr, dispatch]);

  const resetReorder = useCallback(() => {
    const defaultItems = allZikr
      .filter((z) => z.categoryId === activeCategoryId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    setReorderData(defaultItems);
  }, [activeCategoryId, allZikr]);

  const selectItem = useCallback((zikr: Zikr) => {
    onSelectZikr(zikr);
    onClose();
  }, [onSelectZikr, onClose]);
  const getIsActive = useCallback((zikr: Zikr) => currentZikr?.arabic === zikr.arabic, [currentZikr]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<Zikr>) => (
    <ZikrListItem
      zikr={item}
      isActive={getIsActive(item)}
      onSelect={selectItem}
      colors={colors}
      showArabic={language !== 'en'}
      showTransliteration={language === 'en'}
      showTranslation={language === 'en'}
      showTitle={filter === 'custom'}
      isSaved={savedZikr.some((s) => s.arabic === item.arabic)}
      onToggleSave={onToggleSave}
    />
  ), [colors, language, selectItem, getIsActive, filter, savedZikr, onToggleSave]);

  const renderDragItem = useCallback((item: Zikr, isActive: boolean) => (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isActive ? colors.accent + '30' : colors.card,
          borderRightColor: colors.accent,
          flexDirection: 'row',
          alignItems: 'center',
          height: 80,
        },
      ]}
    >
      <View style={styles.dragHandle}>
        <Text style={{ color: colors.textLight, fontSize: 18 }}>⠿</Text>
      </View>
      <View style={{ flex: 1 }}>
        {language !== 'en' && (
          <Text style={[styles.dragArabic, { color: colors.text }]} numberOfLines={2}>{item.arabic}</Text>
        )}
        {language === 'en' && item.translation && (
          <Text style={[styles.dragTranslation, { color: colors.textLight }]} numberOfLines={2}>{item.translation}</Text>
        )}
        {item.count > 1 && (
          <Text style={[styles.dragBadge, { color: colors.accent }]}>×{item.count}</Text>
        )}
      </View>
    </View>
  ), [colors, language]);

  const contentAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isIndexView) {
      Animated.timing(contentAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      contentAnim.setValue(1);
    }
  }, [isIndexView, filter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.header, paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            {showBack && <BackButton onPress={() => { onSetFilter('index'); setSearchQuery(''); setReorderMode(false); }} accent={colors.accent} />}
            <Text style={[styles.title, { color: colors.text }]}>
              {reorderMode
                ? (language === 'ar' ? 'ترتيب الأذكار' : 'Reorder ZIKR')
                : getFilterTitle(filter, language, categories, selectedCategoryId)}
            </Text>
          </View>
          {reorderMode ? (
            <View style={styles.reorderActions}>
              <TouchableOpacity onPress={resetReorder} style={[styles.reorderBtn, { borderColor: colors.textLight }]}>
                <RotateCcw size={16} stroke={colors.textLight} />
              </TouchableOpacity>
              <TouchableOpacity onPress={exitReorderMode} style={[styles.reorderBtn, { borderColor: colors.textLight }]}>
                <X size={16} stroke={colors.textLight} />
              </TouchableOpacity>
              <TouchableOpacity onPress={saveReorder} style={[styles.reorderBtn, { borderColor: colors.accent, backgroundColor: colors.accent }]}>
                <Check size={16} stroke="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.textLight }]}>
              <X size={20} stroke={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        {reorderMode ? (
          <Text style={[styles.reorderHint, { color: colors.textLight }]}>
            {language === 'ar' ? 'اضغط مطولاً ثم اسحب الأذكار لإعادة ترتيبها' : 'Press and hold, then drag azkar to reorder them'}
          </Text>
        ) : (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={language === 'ar' ? 'ابحث عن ذِكْر ...' : 'Search for a dhikr...'}
            colors={colors}
          />
        )}
      </View>

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
                  onSelect={(c) => { onSelectCategory(c.id); setSearchQuery(''); }}
                  getLabel={(c) => language === 'ar' ? c.subtitle || c.title : c.title || c.subtitle}
                  getSubLabel={() => null}
                  adhkarCount={(id) => allZikr.filter((a) => a.categoryId === id).length}
                  colors={colors}
                  isSavedMap={isSavedCategoryMap}
                  onToggleSave={onToggleSaveCategory}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            matchedCategories.length === 0 && filteredItems.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
              </Text>
            ) : null
          }
        />
      ) : isIndexView ? (
        <Animated.ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: contentAnim }}>
            <IndexGrid
              categories={categories}
              savedZikr={savedZikr}
              allZikr={allZikr}
              savedCategoryIds={savedCategoryIds}
              onSelectCategory={onSelectCategory}
              onSetFilter={onSetFilter}
              onNavigateHistory={onNavigateHistory}
              onNavigateTasbeeh={onNavigateTasbeeh}
              onToggleSaveCategory={onToggleSaveCategory}
              language={language}
              colors={colors}
            />
          </Animated.View>
        </Animated.ScrollView>
      ) : filter === 'custom' ? (
        <Animated.ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <CategoryList
            categories={customCategories}
            onSelect={(c) => { onSelectCategory(c.id); setSearchQuery(''); }}
            getLabel={(c) => language === 'ar' ? c.subtitle || c.title : c.title || c.subtitle}
            getSubLabel={() => null}
            adhkarCount={(id) => allZikr.filter((a) => a.categoryId === id).length}
            colors={colors}
            isSavedMap={isSavedCategoryMap}
            onToggleSave={onToggleSaveCategory}
          />
        </Animated.ScrollView>
      ) : filter === 'saved' ? (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={savedZikr}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={
            savedCategories.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <CategoryList
                  categories={savedCategories}
                  onSelect={(c) => { onSelectCategory(c.id); onSetFilter('category'); }}
                  getLabel={(c) => language === 'ar' ? c.subtitle || c.title : c.title || c.subtitle}
                  getSubLabel={() => null}
                  adhkarCount={(id) => allZikr.filter((a) => a.categoryId === id).length}
                  colors={colors}
                  isSavedMap={isSavedCategoryMap}
                  onToggleSave={onToggleSaveCategory}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            savedZikr.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                {language === 'ar' ? 'لم تحفظ أي أذكار بعد' : 'No saved ZIKR yet'}
              </Text>
            ) : null
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          {canReorder && !isSearching && (
            <TouchableOpacity
              onPress={enterReorderMode}
              style={[styles.reorderToggleBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}
            >
              <ArrowUpDown size={16} stroke={colors.accent} />
              <Text style={[styles.reorderToggleText, { color: colors.accent }]}>
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
          />
        </View>
      )}
    </View>
  );
});

function IndexGrid({
  categories, savedZikr, allZikr, savedCategoryIds,
  onSelectCategory, onSetFilter, onNavigateHistory, onNavigateTasbeeh,
  onToggleSaveCategory,
  language, colors,
}: {
  categories: ZikrCategory[]; savedZikr: Zikr[]; allZikr: Zikr[]; savedCategoryIds: number[];
  onSelectCategory: (id: number) => void; onSetFilter: (filter: DrawerFilter) => void;
  onNavigateHistory: () => void; onNavigateTasbeeh: () => void;
  onToggleSaveCategory: (category: ZikrCategory) => void;
  language: 'ar' | 'en';
  colors: { background: string; text: string; textLight: string; accent: string; card: string; header: string };
}) {
  const regularCategories = useMemo(
    () => categories.filter((c) => c.id !== 1 && c.id !== 2 && c.id !== ABSOLUTE_CATEGORY_ID && c.id !== 135),
    [categories],
  );

  const isSavedCategoryMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    savedCategoryIds.forEach((id) => { map[id] = true; });
    return map;
  }, [savedCategoryIds]);

  return (
    <View>
      <View style={styles.grid}>
        <GridItem
          label={language === 'ar' ? 'الأذكار المحفوظة' : 'Saved ZIKR'}
          icon={<Bookmark size={22} stroke={colors.accent} fill={colors.accent + '40'} />}
          onPress={() => onSetFilter('saved')}
          count={savedZikr.length}
          colors={colors}
          fullWidth
        />
        <GridItem
          label={language === 'ar' ? 'السجل' : 'History'}
          icon={<History size={22} stroke={colors.accent} />}
          onPress={onNavigateHistory}
          colors={colors}
        />
        <GridItem
          label={language === 'ar' ? 'الأذكار المطلقة' : 'Absolute ZIKR'}
          icon={<Infinity size={22} stroke={colors.accent} />}
          onPress={() => onSetFilter('absolute')}
          colors={colors}
        />
        <GridItem
          label={language === 'ar' ? 'الأذكار المخصصة' : 'Custom ZIKR'}
          icon={<Sparkles size={22} stroke={colors.accent} />}
          onPress={() => onSetFilter('custom')}
          colors={colors}
        />
        <GridItem
          label={language === 'ar' ? 'مسبحة' : 'Tasbeeh'}
          icon={<Wand2 size={22} stroke={colors.accent} />}
          onPress={onNavigateTasbeeh}
          colors={colors}
        />
      </View>

      {regularCategories.length > 0 && (
        <>
          <View style={styles.sectionSeparator}>
            <View style={[styles.separatorLine, { backgroundColor: colors.accent + '30' }]} />
            <Text style={[styles.separatorText, { color: colors.textLight }]}>
              {language === 'ar' ? 'جميع الأذكار' : 'All ZIKR'}
            </Text>
            <View style={[styles.separatorLine, { backgroundColor: colors.accent + '30' }]} />
          </View>
          <CategoryList
            categories={regularCategories}
            onSelect={(c) => onSelectCategory(c.id)}
            getLabel={(c) => language === 'ar' ? c.subtitle || c.title : c.title || c.subtitle}
            getSubLabel={() => null}
            adhkarCount={(id) => allZikr.filter((a) => a.categoryId === id).length}
            colors={colors}
            isSavedMap={isSavedCategoryMap}
            onToggleSave={onToggleSaveCategory}
          />
        </>
      )}
    </View>
  );
}

function GridItem({ label, icon, onPress, count, colors, fullWidth }: {
  label: string; icon: React.ReactNode; onPress: () => void; count?: number; fullWidth?: boolean;
  colors: { text: string; textLight: string; accent: string; card: string };
}) {
  return (
    <View style={[styles.gridCard, fullWidth && styles.gridCardFull]}>
      <PressCard onPress={onPress}>
        <View style={[styles.gridCardInner, { backgroundColor: colors.card, borderColor: colors.accent + '60' }]}>
          <View style={styles.gridIconWrap}>{icon}</View>
          <Text style={[styles.gridLabel, { color: colors.text }]} numberOfLines={1}>{label}</Text>
          {count !== undefined && (
            <View style={[styles.gridCountBadge, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.gridCountText, { color: colors.accent }]}>{count}</Text>
            </View>
          )}
        </View>
      </PressCard>
    </View>
  );
}

function BackButton({ onPress, accent }: { onPress: () => void; accent: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(anim, { toValue: 0, useNativeDriver: true }).start()}
      activeOpacity={0.8}
      style={[styles.backBtn, { borderColor: accent }]}
    >
      <Animated.View style={{ transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) }] }}>
        <ArrowLeft size={18} stroke={accent} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function getItemsForFilter(
  filter: DrawerFilter, selectedCategoryId: number | null,
  _categories: ZikrCategory[], allZikr: Zikr[], savedZikr: Zikr[],
): Zikr[] {
  switch (filter) {
    case 'saved': return savedZikr;
    case 'absolute': return allZikr.filter((a) => a.categoryId === ABSOLUTE_CATEGORY_ID);
    case 'custom': return allZikr;
    case 'morning': return allZikr.filter((a) => a.categoryId === MORNING_CATEGORY_ID);
    case 'evening': return allZikr.filter((a) => a.categoryId === EVENING_CATEGORY_ID);
    case 'category': return selectedCategoryId ? allZikr.filter((a) => a.categoryId === selectedCategoryId) : [];
    default: return [];
  }
}

function getFilterTitle(
  filter: DrawerFilter, language: 'ar' | 'en',
  categories: ZikrCategory[], selectedCategoryId: number | null,
): string {
  if (filter === 'morning') return language === 'ar' ? 'أذكار الصباح' : 'Morning ZIKR';
  if (filter === 'evening') return language === 'ar' ? 'أذكار المساء' : 'Evening ZIKR';
  if (filter === 'saved') return language === 'ar' ? 'الأذكار المحفوظة' : 'Saved ZIKR';
  if (filter === 'absolute') return language === 'ar' ? 'الأذكار المطلقة' : 'Absolute ZIKR';
  if (filter === 'custom') return language === 'ar' ? 'جميع الأذكار' : 'All ZIKR';
  if (filter === 'category' && selectedCategoryId) {
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (cat) return language === 'ar' ? cat.subtitle || cat.title : cat.title || cat.subtitle;
  }
  return language === 'ar' ? 'فهرس الأذكار' : 'ZIKR Index';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title: { fontSize: 20, fontWeight: '700', flex: 1 },
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
  gridCard: { width: '50%', padding: 5 },
  gridCardFull: { width: '100%' },
  gridCardInner: { borderRadius: 18, borderWidth: 1.5, padding: 16, minHeight: 110, alignItems: 'center', justifyContent: 'center', gap: 4 },
  gridIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  gridLabel: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  gridCountBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  gridCountText: { fontSize: 12, fontWeight: '700' },
  sectionSeparator: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  separatorLine: { flex: 1, height: 1 },
  separatorText: { fontSize: 12, fontWeight: '600' },
  dragHandle: { width: 32, alignItems: 'center', justifyContent: 'center' },
  dragArabic: { fontSize: 14, fontWeight: '600' },
  dragTranslation: { fontSize: 13 },
  dragBadge: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});
