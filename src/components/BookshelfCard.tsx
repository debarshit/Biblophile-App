import React from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';

const CARD_WIDTH = Dimensions.get('window').width * 0.32;

interface BookshelfCardProps {
  id: string;
  photo: string;
  status: string;
  startDate?: string;
  endDate?: string;
  currentPage?: number;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
};

const BookshelfCard: React.FC<BookshelfCardProps> = ({
  id,
  photo,
  status,
  startDate,
  endDate,
  currentPage,
}) => {
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.CardLinearGradientContainer}
      colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}>
      <ImageBackground
        source={{ uri: photo }}
        style={styles.CardImageBG}
        resizeMode="cover">
      </ImageBackground>
      <View style={styles.CardFooter}>
        <View style={styles.CardFooterRow}>
          {status === 'Read' && startDate && endDate ? (
            <Text style={styles.CardFooterText}>
              {`${formatDate(startDate)} - ${formatDate(endDate)}`}
            </Text>
          ) : status === 'Currently reading' && currentPage ? (
            <Text style={styles.CardFooterText}>
              {`Current Page: ${currentPage}`}
            </Text>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  CardLinearGradientContainer: {
    padding: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_25,
    marginRight: SPACING.space_10,
  },
  CardImageBG: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: BORDERRADIUS.radius_20,
    marginBottom: SPACING.space_15,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  CardFooter: {
    flexDirection: 'column',
  },
  CardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.space_15,
  },
  CardFooterText: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
  },
});

export default BookshelfCard;