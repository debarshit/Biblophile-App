import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import instance from '../services/axios';
import requests from '../services/requests';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useStore } from '../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import BookshelfCard from '../components/BookshelfCard';
import Mascot from '../components/Mascot';

const BookshelfScreen = ({ navigation }) => {
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const userDetails = useStore((state: any) => state.userDetails);

  const fetchUserBooks = async () => {
    try {
      const response = await instance.post(requests.fetchUserBooks, {
        userId: userDetails[0].userId,
      });
      setUserBooks(response.data.userBooks);
    } catch (error) {
      console.error('Failed to fetch user books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBooks();
  }, []);

  const convertHttpToHttps = (url) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const renderBooksByStatus = (status) => {
    const books = userBooks.filter((book) => book.Status === status);
    if (books.length === 0) {
      return null;
    }

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{status}</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={books}
          contentContainerStyle={styles.bookshelfContainer}
          keyExtractor={(item) => item.BookId}
          renderItem={({ item }) => (
            <BookshelfCard
            id={item.BookId}
            photo={convertHttpToHttps(item.BookPhoto)}
            status={item.Status}
            startDate={item.StartDate}
            endDate={item.EndDate}
            currentPage={item.CurrentPage}
            onUpdate={null}
            navigation={navigation}

          />
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewFlex}
      >
        <HeaderBar title="My Bookshelf" />

        {userBooks.length === 0 && <Mascot emotion="sleeping"/>}

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <>
            {renderBooksByStatus('Currently reading')}
            {renderBooksByStatus('Read')}
            {renderBooksByStatus('To be read')}
            {renderBooksByStatus('Did not finish')}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollViewFlex: {
    paddingBottom: SPACING.space_30,
  },
  sectionContainer: {
    marginBottom: SPACING.space_20,
  },
  sectionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    paddingLeft: SPACING.space_20,
    marginBottom: SPACING.space_12,
  },
  bookshelfContainer: {
    paddingLeft: SPACING.space_20,
    gap: SPACING.space_20,
  },
  loadingText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginTop: SPACING.space_36,
  },
});

export default BookshelfScreen;
