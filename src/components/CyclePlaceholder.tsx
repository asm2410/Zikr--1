import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface CyclePlaceholderProps {
  prefix: string;
  words: string[];
  suffix?: string;
  interval?: number;
  textColor: string;
  visible: boolean;
}

const WORD_HEIGHT = 20;

export function CyclePlaceholder({ prefix, words, suffix = '', interval = 2000, textColor, visible }: CyclePlaceholderProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      const nextIndex = (indexRef.current + 1) % words.length;
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -WORD_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        indexRef.current = nextIndex;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Text style={[styles.prefix, { color: textColor }]}>{prefix}</Text>
      <View style={styles.cycleContainer}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          {words.map((word, i) => (
            <Text key={i} style={[styles.word, { color: textColor }]}>{word}{suffix}</Text>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 36,
    right: 12,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefix: { fontSize: 14 },
  cycleContainer: { height: WORD_HEIGHT, overflow: 'hidden' },
  word: { fontSize: 14, height: WORD_HEIGHT, lineHeight: WORD_HEIGHT },
});
