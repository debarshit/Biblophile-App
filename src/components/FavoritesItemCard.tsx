import React from 'react';
import {StyleSheet, Text, View, ImageProps} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import ImageBackgroundInfo from './ImageBackgroundInfo';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';

interface FavoritesItemCardProps {
  id: number;
  imagelink_portrait: string;
  name: string;
  type: string;
  average_rating: number;
  ratings_count: string;
  genre: string;
  description: string;
  favourite: boolean;
  ToggleFavouriteItem: any;
}

const FavoritesItemCard: React.FC<FavoritesItemCardProps> = ({
  id,
  imagelink_portrait,
  name,
  type,
  average_rating,
  ratings_count,
  genre,
  description,
  favourite,
  ToggleFavouriteItem,
}) => {
  return (
    <View style={styles.CardContainer}>
      <ImageBackgroundInfo
        EnableBackHandler={false}
        imagelink_portrait={imagelink_portrait}
        type={type}
        id={id}
        favourite={favourite}
        name={name}
        average_rating={average_rating}
        ratings_count={ratings_count}
        genre={genre}
        ToggleFavourite={ToggleFavouriteItem}
      />
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
        style={styles.ContainerLinearGradient}>
        <Text style={styles.DescriptionTitle}>Description</Text>
        <Text style={styles.DescriptionText}>{description}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  CardContainer: {
    borderRadius: BORDERRADIUS.radius_25,
    overflow: 'hidden',
  },
  ContainerLinearGradient: {
    gap: SPACING.space_10,
    padding: SPACING.space_20,
  },
  DescriptionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.secondaryLightGreyHex,
  },
  DescriptionText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
});

export default FavoritesItemCard;
