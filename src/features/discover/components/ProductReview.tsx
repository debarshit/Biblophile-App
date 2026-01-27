import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import StarRating from 'react-native-star-rating-widget';
import { WysiwygRender } from '../../../components/wysiwyg/WysiwygRender';
import { useNavigation } from '@react-navigation/native';

interface ProductReviewProps {
  id: string;
  isGoogleBook: boolean;
  product: any; 
}

interface Review {
  ratingId: string;
  userName: string;
  ratingDate: string;
  rating: number;
  review: string;
  productId: string;
  editionFormat: string;
}

const ProductReview: React.FC<ProductReviewProps> = ({ id, isGoogleBook, product }) => {
  const navigation = useNavigation<any>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const reviewsLimit = 10;

  const userDetails = useStore((state: any) => state.userDetails);

  async function fetchReviews(newOffset: number = offset) {
    if (isLoading) return;
    setIsLoading(true);
    try {
      let bookIdToFetch = id;

      if (isGoogleBook) {
        const isbn = product.volumeInfo?.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || '';
        if (isbn) {
          const response = await instance.get(requests.fetchBookId(isbn));
          const bookIdResponse = response.data;
          if (bookIdResponse.data.bookId) {
            bookIdToFetch = bookIdResponse.data.bookId;
          } else {
            console.log('Failed to fetch BookId');
            setIsLoading(false);
            return;
          }
        }
      }

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await instance(
        `${requests.fetchProductReviews(bookIdToFetch)}?offset=${newOffset}&limit=${reviewsLimit}&timezone=${userTimezone}`
      );
      const fetchedReviews: Review[] = response.data.data;

      if (fetchedReviews.length < reviewsLimit) {
        setHasMoreReviews(false);
      }

      setReviews(prevReviews => {
        const prevReviewIds = new Set(prevReviews.map(review => review.ratingId));
        const uniqueReviews = fetchedReviews.filter(review => !prevReviewIds.has(review.ratingId));
        return [...prevReviews, ...uniqueReviews];
      });
      
      setOffset(newOffset + fetchedReviews.length);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews(0);
  }, [product]);

  const loadMoreReviews = () => {
    if (!isLoading && hasMoreReviews) {
      fetchReviews(offset);
    }
  };

  const handleEditionPress = (productId: string) => {
    navigation.navigate('Details', {
      id: productId,
      type: 'Book',
    });
  };

  const renderReview = ({ item }: { item: Review }) => {
    const isDifferentEdition = item.productId != id;

    return (
      <View style={styles.review} key={item.ratingId}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewAuthor}>By {item.userName}</Text>
          {isDifferentEdition && (
            <TouchableOpacity 
              onPress={() => handleEditionPress(item.productId)}
              style={styles.editionBadge}
            >
              <Text style={styles.editionBadgeText}>
                Different edition{item.editionFormat ? ` · ${item.editionFormat}` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.reviewDate}>{item.ratingDate}</Text>
        <View style={styles.reviewRating}>
          <StarRating 
            maxStars={5}
            starSize={24}
            color={COLORS.primaryOrangeHex}
            rating={item.rating}
            enableHalfStar={true}
            onChange={() => null}
          />
        </View>
        {item.review && (
          <View style={styles.reviewContent}>
            <WysiwygRender html={item.review} maxWidth={300} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {userDetails && userDetails[0]?.userId ? (
        <Button 
          title="Submit Review" 
          onPress={() => navigation.navigate('SubmitReview', { id, isGoogleBook, product })} 
          color={COLORS.primaryOrangeHex} 
        />
      ) : (
        <Text style={styles.loginPrompt}>Login to put a review.</Text>
      )}
      
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.ratingId}
        renderItem={renderReview}
        onEndReached={loadMoreReviews}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => {
          if (isLoading) {
            return <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} style={styles.loader} />;
          }
          if (!hasMoreReviews && reviews.length > 0) {
            return <Text style={styles.noMoreText}>No more reviews to show.</Text>;
          }
          return null;
        }}
        ListEmptyComponent={() => {
          if (!isLoading) {
            return <Text style={styles.noReviewsText}>No reviews yet.</Text>;
          }
          return null;
        }}
        scrollEnabled={false}
        style={styles.flatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_8,
    color: COLORS.primaryWhiteHex,
  },
  flatList: {
    marginTop: SPACING.space_16,
  },
  loginPrompt: {
    color: COLORS.primaryRedHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    marginBottom: SPACING.space_12,
  },
  review: {
    backgroundColor: COLORS.primaryBlackRGBA,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_24,
    marginBottom: SPACING.space_12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.space_8,
    marginBottom: SPACING.space_4,
  },
  reviewAuthor: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  editionBadge: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_10,
  },
  editionBadgeText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryOrangeHex,
  },
  reviewDate: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  reviewContent: {
    marginTop: SPACING.space_8,
  },
  loader: {
    marginVertical: SPACING.space_20,
  },
  noMoreText: {
    textAlign: 'center',
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    marginVertical: SPACING.space_20,
  },
  noReviewsText: {
    textAlign: 'center',
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    marginVertical: SPACING.space_30,
  },
});

export default ProductReview;