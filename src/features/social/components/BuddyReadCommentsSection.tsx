import { JSX, forwardRef, useEffect, useRef, useImperativeHandle, useMemo } from "react";
import {
    View, Text, StyleSheet, ActivityIndicator,
    TouchableOpacity, Pressable, ScrollView, Platform, UIManager
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, BORDERRADIUS, FONTFAMILY, FONTSIZE } from "../../../theme/theme";
import { CommentSortDropdown } from "./CommentSortDropdown";
import { CommentItem } from "./BuddyReadCommentItem";
import { useComments, Comment } from "../hooks/useComments";
import { useTheme } from "../../../contexts/ThemeContext";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CurrentUser {
    userId: string | null;
    readingStatus: string | null;
    progressPercentage: number;
}

export interface BuddyReadCommentsSectionRef {
    submitComment: (commentText: string, progressPercentage?: number, parentCommentId?: number | null) => Promise<void>;
}

interface BuddyReadCommentsSectionProps {
    buddyReadId: string;
    currentUser: CurrentUser;
    isHost: boolean;
    accessToken: string | null;
    onReplyPress: (commentId: number, username: string, pageNumber: number) => void;
    replyContextId: number | null;
    onCommentSubmit?: (commentText: string, progressPercentage?: number, parentCommentId?: number | null) => void;
    onContinueThread?: (comment: Comment) => void;
    rootCommentId?: number;
    rootComment?: Comment;
}

