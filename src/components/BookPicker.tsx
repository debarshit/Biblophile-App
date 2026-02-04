import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import instance from '../services/axios';
import requests from '../services/requests';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../theme/theme';
import { useCity } from '../contexts/CityContext';

interface BookPickerProps {
  title?: string;
  placeholder?: string;
  onSelect: (data: {
    bookId: string;
    userBookId?: string;
    type: 'Book' | 'ExternalBook';
    title: string;
  }) => void;
  selectedBookId?: string;
  autoFocus?: boolean;
}

const useDebounce = (callback: Function, delay: number) => {
  const ref = useRef<any>();
  return (...args: any[]) => {
    clearTimeout(ref.current);
    ref.current = setTimeout(() => callback(...args), delay);
  };
};

const BookPicker: React.FC<BookPickerProps> = ({
  title,
  placeholder = 'Search books…',
  onSelect,
  selectedBookId,
  autoFocus = false,
}) => {
  const { selectedCity } = useCity();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchBooks = async (text: string) => {
    if (!text) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await instance.get(
        `${requests.searchExternalBooks}${text}&userCity=${selectedCity}`,
      );
      setResults(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(searchBooks, 400);

  const handleChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  const renderItem = ({ item }: any) => {
    const bookId = item.BookId || item.GoogleBookId;
    const type = item.BookAvailability ? 'Book' : 'ExternalBook';

    const isSelected = selectedBookId === bookId;

    return (
      <TouchableOpacity
        style={[
          styles.row,
          isSelected && styles.selectedRow,
        ]}
        onPress={() =>
          onSelect({
            bookId,
            userBookId: item.UserBookId,
            type,
            title: item.BookName,
          })
        }
      >
        <View style={styles.textWrap}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {item.BookName}
          </Text>
          <Text style={styles.metaText}>
            {type === 'Book' ? 'In your library' : 'External'}
          </Text>
        </View>

        {isSelected && (
          <Feather
            name="check-circle"
            size={18}
            color={COLORS.primaryOrangeHex}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.inputWrap}>
        <Feather name="search" size={16} color={COLORS.primaryLightGreyHex} />
        <TextInput
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.primaryLightGreyHex}
          style={styles.input}
          autoFocus={autoFocus}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) =>
          item.BookId
            ? `local-${item.BookId}`
            : `external-${item.GoogleBookId}`
        }
        renderItem={renderItem}
        ListEmptyComponent={
          query && !loading ? (
            <Text style={styles.empty}>No books found</Text>
          ) : null
        }
      />
    </View>
  );
};

export default BookPicker;

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.space_16,
  },
  title: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginBottom: SPACING.space_8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingHorizontal: SPACING.space_16,
    marginBottom: SPACING.space_12,
  },
  input: {
    flex: 1,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    paddingVertical: SPACING.space_12,
    marginLeft: SPACING.space_8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.space_12,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_8,
  },
  selectedRow: {
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  textWrap: { flex: 1 },
  bookTitle: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  metaText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
  },
  empty: {
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginTop: SPACING.space_16,
  },
});