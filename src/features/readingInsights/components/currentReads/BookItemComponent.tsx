import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import { convertHttpToHttps } from '../../../../utils/convertHttpToHttps';

interface BookItemProps {
  book: any;
  navigation: any;
  onUpdatePress: (book: any) => void;
}

const BookItem: React.FC<BookItemProps> = React.memo(({ book, navigation, onUpdatePress }) => (
  <View style={styles.book}>
    <TouchableOpacity
      onPress={() => {
        navigation.push('Details', {
          id: book.BookId,
          type: "Book",
        });
      }}>
      <Image source={{ uri: convertHttpToHttps(book.BookPhoto) }} style={styles.bookPhoto} />
    </TouchableOpacity>
    <TouchableOpacity 
      style={styles.updateButton}
      onPress={() => onUpdatePress(book)}
    >
      <Text style={styles.updateButtonText}>Update Status</Text>
    </TouchableOpacity>
  </View>
));

export default BookItem;

const styles = StyleSheet.create({
  book: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_10,
    borderRadius: 8,
    marginHorizontal: SPACING.space_10,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bookPhoto: {
    width: 100,
    height: 150,
    borderRadius: 5,
  },
  updateButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_12,
    borderRadius: 5,
    marginTop: SPACING.space_10,
  },
  updateButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    textAlign: 'center',
  },
});