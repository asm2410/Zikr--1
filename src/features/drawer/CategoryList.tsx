import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { PressCard } from '../../components/PressCard';
import type { ZikrCategory } from '../../core/types';

interface CategoryListProps {
  categories: ZikrCategory[];
  onSelect: (category: ZikrCategory) => void;
  getLabel: (c: ZikrCategory) => string;
  getSubLabel: (c: ZikrCategory) => string | null;
  adhkarCount: (categoryId: number) => number;
  colors: { text: string; textLight: string; accent: string; card: string };
  isSavedMap?: Record<number, boolean>;
  onToggleSave?: (category: ZikrCategory) => void;
}

const PAD = 5;

export const CategoryList = memo(function CategoryList({ categories, onSelect, getLabel, getSubLabel, adhkarCount, colors, isSavedMap, onToggleSave }: CategoryListProps) {
  if (categories.length === 0) return null;

  return (
    <View style={styles.grid}>
      {categories.map((item) => (
        <PressCard key={item.id} onPress={() => onSelect(item)} containerStyle={styles.card}>
          <View style={[styles.cardInner, { backgroundColor: colors.card, borderColor: colors.accent + '60' }]}>
            {onToggleSave && (
              <TouchableOpacity
                onPress={() => onToggleSave(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.saveBtn}
              >
                <Bookmark
                  size={13}
                  stroke={colors.accent}
                  fill={isSavedMap?.[item.id] ? colors.accent : 'transparent'}
                />
              </TouchableOpacity>
            )}
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {getLabel(item)}
            </Text>
            {getSubLabel(item) && (
              <Text style={[styles.subtitle, { color: colors.textLight }]}>
                {getSubLabel(item)}
              </Text>
            )}
            <View style={[styles.countBadge, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.countText, { color: colors.accent }]}>
                {adhkarCount(item.id)}
              </Text>
            </View>
          </View>
        </PressCard>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    width: '50%',
    padding: PAD,
  },
  cardInner: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    minHeight: 120,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingTop: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
