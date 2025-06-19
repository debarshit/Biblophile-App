import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable, TextInput } from 'react-native';
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { BORDERRADIUS, COLORS, FONTSIZE, SPACING } from '../../../theme/theme';
import { CommentInputForm } from './CommentInputForm';
import { useStore } from '../../../store/store';

// Types
interface Host {
    name: string;
    userId: string;
}

interface CurrentUser {
    userId: string;
    readingStatus: string;
    currentPage: number;
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
    pageNumber: number;
    user_name: string;
    userId: string;
    like_count: number;
    createdAt: string;
    liked_by_user: boolean;
}

interface ReadalongCheckpointDetailsProps {
    readalong: Readalong;
    currentUser: CurrentUser;
    isMember: boolean;
    isHost: boolean;
    checkpointId: string;
    onBack: () => void;
}

// Constants
const COMMENTS_LIMIT = 10;
const SORT_OPTIONS = {
    NEWEST: 'created_at_desc',
    OLDEST: 'created_at_asc',
    LIKES: 'like_count_desc'
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
            console.log(fetchedData);
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
    const shouldBlur = currentUser.currentPage < comment.pageNumber;
    const canDelete = isHost || comment.userId === currentUser.userId;
    
    const formattedDate = useMemo(() => {
        return new Date(comment.createdAt).toLocaleDateString();
    }, [comment.createdAt]);

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
                    <Text style={styles.commentPage}> (Page {comment.pageNumber})</Text>
                    <Text style={styles.commentDate}> - {formattedDate}</Text>
                </Text>
                
                <Text style={[styles.commentText, shouldBlur && styles.blurredText]}>
                    {comment.commentText}
                </Text>

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

// Main Component
const ReadalongCheckpointDetails: React.FC<ReadalongCheckpointDetailsProps> = ({
    readalong,
    currentUser,
    isMember,
    isHost,
    checkpointId,
    onBack,
}) => {
    const userDetails = useStore((state: any) => state.userDetails);
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

    const handleCommentSubmit = useCallback(async (text: string, pageNumber: number) => {
        if (!text.trim() || !pageNumber || !readalong?.readalongId || !checkpointId) {
            return;
        }

        const tempId = Date.now();
        const tempComment: Comment = {
            commentId: tempId,
            commentText: text,
            pageNumber: pageNumber,
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
                pageNumber: pageNumber,
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
                <Text style={styles.emptyListText}>No comments yet.</Text>
            </View>
        );
    }, [pagination.loading, error]);

    // Handle error state
    if (error) {
        return (
            <View style={styles.centeredMessage}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable 
                    style={styles.retryButton} 
                    onPress={() => handleSortChange(sort)}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.detailsContainer}>
            {/* Back Button */}
            <Pressable onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.primaryWhiteHex} />
                <Text style={styles.backButtonText}>Back to Checkpoints</Text>
            </Pressable>

            {/* Comments Header with Sort Button */}
            <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Comments</Text>
                <View>
                    <Pressable style={styles.sortButton}>
                        <Feather name="filter" size={20} color={COLORS.secondaryLightGreyHex} />
                    </Pressable>
                    {/* Sort options would be implemented in a modal/menu */}
                </View>
            </View>

            {isMember ? (
                <>
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
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={renderEmpty}
                        contentContainerStyle={styles.flatListContent}
                    />

                    <CommentInputForm 
                        onSubmit={(text, pageNumber) => handleCommentSubmit(text, pageNumber)}
                        isLoading={pagination.loading}
                        showPageInput={true}
                        initialPageNumber={currentUser.currentPage}
                    />
                </>
            ) : (
                <View style={styles.centeredMessage}>
                    <Text style={styles.notMemberText}>
                        You must be a member to view and add comments.
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    detailsContainer: {
        flex: 1,
        backgroundColor: COLORS.primaryDarkGreyHex,
        padding: SPACING.space_16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.space_16,
    },
    backButtonText: {
        marginLeft: SPACING.space_8,
        fontSize: SPACING.space_16,
        color: COLORS.primaryWhiteHex,
    },
    commentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.space_12,
    },
    commentsTitle: {
        fontSize: FONTSIZE.size_18,
        fontWeight: 'bold',
        color: COLORS.primaryWhiteHex,
    },
    sortButton: {
        padding: SPACING.space_8,
    },
    flatListContent: {
        paddingBottom: SPACING.space_20,
    },
    commentContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.space_16,
        backgroundColor: '#2d3748',
        borderRadius: BORDERRADIUS.radius_8,
        padding: SPACING.space_12,
        position: 'relative',
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
        top: 28,
        right: 8,
        backgroundColor: COLORS.primaryGreyHex,
        borderRadius: BORDERRADIUS.radius_4,
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
        zIndex: 10,
    },
    deleteMenuItem: {
        padding: SPACING.space_10,
    },
    deleteMenuItemText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
    },
    commentMeta: {
        marginBottom: SPACING.space_4,
    },
    commentUser: {
        fontWeight: 'bold',
        color: COLORS.secondaryLightGreyHex,
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
    commentText: {
        fontSize: FONTSIZE.size_14,
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_8,
    },
    blurredText: {
        // color: 'transparent',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 5,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.space_4,
    },
    likeCount: {
        marginLeft: SPACING.space_4,
        fontSize: FONTSIZE.size_12,
        color: COLORS.secondaryLightGreyHex,
    },
    loadingFooter: {
        paddingVertical: SPACING.space_20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.space_8,
        color: COLORS.secondaryLightGreyHex,
    },
    emptyList: {
        paddingVertical: SPACING.space_20,
        alignItems: 'center',
    },
    emptyListText: {
        color: COLORS.secondaryLightGreyHex,
        fontSize: FONTSIZE.size_16,
    },
    centeredMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.space_20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        fontSize: FONTSIZE.size_16,
        marginBottom: SPACING.space_10,
    },
    notMemberText: {
        color: COLORS.secondaryLightGreyHex,
        textAlign: 'center',
        fontSize: FONTSIZE.size_16,
    },
    retryButton: {
        marginTop: SPACING.space_10,
        backgroundColor: COLORS.primaryRedHex,
        borderRadius: BORDERRADIUS.radius_8,
        paddingVertical: SPACING.space_10,
        paddingHorizontal: SPACING.space_15,
    },
    retryButtonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
    }
});

export default ReadalongCheckpointDetails;