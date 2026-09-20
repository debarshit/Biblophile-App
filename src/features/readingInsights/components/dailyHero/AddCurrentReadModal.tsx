import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';
import { convertHttpToHttps } from '../../../../utils/convertHttpToHttps';
import GlassEffect from '../../../../components/GlassEffect';
import { useAnalytics } from '../../../../utils/analytics';

interface AddCurrentReadModalProps {
  visible: boolean;
  onClose: () => void;
  onBookAdded: (book: any) => void;
}

const AddCurrentReadModal: React.FC<AddCurrentReadModalProps> = ({
  visible,
  onClose,
  onBookAdded,
}) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const userDetails = useStore((state: any) => state.userDetails);
  const analytics = useAnalytics();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [startPage, setStartPage] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await instance.get(
          `${requests.searchExternalBooks}${encodeURIComponent(text.trim())}`
        );
        const results = response.data?.data || [];
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching books:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  const handleSelectBook = (item: any) => {
    setSelectedBook(item);
    setStartPage('0');
  };

  const handleConfirmAdd = async () => {
    if (!selectedBook || !userDetails[0]?.accessToken) return;

    setIsSubmitting(true);
    analytics.track('book_added_to_currently_reading', {
      bookId: selectedBook.bookId ?? selectedBook.BookId,
      title: selectedBook.title ?? selectedBook.BookName,
      startPage: parseInt(startPage, 10) || 0,
    });

    try {
      const pageVal = parseInt(startPage, 10) || 0;
      const todayStr = new Date().toISOString().slice(0, 10);
      const payload: any = {
        bookId: selectedBook.bookId ?? selectedBook.BookId,
        status: 'Currently reading',
        progressUnit: 'pages',
        progressValue: pageVal,
        startDate: todayStr,
      };

      await instance.post(requests.submitReadingStatus, payload, {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
      });

      // Format book for parent component
      const addedBook = {
        BookId: selectedBook.bookId ?? selectedBook.BookId,
        WorkId: selectedBook.workId ?? selectedBook.WorkId,
        BookName: selectedBook.title ?? selectedBook.BookName,
        BookPhoto: selectedBook.image ?? selectedBook.bookPhoto ?? selectedBook.BookPhoto,
        BookPages: selectedBook.pages ?? selectedBook.bookPages ?? selectedBook.BookPages ?? 0,
        ProgressValue: pageVal,
        ProgressUnit: 'pages',
        Status: 'Currently reading',
        StartDate: todayStr,
        UserbookId: Date.now(),
      };

      onBookAdded(addedBook);
      handleResetAndClose();
    } catch (error) {
      console.error('Error adding book to current reads:', error);
      Alert.alert('Error', 'Could not add book to your reading list. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSelectedBook(null);
    setSearchQuery('');
    setSearchResults([]);
    setStartPage('0');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleResetAndClose}
    >
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleResetAndClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryWhiteHex} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add What You're Reading</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Feather name="search" size={20} color={COLORS.primaryOrangeHex} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search title, author, or ISBN..."
            placeholderTextColor={COLORS.secondaryLightGreyHex}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus={true}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={COLORS.secondaryLightGreyHex} />
            </TouchableOpacity>
          )}
        </View>

        {/* Selected Book Configuration View */}
        {selectedBook ? (
          <View style={styles.configContainer}>
            <GlassEffect
              glassStyle="regular"
              intensity={30}
              borderRadius={BORDERRADIUS.radius_20}
              style={styles.selectedCard}
            >
              <View style={styles.selectedBookInfo}>
                {selectedBook.image || selectedBook.bookPhoto ? (
                  <Image
                    source={{ uri: convertHttpToHttps(selectedBook.image || selectedBook.bookPhoto) }}
                    style={styles.selectedBookCover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.selectedBookCover, styles.placeholderCover]}>
                    <FontAwesome5 name="book" size={24} color={COLORS.primaryLightGreyHex} />
                  </View>
                )}
                <View style={styles.selectedBookDetails}>
                  <Text style={styles.selectedBookTitle} numberOfLines={2}>
                    {selectedBook.title || selectedBook.bookName}
                  </Text>
                  <Text style={styles.selectedBookAuthor} numberOfLines={1}>
                    {Array.isArray(selectedBook.authors)
                      ? selectedBook.authors.join(', ')
                      : selectedBook.authors || selectedBook.author || 'Unknown Author'}
                  </Text>
                  <Text style={styles.selectedBookPages}>
                    {selectedBook.pages || selectedBook.bookPages || 'Unknown'} pages
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.pageInputSection}>
                <Text style={styles.pageInputLabel}>What page are you currently on?</Text>
                <View style={styles.pageInputRow}>
                  <TextInput
                    style={styles.pageInput}
                    value={startPage}
                    onChangeText={setStartPage}
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <Text style={styles.pageInputUnit}>pages</Text>
                </View>
                <Text style={styles.pageInputHelp}>
                  If you just started, leave as 0. You can log new pages anytime.
                </Text>
              </View>

              <View style={styles.actionButtonRow}>
                <TouchableOpacity
                  style={styles.cancelBookButton}
                  onPress={() => setSelectedBook(null)}
                >
                  <Text style={styles.cancelBookButtonText}>Choose Another</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
                  onPress={handleConfirmAdd}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={COLORS.primaryWhiteHex} size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Start Tracking 📖</Text>
                  )}
                </TouchableOpacity>
              </View>
            </GlassEffect>
          </View>
        ) : (
          /* Search Results List */
          <View style={styles.resultsContainer}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
                <Text style={styles.loadingText}>Searching books...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item, idx) => String(item.bookId || item.BookId || idx)}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const cover = item.image || item.bookPhoto || item.BookPhoto;
                  const title = item.title || item.bookName || item.BookName;
                  const authors = Array.isArray(item.authors)
                    ? item.authors.join(', ')
                    : item.authors || item.author || '';
                  const pages = item.pages || item.bookPages || item.BookPages;

                  return (
                    <TouchableOpacity
                      style={styles.resultItem}
                      onPress={() => handleSelectBook(item)}
                      activeOpacity={0.7}
                    >
                      {cover ? (
                        <Image
                          source={{ uri: convertHttpToHttps(cover) }}
                          style={styles.resultCover}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.resultCover, styles.placeholderCover]}>
                          <FontAwesome5 name="book" size={18} color={COLORS.primaryLightGreyHex} />
                        </View>
                      )}
                      <View style={styles.resultDetails}>
                        <Text style={styles.resultTitle} numberOfLines={2}>
                          {title}
                        </Text>
                        <Text style={styles.resultAuthor} numberOfLines={1}>
                          {authors}
                        </Text>
                        {pages ? (
                          <Text style={styles.resultPages}>{pages} pages</Text>
                        ) : null}
                      </View>
                      <View style={styles.selectArrow}>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.primaryOrangeHex} />
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : searchQuery.length > 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No books found</Text>
                <Text style={styles.emptySubtitle}>Try searching by ISBN or another title keyword.</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={48} color={COLORS.primaryLightGreyHex} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>Find Your Current Read</Text>
                <Text style={styles.emptySubtitle}>
                  Type a title, author name, or ISBN above to immediately start tracking your pages and daily streak.
                </Text>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default AddCurrentReadModal;

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.space_16,
      paddingVertical: SPACING.space_12,
    },
    backButton: {
      padding: SPACING.space_4,
    },
    headerTitle: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_18,
      color: COLORS.primaryWhiteHex,
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: BORDERRADIUS.radius_15,
      marginHorizontal: SPACING.space_16,
      marginBottom: SPACING.space_16,
      paddingHorizontal: SPACING.space_12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    searchIcon: {
      marginRight: SPACING.space_8,
    },
    searchInput: {
      flex: 1,
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
      paddingVertical: Platform.OS === 'ios' ? SPACING.space_12 : SPACING.space_8,
    },
    clearButton: {
      padding: SPACING.space_4,
    },
    resultsContainer: {
      flex: 1,
      paddingHorizontal: SPACING.space_16,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.space_12,
    },
    loadingText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryLightGreyHex,
    },
    resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.space_12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    resultCover: {
      width: 48,
      height: 72,
      borderRadius: 6,
      backgroundColor: COLORS.secondaryDarkGreyHex,
    },
    placeholderCover: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultDetails: {
      flex: 1,
      marginLeft: SPACING.space_12,
      marginRight: SPACING.space_8,
    },
    resultTitle: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: 15,
      color: COLORS.primaryWhiteHex,
      marginBottom: 2,
    },
    resultAuthor: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: 13,
      color: COLORS.secondaryLightGreyHex,
      marginBottom: 2,
    },
    resultPages: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: 11,
      color: COLORS.primaryLightGreyHex,
    },
    selectArrow: {
      padding: SPACING.space_4,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.space_30,
    },
    emptyTitle: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_16,
      color: COLORS.primaryWhiteHex,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: 13,
      color: COLORS.secondaryLightGreyHex,
      textAlign: 'center',
      lineHeight: 20,
    },
    configContainer: {
      flex: 1,
      paddingHorizontal: SPACING.space_16,
      paddingTop: SPACING.space_10,
    },
    selectedCard: {
      backgroundColor: 'rgba(28, 32, 40, 0.95)',
      borderRadius: BORDERRADIUS.radius_20,
      padding: SPACING.space_20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    selectedBookInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_16,
    },
    selectedBookCover: {
      width: 70,
      height: 105,
      borderRadius: 8,
      backgroundColor: COLORS.secondaryDarkGreyHex,
    },
    selectedBookDetails: {
      flex: 1,
    },
    selectedBookTitle: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_18,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_4,
    },
    selectedBookAuthor: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryOrangeHex,
      marginBottom: SPACING.space_4,
    },
    selectedBookPages: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    divider: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      marginVertical: SPACING.space_16,
    },
    pageInputSection: {
      alignItems: 'center',
      marginBottom: SPACING.space_20,
    },
    pageInputLabel: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryLightGreyHex,
      marginBottom: SPACING.space_10,
    },
    pageInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(15, 17, 22, 0.7)',
      paddingHorizontal: SPACING.space_20,
      paddingVertical: SPACING.space_8,
      borderRadius: BORDERRADIUS.radius_15,
      borderWidth: 1.5,
      borderColor: COLORS.primaryOrangeHex,
      gap: SPACING.space_8,
      marginBottom: SPACING.space_8,
    },
    pageInput: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_24,
      color: COLORS.primaryWhiteHex,
      minWidth: 80,
      textAlign: 'center',
    },
    pageInputUnit: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
      textTransform: 'uppercase',
    },
    pageInputHelp: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: 11,
      color: COLORS.secondaryLightGreyHex,
      textAlign: 'center',
    },
    actionButtonRow: {
      flexDirection: 'row',
      gap: SPACING.space_12,
    },
    cancelBookButton: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      paddingVertical: SPACING.space_15,
      borderRadius: BORDERRADIUS.radius_15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBookButtonText: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_14,
      color: COLORS.secondaryLightGreyHex,
    },
    confirmButton: {
      flex: 1.5,
      backgroundColor: COLORS.primaryOrangeHex,
      paddingVertical: SPACING.space_15,
      borderRadius: BORDERRADIUS.radius_15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButtonDisabled: {
      opacity: 0.6,
    },
    confirmButtonText: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: 15,
      color: COLORS.primaryWhiteHex,
    },
  });
