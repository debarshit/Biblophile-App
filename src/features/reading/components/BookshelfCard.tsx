import React from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import PageStatus from './PageStatus';

const CARD_WIDTH = Dimensions.get('window').width * 0.32;

interface BookshelfCardProps {
  id: string;
  isPageOwner: boolean;
  photo: string;
  status: string;
  startDate?: string;
  endDate?: string;
  currentPage?: number;
  onUpdate: () => void;
  navigation: any;
}

const BookshelfCard: React.FC<BookshelfCardProps> = ({
  id,
  isPageOwner=true,
  photo,
  status,
  startDate,
  endDate,
  currentPage,
  onUpdate,
  navigation
}) => {

  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.CardLinearGradientContainer}
      colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}>
      <TouchableOpacity
        onPress={() => {
          navigation.push('Details', {
            id: id,
            type: "Book",
          });
      }}>
        <ImageBackground
          source={{ uri: photo }}
          style={styles.CardImageBG}
          resizeMode="cover">
        </ImageBackground>
      </TouchableOpacity>
      <View style={styles.CardFooter}>
      {isPageOwner && <PageStatus
          id={id}
          page={currentPage || 0}
          startDate={startDate}
          endDate={endDate}
          status={status}
          onUpdate={onUpdate}
        />}
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