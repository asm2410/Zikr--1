import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import type { Zikr } from '../../core/types';

interface ZikrListItemProps {
  zikr: Zikr;
  isActive: boolean;
  onSelect: (zikr: Zikr) => void;
  colors: { text: string; textLight: string; accent: string; card: string };
  showArabic: boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
  showTitle?: boolean;
  isSaved?: boolean;
  onToggleSave?: (zikr: Zikr) => void;
}

export const ZikrListItem = memo(function ZikrListItem({ zikr, isActive, onSelect, colors, showArabic, showTransliteration, showTranslation, showTitle, isSaved, onToggleSave }: ZikrListItemProps) {
  const handlePress = useCallback(() => onSelect(zikr), [onSelect, zikr]);
  const handleSave = useCallback(() => onToggleSave?.(zikr), [onToggleSave, zikr]);
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        { backgroundColor: isActive ? colors.accent : colors.card, borderRightColor: isActive ? colors.text : colors.accent },
      ]}
    >
      {showTitle && (zikr.titleAr || zikr.title) && (
        <View style={styles.titleGroup}>
          {zikr.titleAr && <Text style={[styles.titleAr, { color: colors.text }]}>{zikr.titleAr}</Text>}
          {zikr.title && <Text style={[styles.titleEn, { color: colors.textLight }]}>{zikr.title}</Text>}
        </View>
      )}
      <View style={styles.header}>
        {showArabic && <Text style={[styles.arabic, { color: colors.text }]}>{zikr.arabic}</Text>}
        {zikr.count > 1 && (
          <View style={[styles.badge, { backgroundColor: isActive ? colors.card : colors.accent }]}>
            <Text style={[styles.badgeText, { color: isActive ? colors.accent : '#FFFFFF' }]}>×{zikr.count}</Text>
          </View>
        )}
      </View>
      {onToggleSave && (
        <View style={styles.saveRow}>
          <TouchableOpacity onPress={handleSave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.saveBtn}>
            <Bookmark size={14} stroke={colors.accent} fill={isSaved ? colors.accent : 'transparent'} />
          </TouchableOpacity>
        </View>
      )}
      {showTransliteration && zikr.transliteration && (
        <Text style={[styles.translit, { color: colors.textLight }]}>{zikr.transliteration}</Text>
      )}
      {showTranslation && zikr.translation && (
        <Text style={[styles.translation, { color: colors.textLight }]} numberOfLines={2}>{zikr.translation}</Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 16, marginBottom: 8, borderRightWidth: 4 },
  titleGroup: { marginBottom: 8, gap: 2 },
  titleAr: { fontSize: 15, fontWeight: '700' },
  titleEn: { fontSize: 13, fontStyle: 'italic' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  arabic: { fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  saveRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
  saveBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  translit: { fontSize: 13, fontStyle: 'italic', marginTop: 4 },
  translation: { fontSize: 12, marginTop: 4 },
});
