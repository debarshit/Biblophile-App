import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageProps,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { AntDesign, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import GradientBGIcon from './GradientBGIcon';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import instance from '../services/axios';
import requests from '../services/requests';

interface ImageBackgroundInfoProps {
  EnableBackHandler: boolean;
  imagelink_portrait: string;
  id: number;
  favourite: boolean;
  name: string;
  type: string;
  author: string;
  genre: string;
  BackHandler?: any;
  ToggleFavourite: any;
}

const ImageBackgroundInfo: React.FC<ImageBackgroundInfoProps> = ({
  EnableBackHandler,
  imagelink_portrait,
  id,
  favourite,
  name,
  type,
  author,
  genre,
  BackHandler,
  ToggleFavourite,
}) => {
  const [averageRating, setAverageRating] = useState(null);
  const [ratingsCount, setRatingsCount] = useState(null);
  const [topEmotions, setTopEmotions] = useState(null);

  useEffect(() => {
    async function fetchProductRatings() {
      try {
        let bookId = id;

        if (type === "ExternalBook") {
            // Fetch the BookId based on ISBN13 in case of google books
            // const isbn = product.volumeInfo?.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || '';
            // if (isbn) {
            //     const bookIdResponse = await axios.post(requests.fetchBookId, { ISBN: isbn });
            //     if (bookIdResponse.data.bookId) {
            //         id = bookIdResponse.data.bookId;
            //     } else {
            //         console.log("Failed to fetch BookId");
            //         return;
            //     }
            // }
        }
        const response = await instance(`${requests.fetchAverageRating}${id}`);
        const data = response.data;
        setAverageRating(data.averageRating);
        setRatingsCount(data.totalRatings);
      }
      catch (error) {
        console.error('Error fetching items:', error);
      }
    }

    fetchProductRatings();
  

  }, [id])

  useEffect(() => {
    async function fetchTopEmotions() {
      try {
        let bookId = id;

        if (type === "ExternalBook") {
            // Fetch the BookId based on ISBN13 in case of google books
            // const isbn = product.volumeInfo?.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || '';
            // if (isbn) {
            //     const bookIdResponse = await axios.post(requests.fetchBookId, { ISBN: isbn });
            //     if (bookIdResponse.data.bookId) {
            //         id = bookIdResponse.data.bookId;
            //     } else {
            //         console.log("Failed to fetch BookId");
            //         return;
            //     }
            // }
        }
        const response = await instance(`${requests.fetchAverageEmotions}${bookId}`);
        const data = response.data;
        setTopEmotions(data.topEmotions);
      }
      catch (error) {
        console.error('Error fetching items:', error);
      }
    }

    fetchTopEmotions();
  

  }, [id])
  

  return (
    <View>
      <ImageBackground
        source={{uri: imagelink_portrait}}
        style={styles.ItemBackgroundImage}>
        {EnableBackHandler ? (
          <View style={styles.ImageHeaderBarContainerWithBack}>
            <TouchableOpacity
              onPress={() => {
                BackHandler();
              }}>
              <GradientBGIcon
                name="left"
                color={COLORS.primaryLightGreyHex}
                size={FONTSIZE.size_16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                ToggleFavourite(favourite, id);
              }}>
              <GradientBGIcon
                name="heart"
                color={
                  favourite ? COLORS.primaryRedHex : COLORS.primaryLightGreyHex
                }
                size={FONTSIZE.size_16}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ImageHeaderBarContainerWithoutBack}>
            <TouchableOpacity
              onPress={() => {
                ToggleFavourite(favourite, id);
              }}>
              <GradientBGIcon
                name="heart"
                color={
                  favourite ? COLORS.primaryRedHex : COLORS.primaryLightGreyHex
                }
                size={FONTSIZE.size_16}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.ImageInfoOuterContainer}>
          <View style={styles.ImageInfoInnerContainer}>
            <View style={styles.InfoContainerRow}>
              <View style={styles.ItemTitleContainer}>
                <Text style={styles.ItemTitleText}>{name}</Text>
              </View>
            </View>
            <View style={styles.InfoContainerRow}>
              {type === "Book" && <View>
                {topEmotions && topEmotions.map((emotion, index) => (
                  <Text style={styles.ItemSubtitleText}>
                  {emotion.Emotion}
                  </Text>
                ))}
                <View style={styles.RatingContainer}>
                  <AntDesign
                    name={'star'}
                    color={COLORS.primaryOrangeHex}
                    size={FONTSIZE.size_20}
                  />
                  <Text style={styles.RatingText}>{averageRating}</Text>
                  <Text style={styles.RatingCountText}>({Number(ratingsCount).toLocaleString()})</Text>
                </View>
              </View>}
              <View>
                <Text style={styles.GenreText}>{genre}</Text>
                <View style={styles.RoastedContainer}>
                  <Text style={styles.RoastedText}>{author}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  ItemBackgroundImage: {
    width: '100%',
    aspectRatio: 20 / 25,
    justifyContent: 'space-between',
  },
  ImageHeaderBarContainerWithBack: {
    padding: SPACING.space_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ImageHeaderBarContainerWithoutBack: {
    padding: SPACING.space_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  ImageInfoOuterContainer: {
    paddingVertical: SPACING.space_24,
    paddingHorizontal: SPACING.space_30,
    backgroundColor: COLORS.primaryBlackRGBA,
    borderTopLeftRadius: BORDERRADIUS.radius_20 * 2,
    borderTopRightRadius: BORDERRADIUS.radius_20 * 2,
  },
  ImageInfoInnerContainer: {
    justifyContent: 'space-between',
    gap: SPACING.space_15,
  },
  InfoContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ItemTitleContainer: {
    flex: 1,
    maxWidth: '80%', // Adjust this value according to your layout requirements
  },
  ItemTitleText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    maxWidth: '100%',
  },
  ItemSubtitleText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  ItemPropertiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_20,
  },
  ProperFirst: {
    height: 55,
    width: 55,
    borderRadius: BORDERRADIUS.radius_15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  PropertyTextFirst: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
  },
  PropertyTextLast: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_2 + SPACING.space_4,
  },
  RatingContainer: {
    flexDirection: 'row',
    gap: SPACING.space_10,
    alignItems: 'center',
  },
  RatingText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  RatingCountText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  RoastedContainer: {
    height: 55,
    width: 55 * 2 + SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  GenreText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    maxWidth: 150,
  },
  RoastedText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
});

export default ImageBackgroundInfo;
