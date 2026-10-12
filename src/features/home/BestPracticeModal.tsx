import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SwipeableSheet } from '../../components/SwipeableSheet';

interface BestPracticeModalProps {
  visible: boolean;
  onClose: () => void;
  colors: { background: string; card: string; text: string; textLight: string; accent: string };
  language: 'ar' | 'en';
  title?: string;
  conciseVirtue?: string;
  fullVirtue?: string;
  source?: string;
}

const CONCISE_VIRTUE_AR = 'قال رسول الله ﷺ: «تُعْرَضُ الْأَعْمَالُ يَوْمَ الِاثْنَيْنِ وَالْخَمِيسِ، فَأُحِبُّ أَنْ يُعْرَضَ عَمَلِي وَأَنَا صَائِمٌ» (رواه الترمذي وصححه الألباني)';
const CONCISE_VIRTUE_EN = 'The Messenger of Allah (ﷺ) said: "Deeds are presented (to Allah) on Mondays and Thursdays, and I love that my deeds be presented while I am fasting." (Reported by Tirmidhi, authenticated by Al-Albani)';

const FULL_VIRTUE_AR = 'أجر صيام يومي الاثنين والخميس، فإن أجر الصيام بصفة عامة لا يعلمه إلا الله سبحانه وتعالى، ففي الحديث القدسي أن الله سبحانه وتعالى يقول: كل عمل ابن آدم له إلا الصوم، فإنه لي وأنا أجزي به. متفق عليه، وقد علل النبي صلى الله عليه وسلم سبب اختيار صيام هذين اليومين دون باقي أيام الأسبوع بأن الأعمال تعرض فيهما على الله عز وجل، ويحب أن يعرض عمله وهو صائم، فقد روى الترمذي وغيره عن أبي هريرة أن رسول الله صلى الله عليه وسلم قال: تعرض الأعمال يوم الاثنين والخميس، فأحب أن يعرض عملي وأنا صائم. والحديث صححه الألباني رحمه الله تعالى.';
const FULL_VIRTUE_EN = 'The reward for fasting on Monday and Thursday is immense. In general, the reward for fasting is known only to Allah Almighty. In a sacred hadith, Allah says: "Every deed of the son of Adam is for him, except fasting; it is for Me, and I shall reward it." (Agreed upon). The Prophet (ﷺ) explained that he chose these two days because deeds are presented to Allah on them, and he loves to have his deeds presented while he is fasting. Abu Hurairah reported that the Messenger of Allah (ﷺ) said: "Deeds are presented (to Allah) on Mondays and Thursdays, and I love that my deeds be presented while I am fasting." (Reported by Tirmidhi and others, authenticated by Al-Albani, may Allah have mercy on him).';

const SOURCE_AR = 'الحديث القدسي: رواه البخاري (1904) ومسلم (1151)\nالحديث: رواه الترمذي (747) وغيره، وصححه الألباني في صحيح الترغيب والترهيب';
const SOURCE_EN = 'Sacred Hadith: Narrated by Bukhari (1904) and Muslim (1151)\nHadith: Narrated by Tirmidhi (747) and others, authenticated by Al-Albani in Sahih Al-Targhib wa Al-Tarhib';

export function BestPracticeModal({ visible, onClose, colors, language, title, conciseVirtue, fullVirtue, source }: BestPracticeModalProps) {
  const isRtl = language === 'ar';

  const modalTitle = title ?? (language === 'ar' ? 'فضل صيام الاثنين والخميس' : 'Virtue of Fasting Mon & Thu');
  const concise = conciseVirtue ?? (language === 'ar' ? CONCISE_VIRTUE_AR : CONCISE_VIRTUE_EN);
  const full = fullVirtue ?? (language === 'ar' ? FULL_VIRTUE_AR : FULL_VIRTUE_EN);
  const src = source ?? (language === 'ar' ? SOURCE_AR : SOURCE_EN);

  return (
    <SwipeableSheet visible={visible} onClose={onClose} colors={colors}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {modalTitle}
        </Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            {language === 'ar' ? 'مختصر الفضل' : 'Concise Virtue'}
          </Text>
          <Text style={[styles.sectionBody, { color: colors.text, textAlign: isRtl ? 'right' : 'left' }]}>
            {concise}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            {language === 'ar' ? 'فضل العمل' : 'Full Virtue'}
          </Text>
          <Text style={[styles.sectionBody, { color: colors.text, textAlign: isRtl ? 'right' : 'left' }]}>
            {full}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            {language === 'ar' ? 'المصدر' : 'Source'}
          </Text>
          <Text style={[styles.sectionBody, { color: colors.text, textAlign: isRtl ? 'right' : 'left' }]}>
            {src}
          </Text>
        </View>
      </ScrollView>
    </SwipeableSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  body: { paddingHorizontal: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
});
