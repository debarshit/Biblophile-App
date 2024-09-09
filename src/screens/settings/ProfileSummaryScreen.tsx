import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import instance from '../../services/axios';
import requests from '../../services/requests';
import BookshelfCard from '../../components/BookshelfCard';
import Mascot from '../../components/Mascot';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../theme/theme';
import { useStore } from '../../store/store';

const ProfileSummaryScreen = () => {
  const [userBooks, setUserBooks] = useState([]);
  const [userAverageRating, setUserAverageRating] = useState<number | null>(null);
  const [userAverageEmotions, setUserAverageEmotions] = useState([]);
  const [averageReadingDays, setAverageReadingDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const userDetails = useStore((state: any) => state.userDetails);
  const userId = userDetails[0].userId;

  const convertHttpToHttps = (url) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  useEffect(() => {
    const fetchUserBooks = async () => {
      try {
        const response = await instance.post(requests.fetchUserBooks, {
          userId: userId,
        });
        setUserBooks(response.data.userBooks);
      } catch (error) {
        console.error('Failed to fetch user books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBooks();
  }, []);

  useEffect(() => {
    const fetchAverageRatingByUser = async () => {
      try {
        const response = await instance(requests.fetchAverageRatingByUser + userId);
        setUserAverageRating(response.data.averageRating);
      } catch (error) {
        console.error('Failed to fetch user rating:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAverageRatingByUser();
  }, []);

  useEffect(() => {
    const fetchAverageEmotionsByUser = async () => {
      try {
        const response = await instance(requests.fetchAverageEmotionsByUser + userId);
        if (response.data.topEmotions) {
          setUserAverageEmotions(response.data.topEmotions);
        }
      } catch (error) {
        console.error('Failed to fetch user emotions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAverageEmotionsByUser();
  }, []);

  useEffect(() => {
    const fetchAverageDaystoFinish = async () => {
      try {
        const response = await instance(requests.fetchAverageDaystoFinish + userId);
        setAverageReadingDays(response.data.averageDaysToFinish);
      } catch (error) {
        console.error('Failed to fetch average reading days:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAverageDaystoFinish();
  }, []);

  const currentlyReading = userBooks.filter((book) => book.Status === 'Currently reading');
  const recentlyRead = userBooks.filter((book) => book.Status === 'Read');
  const toBeRead = userBooks.filter((book) => book.Status === 'To be read');

  const formattedMoodPreferences = userAverageEmotions.map((mood) => mood.Emotion).join(', ');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
        <View style={styles.infoSection}>
            <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood Preferences</Text>
            {userAverageEmotions.length === 0 ? (
                <Text style={styles.highlightText}>Sufficient data not available.</Text>
            ) : (
                <Text style={styles.descriptionText}>
                Prefers to read books which evoke <Text style={styles.highlightText}>{formattedMoodPreferences}</Text>.
                </Text>
            )}
            </View>
            <View style={styles.section}>
            <View style={styles.summaryItem}>
                <Text style={styles.sectionTitle}>Average Days to Finish a Book</Text>
                <Text style={styles.descriptionText}><Text style={styles.highlightText}>{averageReadingDays}</Text> days</Text>
            </View>
            <View style={styles.summaryItem}>
                <Text style={styles.sectionTitle}>Average Rating</Text>
                <Text style={styles.descriptionText}><Text style={styles.highlightText}>{userAverageRating}</Text> / 5</Text>
            </View>
            </View>
        </View>
        <View style={styles.booksSection}>
            {userBooks.length === 0 && <Mascot emotion="pendingBooks" />}
            {currentlyReading.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Currently Reading</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.booksList}>
                {currentlyReading.map((book) => (
                    <BookshelfCard
                    key={book.BookId}
                    id={book.BookId}
                    photo={convertHttpToHttps(book.BookPhoto)}
                    status={book.Status}
                    startDate={book.StartDate}
                    endDate={book.EndDate}
                    currentPage={book.CurrentPage}
                    onUpdate={null}
                    />
                ))}
                </ScrollView>
            </View>
            )}
            {recentlyRead.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Read Recently</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.booksList}>
                {recentlyRead.map((book) => (
                    <BookshelfCard
                    key={book.BookId}
                    id={book.BookId}
                    photo={convertHttpToHttps(book.BookPhoto)}
                    status={book.Status}
                    startDate={book.StartDate}
                    endDate={book.EndDate}
                    currentPage={book.CurrentPage}
                    onUpdate={null}
                    />
                ))}
                </ScrollView>
            </View>
            )}
            {toBeRead.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>To Be Read</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.booksList}>
                {toBeRead.map((book) => (
                    <BookshelfCard
                    key={book.BookId}
                    id={book.BookId}
                    photo={convertHttpToHttps(book.BookPhoto)}
                    status={book.Status}
                    startDate={book.StartDate}
                    endDate={book.EndDate}
                    currentPage={book.CurrentPage}
                    onUpdate={null}
                    />
                ))}
                </ScrollView>
            </View>
            )}
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.space_20,
    backgroundColor: COLORS.primaryBlackHex,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  booksSection: {
    marginBottom: SPACING.space_20,
  },
  infoSection: {
    flexDirection: 'column',
    gap: SPACING.space_20,
  },
  section: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_20,
    marginBottom: SPACING.space_20,
  },
  sectionTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    marginBottom: SPACING.space_16,
    color: COLORS.primaryWhiteHex,
  },
  booksList: {
    flexDirection: 'row',
  },
  descriptionText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_18,
  },
  highlightText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
  },
  summaryItem: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_16,
    textAlign: 'center',
    shadowColor: COLORS.primaryBlackRGBA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    margin: SPACING.space_10,
  },
});

export default ProfileSummaryScreen;