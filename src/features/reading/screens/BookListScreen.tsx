import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, SafeAreaView } from 'react-native';
import BookshelfCard from '../components/BookshelfCard';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';

const { width } = Dimensions.get('window');
const CARD_MARGIN = SPACING.space_8;
const CONTAINER_PADDING = SPACING.space_16;
const AVAILABLE_WIDTH = width - (CONTAINER_PADDING * 2);
const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_MARGIN) / 2;

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

    const renderBookItem = ({ item, index }) => (
        <View style={[
            styles.cardContainer,
            {
                marginLeft: index % 2 === 0 ? 0 : CARD_MARGIN / 2,
                marginRight: index % 2 === 1 ? 0 : CARD_MARGIN / 2,
            }
        ]}>
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
    );

    const renderLoadingFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingIndicator}>
                    <Text style={styles.loadingText}>Loading more books...</Text>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptySubtitle}>
                {status === 'Read' ? 'No books marked as read yet' :
                 status === 'Currently reading' ? 'No books currently being read' :
                 status === 'To be read' ? 'No books in your reading list' :
                 'No books found for this status'}
            </Text>
        </View>
    );
      
    return (
      <SafeAreaView style={styles.container}>
          <FlatList
              data={books}
              numColumns={2}
              keyExtractor={(item) => item.BookId.toString()}
              renderItem={renderBookItem}
              onEndReached={loadMoreBooks}
              onEndReachedThreshold={0.5} // Trigger when the user is 50% away from the bottom
              ListFooterComponent={renderLoadingFooter}
              ListEmptyComponent={books.length === 0 && !loading ? renderEmptyState : null}
              contentContainerStyle={[
                    styles.listContent,
                    books.length === 0 && !loading && styles.emptyListContent
              ]}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.row}
          />
      </SafeAreaView>
  );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primaryDarkGreyHex,
        paddingHorizontal: CONTAINER_PADDING,
        paddingTop: SPACING.space_16,
    },
    listContent: {
        paddingBottom: SPACING.space_24,
        paddingHorizontal: SPACING.space_10,
    },
    emptyListContent: {
        flex: 1,
        justifyContent: 'center',
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: SPACING.space_16,
    },
    cardContainer: {
        width: CARD_WIDTH,
        backgroundColor: COLORS.primaryGreyHex,
        borderRadius: BORDERRADIUS.radius_15,
        overflow: 'hidden',
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: SPACING.space_8,
    },
    loadingContainer: {
        paddingVertical: SPACING.space_20,
        alignItems: 'center',
    },
    loadingIndicator: {
        backgroundColor: COLORS.primaryGreyHex,
        paddingHorizontal: SPACING.space_20,
        paddingVertical: SPACING.space_12,
        borderRadius: BORDERRADIUS.radius_10,
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loadingText: {
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_medium,
        fontSize: FONTSIZE.size_14,
        textAlign: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.space_36,
        paddingHorizontal: SPACING.space_24,
    },
    emptyTitle: {
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_20,
        marginBottom: SPACING.space_12,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: COLORS.secondaryLightGreyHex,
        fontFamily: FONTFAMILY.poppins_regular,
        fontSize: FONTSIZE.size_14,
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default BookListScreen;