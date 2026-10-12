import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { SearchIcon } from '../../components/SearchIcon';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  colors: { text: string; textLight: string; card: string; accent: string };
}

export function SearchBar({ value, onChangeText, placeholder, colors }: SearchBarProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <SearchIcon size={16} stroke={colors.textLight} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <X size={16} stroke={colors.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  input: { flex: 1, fontSize: 14, padding: 0 },
});
