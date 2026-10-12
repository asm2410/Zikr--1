import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Share2, Download } from 'lucide-react-native';
import { SwipeableSheet } from '../../components/SwipeableSheet';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  onSaveToDevice: () => void;
  loading: boolean;
  colors: { background: string; card: string; text: string; textLight: string; accent: string };
  language: 'ar' | 'en';
}

export function ShareSheet({ visible, onClose, onShare, onSaveToDevice, loading, colors, language }: ShareSheetProps) {
  const isRtl = language === 'ar';

  return (
    <SwipeableSheet visible={visible} onClose={onClose} colors={colors}>
      <View style={[styles.header, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {language === 'ar' ? 'مشاركة الذكر' : 'Share dhikr'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>
            {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
          </Text>
        </View>
      ) : (
        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.optionBtn, { backgroundColor: colors.background }]}
            onPress={onShare}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.accent + '20' }]}>
              <Share2 size={22} stroke={colors.accent} />
            </View>
            <View style={[styles.optionTextWrap, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                {language === 'ar' ? 'مشاركة' : 'Share'}
              </Text>
              <Text style={[styles.optionDesc, { color: colors.textLight }]}>
                {language === 'ar' ? 'مشاركة الذكر كصورة' : 'Share the dhikr as an image'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionBtn, { backgroundColor: colors.background }]}
            onPress={onSaveToDevice}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.accent + '20' }]}>
              <Download size={22} stroke={colors.accent} />
            </View>
            <View style={[styles.optionTextWrap, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                {language === 'ar' ? 'حفظ على الجهاز' : 'Save to device'}
              </Text>
              <Text style={[styles.optionDesc, { color: colors.textLight }]}>
                {language === 'ar' ? 'حفظ الصورة في المعرض' : 'Save the image to gallery'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SwipeableSheet>
  );
}

const styles = StyleSheet.create({
  header: { justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14 },
  options: { paddingHorizontal: 20, gap: 12 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionDesc: { fontSize: 12, marginTop: 2 },
});
