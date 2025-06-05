import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Alert, Share } from 'react-native';
import { AntDesign, FontAwesome5 } from '@expo/vector-icons';
import GradientBGIcon from '../../../components/GradientBGIcon';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import ReadingStatus from './ReadingStatus';
import CityModal from '../../bookshop/components/CityModal';
import { useStore } from '../../../store/store';

interface ImageBackgroundInfoProps {
  EnableBackHandler: boolean;
  imagelink_portrait: string;
  id: string;
  favourite: boolean;
  name: string;
  type: string;
  author: string;
  genre: string;
  BackHandler?: () => void;
  product: any;
  isGoogleBook: boolean;
}

interface Emotion {
  Emotion: string;
}

const ImageBackgroundInfo: React.FC<ImageBackgroundInfoProps> = ({
  EnableBackHandler,
  imagelink_portrait,
  id,
  name,
  type,
  author,
  genre,
  BackHandler,
  product,
  isGoogleBook,
}) => {
  const [bookData, setBookData] = useState({
    averageRating: null as number | null,
    ratingsCount: null as number | null,
    topEmotions: [] as Emotion[]
  });
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const { selectedCity } = useStore();

  // Get actual book ID (handling Google Books)
  const getBookId = async () => {
    if (type !== 'ExternalBook') return id;
    
    const isbn = product.volumeInfo?.industryIdentifiers?.find(
      (id: any) => id.type === 'ISBN_13'
    )?.identifier || '';
    
    if (!isbn) return id;
    
    try {
      const bookIdResponse = await instance.post(requests.fetchBookId, { ISBN: isbn });
      return bookIdResponse.data.bookId || id;
    } catch (error) {
      console.error('Failed to fetch BookId', error);
      return id;
    }
  };

  // Fetch book data
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const bookId = await getBookId();
        
        // Fetch ratings
        const ratingResponse = await instance(`${requests.fetchAverageRating}${bookId}`);
        
        // Fetch emotions
        const emotionsResponse = await instance(`${requests.fetchAverageEmotions}${bookId}`);
        
        setBookData({
          averageRating: ratingResponse.data.averageRating,
          ratingsCount: ratingResponse.data.totalRatings,
          topEmotions: emotionsResponse.data.topEmotions || []
        });
      } catch (error) {
        console.error('Error fetching book data:', error);
      }
    };

    fetchBookData();
  }, [id, type, product]);

  const handleSharePress = async () => {
    try {
      await Share.share({
        message: `Checkout this book at https://biblophile.com/books/${type}/${id}/${name}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {EnableBackHandler && (
          <TouchableOpacity onPress={BackHandler}>
            <GradientBGIcon 
              name="left" 
              color={COLORS.primaryLightGreyHex} 
              size={FONTSIZE.size_16} 
            />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity onPress={() => setCityModalVisible(true)}>
          <View style={styles.location}>
            <FontAwesome5 name="map-marker" size={20} color="#D17842" />
            <Text style={styles.locationText}>
              {selectedCity || 'location'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSharePress}>
          <GradientBGIcon 
            name="sharealt" 
            color={COLORS.primaryLightGreyHex} 
            size={FONTSIZE.size_16} 
          />
        </TouchableOpacity>
      </View>

      {/* Book Info */}
      <View style={styles.bookInfoContainer}>
        <Image source={{ uri: imagelink_portrait }} style={styles.bookCover} />

        <View style={styles.textContainer}>
          {/* Emotions */}
          <ScrollView horizontal style={styles.emotionContainer}>
            {bookData.topEmotions.map((emotion, index) => (
              <Text key={index} style={styles.emotionText}>
                {emotion.Emotion}
              </Text>
            ))}
          </ScrollView>

          {/* Genre */}
          <ScrollView horizontal style={styles.genreScrollView}>
            <Text style={styles.genreText}>{genre}</Text>
          </ScrollView>

          {/* Author */}
          <Text style={styles.authorText}>{author}</Text>

          {/* Ratings */}
          <View style={styles.ratingContainer}>
            {bookData.averageRating ? (
              <>
                <AntDesign 
                  name="star" 
                  color={COLORS.primaryOrangeHex} 
                  size={FONTSIZE.size_20} 
                />
                <Text style={styles.ratingText}>{bookData.averageRating}</Text>
                <Text style={styles.ratingCountText}>
                  ({Number(bookData.ratingsCount).toLocaleString()})
                </Text>
              </>
            ) : (
              <Text style={styles.noRatingsText}>No ratings yet</Text>
            )}
          </View>
        </View>
      </View>

      {/* Book Title */}
      <Text style={styles.bookTitle}>{name}</Text>

      {/* Reading Status */}
      <View style={styles.readingStatusContainer}>
        {type !== 'Bookmark' && (
          <ReadingStatus id={id} isGoogleBook={isGoogleBook} product={product} />
        )}
      </View>
      
      {/* City Modal */}
      <CityModal 
        visibility={cityModalVisible} 
        onClose={() => setCityModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  header: {
    padding: SPACING.space_20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    flexDirection: 'row',
    marginTop: SPACING.space_10,
  },
  locationText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_8,
  },
  bookInfoContainer: {
    padding: SPACING.space_24,
    backgroundColor: COLORS.primaryBlackRGBA,
    borderTopLeftRadius: BORDERRADIUS.radius_20 * 2,
    borderTopRightRadius: BORDERRADIUS.radius_20 * 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_20,
  },
  bookCover: {
    width: 120,
    height: 180,
    borderRadius: BORDERRADIUS.radius_10,
    marginRight: SPACING.space_20,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
  },
  textContainer: {
    flex: 1,
  },
  bookTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
    textAlign: 'center',
  },
  emotionContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.space_12,
  },
  emotionText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_10,
    backgroundColor: COLORS.primaryDarkGreyHex,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  ratingText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_8,
  },
  ratingCountText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_4,
  },
  noRatingsText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  genreScrollView: {
    marginBottom: SPACING.space_12,
  },
  genreText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_12,
  },
  authorText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  readingStatusContainer: {
    alignSelf: 'center',
  },
});

export default ImageBackgroundInfo;