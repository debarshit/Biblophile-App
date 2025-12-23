import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    Dimensions, 
    SafeAreaView, 
    Platform, 
    TouchableOpacity, 
    ActivityIndicator,
    TouchableWithoutFeedback
} from 'react-native';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';
import BookshelfCard from '../components/BookshelfCard';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import HeaderBar from '../../../components/HeaderBar';
import { AntDesign } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_MARGIN = SPACING.space_8;
const CONTAINER_PADDING = SPACING.space_16;
const AVAILABLE_WIDTH = width - (CONTAINER_PADDING * 2);
const CARD_WIDTH = (AVAILABLE_WIDTH - (CARD_MARGIN * 2)) / 3;
const QUEUE_CARD_WIDTH = 120;
const QUEUE_CARD_MARGIN = SPACING.space_12;

interface Book {
    bookId: number;
    userBookId: number;
    bookPhoto: string;
    status: string;
    startDate: string;
    endDate: string;
    currentPage: number;
    position?: number;
}

interface QueueItem {
    userBookId: number;
    position: number;
    bookPhoto?: string;
    bookId?: number;
}

const DraggableQueueItem = ({ 
    item, 
    onDragStart, 
    onDragEnd,
    isActive,
    userData,
    navigation,
    onRemove
}: DragListRenderItemInfo<Book> & {
    userData: any;
    navigation: any;
    onRemove: (userBookId: number) => void;
}) => {
    return (
        <TouchableWithoutFeedback
            onPressIn={onDragStart}
            onPressOut={onDragEnd}
        >
            <View
                style={[
                    styles.queueCard,
                    isActive && styles.queueCardActive,
                ]}
            >
                <View style={styles.queueCardContent}>
                    <View style={styles.dragHandle}>
                        <AntDesign name="menufold" size={20} color={COLORS.secondaryLightGreyHex} />
                    </View>
                    
                    <View style={styles.queueBookCover}>
                        <BookshelfCard
                            id={item.bookId.toString()}
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

                    <View style={styles.queuePosition}>
                        <Text style={styles.positionText}>#{item.position}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => onRemove(item.userBookId)}
                    >
                        <AntDesign name="close" size={18} color={COLORS.primaryRedHex} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const BookListScreen = ({ route, navigation }) => {
    const { status, tagId, tagName, userData } = route.params;
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    
    // Queue state
    const [queueBooks, setQueueBooks] = useState<Book[]>([]);
    const [queueLoading, setQueueLoading] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0].accessToken;

    const updateBookList = (newBooks: Book[], limit: number) => {
        setBooks((prev) => {
            const ids = new Set(prev.map((b) => b.bookId));
            const filtered = newBooks.filter((b) => !ids.has(b.bookId));
            return [...prev, ...filtered];
        });

        if (newBooks.length < limit) setHasMore(false);
    };

    const fetchBooks = async (page: number) => {
        setLoading(true);
        try {
            const limit = 10;
            const offset = page * limit;

            let response;

            if (tagId) {
            // Fetch books for tag
                response = await instance.get(
                    `${requests.fetchBooksByTag(tagId)}?limit=${limit}&offset=${offset}`
                );
                const newBooks = response.data.data.books || [];
                updateBookList(newBooks, limit);
            
            } else {
            // Fetch status-based bookshelf
                const query = new URLSearchParams({
                    userId: userData.userId,
                    status,
                    limit: limit.toString(),
                    offset: offset.toString(),
                });

                response = await instance(`${requests.fetchBookShelf}?${query}`);
                const newBooks = response.data.data.userBooks || [];
                updateBookList(newBooks, limit);
            }

        } catch (error) {
            console.error("Failed to fetch books:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReadingQueue = async () => {
        if (status !== 'To be read') return;
        
        setQueueLoading(true);
        try {
            const response = await instance.get(requests.fetchReadingQueue, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            const queue = response.data.data.queue || [];
            
            if (queue.length > 0) {
                const userBookIds = queue.map((item: QueueItem) => item.userBookId);
                const booksResponse = await instance.post(
                    requests.fetchBooksByUserBookIds,
                    { userBookIds },
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                const queueBooksData = booksResponse.data.data.books || [];
                
                const mergedQueue = queue.map((qItem: QueueItem) => {
                    const bookData = queueBooksData.find((b: Book) => b.userBookId === qItem.userBookId);
                    return {
                        ...bookData,
                        position: qItem.position,
                    };
                }).sort((a: any, b: any) => a.position - b.position);

                setQueueBooks(mergedQueue);
            } else {
                setQueueBooks([]);
            }
        } catch (error) {
            console.error("Failed to fetch reading queue:", error);
        } finally {
            setQueueLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks(page);
        if (status === 'To be read') {
            fetchReadingQueue();
        }
    }, [page, status]);

    const loadMoreBooks = () => {
        if (hasMore && !loading) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    const handleRemoveFromQueue = async (userBookId: number) => {
        try {
            await instance.delete(requests.removeFromQueue(userBookId), {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            
            await fetchReadingQueue();
        } catch (error) {
            console.error("Failed to remove from queue:", error);
        }
    };

    const handleReordered = async (fromIndex: number, toIndex: number) => {
        setIsReordering(true);

        try {
            // Create a copy and reorder
            const newOrder = [...queueBooks];
            const [movedItem] = newOrder.splice(fromIndex, 1);
            newOrder.splice(toIndex, 0, movedItem);

            // Update positions
            const updatedOrder = newOrder.map((book, index) => ({
                ...book,
                position: index + 1,
            }));

            // Update local state immediately for smooth UI
            setQueueBooks(updatedOrder);

            // Send to backend
            const items = updatedOrder.map((book, index) => ({
                userBookId: book.userBookId,
                position: index + 1,
            }));

            await instance.put(
                requests.reorderQueue,
                { items },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
        } catch (error) {
            console.error("Failed to reorder queue:", error);
            // Revert to server state on error
            await fetchReadingQueue();
        } finally {
            setIsReordering(false);
        }
    };

    const renderQueueItem = (info: DragListRenderItemInfo<Book>) => {
        return (
            <DraggableQueueItem
                {...info}
                userData={userData}
                navigation={navigation}
                onRemove={handleRemoveFromQueue}
            />
        );
    };

    const renderBookItem = ({ item, index }: { item: Book; index: number }) => (
        <View style={[
            styles.cardContainer,
            {
                marginLeft: index % 3 === 0 ? 0 : CARD_MARGIN / 2,
                marginRight: index % 3 === 2 ? 0 : CARD_MARGIN / 2,
            }
        ]}>
            <BookshelfCard
                id={item.bookId.toString()}
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

    const renderQueueSection = () => {
        if (status !== 'To be read') return null;

        return (
            <View style={styles.queueSection}>
                <View style={styles.queueHeader}>
                    <View>
                        <Text style={styles.queueTitle}>📚 Reading Queue</Text>
                        <Text style={styles.queueSubtitle}>
                            Your next {queueBooks.length} of 5 books • Press menufold to reorder
                        </Text>
                    </View>
                    {isReordering && (
                        <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
                    )}
                </View>

                {queueLoading ? (
                    <View style={styles.queueLoadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
                    </View>
                ) : queueBooks.length > 0 ? (
                    <DragList
                        data={queueBooks}
                        keyExtractor={(item) => item.userBookId.toString()}
                        onReordered={handleReordered}
                        renderItem={renderQueueItem}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.queueContainer}
                    />
                ) : (
                    <View style={styles.emptyQueueContainer}>
                        <Text style={styles.emptyQueueText}>
                            No books in your queue yet. Add up to 5 books from your "To be read" list!
                        </Text>
                    </View>
                )}
            </View>
        );
    };
      
    return (
        <SafeAreaView style={styles.container}>
            <HeaderBar showBackButton={true} title={tagId ? tagName : status} />
            
            {renderQueueSection()}

            <FlatList
                data={books}
                numColumns={3}
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
    queueSection: {
        marginBottom: SPACING.space_24,
        paddingVertical: SPACING.space_16,
        backgroundColor: COLORS.primaryGreyHex,
        borderRadius: BORDERRADIUS.radius_15,
        paddingHorizontal: SPACING.space_16,
    },
    queueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.space_16,
    },
    queueTitle: {
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_18,
        color: COLORS.primaryWhiteHex,
    },
    queueSubtitle: {
        fontFamily: FONTFAMILY.poppins_regular,
        fontSize: FONTSIZE.size_12,
        color: COLORS.secondaryLightGreyHex,
        marginTop: SPACING.space_4,
    },
    queueLoadingContainer: {
        paddingVertical: SPACING.space_36,
        alignItems: 'center',
    },
    queueContainer: {
        paddingVertical: SPACING.space_8,
    },
    queueCard: {
        backgroundColor: COLORS.primaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_15,
        marginRight: QUEUE_CARD_MARGIN,
        width: QUEUE_CARD_WIDTH,
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    queueCardActive: {
        opacity: 0.8,
        transform: [{ scale: 1.05 }],
    },
    queueCardContent: {
        position: 'relative',
        padding: SPACING.space_8,
    },
    dragHandle: {
        position: 'absolute',
        top: SPACING.space_4,
        left: SPACING.space_4,
        zIndex: 10,
        backgroundColor: COLORS.primaryGreyHex,
        borderRadius: BORDERRADIUS.radius_10,
        padding: SPACING.space_4,
    },
    queueBookCover: {
        width: '100%',
        aspectRatio: 2/3,
        borderRadius: BORDERRADIUS.radius_10,
        overflow: 'hidden',
    },
    queuePosition: {
        position: 'absolute',
        top: SPACING.space_8,
        right: SPACING.space_8,
        backgroundColor: COLORS.primaryOrangeHex,
        borderRadius: BORDERRADIUS.radius_10,
        paddingHorizontal: SPACING.space_8,
        paddingVertical: SPACING.space_4,
    },
    positionText: {
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_12,
        color: COLORS.primaryWhiteHex,
    },
    removeButton: {
        position: 'absolute',
        bottom: SPACING.space_8,
        right: SPACING.space_8,
        backgroundColor: COLORS.primaryGreyHex,
        borderRadius: BORDERRADIUS.radius_20,
        padding: SPACING.space_4,
    },
    emptyQueueContainer: {
        paddingVertical: SPACING.space_24,
        paddingHorizontal: SPACING.space_16,
        alignItems: 'center',
    },
    emptyQueueText: {
        fontFamily: FONTFAMILY.poppins_regular,
        fontSize: FONTSIZE.size_14,
        color: COLORS.secondaryLightGreyHex,
        textAlign: 'center',
        lineHeight: 20,
    },
    listContent: {
        paddingBottom: SPACING.space_24,
        paddingHorizontal: Platform.OS === 'ios' ? SPACING.space_10 : 0,
    },
    emptyListContent: {
        flex: 1,
        justifyContent: 'center',
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: SPACING.space_12,
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