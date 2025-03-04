import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import BookshelfCard from '../components/BookshelfCard';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

interface Book {
    BookId: number;
    BookPhoto: string;
    Status: string;
    StartDate: string;
    EndDate: string;
    CurrentPage: number;
}

const BookListScreen = ({ route, navigation }) => {
    const { status, userData } = route.params;
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);

    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0].accessToken;

    const convertHttpToHttps = (url) => {
        if (url && url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }
        return url;
    };

    const fetchBookShelf = async (page: number) => {
        setLoading(true);
        try {
          const response = await instance.post(requests.fetchBookShelf, {
            userId: userData.userId,
            status,
            limit: 10,
            offset: page * 10,
          }, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
      
          const newBooks: Book[] = response.data.userBooks;
      
          // Prevent duplicates by filtering out books already in the state
          setBooks((prevBooks) => {
            const bookIds = new Set(prevBooks.map((book) => book.BookId));
            const filteredNewBooks = newBooks.filter((book) => !bookIds.has(book.BookId));
            return [...prevBooks, ...filteredNewBooks];
          });
      
          if (newBooks.length < 10) {
            setHasMore(false); // No more books to load
          }
      
        } catch (error) {
          console.error('Failed to fetch user books:', error);
        } finally {
          setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookShelf(page);
    }, [page, status]);


    const loadMoreBooks = () => {
        if (hasMore && !loading) {
            setPage((prevPage) => prevPage + 1);
        }
    };
      
    return (
      <View style={styles.container}>
          <FlatList
              data={books}
              keyExtractor={(item) => item.BookId.toString()}
              renderItem={({ item }) => (
                  <View style={styles.cardContainer}>
                      <BookshelfCard
                          id={item.BookId}
                          isPageOwner={userData.isPageOwner}
                          photo={convertHttpToHttps(item.BookPhoto)} 
                          status={item.Status}
                          startDate={item.StartDate}
                          endDate={item.EndDate}
                          currentPage={item.CurrentPage}
                          onUpdate={null}
                          navigation={navigation}
                      />
                  </View>
              )}
              onEndReached={loadMoreBooks}
              onEndReachedThreshold={0.5} // Trigger when the user is 50% away from the bottom
              ListFooterComponent={loading ? <Text style={styles.loadingText}>Loading...</Text> : null}
              contentContainerStyle={styles.listContent} // Add some padding to the list
          />
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_16,
  },
  cardContainer: {
    flex: 1,
    margin: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryGreyHex,
    padding: SPACING.space_12,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  loadingText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    textAlign: 'center',
    padding: SPACING.space_20,
  },
  listContent: {
    paddingBottom: SPACING.space_24,
  },
});

export default BookListScreen;