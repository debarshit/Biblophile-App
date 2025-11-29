import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import BookItem from './BookItemComponent';

interface CurrentlyReadingBooksProps {
  currentReads: any[];
  isLoading: boolean;
  showDiscoverLink: boolean;
  navigation: any;
  onUpdatePress: (book: any) => void;
}

const CurrentlyReadingBooks: React.FC<CurrentlyReadingBooksProps> = ({
  currentReads,
  isLoading,
  showDiscoverLink,
  navigation,
  onUpdatePress,
}) => {
  // Memoized rendered books list
  const renderedBooks = useMemo(() => 
    currentReads.map((book) => (
      <BookItem 
        key={book.BookId} 
        book={book} 
        navigation={navigation}
        onUpdatePress={onUpdatePress}
      />
    )), [currentReads, navigation, onUpdatePress]
  );

  return (
    <View style={styles.currentReadsSection}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          <Text style={styles.loadingText}>Loading your books...</Text>
        </View>
      ) : currentReads.length > 0 ? (
        <>
          <Text style={styles.sectionHeading}>Currently Reading</Text>
          <ScrollView horizontal contentContainerStyle={styles.currentReads}>
            {renderedBooks}
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            No books in your current reads yet
          </Text>
          {showDiscoverLink && (
            <TouchableOpacity 
              style={styles.discoverButton}
              onPress={() => navigation.navigate('Discover')}
            >
              <Text style={styles.discoverButtonText}>
                Discover Books to Add
              </Text>
              <FontAwesome name="arrow-right" style={styles.discoverButtonIcon} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default CurrentlyReadingBooks;

const styles = StyleSheet.create({
  currentReadsSection: {
    width: '100%',
    marginBottom: SPACING.space_20,
    alignItems: 'center',
  },
  sectionHeading: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    textAlign: 'center',
    marginBottom: SPACING.space_16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_30,
    gap: SPACING.space_10,
  },
  loadingText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_20,
  },
  currentReads: {
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  emptyStateText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    textAlign: 'center',
    marginBottom: SPACING.space_16,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_20,
    borderRadius: 25,
    gap: SPACING.space_8,
  },
  discoverButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  discoverButtonIcon: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_12,
  },
});