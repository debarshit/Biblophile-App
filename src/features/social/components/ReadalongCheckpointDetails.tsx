import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import React, { useState, useEffect, useCallback, memo, forwardRef, useImperativeHandle } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { BORDERRADIUS, COLORS, FONTSIZE, SPACING } from '../../../theme/theme';
import { useStore } from '../../../store/store';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

// Types
interface Host {
    name: string;
    userId: string;
}

interface CurrentUser {
    userId: string;
    readingStatus: string;
    progressPercentage: number;
}

interface Readalong {
  readalongId: number;
  bookId: string;
  book_title: string;
  book_photo: string;
  book_pages: number;
  readalong_description: string;
  startDate: string;
  endDate: string;
  maxMembers: number;
  members: number;
  host: Host;
}

interface Comment {
    commentId: number;
    commentText: string;
    progressPercentage: number;
    user_name: string;
    userId: string;
    like_count: number;
    createdAt: string;
    liked_by_user: boolean;
}

export interface ReadalongCheckpointDetailsRef {
    submitComment: (text: string, progressPercentage: number) => Promise<void>;
}

interface ReadalongCheckpointDetailsProps {
    readalong: Readalong;
    currentUser: CurrentUser;
    isMember: boolean;
    isHost: boolean;
    checkpointId: string;
    checkpointPrompt: string;
}

// Constants
const COMMENTS_LIMIT = 10;
const SORT_OPTIONS = {
    NEWEST: 'created_at_desc',
    OLDEST: 'created_at_asc',
    PAGE_ASC: 'page_asc',
    PAGE_DESC: 'page_desc',

};

// Custom Hooks
const useComments = (checkpointId: string, currentUser: CurrentUser,  userDetails: any) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        hasMore: true,
        loading: false
    });
    const [error, setError] = useState<string | null>(null);
    const [sort, setSort] = useState<string>(SORT_OPTIONS.OLDEST);

    const fetchComments = useCallback(async (page: number, currentSort: string, appending: boolean = true) => {
        if (pagination.loading) return;

        setPagination(prev => ({ ...prev, loading: true }));
        
        if (!appending) {
            setComments([]);
            setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
            setError(null);
        }

        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const response = await instance.get(`${requests.fetchReadalongComments(checkpointId)}?page=${page}&order_by=${currentSort}&limit=${COMMENTS_LIMIT}&timezone=${userTimezone}`, {
                headers: {
                    Authorization: `Bearer ${userDetails[0].accessToken}`
                },
            });

            const fetchedData = response.data.data;
            const hasMore = fetchedData.comments.length === COMMENTS_LIMIT;

            if (!appending && fetchedData.comments.length === 0) {
                setPagination(prev => ({
                    ...prev,
                    page,
                    hasMore: false,
                    loading: false
                }));
            } else {
                setComments(prevComments =>
                    appending ? [...prevComments, ...fetchedData.comments] : fetchedData.comments
                );
            
                setPagination(prev => ({
                    ...prev,
                    page,
                    hasMore,
                    loading: false
                }));
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
            setError("Failed to load comments.");
            setPagination(prev => ({ ...prev, loading: false, hasMore: false }));
            
            if (appending) {
                // Quietly handle append errors
                console.warn("Failed to load more comments.");
            }
        }
    }, [checkpointId, currentUser.userId]);

    const handleLoadMore = useCallback(() => {
        if (!pagination.loading && pagination.hasMore && comments.length > 0) {
            fetchComments(pagination.page + 1, sort, true);
        }
    }, [fetchComments, pagination.loading, pagination.hasMore, pagination.page, sort, comments.length]);

    const handleSortChange = useCallback((newSort: string) => {
        setSort(newSort);
        fetchComments(1, newSort, false);
    }, [fetchComments]);

    const addComment = useCallback((newComment: Comment) => {
        setComments(prev => [newComment, ...prev]);
    }, []);

    const updateComment = useCallback((commentId: number, updatedComment: Partial<Comment>) => {
        setComments(prev => prev.map(comment => 
            comment.commentId === commentId ? { ...comment, ...updatedComment } : comment
        ));
    }, []);

    const deleteComment = useCallback((commentId: number) => {
        setComments(prev => prev.filter(comment => comment.commentId !== commentId));
    }, []);

    useEffect(() => {
        if (checkpointId && requests.fetchReadalongComments) {
            fetchComments(1, sort, false);
        }
    }, [checkpointId, sort, fetchComments]);

    return {
        comments,
        pagination,
        error,
        sort,
        fetchComments,
        handleLoadMore,
        handleSortChange,
        addComment,
        updateComment,
        deleteComment
    };
};

