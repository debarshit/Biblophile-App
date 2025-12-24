import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator
} from 'react-native';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';
import DraggableQueueItem from './DraggableQueueItem';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useFocusEffect } from '@react-navigation/native';

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

interface ReadingQueueSectionProps {
    status: string;
    userData: any;
    navigation: any;
    accessToken: string;
}

const ReadingQueueSection: React.FC<ReadingQueueSectionProps> = ({ 
    status, 
    userData, 
    navigation, 
    accessToken 
}) => {
    const [queueBooks, setQueueBooks] = useState<Book[]>([]);
    const [queueLoading, setQueueLoading] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    const fetchReadingQueue = async () => {
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

    useFocusEffect(
        React.useCallback(() => {
            if (status === 'To be read') {
            fetchReadingQueue();
            }
        }, [status])
    );

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

const styles = StyleSheet.create({
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
});

export default ReadingQueueSection;