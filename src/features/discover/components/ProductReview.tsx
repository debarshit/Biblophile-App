import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import StarRating from 'react-native-star-rating-widget';
import { WysiwygRender } from '../../../components/WysiwygRender';
import { useNavigation } from '@react-navigation/native';

interface ProductReviewProps {
  id: string;
  isGoogleBook: boolean;
  product: any; 
}

interface Review {
  id: string;
  userName: string;
  ratingDate: string;
  rating: number;
  review: string;
}

const ProductReview: React.FC<ProductReviewProps> = ({ id, isGoogleBook, product }) => {
  const navigation = useNavigation<any>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const userDetails = useStore((state: any) => state.userDetails);

  async function fetchReviews() {
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
      const response = await instance(requests.fetchProductReviews(bookIdToFetch) + `?offset=${offset}` + `&timezone=${userTimezone}`);
      const reviewsResponse = response.data;
      if (reviewsResponse.data && reviewsResponse.data.length > 0) {
        setReviews(prevReviews => [...prevReviews, ...reviewsResponse.data]);
        setOffset(prevOffset => prevOffset + reviewsResponse.data.length);
      } else {
        setHasMoreReviews(false); // No more reviews
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, [product]);

  const loadMoreReviews = () => {
    if (!isLoading && hasMoreReviews) {
      fetchReviews();
    }
  };

  return (
    <View style={styles.container}>
      {userDetails[0].userId ? (
         <Button title="Submit Review" onPress={() => navigation.navigate('SubmitReview', { id, isGoogleBook, product })} color={COLORS.primaryOrangeHex} />
      ) : (
        <Text style={styles.loginPrompt}>Login to put a review.</Text>
      )}
      {/* This virtual list causing warnings due to being inside scrollView of DetailScreen */}
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.review} key={item.id}>
            <Text style={styles.reviewAuthor}>By {item.userName}</Text>
            <Text style={styles.reviewDate}>{item.ratingDate}</Text>
            <View style={styles.reviewRating}>
              <StarRating 
                maxStars={5}
                starSize={30}
                color={COLORS.primaryOrangeHex}
                rating={item.rating}
                enableHalfStar={true}
                onChange={(rating) => null}
              />
            </View>
            <View style={{ marginTop: SPACING.space_8 }}>
              <WysiwygRender html={item.review} maxWidth={300} />
            </View>
          </View>
        )}
        onEndReached={loadMoreReviews}
        onEndReachedThreshold={0.5} // Trigger when the user is halfway down
        ListFooterComponent={isLoading ? <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} /> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_8,
    margin: 10,
    color: COLORS.primaryWhiteHex,
  },
  loginPrompt: {
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_20,
  },
  review: {
    backgroundColor: COLORS.primaryBlackRGBA,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_24,
    marginBottom: SPACING.space_10,
  },
  reviewAuthor: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  reviewDate: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ProductReview;