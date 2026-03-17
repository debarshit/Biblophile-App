import { JSX } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { COLORS, SPACING, BORDERRADIUS, FONTFAMILY, FONTSIZE } from "../../../theme/theme";
import { Comment } from "../hooks/useComments";

interface CommentItemProps {
    comment: Comment;
    depth: number;
    maxDepth: number;
    currentUser: { userId: string | null; readingStatus: string | null; progressPercentage: number };
    isHost: boolean;
    replyContextId: number | null;
    selectedCommentForDeletion: number | null;
    loadingReplies: Record<number, boolean>;
    hasMoreReplies: Record<number, boolean>;
    animatedValue: Animated.Value;
    onReplyPress: (commentId: number, username: string, pageNumber: number) => void;
    onToggleLike: (commentId: number) => void;
    onLoadReplies: (commentId: number) => void;
    onEllipsisClick: (commentId: number) => void;
    onDeleteComment: (commentId: number) => void;
    onContinueThread?: (comment: Comment) => void;
    renderComments: (comments: Comment[], depth: number, maxDepth: number) => JSX.Element[];
    formatTimestamp: (ts: string) => string;
}

export const CommentItem = ({
    comment,
    depth,
    maxDepth,
    currentUser,
    isHost,
    replyContextId,
    selectedCommentForDeletion,
    loadingReplies,
    hasMoreReplies,
    animatedValue,
    onReplyPress,
    onToggleLike,
    onLoadReplies,
    onEllipsisClick,
    onDeleteComment,
    onContinueThread,
    renderComments,
    formatTimestamp,
}: CommentItemProps) => {
    const isBlurred = currentUser.readingStatus !== 'Read' 
        && currentUser.progressPercentage < comment.progressPercentage;

    return (
        <Animated.View
            style={[
                styles.commentContainer,
                {
                    marginLeft: depth * SPACING.space_2,
                    transform: [{ scale: animatedValue }],
                },
            ]}
        >
            {/* Header */}
            <View style={styles.commentHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {comment.user_name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.commentUserName}>{comment.user_name}</Text>
                        <View style={styles.commentMeta}>
                            <Text style={styles.pageIndicator}>At {comment.progressPercentage}%</Text>
                            <Text style={styles.timestamp}>• {formatTimestamp(comment.createdAt)}</Text>
                        </View>
                    </View>
                </View>
                {(isHost || comment.userId === currentUser.userId) && (
                    <Pressable
                        onPress={() => onEllipsisClick(comment.commentId)}
                        style={styles.optionsButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.secondaryLightGreyHex} />
                    </Pressable>
                )}
            </View>

            {/* Delete dropdown */}
            {selectedCommentForDeletion === comment.commentId && (
                <View style={styles.deleteDropdown}>
                    <Pressable onPress={() => onDeleteComment(comment.commentId)} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={16} color={COLORS.primaryRedHex} />
                        <Text style={styles.deleteButtonText}>Delete Comment</Text>
                    </Pressable>
                </View>
            )}

            {/* Text */}
            <View style={styles.textWrapper}>
                <Text style={styles.commentText}>{comment.commentText}</Text>
                {isBlurred && (
                    <BlurView
                        intensity={30}
                        tint="dark"
                        experimentalBlurMethod="dimezisBlurView"
                        style={StyleSheet.absoluteFill}
                    />
                )}
            </View>

            {/* Actions */}
            <View style={styles.commentActions}>
                <Pressable
                    onPress={() => onToggleLike(comment.commentId)}
                    style={styles.actionButton}
                >
                    <Animated.View style={{ transform: [{ scale: animatedValue }] }}>
                        <FontAwesome6
                            name="heart"
                            size={18}
                            color={comment.liked_by_user ? COLORS.primaryOrangeHex : COLORS.secondaryLightGreyHex}
                            solid={comment.liked_by_user}
                        />
                    </Animated.View>
                    <Text style={[styles.actionText, comment.liked_by_user && { color: COLORS.primaryOrangeHex }]}>
                        {comment.like_count || 0}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => onReplyPress(comment.commentId, comment.user_name, comment.progressPercentage)}
                    style={styles.actionButton}
                >
                    <Ionicons
                        name="chatbubble-outline"
                        size={18}
                        color={replyContextId === comment.commentId ? COLORS.primaryOrangeHex : COLORS.secondaryLightGreyHex}
                    />
                    <Text style={[styles.actionText, replyContextId === comment.commentId && { color: COLORS.primaryOrangeHex }]}>
                        Reply
                    </Text>
                </Pressable>

                {comment.reply_count > 0 && (
                    <Pressable
                        onPress={() => onLoadReplies(comment.commentId)}
                        style={styles.actionButton}
                        disabled={loadingReplies[comment.commentId]}
                    >
                        {loadingReplies[comment.commentId] ? (
                            <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
                        ) : (
                            <>
                                <Ionicons name="arrow-down" size={16} color={COLORS.secondaryLightGreyHex} />
                                <Text style={styles.actionText}>
                                    {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                                </Text>
                            </>
                        )}
                    </Pressable>
                )}
            </View>

            {/* Nested replies or continue thread */}
            {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                depth < maxDepth ? (
                    <View style={styles.repliesContainer}>
                        {renderComments(comment.replies, depth + 1, maxDepth)}
                    </View>
                ) : (
                    <Pressable
                        onPress={() => onContinueThread?.(comment)}
                        style={styles.continueThreadButton}
                    >
                        <Ionicons name="arrow-forward" size={14} color={COLORS.primaryOrangeHex} />
                        <Text style={styles.continueThreadText}>
                            Continue thread ({comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'})
                        </Text>
                    </Pressable>
                )
            )}

            {/* Load more replies */}
            {depth < maxDepth && hasMoreReplies[comment.commentId] &&
                (comment.reply_count - (comment.replies?.length || 0)) > 0 && (
                <Pressable onPress={() => onLoadReplies(comment.commentId)} style={styles.loadMoreRepliesButton}>
                    <Ionicons name="add" size={16} color={COLORS.primaryOrangeHex} />
                    <Text style={styles.loadMoreRepliesText}>
                        Load more replies ({comment.reply_count - (comment.replies?.length || 0)} more)
                    </Text>
                </Pressable>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    commentContainer: {
        backgroundColor: COLORS.primaryGreyHex,
        padding: SPACING.space_15,
        borderRadius: BORDERRADIUS.radius_10,
        marginVertical: SPACING.space_8,
        position: 'relative',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primaryOrangeHex,
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.space_12,
    },
    userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primaryOrangeHex,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.space_10,
    },
    avatarText: {
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_16,
    },
    userDetails: { flex: 1 },
    commentUserName: {
        fontFamily: FONTFAMILY.poppins_semibold,
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        marginBottom: SPACING.space_2,
    },
    commentMeta: { flexDirection: 'row', alignItems: 'center' },
    pageIndicator: {
        color: COLORS.primaryOrangeHex,
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_medium,
        backgroundColor: COLORS.primaryDarkGreyHex,
        paddingHorizontal: SPACING.space_4,
        paddingVertical: SPACING.space_2,
        borderRadius: BORDERRADIUS.radius_4,
        marginRight: SPACING.space_8,
    },
    timestamp: {
        color: COLORS.secondaryLightGreyHex,
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_regular,
    },
    optionsButton: { padding: SPACING.space_4, borderRadius: BORDERRADIUS.radius_4 },
    deleteDropdown: {
        position: 'absolute',
        top: SPACING.space_36,
        right: SPACING.space_10,
        backgroundColor: COLORS.secondaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_8,
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 1000,
        minWidth: 140,
    },
    deleteButton: { flexDirection: 'row', alignItems: 'center', padding: SPACING.space_12 },
    deleteButtonText: {
        color: COLORS.primaryRedHex,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_medium,
        marginLeft: SPACING.space_8,
    },
    textWrapper: { position: 'relative', overflow: 'hidden' },
    commentText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
        lineHeight: 20,
        marginBottom: SPACING.space_12,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: SPACING.space_8,
        borderTopWidth: 1,
        borderTopColor: COLORS.primaryDarkGreyHex,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.space_8,
        paddingHorizontal: SPACING.space_12,
        marginRight: SPACING.space_15,
        borderRadius: BORDERRADIUS.radius_4,
        backgroundColor: COLORS.primaryDarkGreyHex,
        minHeight: 36,
    },
    actionText: {
        color: COLORS.secondaryLightGreyHex,
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_medium,
        marginLeft: SPACING.space_4,
    },
    repliesContainer: {
        marginTop: SPACING.space_15,
        paddingTop: SPACING.space_15,
        borderTopWidth: 1,
        borderTopColor: COLORS.primaryDarkGreyHex,
    },
    loadMoreRepliesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.space_12,
        paddingVertical: SPACING.space_8,
        paddingHorizontal: SPACING.space_12,
        borderRadius: BORDERRADIUS.radius_4,
        backgroundColor: COLORS.primaryDarkGreyHex,
    },
    loadMoreRepliesText: {
        color: COLORS.primaryOrangeHex,
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_medium,
        marginLeft: SPACING.space_4,
    },
    continueThreadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.space_12,
        paddingVertical: SPACING.space_8,
        paddingHorizontal: SPACING.space_12,
        borderRadius: BORDERRADIUS.radius_4,
        borderWidth: 1,
        borderColor: COLORS.primaryOrangeHex,
        alignSelf: 'flex-start',
    },
    continueThreadText: {
        color: COLORS.primaryOrangeHex,
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_medium,
        marginLeft: SPACING.space_4,
    },
});