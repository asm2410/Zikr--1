import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AYAT = [
  { text: 'إِنَّ الْمُنَافِقِينَ يُخَادِعُونَ اللَّهَ وَهُوَ خَادِعُهُمْ وَإِذَا قَامُوا إِلَى الصَّلَاةِ قَامُوا كُسَالَىٰ يُرَاءُونَ النَّاسَ وَلَا يَذْكُرُونَ اللَّهَ إِلَّا قَلِيلًا', reference: 'سُورَةُ النِّسَاءِ: ١٤٢' },
  { text: 'إِنَّ الْمُسْلِمِينَ وَالْمُسْلِمَاتِ وَالْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ وَالْقَانِتِينَ وَالْقَانِتَاتِ وَالصَّادِقِينَ وَالصَّادِقَاتِ وَالصَّابِرِينَ وَالصَّابِرَاتِ وَالْخَاشِعِينَ وَالْخَاشِعَاتِ وَالْمُتَصَدِّقِينَ وَالْمُتَصَدِّقَاتِ وَالصَّائِمِينَ وَالصَّائِمَاتِ وَالْحَافِظِينَ فُرُوجَهُمْ وَالْحَافِظَاتِ وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا', reference: 'سُورَةُ الأَحْزَابِ: ٣٥' },
  { text: 'قَالَ رَبِّ اجْعَل لِّي آيَةً ۚ قَالَ آيَتُكَ أَلَّا تُكَلِّمَ النَّاسَ ثَلَاثَةَ أَيَّامٍ إِلَّا رَمْزًا ۗ وَاذْكُر رَّبَّكَ كَثِيرًا وَسَبِّحْ بِالْعَشِيِّ وَالْإِبْكَارِ', reference: 'سُورَةُ آلِ عِمْرَانَ: ٤١' },
  { text: 'وَاذْكُر رَّبَّكَ فِي نَفْسِكَ تَضَرُّعًا وَخِيفَةً وَدُونَ الْجَهْرِ مِنَ الْقَوْلِ بِالْغُدُوِّ وَالْآصَالِ وَلَا تَكُن مِّنَ الْغَافِلِينَ', reference: 'سُورَةُ الأَعْرَافِ: ٢٠٥' },
  { text: 'وَاذْكُرِ اسْمَ رَبِّكَ بُكْرَةً وَأَصِيلًا', reference: 'سُورَةُ الإِنْسَانِ: ٢٥' },
  { text: 'فَإِذَا قُضِيَتِ الصَّلَاةُ فَانتَشِرُوا فِي الْأَرْضِ وَابْتَغُوا مِن فَضْلِ اللَّهِ وَاذْكُرُوا اللَّهَ كَثِيرًا لَّعَلَّكُمْ تُفْلِحُونَ', reference: 'سُورَةُ الجُمُعَةِ: ١٠' },
  { text: 'إِلَّا أَن يَشَاءَ اللَّهُ ۚ وَاذْكُر رَّبَّكَ إِذَا نَسِيتَ وَقُلْ عَسَىٰ أَن يَهْدِيَنِ رَبِّي لِأَقْرَبَ مِنْ هَٰذَا رَشَدًا', reference: 'سُورَةُ الكَهْفِ: ٢٤' },
  { text: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ', reference: 'سُورَةُ البَقَرَةِ: ١٥٢' },
  { text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا', reference: 'سُورَةُ الأَحْزَابِ: ٤١' },
  { text: 'فَاصْبِرْ عَلَىٰ مَا يَقُولُونَ وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ غُرُوبِهَا ۖ وَمِنْ آنَاءِ اللَّيْلِ فَسَبِّحْ وَأَطْرَافَ النَّهَارِ لَعَلَّكَ تَرْضَىٰ', reference: 'سُورَةُ طه: ١٣٠' },
];

interface Props {
  textColor: string;
  refColor: string;
}

export default function SplashLoader({ textColor, refColor }: Props) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [ayah] = useState(() => AYAT[Math.floor(Math.random() * AYAT.length)]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.loaderWrapper}>
        <Animated.View style={[styles.loader, { transform: [{ rotate: spin }] }]}>
          <Svg width={96} height={96}>
            <Defs>
              <LinearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#9b59b6" />
                <Stop offset="50%" stopColor="#84cdfa" />
                <Stop offset="100%" stopColor="#5ad1cd" />
              </LinearGradient>
            </Defs>
            <Circle cx={48} cy={48} r={43} stroke="url(#loaderGrad)" strokeWidth={14} opacity={0.12} fill="none" />
            <Circle cx={48} cy={48} r={43} stroke="url(#loaderGrad)" strokeWidth={12} opacity={0.25} fill="none" />
            <Circle cx={48} cy={48} r={43} stroke="url(#loaderGrad)" strokeWidth={10} opacity={1} fill="none" />
          </Svg>
        </Animated.View>
      </View>
      <View style={styles.ayahSection}>
        <Text style={[styles.ayahText, { color: textColor }]}>{ayah.text}</Text>
        <View style={styles.separator} />
        <Text style={[styles.ayahRef, { color: refColor }]}>{ayah.reference}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 80 },
  loaderWrapper: { position: 'relative', width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  loader: { position: 'absolute', top: 0, left: 0 },
  ayahSection: { paddingHorizontal: 32, marginTop: 48, alignItems: 'center' },
  ayahText: { fontSize: 20, lineHeight: 34, textAlign: 'center', writingDirection: 'rtl', fontFamily: 'Cairo_400Regular' },
  separator: { width: 60, height: 2, backgroundColor: '#9b59b6', marginVertical: 16, opacity: 0.5 },
  ayahRef: { fontSize: 14, textAlign: 'center', fontFamily: 'Cairo_600SemiBold' },
});
