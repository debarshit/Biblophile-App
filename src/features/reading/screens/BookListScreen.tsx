import React, { useEffect, useMemo, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    Dimensions, 
    SafeAreaView, 
    Platform,
    TouchableOpacity,
    Modal,
    Share,
    Alert
} from 'react-native';
import BookshelfCard from '../components/BookshelfCard';
import ReadingQueueSection from '../components/ReadingQueueSection';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import HeaderBar from '../../../components/HeaderBar';
import { useTheme } from '../../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_MARGIN = SPACING.space_8;
const CONTAINER_PADDING = SPACING.space_16;
const AVAILABLE_WIDTH = width - (CONTAINER_PADDING * 2);
const CARD_WIDTH = (AVAILABLE_WIDTH - (CARD_MARGIN * 2)) / 3;

const APP_BASE_URL = 'https://yourapp.com';

interface Book {
    bookId: number;
    userBookId: number;
    bookPhoto: string;
    status: string;
    startDate: string;
    endDate: string;
    progressUnit?: 'pages' | 'percentage' | 'seconds';
    progressValue: number | null;
    position?: number;
    visibility: 'only_me' | 'friends' | 'followers' | 'everyone';
}

const BookListScreen = ({ route, navigation }) => {
    const { status, tagId, tagName, userData } = route.params;
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [showShelfMenu, setShowShelfMenu] = useState(false);
    const [currentVisibility, setCurrentVisibility] = useState<'only_me' | 'friends' | 'followers' | 'everyone'>('everyone');

    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0].accessToken;
    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    // ─── Share handler (available to everyone) ───────────────────────────────
    const handleShare = async () => {
        try {
            // Build a deep link. Adjust the path structure to match your router.
            const params = new URLSearchParams({ userId: userData.userId });
            if (tagId) {
                params.set('tagId', tagId);
                params.set('tagName', tagName ?? '');
            } else {
                params.set('status', status);
            }

            const shareUrl = `${APP_BASE_URL}/bookshelf?${params.toString()}`;
            const shelfLabel = tagId ? tagName : status;

            await Share.share({
                title: `${userData.username ?? 'A user'}'s ${shelfLabel} shelf`,
                message: `Check out this reading shelf: ${shareUrl}`,
                url: shareUrl,   // iOS uses `url`; Android uses `message`
            });
        } catch (error: any) {
            // User dismissed the sheet — no need to alert
            if (error?.message !== 'User did not share') {
                Alert.alert('Could not share', 'Please try again.');
            }
        }
    };

    const updateBookList = (newBooks: Book[], limit: number) => {
        setBooks((prev) => {
            const ids = new Set(prev.map((b) => b.bookId));
            const filtered = newBooks.filter((b) => !ids.has(b.bookId));
            return [...prev, ...filtered];
        });
        if (newBooks.length < limit) setHasMore(false);
    };

    const updateShelfPrivacy = async (visibility: string) => {
        try {
            await instance.put(
                requests.updateShelfPrivacy,
                tagId
                    ? { tagId, visibility }
                    : { shelfType: status, visibility },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
        } catch (err) {
            console.log('Failed to update shelf privacy', err);
        }
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
                    `${requests.fetchBooksByTag(tagId)}?userId=${userData.userId}&limit=${limit}&offset=${offset}`,
                    { headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' } }
                );
                const newBooks = response.data.data.books || [];
                setCurrentVisibility(response.data.data.tagVisibility || 'everyone');
                updateBookList(newBooks, limit);
            } else {
                // Fetch status-based bookshelf
                const query = new URLSearchParams({
                    userId: userData.userId,
                    status,
                    limit: limit.toString(),
                    offset: offset.toString(),
                });
                response = await instance(
                    `${requests.fetchBookShelf}?${query}`,
                    { headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' } }
                );
                const newBooks = response.data.data.userBooks || [];
                setCurrentVisibility(response.data.data.shelfVisibility || 'everyone');
                updateBookList(newBooks, limit);
            }
        } catch (error) {
            console.error('Failed to fetch books:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks(page);
    }, [page, status]);

    const loadMoreBooks = () => {
        if (hasMore && !loading) setPage((prev) => prev + 1);
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
                userBookId={item.userBookId}
                isPageOwner={userData.isPageOwner}
                photo={convertHttpToHttps(item.bookPhoto)}
                status={item.status}
                startDate={item.startDate}
                endDate={item.endDate}
                progressUnit={item.progressUnit}
                progressValue={item.progressValue}
                visibility={item.visibility}
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

    // ─── Right header icons ───────────────────────────────────────────────────
    const renderHeaderRight = () => (
        <View style={styles.headerActions}>
            {/* Share — visible to everyone */}
            <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
                <Ionicons name="share-social-outline" size={22} color={COLORS.primaryWhiteHex} />
            </TouchableOpacity>

            {/* Privacy menu — owner only */}
            {userData.isPageOwner && (
                <TouchableOpacity onPress={() => setShowShelfMenu(true)} style={styles.headerIconBtn}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.primaryWhiteHex} />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <HeaderBar
                showBackButton={true}
                title={tagId ? tagName : status}
                rightComponent={renderHeaderRight()}
            />

            <FlatList
                data={books}
                numColumns={3}
                keyExtractor={(item) => item.bookId.toString()}
                renderItem={renderBookItem}
                onEndReached={loadMoreBooks}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={
                    userData.isPageOwner ? (
                        <ReadingQueueSection
                            status={status}
                            userData={userData}
                            navigation={navigation}
                            accessToken={accessToken}
                        />
                    ) : null
                }
                ListFooterComponent={renderLoadingFooter}
                ListEmptyComponent={books.length === 0 && !loading ? renderEmptyState : null}
                contentContainerStyle={[
                    styles.listContent,
                    books.length === 0 && !loading && styles.emptyListContent
                ]}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={styles.row}
            />

            <Modal visible={showShelfMenu} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowShelfMenu(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Shelf Privacy</Text>
                        {[
                            { label: '🔒 Only Me',   value: 'only_me'   },
                            { label: '👥 Friends',   value: 'friends'   },
                            { label: '👤 Followers', value: 'followers' },
                            { label: '🌍 Everyone',  value: 'everyone'  },
                        ].map((option) => {
                            const isSelected = option.value === currentVisibility;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.modalOption, isSelected && styles.selectedOption]}
                                    onPress={() => {
                                        updateShelfPrivacy(option.value);
                                        setCurrentVisibility(option.value as any);
                                        setShowShelfMenu(false);
                                    }}
                                >
                                    <Text style={[styles.modalText, isSelected && styles.selectedText]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const createStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primaryDarkGreyHex,
        paddingHorizontal: CONTAINER_PADDING,
        paddingTop: SPACING.space_16,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.space_8,
    },
    headerIconBtn: {
        padding: SPACING.space_4,
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
        shadowOffset: { width: 0, height: 4 },
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
        shadowOffset: { width: 0, height: 2 },
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.primaryDarkGreyHex,
        padding: SPACING.space_20,
        borderTopLeftRadius: BORDERRADIUS.radius_20,
        borderTopRightRadius: BORDERRADIUS.radius_20,
    },
    modalTitle: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_16,
        fontFamily: FONTFAMILY.poppins_semibold,
        marginBottom: SPACING.space_12,
    },
    modalOption: {
        paddingVertical: SPACING.space_12,
    },
    modalText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_medium,
    },
    selectedOption: {
        backgroundColor: COLORS.primaryGreyHex,
        borderRadius: BORDERRADIUS.radius_8,
        paddingHorizontal: SPACING.space_8,
    },
    selectedText: {
        color: COLORS.primaryOrangeHex,
    },
});

export default BookListScreen;