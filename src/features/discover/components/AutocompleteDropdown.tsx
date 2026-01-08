import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, SPACING } from '../../../theme/theme';

interface Props<T> {
  value: string;
  onChange: (v: string) => void;
  fetchFn: (query: string) => Promise<T[]>;
  extractLabel: (item: T) => string;
  placeholder?: string;
  minChars?: number;
  singleValue?: boolean;
}

export function AutocompleteDropdown<T>({
  value,
  onChange,
  fetchFn,
  extractLabel,
  placeholder,
  minChars = 2,
  singleValue = false,
}: Props<T>) {
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [visible, setVisible] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleChange = (text: string) => {
    onChange(text);

    const token = singleValue ? text : text.split(',').pop()?.trim() || '';
    if (token.length < minChars) {
      setSuggestions([]);
      setVisible(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchFn(token);
        setSuggestions(res);
        setVisible(true);
      } catch {
        setSuggestions([]);
        setVisible(false);
      }
    }, 300);
  };

  const selectItem = (label: string) => {
    if (singleValue) {
      onChange(label);
    } else {
      const parts = value.split(',');
      parts[parts.length - 1] = ` ${label}`;
      onChange(parts.join(',').replace(/^ /, '') + ', ');
    }
    setVisible(false);
  };

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.secondaryLightGreyHex}
        style={styles.Input}
        autoCorrect={false}
      />

      {visible && suggestions.length > 0 && (
        <View style={styles.Dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={suggestions}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectItem(extractLabel(item))}
                style={styles.Item}
              >
                <Text style={styles.ItemText}>
                  {extractLabel(item)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  Input: {
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryWhiteHex,
    padding: SPACING.space_12,
    borderRadius: 8,
  },
  Dropdown: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  Item: {
    padding: SPACING.space_12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.secondaryDarkGreyHex,
  },
  ItemText: {
    color: COLORS.primaryWhiteHex,
  },
});