// CommentItem Component
const CommentItem = memo(({ 
    comment, 
    currentUser, 
    isHost,
    onToggleLike,
    onDeleteComment
}: { 
    comment: Comment, 
    currentUser: CurrentUser, 
    isHost: boolean,
    onToggleLike: (commentId: number) => void,
    onDeleteComment: (commentId: number) => void
}) => {
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);
    const shouldBlur = currentUser.progressPercentage < comment.progressPercentage;
    const canDelete = isHost || comment.userId === currentUser.userId;
    
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

    return (
        <View style={styles.commentContainer}>
            <View style={styles.commentContent}>
                {canDelete && (
                    <Pressable
                        style={styles.commentEllipsis}
                        onPress={() => setShowDeleteMenu(prev => !prev)}
                    >
                        <Feather name="more-vertical" size={20} color={COLORS.secondaryLightGreyHex} />
                    </Pressable>
                )}

                {canDelete && showDeleteMenu && (
                    <View style={styles.deleteMenu}>
                        <Pressable
                            onPress={() => {
                                onDeleteComment(comment.commentId);
                                setShowDeleteMenu(false);
                            }}
                            style={styles.deleteMenuItem}
                        >
                            <Text style={styles.deleteMenuItemText}>Delete Comment</Text>
                        </Pressable>
                    </View>
                )}

                <Text style={styles.commentMeta}>
                    <Text style={styles.commentUser}>{comment.user_name}</Text>
                    <Text style={styles.commentPage}> (At {comment.progressPercentage}%)</Text>
                    <Text style={styles.commentDate}> • {formatTimestamp(comment.createdAt)}</Text>
                </Text>

                {/* Comment Text */}
                <View style={styles.textWrapper}>
                    <Text style={styles.commentText}>
                        {comment.commentText}
                    </Text>

                    {shouldBlur && (
                        <BlurView
                        intensity={30}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                        />
                    )}
                </View>

                <View style={styles.commentActions}>
                    <Pressable
                        style={styles.likeButton}
                        onPress={() => onToggleLike(comment.commentId)}
                    >
                        {comment.liked_by_user ? (
                            <Ionicons name="heart" size={20} color={COLORS.primaryOrangeHex} />
                        ) : (
                            <Ionicons name="heart-outline" size={20} color={COLORS.primaryLightGreyHex} />
                        )}
                        <Text style={styles.likeCount}>{comment.like_count}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
});

