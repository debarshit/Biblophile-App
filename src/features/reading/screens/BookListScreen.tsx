import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, SafeAreaView } from 'react-native';
import BookshelfCard from '../components/BookshelfCard';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import HeaderBar from '../../../components/HeaderBar';

const { width } = Dimensions.get('window');
const CARD_MARGIN = SPACING.space_8;
const CONTAINER_PADDING = SPACING.space_16;
const AVAILABLE_WIDTH = width - (CONTAINER_PADDING * 2);
const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_MARGIN) / 2;

interface Book {
    bookId: number;
    bookPhoto: string;
    status: string;
    startDate: string;
    endDate: string;
    currentPage: number;
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
            const offset = page * 10;
            const limit = 10;

            const query = new URLSearchParams({
                userId: userData.userId,
                status,
                limit: limit.toString(),
                offset: offset.toString()
            });

            const response = await instance(`${requests.fetchBookShelf}?${query.toString()}`);
            const newBooks: Book[] = Array.isArray(response.data?.data?.userBooks) ? response.data.data.userBooks : [];

            setBooks((prevBooks) => {
                const bookIds = new Set(prevBooks.map((book) => book.bookId));
                const filteredNewBooks = newBooks.filter((book) => !bookIds.has(book.bookId));
                return [...prevBooks, ...filteredNewBooks];
            });

            if (newBooks.length < limit) {
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
                id={item.bookId}
                isPageOwner={userData.isPageOwner}
                photo={convertHttpToHttps(item.bookPhoto)}
                status={item.status}
                startDate={item.startDate}
                endDate={item.endDate}
                currentPage={item.currentPage}
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
        <HeaderBar showBackButton={true} title={status} />
          <FlatList
              data={books}
              numColumns={2}
              keyExtractor={(item) => item.bookId.toString()}
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