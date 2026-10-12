import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { Zikr, CountRecord } from '../../core/types';

interface HistoryScreenProps {
  history: Zikr[];
  savedZikr: Zikr[];
  countRecords: CountRecord[];
  onSelectZikr: (zikr: Zikr) => void;
  onRemoveSaved: (arabic: string) => void;
  colors: { background: string; text: string; textLight: string; accent: string; card: string; header: string };
  language: 'ar' | 'en';
  t: any;
}

export function HistoryScreen({
  history, savedZikr, countRecords,
  onSelectZikr, onRemoveSaved,
  colors, language, t,
}: HistoryScreenProps) {
  const stats = useMemo(() => ({
    totalCount: countRecords.reduce((sum, r) => sum + r.count, 0),
    completedToday: countRecords.filter((r) =>
      r.recordedAt.startsWith(new Date().toISOString().slice(0, 10))
    ).length,
    totalSessions: countRecords.length,
  }), [countRecords]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t.historyTitle}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>{stats.totalCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>{t.tasbeehCount}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>{stats.totalSessions}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>{t.counterRecords}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>{stats.completedToday}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>
              {language === 'ar' ? 'اليوم' : 'Today'}
            </Text>
          </View>
        </View>

        {countRecords.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.completedCounters}</Text>
            {countRecords.slice(0, 20).map((record) => (
              <View key={record.id} style={styles.recordRow}>
                <Text style={[styles.recordText, { color: colors.text }]} numberOfLines={1}>
                  {record.zikrArabic}
                </Text>
                <Text style={[styles.recordCount, { color: colors.accent }]}>
                  ×{record.count}
                </Text>
              </View>
            ))}
          </View>
        )}

        {savedZikr.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.savedSection}</Text>
            {savedZikr.map((zikr) => (
              <View key={zikr.arabic} style={styles.savedRow}>
                <TouchableOpacity onPress={() => onSelectZikr(zikr)} style={styles.savedTextContainer}>
                  <Text style={[styles.savedText, { color: colors.text }]}>{zikr.arabic}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onRemoveSaved(zikr.arabic)}>
                  <Text style={[styles.removeText, { color: colors.textLight }]}>
                    {language === 'ar' ? 'إزالة' : 'Remove'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {history.length === 0 && savedZikr.length === 0 && countRecords.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            {t.noHistoryYet}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '700', fontFamily: 'Cairo_700Bold', textAlign: 'center' },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 16 },
  statsRow: { flexDirection: 'row', borderRadius: 16, padding: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700', fontFamily: 'Cairo_700Bold' },
  statLabel: { fontSize: 12, marginTop: 4, fontFamily: 'Cairo_600SemiBold' },
  section: { borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, fontFamily: 'Cairo_700Bold' },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  recordText: { flex: 1, fontSize: 14, fontFamily: 'Cairo_600SemiBold' },
  recordCount: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo_700Bold' },
  savedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  savedTextContainer: { flex: 1 },
  savedText: { fontSize: 14, fontFamily: 'Cairo_600SemiBold' },
  removeText: { fontSize: 12, fontFamily: 'Cairo_600SemiBold' },
  emptyText: { textAlign: 'center', paddingVertical: 48, fontSize: 16, fontFamily: 'Cairo_600SemiBold' },
});