// Checkpoint Prompt Component
const CheckpointPrompt = memo(({ prompt }: { prompt: string }) => (
    <View style={styles.promptContainer}>
        <View style={styles.promptHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color={COLORS.primaryOrangeHex} />
            <Text style={styles.promptTitle}>Discussion Prompt</Text>
        </View>
        <Text style={styles.promptText}>{prompt}</Text>
    </View>
));

// Main Component
const ReadalongCheckpointDetails = forwardRef<ReadalongCheckpointDetailsRef, ReadalongCheckpointDetailsProps>(({
    readalong,
    currentUser,
    isMember,
    isHost,
    checkpointId,
    checkpointPrompt,
}, ref) => {
    const userDetails = useStore((state: any) => state.userDetails);
    const navigation = useNavigation<any>();
    const {
        comments,
        pagination,
        error,
        sort,
        handleLoadMore,
        handleSortChange,
        addComment,
        updateComment,
        deleteComment
    } = useComments(checkpointId, currentUser, userDetails);
    
    const [showSortMenu, setShowSortMenu] = useState(false);

    useImperativeHandle(ref, () => ({
        submitComment: handleCommentSubmit,
    }));

    const handleToggleLike = useCallback(async (commentId: number) => {
        // Optimistic update
        const commentToUpdate = comments.find(c => c.commentId === commentId);
        if (!commentToUpdate) return;
        
        const willBeLiked = !commentToUpdate.liked_by_user;
        const newLikeCount = commentToUpdate.like_count + (willBeLiked ? 1 : -1);
        
        updateComment(commentId, {
            liked_by_user: willBeLiked,
            like_count: newLikeCount
        });

        try {
            const response = await instance.post(requests.toggleReadalongLike(commentId), {
                user_id: currentUser.userId,
            }, {
                headers: {
                    Authorization: `Bearer ${userDetails[0].accessToken}`
                },
            });

            if (response.data.status === "error") {
                console.error("Failed to toggle like:", response.data.message);
                // Revert optimistic update
                updateComment(commentId, {
                    liked_by_user: commentToUpdate.liked_by_user,
                    like_count: commentToUpdate.like_count
                });
            }
        } catch (error) {
            console.error("Error in toggleLike:", error);
            // Revert optimistic update
            updateComment(commentId, {
                liked_by_user: commentToUpdate.liked_by_user,
                like_count: commentToUpdate.like_count
            });
        }
    }, [comments, currentUser.userId, updateComment]);

    const handleDeleteComment = useCallback(async (commentId: number) => {
        // Optimistic update
        deleteComment(commentId);

        try {
            const response = await instance.delete(requests.deleteReadalongComment(commentId), {
                headers: {
                    Authorization: `Bearer ${userDetails[0].accessToken}`
                },
            });

            if (response.data.status !== 'success') {
                console.error(response.data.message || 'Failed to delete comment.');
                // On failure, refresh comments to restore accurate state
                handleSortChange(sort);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            // On error, refresh comments to restore accurate state
            handleSortChange(sort);
        }
    }, [deleteComment, currentUser.userId, handleSortChange, sort]);

    const handleCommentSubmit = useCallback(async (text: string, progressPercentage: number) => {
        if (!text.trim() || !progressPercentage || !readalong?.readalongId || !checkpointId) {
            return;
        }

        const tempId = Date.now();
        const tempComment: Comment = {
            commentId: tempId,
            commentText: text,
            progressPercentage: progressPercentage,
            user_name: currentUser.userId, // Will be replaced with actual name from API
            userId: currentUser.userId,
            like_count: 0,
            createdAt: new Date().toISOString(),
            liked_by_user: false
        };
        
        addComment(tempComment);

        try {
            const response = await instance.post(requests.submitReadalongComment(checkpointId), {
                commentText: text,
                readalongId: readalong.readalongId,
                progress_percentage: progressPercentage,
            },
            {
                headers: {
                    Authorization: `Bearer ${userDetails[0].accessToken}`,
                },
          });

            const data = response.data;

            if (data.status === "success") {
                // Replace temp comment with actual comment from API
                deleteComment(tempId);
                addComment(data.comment);
                
                // If sorted by oldest first, refresh to get correct order
                if (sort === SORT_OPTIONS.OLDEST) {
                    handleSortChange(sort);
                }
            } else {
                console.error("Failed to post comment:", data.message);
                // Remove the temp comment on failure
                deleteComment(tempId);
            }
        } catch (error) {
            console.error("Error posting comment:", error);
            // Remove the temp comment on error
            deleteComment(tempId);
        }
    }, [readalong?.readalongId, checkpointId, currentUser.userId, addComment, deleteComment, sort, handleSortChange]);

    const getSortLabel = useCallback(() => {
        switch (sort) {
            case SORT_OPTIONS.NEWEST:
                return 'Newest';
            case SORT_OPTIONS.OLDEST:
                return 'Oldest';
            case SORT_OPTIONS.PAGE_ASC:
                return 'Page Ascending';
            case SORT_OPTIONS.PAGE_DESC:
                return 'Page Descending';
            default:
                return 'Sort';
        }
    }, [sort]);

    const renderFooter = useCallback(() => {
        if (!pagination.loading) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
                <Text style={styles.loadingText}>Loading more comments...</Text>
            </View>
        );
    }, [pagination.loading]);

    const renderEmpty = useCallback(() => {
        if (pagination.loading || error) return null;
        return (
            <View style={styles.emptyList}>
                <Ionicons name="chatbubble-outline" size={48} color={COLORS.secondaryLightGreyHex} />
                <Text style={styles.emptyListText}>No comments yet.</Text>
                <Text style={styles.emptyListSubtext}>Be the first to share your thoughts!</Text>
            </View>
        );
    }, [pagination.loading, error]);

    const renderListHeader = useCallback(() => (
        <>
            {/* Checkpoint Prompt */}
            <CheckpointPrompt prompt={checkpointPrompt} />

            {/* Comments Header with Sort Button */}
            <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>
                    Comments {comments.length > 0 && `(${comments.length})`}
                </Text>
                <View>
                    <Pressable 
                        style={styles.sortButton}
                        onPress={() => setShowSortMenu(!showSortMenu)}
                    >
                        <Feather name="filter" size={18} color={COLORS.secondaryLightGreyHex} />
                        <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
                    </Pressable>
                    
                    {showSortMenu && (
                        <View style={styles.sortMenu}>
                            <Pressable
                                style={[styles.sortMenuItem, sort === SORT_OPTIONS.NEWEST && styles.sortMenuItemActive]}
                                onPress={() => {
                                    handleSortChange(SORT_OPTIONS.NEWEST);
                                    setShowSortMenu(false);
                                }}
                            >
                                <Text style={[styles.sortMenuItemText, sort === SORT_OPTIONS.NEWEST && styles.sortMenuItemTextActive]}>
                                    Newest First
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.sortMenuItem, sort === SORT_OPTIONS.OLDEST && styles.sortMenuItemActive]}
                                onPress={() => {
                                    handleSortChange(SORT_OPTIONS.OLDEST);
                                    setShowSortMenu(false);
                                }}
                            >
                                <Text style={[styles.sortMenuItemText, sort === SORT_OPTIONS.OLDEST && styles.sortMenuItemTextActive]}>
                                    Oldest First
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.sortMenuItem, sort === SORT_OPTIONS.PAGE_ASC && styles.sortMenuItemActive]}
                                onPress={() => {
                                    handleSortChange(SORT_OPTIONS.PAGE_ASC);
                                    setShowSortMenu(false);
                                }}
                            >
                                <Text style={[styles.sortMenuItemText, sort === SORT_OPTIONS.PAGE_ASC && styles.sortMenuItemTextActive]}>
                                    Page Ascending
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.sortMenuItem, sort === SORT_OPTIONS.PAGE_DESC && styles.sortMenuItemActive]}
                                onPress={() => {
                                    handleSortChange(SORT_OPTIONS.PAGE_DESC);
                                    setShowSortMenu(false);
                                }}
                            >
                                <Text style={[styles.sortMenuItemText, sort === SORT_OPTIONS.PAGE_DESC && styles.sortMenuItemTextActive]}>
                                    Page Descending
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        </>
    ), [checkpointPrompt, comments.length, showSortMenu, sort, getSortLabel, handleSortChange]);

    // Handle error state
    if (error) {
        return (
            <View style={styles.detailsContainer}>
                <View style={styles.centeredMessage}>
                    <Ionicons name="alert-circle-outline" size={48} color="red" />
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable 
                        style={styles.retryButton} 
                        onPress={() => handleSortChange(sort)}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
            <View style={styles.detailsContainer}>
                {isMember ? (
                    <FlatList
                        data={comments}
                        renderItem={({ item }) => (
                            <CommentItem
                                comment={item}
                                currentUser={currentUser}
                                isHost={isHost}
                                onToggleLike={handleToggleLike}
                                onDeleteComment={handleDeleteComment}
                            />
                        )}
                        keyExtractor={(item) => item.commentId.toString()}
                        onEndReached={comments.length > 0 ? handleLoadMore : undefined}
                        onEndReachedThreshold={0.5}
                        ListHeaderComponent={renderListHeader}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={renderEmpty}
                        contentContainerStyle={styles.flatListContent}
                        keyboardShouldPersistTaps="handled"
                    />
                ) : (
                    <View style={styles.centeredMessage}>
                        <Ionicons name="lock-closed-outline" size={48} color={COLORS.secondaryLightGreyHex} />
                        <Text style={styles.notMemberText}>
                            You must be a member to view and add comments.
                        </Text>
                    </View>
                )}
            </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primaryDarkGreyHex,
    },
    detailsContainer: {
        flex: 1,
        backgroundColor: COLORS.primaryDarkGreyHex,
        padding: SPACING.space_16,
    },
    promptContainer: {
        backgroundColor: '#1a2332',
        borderRadius: BORDERRADIUS.radius_10,
        padding: SPACING.space_16,
        marginBottom: SPACING.space_20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primaryOrangeHex,
    },
    promptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.space_10,
    },
    promptTitle: {
        fontSize: FONTSIZE.size_14,
        fontWeight: '600',
        color: COLORS.primaryOrangeHex,
        marginLeft: SPACING.space_8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    promptText: {
        fontSize: FONTSIZE.size_16,
        color: COLORS.primaryWhiteHex,
        lineHeight: 24,
    },
    commentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.space_16,
        paddingBottom: SPACING.space_12,
        borderBottomWidth: 1,
        borderBottomColor: '#2d3748',
    },
    commentsTitle: {
        fontSize: FONTSIZE.size_18,
        fontWeight: '600',
        color: COLORS.primaryWhiteHex,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.space_8,
        paddingHorizontal: SPACING.space_12,
        backgroundColor: '#2d3748',
        borderRadius: BORDERRADIUS.radius_8,
    },
    sortButtonText: {
        marginLeft: SPACING.space_4,
        fontSize: FONTSIZE.size_14,
        color: COLORS.secondaryLightGreyHex,
    },
    sortMenu: {
        position: 'absolute',
        top: 40,
        right: 0,
        backgroundColor: '#2d3748',
        borderRadius: BORDERRADIUS.radius_8,
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        zIndex: 10,
        minWidth: 150,
    },
    sortMenuItem: {
        padding: SPACING.space_12,
        paddingHorizontal: SPACING.space_16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a2332',
    },
    sortMenuItemActive: {
        backgroundColor: '#1a2332',
    },
    sortMenuItemText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
    },
    sortMenuItemTextActive: {
        color: COLORS.primaryOrangeHex,
        fontWeight: '600',
    },
    flatListContent: {
        paddingBottom: SPACING.space_20,
    },
    commentContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.space_12,
        backgroundColor: '#2d3748',
        borderRadius: BORDERRADIUS.radius_10,
        padding: SPACING.space_12,
        position: 'relative',
        borderWidth: 1,
        borderColor: 'transparent',
        zIndex: -1,
    },
    commentContent: {
        flex: 1,
    },
    commentEllipsis: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: SPACING.space_4,
        zIndex: 1,
    },
    deleteMenu: {
        position: 'absolute',
        top: 36,
        right: 8,
        backgroundColor: '#1a2332',
        borderRadius: BORDERRADIUS.radius_8,
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
        zIndex: 10,
    },
    deleteMenuItem: {
        padding: SPACING.space_12,
        paddingHorizontal: SPACING.space_16,
    },
    deleteMenuItemText: {
        color: '#ff6b6b',
        fontSize: FONTSIZE.size_14,
        fontWeight: '500',
    },
    commentMeta: {
        marginBottom: SPACING.space_8,
    },
    commentUser: {
        fontWeight: '600',
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
    },
    commentPage: {
        fontSize: FONTSIZE.size_12,
        color: COLORS.secondaryLightGreyHex,
        fontStyle: 'italic',
    },
    commentDate: {
        fontSize: FONTSIZE.size_12,
        color: COLORS.secondaryLightGreyHex,
    },
    textWrapper: {
        position: 'relative',
        overflow: 'hidden',
    },
    commentText: {
        fontSize: FONTSIZE.size_14,
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_10,
        lineHeight: 20,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.space_4,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.space_4,
        paddingRight: SPACING.space_8,
    },
    likeCount: {
        marginLeft: SPACING.space_4,
        fontSize: FONTSIZE.size_14,
        color: COLORS.secondaryLightGreyHex,
        fontWeight: '500',
    },
    loadingFooter: {
        paddingVertical: SPACING.space_20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.space_8,
        color: COLORS.secondaryLightGreyHex,
        fontSize: FONTSIZE.size_14,
    },
    emptyList: {
        paddingVertical: SPACING.space_32,
        alignItems: 'center',
    },
    emptyListText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_16,
        fontWeight: '500',
        marginTop: SPACING.space_12,
    },
    emptyListSubtext: {
        color: COLORS.secondaryLightGreyHex,
        fontSize: FONTSIZE.size_14,
        marginTop: SPACING.space_4,
    },
    centeredMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.space_20,
    },
    errorText: {
        color: '#ff6b6b',
        textAlign: 'center',
        fontSize: FONTSIZE.size_16,
        marginTop: SPACING.space_12,
        marginBottom: SPACING.space_16,
    },
    notMemberText: {
        color: COLORS.secondaryLightGreyHex,
        textAlign: 'center',
        fontSize: FONTSIZE.size_16,
        marginTop: SPACING.space_12,
    },
    retryButton: {
        marginTop: SPACING.space_16,
        backgroundColor: COLORS.primaryOrangeHex,
        borderRadius: BORDERRADIUS.radius_10,
        paddingVertical: SPACING.space_12,
        paddingHorizontal: SPACING.space_24,
    },
    retryButtonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        fontWeight: '600',
    }
});

export default ReadalongCheckpointDetails;