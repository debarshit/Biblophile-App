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
import PageStatus from './PageStatus';

const CARD_WIDTH = Dimensions.get('window').width * 0.32;

interface BookshelfCardProps {
  id: string;
  photo: string;
  status: string;
  startDate?: string;
  endDate?: string;
  currentPage?: number;
  onUpdate: () => void;
}

const BookshelfCard: React.FC<BookshelfCardProps> = ({
  id,
  photo,
  status,
  startDate,
  endDate,
  currentPage,
  onUpdate,
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
      <PageStatus
          id={id}
          page={currentPage || 0}
          startDate={startDate}
          endDate={endDate}
          status={status}
          onUpdate={onUpdate}
        />
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
});

export default BookshelfCard;