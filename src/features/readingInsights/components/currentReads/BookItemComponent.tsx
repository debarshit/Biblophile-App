import React, { useMemo } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import { convertHttpToHttps } from '../../../../utils/convertHttpToHttps';
import { useTheme } from '../../../../contexts/ThemeContext';
import GlassEffect from '../../../../components/GlassEffect';

interface BookItemProps {
  book: any;
  navigation: any;
  onUpdatePress: (book: any) => void;
}

const BookItem: React.FC<BookItemProps> = React.memo(({ book, navigation, onUpdatePress }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const percentage = useMemo(() => {
    const status = book.Status ?? book.status;
    const progressValue = book.ProgressValue ?? book.progressValue;
    const progressUnit = book.ProgressUnit ?? book.progressUnit;
    const bookPages = book.BookPages ?? book.bookPages;
    const audioDurationSec = book.AudioDurationSec ?? book.audioDurationSec;

    if (status === 'Read') return 100;
    if (status === 'To be read') return 0;

    if (progressValue === null || progressValue === undefined || progressValue <= 0) {
      return 0;
    }

    if (progressUnit === 'percentage') {
      return Math.min(100, Math.max(0, progressValue));
    }

    if (progressUnit === 'pages') {
      if (bookPages && bookPages > 0) {
        return Math.min(100, Math.round((progressValue / bookPages) * 100));
      }
      return null;
    }

    if (progressUnit === 'seconds') {
      if (audioDurationSec && audioDurationSec > 0) {
        return Math.min(100, Math.round((progressValue / audioDurationSec) * 100));
      }
      return null;
    }

    return null;
  }, [
    book.Status, book.status,
    book.ProgressUnit, book.progressUnit,
    book.ProgressValue, book.progressValue,
    book.BookPages, book.bookPages,
    book.AudioDurationSec, book.audioDurationSec
  ]);

  return (
    <GlassEffect
      glassStyle="regular"
      intensity={25}
      borderRadius={8}
      style={styles.book}
    >
      <TouchableOpacity
        onPress={() => {
          navigation.push('Details', {
            id: book.BookId ?? book.bookId,
            type: "Book",
          });
        }}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: convertHttpToHttps(book.BookPhoto ?? book.bookPhoto) }} style={styles.bookPhoto} />
          {percentage !== null && (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.updateButton}
        onPress={() => onUpdatePress(book)}
      >
        <Text style={styles.updateButtonText}>Update Status</Text>
      </TouchableOpacity>
    </GlassEffect>
  );
});


export default BookItem;

const createStyles = (COLORS) => StyleSheet.create({
  book: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(40, 40, 45, 0.45)' : COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_10,
    borderRadius: 8,
    marginHorizontal: SPACING.space_10,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bookPhoto: {
    width: 100,
    height: 150,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryOrangeHex,
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