const BuddyReadCommentsSection = forwardRef<BuddyReadCommentsSectionRef, BuddyReadCommentsSectionProps>(({
    buddyReadId,
    currentUser,
    isHost,
    accessToken,
    onReplyPress,
    replyContextId,
    onContinueThread,
    rootCommentId,
    rootComment,
}, ref) => {
    const scrollRef = useRef<ScrollView>(null);
    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    const {
        comments,
        loadingInitialData,
        error,
        loadingComments,
        loadingReplies,
        hasMoreCommentsState,
        hasMoreReplies,
        selectedCommentForDeletion,
        sort,
        getAnimatedValue,
        fetchComments,
        loadMoreComments,
        loadReplies,
        handleSortChange,
        handleEllipsisClick,
        handleDeleteComment,
        handleCommentSubmit,
        toggleLike,
    } = useComments({ buddyReadId, accessToken, currentUser, rootCommentId, rootComment });

    useImperativeHandle(ref, () => ({ submitComment: handleCommentSubmit }));

    useEffect(() => { fetchComments(); }, [fetchComments]);

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        const diffInDays = diffInHours / 24;
        if (diffInHours < 1) return 'just now';
        if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
        if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`;
        return date.toLocaleDateString();
    };

    const renderComments = (currentComments: Comment[], depth = 0, maxDepth = 3): JSX.Element[] =>
        currentComments.map(comment => (
            <CommentItem
                key={comment.commentId}
                comment={comment}
                depth={depth}
                maxDepth={maxDepth}
                currentUser={currentUser}
                isHost={isHost}
                replyContextId={replyContextId}
                selectedCommentForDeletion={selectedCommentForDeletion}
                loadingReplies={loadingReplies}
                hasMoreReplies={hasMoreReplies}
                animatedValue={getAnimatedValue(comment.commentId)}
                onReplyPress={onReplyPress}
                onToggleLike={toggleLike}
                onLoadReplies={loadReplies}
                onEllipsisClick={handleEllipsisClick}
                onDeleteComment={handleDeleteComment}
                onContinueThread={onContinueThread}
                renderComments={renderComments}
                formatTimestamp={formatTimestamp}
            />
        ));

    if (loadingInitialData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
                <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color={COLORS.primaryRedHex} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => fetchComments()} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView ref={scrollRef} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
                <View style={styles.commentsSection}>
                    {/* Header */}
                    <View style={styles.commentsHeader}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.commentsTitle}>Discussion</Text>
                            <View style={styles.commentCount}>
                                <Text style={styles.commentCountText}>{comments.length}</Text>
                            </View>
                        </View>
                        <CommentSortDropdown
                            label={<Ionicons name="filter" size={20} color={COLORS.primaryWhiteHex} />}
                            items={[
                                { label: 'Latest First', value: 'created_at_desc' },
                                { label: 'Oldest First', value: 'created_at_asc' },
                                { label: 'Page Ascending', value: 'page_asc' },
                                { label: 'Page Descending', value: 'page_desc' },
                            ]}
                            onValueChange={handleSortChange}
                            itemStyle={styles.dropdownItem}
                            itemTextStyle={styles.dropdownItemText}
                            dropdownStyle={styles.dropdownStyle}
                            labelStyle={styles.dropdownLabel}
                        />
                    </View>

                    {/* Comments list */}
                    {comments.length > 0 ? (
                        <View style={styles.commentsContainer}>
                            {renderComments(comments)}
                        </View>
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.secondaryLightGreyHex} />
                            <Text style={styles.emptyStateTitle}>No comments yet</Text>
                            <Text style={styles.emptyStateSubtitle}>Be the first to share your thoughts!</Text>
                        </View>
                    )}

                    {/* Load more */}
                    {hasMoreCommentsState && (
                        <Pressable
                            onPress={loadMoreComments}
                            style={[styles.loadMoreCommentsButton, loadingComments && styles.loadingButton]}
                            disabled={loadingComments}
                        >
                            {loadingComments ? (
                                <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                            ) : (
                                <>
                                    <Ionicons name="arrow-down" size={18} color={COLORS.primaryWhiteHex} />
                                    <Text style={styles.loadMoreCommentsButtonText}>Load More Comments</Text>
                                </>
                            )}
                        </Pressable>
                    )}
                </View>
            </ScrollView>
        </View>
    );
});

const createStyles = (COLORS) => StyleSheet.create({
    commentsSection: {
        backgroundColor: COLORS.primaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_15,
        marginBottom: SPACING.space_20,
        overflow: 'hidden',
    },
    loadingContainer: {
        backgroundColor: COLORS.primaryDarkGreyHex,
        padding: SPACING.space_30,
        borderRadius: BORDERRADIUS.radius_15,
        alignItems: 'center',
        marginBottom: SPACING.space_20,
    },
    loadingText: {
        color: COLORS.secondaryLightGreyHex,
        marginTop: SPACING.space_10,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
    },
    errorContainer: {
        backgroundColor: COLORS.primaryDarkGreyHex,
        padding: SPACING.space_30,
        borderRadius: BORDERRADIUS.radius_15,
        alignItems: 'center',
        marginBottom: SPACING.space_20,
    },
    errorText: {
        color: COLORS.primaryRedHex,
        textAlign: 'center',
        marginVertical: SPACING.space_15,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
    },
    retryButton: {
        backgroundColor: COLORS.primaryOrangeHex,
        paddingHorizontal: SPACING.space_20,
        paddingVertical: SPACING.space_10,
        borderRadius: BORDERRADIUS.radius_8,
    },
    retryButtonText: {
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_medium,
        fontSize: FONTSIZE.size_14,
    },
    commentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.space_20,
        paddingVertical: SPACING.space_20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primaryGreyHex,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    commentsTitle: {
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_18,
        color: COLORS.primaryWhiteHex,
        marginRight: SPACING.space_10,
    },
    commentCount: {
        backgroundColor: COLORS.primaryOrangeHex,
        borderRadius: BORDERRADIUS.radius_15,
        paddingHorizontal: SPACING.space_8,
        paddingVertical: SPACING.space_2,
        minWidth: 24,
        alignItems: 'center',
    },
    commentCountText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_medium,
    },
    commentsContainer: {
        paddingHorizontal: SPACING.space_20,
        paddingVertical: SPACING.space_10,
    },
    emptyStateContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.space_36,
        paddingHorizontal: SPACING.space_20,
    },
    emptyStateTitle: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_18,
        fontFamily: FONTFAMILY.poppins_semibold,
        marginTop: SPACING.space_15,
        marginBottom: SPACING.space_8,
    },
    emptyStateSubtitle: {
        color: COLORS.secondaryLightGreyHex,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
        textAlign: 'center',
    },
    loadMoreCommentsButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primaryOrangeHex,
        paddingVertical: SPACING.space_15,
        paddingHorizontal: SPACING.space_20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: SPACING.space_20,
        marginVertical: SPACING.space_15,
        borderRadius: BORDERRADIUS.radius_10,
        elevation: 5,
    },
    loadingButton: { backgroundColor: COLORS.secondaryLightGreyHex },
    loadMoreCommentsButtonText: {
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_14,
        color: COLORS.primaryWhiteHex,
        marginLeft: SPACING.space_8,
    },
    dropdownStyle: {
        backgroundColor: COLORS.primaryGreyHex,
        borderRadius: BORDERRADIUS.radius_8,
        width: 160,
        marginTop: SPACING.space_4,
        elevation: 10,
    },
    dropdownItem: {
        paddingVertical: SPACING.space_12,
        paddingHorizontal: SPACING.space_15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primaryDarkGreyHex,
    },
    dropdownItemText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
    },
    dropdownLabel: {
        color: COLORS.primaryWhiteHex,
        padding: SPACING.space_8,
        borderRadius: BORDERRADIUS.radius_4,
        backgroundColor: COLORS.primaryGreyHex,
    },
});

export default BuddyReadCommentsSection;