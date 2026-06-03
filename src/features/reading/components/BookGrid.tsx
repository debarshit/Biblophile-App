import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Platform,
    TouchableOpacity,
    Modal,
    Dimensions,
} from 'react-native';
import BookshelfCard from './BookshelfCard';
import { BORDERRADIUS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import type { Book } from '../types';

const { width } = Dimensions.get('window');
const CARD_MARGIN = SPACING.space_8;
const CONTAINER_PADDING = SPACING.space_16;
const AVAILABLE_WIDTH = width - CONTAINER_PADDING * 2;
const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_MARGIN * 2) / 3;

const VISIBILITY_OPTIONS = [
    { value: 'only_me',   label: '🔒 Only Me' },
    { value: 'friends',   label: '👥 Friends' },
    { value: 'followers', label: '👤 Followers' },
    { value: 'everyone',  label: '🌍 Everyone' },
] as const;

interface BookGridProps {
    books: Book[];
    loading: boolean;
    isPageOwner?: boolean;
    emptyMessage?: string;
    listHeader?: React.ReactElement | null;
    showPrivacyModal: boolean;
    currentVisibility: 'only_me' | 'friends' | 'followers' | 'everyone';
    onClosePrivacyModal: () => void;
    onSelectVisibility: (v: 'only_me' | 'friends' | 'followers' | 'everyone') => void;
    onEndReached: () => void;
    navigation: any;
}

export const BookGrid: React.FC<BookGridProps> = ({
    books,
    loading,
    isPageOwner,
    emptyMessage = 'No books found',
    listHeader,
    showPrivacyModal,
    currentVisibility,
    onClosePrivacyModal,
    onSelectVisibility,
    onEndReached,
    navigation,
}) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    const renderItem = useCallback(
        ({ item, index }: { item: Book; index: number }) => (
            <View
                style={[
                    styles.cardContainer,
                    {
                        marginLeft: index % 3 === 0 ? 0 : CARD_MARGIN / 2,
                        marginRight: index % 3 === 2 ? 0 : CARD_MARGIN / 2,
                    },
                ]}
            >
                <BookshelfCard
                    id={item.bookId.toString()}
                    userBookId={item.userBookId}
                    isPageOwner={isPageOwner}
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
        ),
        [isPageOwner, styles, navigation]
    );

    const footer = loading ? (
        <View style={styles.loadingContainer}>
            <View style={styles.loadingIndicator}>
                <Text style={styles.loadingText}>Loading more books...</Text>
            </View>
        </View>
    ) : null;

    const empty = !loading ? (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptySubtitle}>{emptyMessage}</Text>
        </View>
    ) : null;

    return (
        <>
            <FlatList
                data={books}
                numColumns={3}
                keyExtractor={(item) => item.bookId.toString()}
                renderItem={renderItem}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={listHeader}
                ListFooterComponent={footer}
                ListEmptyComponent={empty}
                contentContainerStyle={[
                    styles.listContent,
                    books.length === 0 && !loading && styles.emptyListContent,
                ]}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={styles.row}
            />

            <Modal visible={showPrivacyModal} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={onClosePrivacyModal}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Shelf Privacy</Text>
                        {VISIBILITY_OPTIONS.map(({ value, label }) => (
                            <TouchableOpacity
                                key={value}
                                style={[
                                    styles.modalOption,
                                    value === currentVisibility && styles.selectedOption,
                                ]}
                                onPress={() => onSelectVisibility(value)}
                            >
                                <Text
                                    style={[
                                        styles.modalText,
                                        value === currentVisibility && styles.selectedText,
                                    ]}
                                >
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const createStyles = (COLORS: any) =>
    StyleSheet.create({
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