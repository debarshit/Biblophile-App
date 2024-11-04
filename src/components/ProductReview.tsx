import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import instance from '../services/axios';
import requests from '../services/requests';
import { useStore } from '../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import StarRating from 'react-native-star-rating-widget';

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
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
          const bookIdResponse = await instance.post(requests.fetchBookId, { ISBN: isbn });
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
      const response = await instance(requests.fetchProductReviews + bookIdToFetch + `&offset=${offset}` + `&timezone=${userTimezone}`);
      if (response.data && response.data.length > 0) {
        setReviews(prevReviews => [...prevReviews, ...response.data]);
        setOffset(prevOffset => prevOffset + response.data.length);
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

  const handleReviewSubmit = async () => {
    if (!userReview || rating === 0) {
      Alert.alert('Error', 'Please provide a review and rating.');
      return;
    }

    try {
      const userId = userDetails[0].userId;
      let bookId = id;

      if (isGoogleBook) {
        const bookData = {
          ISBN: product.volumeInfo?.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || '',
          Title: product.volumeInfo?.title || '',
          Pages: product.volumeInfo?.pageCount || '',
          Price: product.saleInfo?.listPrice?.amount || 0,
          Description: product.volumeInfo?.description || '',
          Authors: JSON.stringify(product.volumeInfo?.authors || []),
          Genres: JSON.stringify(product.volumeInfo?.categories || []),
          Image: product.volumeInfo?.imageLinks?.thumbnail || '',
        };

        const bookResponse = await instance.post(requests.addBook, bookData);

        if (bookResponse.data.message === 'Book added/updated successfully') {
          bookId = bookResponse.data.bookId;
        } else {
          console.log('Failed to add/update book');
          return;
        }
      }

      const reviewData = {
        userId: userId,
        productId: bookId,
        rating: rating,
        review: userReview,
      };

      const response = await instance.post(requests.submitReview, reviewData);
      if (response.data.message === 'Updated') {
        setUserReview('');
        setRating(0);
        setReviews([]);
        setOffset(0);
        setHasMoreReviews(true);
        fetchReviews(); // Refresh reviews after submitting
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const onStarRatingPress = (rating) => {
    setRating(rating);
  };

  const loadMoreReviews = () => {
    if (!isLoading && hasMoreReviews) {
      fetchReviews();
    }
  };

  return (
    <View style={styles.container}>
      {userDetails[0].userId ? (
        <View style={styles.reviewForm}>
          {/* <Text style={styles.label}>Rating:</Text> */}
          <StarRating 
            maxStars={5}
            starSize={30}
            color={COLORS.primaryOrangeHex}
            rating={rating}
            enableHalfStar={true}
            enableSwiping={true}
            onChange={(rating) => onStarRatingPress(rating)}
          />
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={5}
            value={userReview}
            onChangeText={setUserReview}
            placeholder="Write your review here..."
            placeholderTextColor="#AAAAAA"
          />
          <Button title="Submit Review" onPress={handleReviewSubmit} color={COLORS.primaryOrangeHex} />
        </View>
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
              {/* <Text>{item.rating}</Text> */}
            </View>
            <Text style={styles.reviewText}>{item.review}</Text>
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
  reviewForm: {
    marginBottom: SPACING.space_20,
    backgroundColor: COLORS.primaryBlackRGBA,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_18,
  },
  label: {
    color: COLORS.primaryWhiteHex,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryWhiteHex,
    padding: SPACING.space_12,
    marginTop: SPACING.space_10,
    marginBottom: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    textAlignVertical: 'top',
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
  reviewText: {
    color: COLORS.primaryWhiteHex,
  },
});

export default ProductReview;
