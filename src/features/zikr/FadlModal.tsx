import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SwipeableSheet } from '../../components/SwipeableSheet';

interface FadlModalProps {
  visible: boolean;
  onClose: () => void;
  zikr: {
    fadl: string | null;
    sourceReference: string | null;
    fadlEn: string | null;
    sourceReferenceEn: string | null;
    notes: string | null;
  } | null;
  colors: { background: string; card: string; text: string; textLight: string; accent: string };
  language: 'ar' | 'en';
}

export function FadlModal({ visible, onClose, zikr, colors, language }: FadlModalProps) {
  if (!zikr) return null;

  const hasContent = language === 'ar'
    ? (zikr.fadl || zikr.sourceReference || zikr.notes)
    : ((zikr.fadlEn ?? zikr.fadl) || (zikr.sourceReferenceEn ?? zikr.sourceReference) || zikr.notes);
  const isRtl = language === 'ar';

  return (
    <SwipeableSheet visible={visible} onClose={onClose} colors={colors}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {language === 'ar' ? 'فضل الذكر والمصدر' : 'Virtue & Source'}
        </Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {!hasContent && (
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            {language === 'ar' ? 'لا تتوفر بيانات تخريج لهذا الذكر بعد.' : 'No data available for this dhikr yet.'}
          </Text>
        )}

        {(language === 'ar' ? zikr.fadl : zikr.fadlEn ?? zikr.fadl) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>
              {language === 'ar' ? 'الفضل' : 'Virtue'}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.text, textAlign: isRtl ? 'right' : 'left' }]}>
              {language === 'ar' ? zikr.fadl : (zikr.fadlEn ?? zikr.fadl)}
            </Text>
          </View>
        )}

        {(language === 'ar' ? zikr.sourceReference : zikr.sourceReferenceEn ?? zikr.sourceReference) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>
              {language === 'ar' ? 'المصدر والتخريج' : 'Source & Grading'}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.text, textAlign: isRtl ? 'right' : 'left' }]}>
              {language === 'ar' ? zikr.sourceReference : (zikr.sourceReferenceEn ?? zikr.sourceReference)}
            </Text>
          </View>
        )}

        {zikr.notes && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>
              {language === 'ar' ? 'شرح' : 'Notes'}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.text, textAlign: isRtl ? 'right' : 'left' }]}>
              {zikr.notes}
            </Text>
          </View>
        )}
      </ScrollView>
    </SwipeableSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  body: { paddingHorizontal: 20 },
  emptyText: { textAlign: 'center', paddingVertical: 32, fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
});
