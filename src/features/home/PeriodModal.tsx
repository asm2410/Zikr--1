import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpDown, Check, X, RotateCcw } from 'lucide-react-native';
import { ReorderableList } from '../../components/ReorderableList';
import { SwipeableSheet } from '../../components/SwipeableSheet';
import { ZikrListItem } from '../drawer/ZikrListItem';
import { getOrderedCategoryItems, getDefaultOrderIds } from '../../core/utils/ordering';
import type { Zikr, ThemeColors, CustomOrder } from '../../core/types';
import { MORNING_CATEGORY_ID, EVENING_CATEGORY_ID } from '../../core/constants';

interface PeriodModalProps {
  visible: boolean;
  onClose: () => void;
  period: 'morning' | 'evening';
  allZikr: Zikr[];
  currentZikr: Zikr | null;
  onSelectZikr: (zikr: Zikr) => void;
  colors: ThemeColors;
  language: 'ar' | 'en';
  t: {
    periodMorning: string;
    periodEvening: string;
  };
  customOrder: CustomOrder;
  dispatch: React.Dispatch<any>;
}

export function PeriodModal({
  visible, onClose, period, allZikr, currentZikr, onSelectZikr, colors, language, t,
  customOrder, dispatch,
}: PeriodModalProps) {
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderData, setReorderData] = useState<Zikr[]>([]);

  const categoryId = period === 'morning' ? MORNING_CATEGORY_ID : EVENING_CATEGORY_ID;

  const items = useMemo(
    () => getOrderedCategoryItems(allZikr, categoryId, customOrder),
    [allZikr, customOrder, categoryId],
  );

  useEffect(() => {
    if (!visible) {
      setReorderMode(false);
      setReorderData([]);
    }
  }, [visible]);

  const title = period === 'morning' ? t.periodMorning : t.periodEvening;

  const enterReorderMode = useCallback(() => {
    setReorderData([...items]);
    setReorderMode(true);
  }, [items]);

  const exitReorderMode = useCallback(() => {
    setReorderMode(false);
    setReorderData([]);
  }, []);

  const saveReorder = useCallback(() => {
    if (reorderData.length === 0) {
      setReorderMode(false);
      return;
    }
    const orderIds = reorderData.map((z) => Number(z.id));
    const defaultIds = getDefaultOrderIds(
      allZikr.filter((z) => Number(z.categoryId) === Number(categoryId)),
    );
    const isDefault = orderIds.length === defaultIds.length && orderIds.every((id, i) => id === defaultIds[i]);
    if (isDefault) {
      dispatch({ type: 'RESET_CUSTOM_ORDER', categoryId });
    } else {
      dispatch({ type: 'UPDATE_CUSTOM_ORDER', categoryId, order: orderIds });
    }
    setReorderMode(false);
    setReorderData([]);
  }, [reorderData, categoryId, allZikr, dispatch]);

  const resetReorder = useCallback(() => {
    const defaultItems = allZikr
      .filter((z) => Number(z.categoryId) === Number(categoryId))
      .sort((a, b) => a.orderIndex - b.orderIndex);
    setReorderData(defaultItems);
  }, [categoryId, allZikr]);

  const renderDragItem = useCallback((item: Zikr, isActive: boolean) => (
    <View
      style={[
        styles.dragItem,
        { backgroundColor: isActive ? colors.accent + '30' : colors.card, borderColor: colors.accent + '40' },
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

  return (
    <SwipeableSheet visible={visible} onClose={onClose} colors={colors}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {reorderMode ? (language === 'ar' ? 'ترتيب الأذكار' : 'Reorder ZIKR') : title}
        </Text>
        <View style={styles.headerActions}>
          {reorderMode ? (
            <>
              <TouchableOpacity onPress={resetReorder} style={[styles.actionBtn, { borderColor: colors.textLight }]}>
                <RotateCcw size={16} stroke={colors.textLight} />
              </TouchableOpacity>
              <TouchableOpacity onPress={exitReorderMode} style={[styles.actionBtn, { borderColor: colors.textLight }]}>
                <X size={16} stroke={colors.textLight} />
              </TouchableOpacity>
              <TouchableOpacity onPress={saveReorder} style={[styles.actionBtn, { borderColor: colors.accent, backgroundColor: colors.accent }]}>
                <Check size={16} stroke="#FFF" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={enterReorderMode} style={[styles.reorderToggleBtn, { borderColor: colors.accent + '40', backgroundColor: colors.accent + '10' }]}>
              <ArrowUpDown size={14} stroke={colors.accent} />
              <Text style={[styles.reorderToggleText, { color: colors.accent }]}>
                {language === 'ar' ? 'ترتيب' : 'Reorder'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {reorderMode && (
        <Text style={[styles.reorderHint, { color: colors.textLight }]}>
          {language === 'ar' ? 'اضغط مطولاً ثم اسحب الأذكار لإعادة ترتيبها' : 'Press and hold, then drag azkar to reorder them'}
        </Text>
      )}
      <View style={styles.body}>
        {reorderMode ? (
          <ReorderableList
            data={reorderData}
            keyExtractor={(item: Zikr) => `z-${item.id}`}
            renderItem={renderDragItem}
            onReorder={setReorderData}
            itemHeight={80}
          />
        ) : items.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            {language === 'ar' ? 'لا توجد أذكار' : 'No azkar found'}
          </Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((zikr) => (
              <ZikrListItem
                key={zikr.id}
                zikr={zikr}
                isActive={currentZikr?.id === zikr.id}
                onSelect={(z) => { onSelectZikr(z); onClose(); }}
                colors={colors}
                showArabic={language === 'ar'}
                showTransliteration={language === 'en'}
                showTranslation={language === 'en'}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SwipeableSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  headerActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionBtn: { width: 32, height: 32, borderWidth: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  reorderToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  reorderToggleText: { fontSize: 12, fontWeight: '600' },
  reorderHint: { fontSize: 12, textAlign: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  body: { flex: 1, paddingHorizontal: 20, minHeight: 280, paddingBottom: 24 },
  emptyText: { textAlign: 'center', paddingVertical: 32, fontSize: 14 },
  dragItem: { flex: 1, paddingHorizontal: 12, borderRadius: 16, borderRightWidth: 4, flexDirection: 'row', alignItems: 'center' },
  dragHandle: { width: 32, alignItems: 'center', justifyContent: 'center' },
  dragArabic: { fontSize: 14, fontWeight: '600' },
  dragTranslation: { fontSize: 13 },
  dragBadge: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});
