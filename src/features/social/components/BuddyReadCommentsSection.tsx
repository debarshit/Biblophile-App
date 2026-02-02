import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState, useRef, JSX, forwardRef, useImperativeHandle } from "react";
import { 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Text, 
  StyleSheet, 
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
  ScrollView
} from "react-native";
import { SPACING, COLORS, BORDERRADIUS, FONTFAMILY, FONTSIZE } from "../../../theme/theme";
import { CommentSortDropdown } from "./CommentSortDropdown";
import requests from "../../../services/requests";
import instance from "../../../services/axios";
import { BlurView } from "expo-blur";

// Enable LayoutAnimation for Android
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
}

interface Comment {
    commentId: number;
    commentText: string;
    progressPercentage: number;
    user_name: string;
    userId: string;
    like_count: number;
    createdAt: string;
    parent_comment_id?: number | null;
    replies: Comment[] | undefined;
    reply_count: number;
    liked_by_user: boolean;
}

const BuddyReadCommentsSection = forwardRef<BuddyReadCommentsSectionRef, BuddyReadCommentsSectionProps>(({
    buddyReadId,
    currentUser,
    isHost,
    accessToken,
    onReplyPress,
    replyContextId,
    onCommentSubmit,
}, ref) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingComments, setLoadingComments] = useState<boolean>(false);
    const [commentPage, setCommentPage] = useState<number>(1);
    const [replyPages, setReplyPages] = useState<Record<number, number>>({});
    const [hasMoreReplies, setHasMoreReplies] = useState<Record<number, boolean>>({});
    const [newComment, setNewComment] = useState<string>('');
    const [hasMoreCommentsState, setHasMoreCommentsState] = useState<boolean>(false);
    const [selectedCommentForDeletion, setSelectedCommentForDeletion] = useState<number | null>(null);
    const [sort, setSort] = useState<string>('created_at_asc');
    const animatedValues = useRef<Record<number, Animated.Value>>({}).current;
    const scrollRef = useRef<ScrollView>(null);
    const commentPositions = useRef<Record<number, number>>({});

    useImperativeHandle(ref, () => ({
        submitComment: handleCommentSubmit,
    }));

    const getAnimatedValue = (commentId: number) => {
        if (!animatedValues[commentId]) {
            animatedValues[commentId] = new Animated.Value(1);
        }
        return animatedValues[commentId];
    };

    const fetchComments = useCallback(async (currentSort: string = sort) => {
        setLoadingInitialData(true);
        setError(null);
        try {    
            let initialComments: Comment[] = [];
            let initialHasMoreComments = false;
            let initialHasMoreRepliesData: Record<number, boolean> = {};

            if (accessToken) {
                const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const commentsResponse = await instance.get(
                    `${requests.fetchComments(String(buddyReadId))}?page=${1}&order_by=${currentSort}&timezone=${userTimezone}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                initialComments = commentsResponse.data.data.comments || [];
                initialHasMoreComments = commentsResponse.data.data.hasMoreComments || false;

                initialHasMoreRepliesData = initialComments.reduce((acc, comment) => {
                    if (comment.reply_count > 0) {
                        acc[comment.commentId] = true;
                    }
                    return acc;
                }, {});

                setComments(initialComments);
                setHasMoreCommentsState(initialHasMoreComments);
                setHasMoreReplies(initialHasMoreRepliesData);
            }
        } catch (err: any) {
            setError('Failed to fetch buddy read comments');
            console.error('Error fetching buddy read comments:', err);
        } finally {
            setLoadingInitialData(false);
        }
    }, [buddyReadId, sort]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const loadMoreComments = async () => {
        if (loadingComments || !hasMoreCommentsState || !buddyReadId|| !accessToken || !currentUser.userId) {
            return;
        }
        setLoadingComments(true);
        const nextPage = commentPage + 1;

        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const response = await instance.get(
                `${requests.fetchComments(String(buddyReadId))}?page=${nextPage}&order_by=${sort}&timezone=${userTimezone}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            if (response.status === 200) {
                const newCommentsData = response.data.data;
                setComments((prev) => [...prev, ...(newCommentsData.comments || [])]);
                setHasMoreCommentsState(newCommentsData.hasMoreComments || false);
                setCommentPage(nextPage);
            } else {
                console.error('Failed to load more comments');
            }
        } catch (error) {
            console.error('Error loading more comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const loadReplies = async (parentCommentId: number) => {
        if (!accessToken || !currentUser.userId) return;
        const nextPage = replyPages[parentCommentId] || 1;

        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const repliesResponse = await instance.get(
                `${requests.fetchReplies(parentCommentId)}?page=${nextPage}&order_by=${sort}&timezone=${userTimezone}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            const response = repliesResponse.data;
            const newReplies = response.data.replies || [];
            const hasMore = response.data.hasMoreReplies ?? false;

            setReplyPages(prev => ({
                ...prev,
                [parentCommentId]: hasMore ? nextPage + 1 : nextPage,
            }));

            setHasMoreReplies(prev => ({
                ...prev,
                [parentCommentId]: hasMore,
            }));

            setComments(prevComments =>
                prevComments.map(comment => {
                    if (comment.commentId === parentCommentId) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), ...newReplies],
                        };
                    }
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: loadRepliesRecursively(comment.replies, parentCommentId, newReplies),
                        };
                    }
                    return comment;
                })
            );

            // Animate the expansion
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } catch (error) {
            console.error('Error fetching replies:', error);
            setHasMoreReplies(prev => ({
                ...prev,
                [parentCommentId]: false,
            }));
        }
    };

    const loadRepliesRecursively = (
        replies: Comment[],
        parentCommentId: number,
        newReplies: Comment[]
    ): Comment[] => {
        return replies.map(reply => {
            if (reply.commentId === parentCommentId) {
                return {
                    ...reply,
                    replies: [...(reply.replies || []), ...newReplies],
                };
            }
            if (reply.replies) {
                return {
                    ...reply,
                    replies: loadRepliesRecursively(reply.replies, parentCommentId, newReplies),
                };
            }
            return reply;
        });
    };

    const handleSortChange = useCallback((newSort: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSort(newSort);
        setCommentPage(1);
        setComments([]);
        fetchComments(newSort);
    }, [setSort, setCommentPage, setComments]);

    const handleEllipsisClick = (commentId: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        setSelectedCommentForDeletion(selectedCommentForDeletion === commentId ? null : commentId);
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!accessToken || !currentUser.userId) return;
        
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const deleteResponse = await instance.delete(
                                requests.deleteComment(commentId),
                                {
                                    headers: {
                                        Authorization: `Bearer ${accessToken}`,
                                    },
                                }
                            );
                            const response = deleteResponse.data;

                            if (response.data.status === 'success') {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setComments((prevComments) => 
                                    prevComments?.filter((comment) => comment.commentId !== commentId) || []
                                );
                                Alert.alert('Success', 'Comment deleted successfully.');
                            } else {
                                Alert.alert('Error', response.data.message || 'Failed to delete comment.');
                            }
                        } catch (error) {
                            console.error('Error deleting comment:', error);
                            Alert.alert('Error', 'An error occurred while deleting the comment.');
                        } finally {
                            setSelectedCommentForDeletion(null);
                        }
                    }
                }
            ]
        );
    };

    const handleCommentSubmit = async (commentText: string, progressPercentage?: number, parentCommentId?: number | null) => {
        if (!accessToken || !buddyReadId || !currentUser.userId) return;

        if (!commentText.trim()) {
            console.log('Comment text is empty');
            return;
        }

        const actualProgressPercentage = progressPercentage || currentUser.progressPercentage;

        try {
            const params = new URLSearchParams({
                comment_text: commentText,
                buddy_read_id: String(buddyReadId),
                progress_percentage: String(actualProgressPercentage),
                user_id: currentUser.userId,
            });

            if (parentCommentId !== null && parentCommentId !== undefined) {
                params.append('parent_comment_id', String(parentCommentId));
            }

            const response = await instance.post(requests.submitComment(String(buddyReadId)), params, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.data.data.message == 'Comment added') {
                console.log('Comment posted');
                setNewComment('');
                setCommentPage(1);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                fetchComments(sort);
            } else if (response.data.data.status === 'error') {
                console.log('Not posted');
            } else {
                console.error('Failed to post comment:', response.data.data.message);
            }
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    const toggleLike = async (commentId: number, userId: number) => {
        if (!accessToken) return;

        // Animate like button
        const animatedValue = getAnimatedValue(commentId);
        Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 1.3,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();

        const updateLikesRecursively = (currentComments: Comment[]): Comment[] => {
            return currentComments.map((comment) => {
                if (comment.commentId === commentId) {
                    const updatedLikeCount = comment.liked_by_user ? comment.like_count - 1 : comment.like_count + 1;
                    return {
                        ...comment,
                        liked_by_user: !comment.liked_by_user,
                        like_count: updatedLikeCount,
                    };
                } else if (Array.isArray(comment.replies)) {
                    return {
                        ...comment,
                        replies: updateLikesRecursively(comment.replies),
                    };
                }
                return comment;
            });
        };

        setComments((prevComments) => updateLikesRecursively(prevComments));

        try {
            const toggleLikeResponse = await instance.post(
                requests.toggleLike(commentId),{},
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            const response = toggleLikeResponse.data;
            if (response.data.message == 'Comment liked') {
                console.log('Comment liked');
            } else if (response.data.message == 'Comment unliked') {
                console.log('Comment unliked');
            } else {
                console.error('Failed to toggle like:', response.data.message);
                // Revert optimistic update
                setComments((prevComments) => {
                    const revertLikesRecursively = (revertComments: Comment[]): Comment[] => {
                        return revertComments.map((comment) => {
                            if (comment.commentId === commentId) {
                                const updatedLikeCount = comment.liked_by_user ? comment.like_count + 1 : comment.like_count - 1;
                                return {
                                    ...comment,
                                    liked_by_user: !comment.liked_by_user,
                                    like_count: updatedLikeCount,
                                };
                            } else if (Array.isArray(comment.replies)) {
                                return {
                                    ...comment,
                                    replies: revertLikesRecursively(comment.replies),
                                };
                            }
                            return comment;
                        });
                    };
                    return revertLikesRecursively(prevComments);
                });
            }
        } catch (error) {
            console.error('Error in toggleLike:', error);
            // Revert optimistic update
            setComments((prevComments) => {
                const revertLikesRecursively = (revertComments: Comment[]): Comment[] => {
                    return revertComments.map((comment) => {
                        if (comment.commentId === commentId) {
                            const updatedLikeCount = comment.liked_by_user ? comment.like_count + 1 : comment.like_count - 1;
                            return {
                                ...comment,
                                liked_by_user: !comment.liked_by_user,
                                like_count: updatedLikeCount,
                            };
                        } else if (Array.isArray(comment.replies)) {
                            return {
                                ...comment,
                                replies: revertLikesRecursively(comment.replies),
                            };
                        }
                        return comment;
                    });
                };
                return revertLikesRecursively(prevComments);
            });
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInHours < 1) {
            return 'just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInDays < 7) {
            return `${Math.floor(diffInDays)}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const renderComments = (currentComments: Comment[], depth: number = 0, maxDepth: number = 3): JSX.Element[] => {
        return currentComments?.map((comment) => {
            const isBlurred = currentUser.readingStatus !== 'Read' && currentUser.progressPercentage < comment.progressPercentage;
            const animatedValue = getAnimatedValue(comment.commentId);

            return (
                <Animated.View 
                    key={comment.commentId}
                    style={[
                        styles.commentContainer, 
                        { 
                            marginLeft: depth * SPACING.space_12,
                            transform: [{ scale: animatedValue }]
                        }
                    ]}
                >
                    {/* Comment Header */}
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
                        
                        {/* Options Menu */}
                        {(isHost || comment.userId == currentUser.userId) && (
                            <Pressable 
                                onPress={() => handleEllipsisClick(comment.commentId)} 
                                style={styles.optionsButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.secondaryLightGreyHex} />
                            </Pressable>
                        )}
                    </View>

                    {/* Delete Dropdown */}
                    {selectedCommentForDeletion === comment.commentId && (
                        <View style={styles.deleteDropdown}>
                            <Pressable 
                                onPress={() => handleDeleteComment(comment.commentId)} 
                                style={styles.deleteButton}
                            >
                                <Ionicons name="trash-outline" size={16} color={COLORS.primaryRedHex} />
                                <Text style={styles.deleteButtonText}>Delete Comment</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Comment Text */}
                    <View style={styles.textWrapper}>
                        <Text style={styles.commentText}>
                            {comment.commentText}
                        </Text>

                        {isBlurred && (
                            <BlurView
                            intensity={30}
                            tint="dark"
                            style={StyleSheet.absoluteFill}
                            />
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.commentActions}>
                        <Pressable 
                            onPress={() => toggleLike(comment.commentId, Number(currentUser.userId))} 
                            style={styles.actionButton}
                        >
                            <Animated.View style={{ transform: [{ scale: animatedValue }] }}>
                                <FontAwesome6 
                                    name={comment.liked_by_user ? "heart" : "heart"} 
                                    size={18} 
                                    color={comment.liked_by_user ? COLORS.primaryOrangeHex : COLORS.secondaryLightGreyHex}
                                    solid={comment.liked_by_user}
                                />
                            </Animated.View>
                            <Text style={[
                                styles.actionText, 
                                comment.liked_by_user && { color: COLORS.primaryOrangeHex }
                            ]}>
                                {comment.like_count || 0}
                            </Text>
                        </Pressable>

                        <Pressable 
                            onPress={() => {
                                onReplyPress(comment.commentId, comment.user_name, comment.progressPercentage);
                            }}
                            style={styles.actionButton}
                        >
                            <Ionicons 
                                name="chatbubble-outline" 
                                size={18} 
                                color={replyContextId === comment.commentId ? COLORS.primaryOrangeHex : COLORS.secondaryLightGreyHex} 
                            />
                            <Text style={[
                                styles.actionText,
                                replyContextId === comment.commentId && { color: COLORS.primaryOrangeHex }
                            ]}>
                                Reply
                            </Text>
                        </Pressable>

                        {comment.reply_count > 0 && (
                            <Pressable 
                                onPress={() => loadReplies(comment.commentId)}
                                style={styles.actionButton}
                            >
                                <Ionicons name="arrow-down" size={16} color={COLORS.secondaryLightGreyHex} />
                                <Text style={styles.actionText}>
                                    {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {/* Nested Replies */}
                    {depth < maxDepth && Array.isArray(comment.replies) && comment.replies.length > 0 && (
                        <View style={styles.repliesContainer}>
                            {renderComments(comment.replies, depth + 1, maxDepth)}
                        </View>
                    )}

                    {/* Load More Replies */}
                    {hasMoreReplies[comment.commentId] && (
                        <Pressable 
                            onPress={() => loadReplies(comment.commentId)} 
                            style={styles.loadMoreRepliesButton}
                        >
                            <Ionicons name="add" size={16} color={COLORS.primaryOrangeHex} />
                            <Text style={styles.loadMoreRepliesText}>
                                Load more replies ({comment.reply_count - (comment.replies?.length || 0)} more)
                            </Text>
                        </Pressable>
                    )}
                </Animated.View>
            );
        });
    };

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
            <ScrollView
                ref={scrollRef}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
            >
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

                {/* Comments List */}
                {comments && comments.length > 0 ? (
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

                {/* Load More Comments */}
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

const styles = StyleSheet.create({
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
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
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
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
    userDetails: {
        flex: 1,
    },
    commentUserName: {
        fontFamily: FONTFAMILY.poppins_semibold,
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        marginBottom: SPACING.space_2,
    },
    commentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
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
    optionsButton: {
        padding: SPACING.space_4,
        borderRadius: BORDERRADIUS.radius_4,
    },
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
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.space_12,
    },
    deleteButtonText: {
        color: COLORS.primaryRedHex,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_medium,
        marginLeft: SPACING.space_8,
    },
    textWrapper: {
        position: 'relative',
        overflow: 'hidden',
    },
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
    replyInputContainer: {
        marginTop: SPACING.space_15,
        paddingTop: SPACING.space_15,
        borderTopWidth: 1,
        borderTopColor: COLORS.primaryDarkGreyHex,
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
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loadingButton: {
        backgroundColor: COLORS.secondaryLightGreyHex,
    },
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
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
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