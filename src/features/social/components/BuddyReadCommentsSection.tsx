import { FontAwesome6, FontAwesome } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, Text, StyleSheet, Alert } from "react-native";
import { SPACING, COLORS, BORDERRADIUS, FONTFAMILY, FONTSIZE } from "../../../theme/theme";
import { CommentInputForm } from "./CommentInputForm";
import { CommentSortDropdown } from "./CommentSortDropdown";
import requests from "../../../services/requests";
import instance from "../../../services/axios";

interface CurrentUser {
    userId: string | null;
    readingStatus: string | null;
    currentPage: number;
  }

interface BuddyReadCommentsSectionProps {
    buddyReadId: string;
    currentUser: CurrentUser;
    isHost: boolean;
    accessToken: string | null;
  }

  interface Comment {
    comment_id: number;
    comment_text: string;
    page_number: number;
    user_name: string;
    user_id: string;
    like_count: number;
    created_at: string;
    parent_comment_id?: number | null;
    replies: Comment[] | undefined;
    reply_count: number;
    liked_by_user: boolean;
  }

  const BuddyReadCommentsSection: React.FC<BuddyReadCommentsSectionProps> = ({
    buddyReadId,
    currentUser,
    isHost,
    accessToken,
  }) => {
    const [comments, setComments] = useState<Comment[]>([]);
      const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true);
      const [error, setError] = useState<string | null>(null);
      const [loadingComments, setLoadingComments] = useState<boolean>(false);
      const [commentPage, setCommentPage] = useState<number>(1);
      const [replyPages, setReplyPages] = useState<Record<number, number>>({});
      const [hasMoreReplies, setHasMoreReplies] = useState<Record<number, boolean>>({});
      const [replyingTo, setReplyingTo] = useState<number | null>(null);
      const [newComment, setNewComment] = useState<string>('');
      const [newReply, setNewReply] = useState<string>('');
      const [hasMoreCommentsState, setHasMoreCommentsState] = useState<boolean>(false);
      const [selectedCommentForDeletion, setSelectedCommentForDeletion] = useState<number | null>(null);
      const [sort, setSort] = useState<string>('created_at_asc');

      const fetchComments = useCallback(async (currentSort: string = sort) => {
        setLoadingInitialData(true);
        setError(null);
        try {    
          let initialComments: Comment[] = [];
          let initialHasMoreComments = false;
          let initialHasMoreRepliesData: Record<number, boolean> = {};
    
          if (accessToken) {
            const commentsResponse = await instance.get(
              `${requests.fetchComments}&buddy_read_id=${buddyReadId}&page=${1}&order_by=${currentSort}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            initialComments = commentsResponse.data.comments || [];
            initialHasMoreComments = commentsResponse.data.hasMoreComments || false;
    
            // Explicitly set hasMoreReplies based on reply_count
            initialHasMoreRepliesData = initialComments.reduce((acc, comment) => {
              if (comment.reply_count > 0) {
                acc[comment.comment_id] = true;
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
        const response = await instance.get(
          `${requests.fetchComments}&buddy_read_id=${buddyReadId}&page=${nextPage}&order_by=${sort}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (response.status === 200) {
          const newCommentsData = response.data;
          setComments((prev) => [...prev, ...(newCommentsData.comments || [])]);
          setHasMoreCommentsState(newCommentsData.hasMoreComments || false);
          setCommentPage((prev) => prev + 1);
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
      const currentPage = replyPages[parentCommentId] || 1;
  
      try {
        const response = await instance.get(
          `${requests.fetchReplies}&parent_comment_id=${parentCommentId}&page=${currentPage}&order_by=${sort}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
  
        const newReplies = response.data.replies || [];
        const hasMore = response.data.hasMoreReplies ?? false;
  
        const filteredReplies = newReplies.filter(newReply =>
          !comments.some(comment =>
            comment.comment_id === parentCommentId &&
            comment.replies?.some(existingReply =>
              existingReply.comment_id === newReply.comment_id
            )
          )
        );
  
        setReplyPages(prev => ({
          ...prev,
          [parentCommentId]: hasMore ? currentPage + 1 : 0,
        }));
  
        setHasMoreReplies(prev => ({
          ...prev,
          [parentCommentId]: hasMore,
        }));
  
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment.comment_id === parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), ...filteredReplies],
              };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: loadRepliesRecursively(comment.replies, parentCommentId, filteredReplies),
              };
            }
            return comment;
          })
        );
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
        if (reply.comment_id === parentCommentId) {
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
      setSort(newSort);
      setCommentPage(1); // Reset page on sort
      setComments([]); // Clear existing comments
      fetchComments(newSort);
    }, [setSort, setCommentPage, setComments]);

    const handleEllipsisClick = (commentId: number) => {
      setSelectedCommentForDeletion(commentId);
    };

    const handleDeleteComment = async (commentId: number) => {
      Alert.alert('Error', 'Failed to delete comment.');
      if (!accessToken || !currentUser.userId) return;
      try {
        const response = await instance.post(
          requests.deleteComment,
          { comment_id: commentId, user_id: currentUser.userId },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
  
        if (response.data.status === 'success') {
          Alert.alert('Success', 'Comment deleted successfully.');
          setComments((prevComments) => prevComments?.filter((comment) => comment.comment_id !== commentId) || []);
        } else {
          Alert.alert('Error', response.data.message || 'Failed to delete comment.');
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        Alert.alert('Error', 'An error occurred while deleting the comment.');
      } finally {
        setSelectedCommentForDeletion(null);
      }
    };

    const handleCommentSubmit = async (parentCommentId?: number | null) => {
      if (!accessToken || !buddyReadId || !currentUser.userId) return;
      const commentText = parentCommentId ? newReply : newComment;
  
      try {
        const params = new URLSearchParams({
          comment_text: commentText,
          buddy_read_id: String(buddyReadId),
          page_number: String(currentUser.currentPage),
          user_id: currentUser.userId,
        });
  
        if (parentCommentId !== null) {
          params.append('parent_comment_id', String(parentCommentId));
        }
  
        const response = await instance.post(requests.submitComment, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        if (response.data.status === 'success') {
          console.log('Comment posted');
          setNewComment('');
          setNewReply('');
          setReplyingTo(null);
          setCommentPage(1); // Reset to first page to see the new comment
          fetchComments(sort); // Refresh comments
        } else if (response.data.status === 'error') {
          console.log('Not posted');
        } else {
          console.error('Failed to post comment:', response.data.message);
        }
      } catch (error) {
        console.error('Failed to post comment', error);
      }
    };

    const toggleLike = async (commentId: number, userId: number) => {
      if (!accessToken) return;
      const updateLikesRecursively = (currentComments: Comment[]): Comment[] => {
        return currentComments.map((comment) => {
          if (comment.comment_id === commentId) {
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
        const response = await instance.post(
          requests.toggleLike,
          { comment_id: commentId.toString(), user_id: userId.toString() },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
  
        if (response.data.status === 'liked') {
          console.log('Comment liked');
        } else if (response.data.status === 'unliked') {
          console.log('Comment unliked');
        } else {
          console.error('Failed to toggle like:', response.data.message);
          // Revert optimistic update on error (implementation similar to Remix version)
          setComments((prevComments) => {
            const revertLikesRecursively = (revertComments: Comment[]): Comment[] => {
              return revertComments.map((comment) => {
                if (comment.comment_id === commentId) {
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
        // Revert optimistic update on error (implementation similar to Remix version)
        setComments((prevComments) => {
          const revertLikesRecursively = (revertComments: Comment[]): Comment[] => {
            return revertComments.map((comment) => {
              if (comment.comment_id === commentId) {
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
  
    const renderComments = (currentComments: Comment[], depth: number = 0, maxDepth: number = 3): JSX.Element[] => {
        return currentComments?.map((comment) => (
          <View key={comment.comment_id} style={[styles.commentContainer, { marginLeft: depth * SPACING.space_16 }]}>
            {(isHost || comment.user_id === currentUser.userId) && (
              <TouchableOpacity onPress={() => handleEllipsisClick(comment.comment_id)} style={styles.ellipsisButton}>
                <Text style={styles.ellipsis}>...</Text>
              </TouchableOpacity>
            )}
            {selectedCommentForDeletion === comment.comment_id && (
              <View style={styles.deleteDropdown}>
                <TouchableOpacity onPress={() => handleDeleteComment(comment.comment_id)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete Comment</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.commentText}>
              <Text style={styles.commentUserName}>{comment.user_name}</Text>
              <Text style={styles.commentPageNumber}> (Page {comment.page_number})</Text>:{' '}
              <Text style={currentUser.readingStatus !== 'Read' && currentUser.currentPage < comment.page_number ? styles.blurredText : undefined}>
                {comment.comment_text}
              </Text>
            </Text>
            <View style={styles.commentActions}>
              <TouchableOpacity onPress={() => toggleLike(comment.comment_id, Number(currentUser.userId))} style={styles.likeButton}>
                <FontAwesome6 name="heart" size={20} color={comment.liked_by_user ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex} />
                <Text style={[styles.likeCount, { color: comment.liked_by_user ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex }]}>
                  {comment.like_count} likes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setReplyingTo(comment.comment_id)} style={styles.replyButton}>
                <Text style={styles.replyButtonText}>Reply</Text>
              </TouchableOpacity>
            </View>
            {replyingTo === comment.comment_id && (
              <CommentInputForm
                value={newReply}
                onChangeText={setNewReply}
                onSubmit={() => handleCommentSubmit(comment.comment_id)}
                placeholder="Write your reply..."
              />
            )}
            {depth < maxDepth && Array.isArray(comment.replies) && comment.replies.length > 0 && (
              <View style={{ marginLeft: SPACING.space_16 }}>
                {renderComments(comment.replies, depth + 1, maxDepth)}
              </View>
            )}
            {comment.reply_count > (comment.replies?.length || 0) && (
              <TouchableOpacity onPress={() => loadReplies(comment.comment_id)} style={styles.loadMoreRepliesButton}>
                <Text style={styles.loadMoreRepliesText}>
                  Load more replies ({comment.reply_count - (comment.replies?.length || 0)} more)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ));
      };
  
    return (
      <View style={styles.commentsSection}>
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>Comments</Text>
          <CommentSortDropdown
            label={<FontAwesome name="sort-down" size={20} color={COLORS.primaryWhiteHex} />}
            items={[
              { label: 'Date Ascending', value: 'created_at_asc' },
              { label: 'Date Descending', value: 'created_at_desc' },
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
        {comments && comments.length > 0 ? (
          renderComments(comments)
        ) : (
          <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
        )}
        <CommentInputForm
          value={newComment}
          onChangeText={setNewComment}
          onSubmit={() => handleCommentSubmit(null)}
          placeholder="Write a comment..."
        />
        {loadingComments && <ActivityIndicator style={styles.loadMoreIndicator} color={COLORS.primaryOrangeHex} />}
        {hasMoreCommentsState && (
          <TouchableOpacity onPress={loadMoreComments} style={styles.loadMoreCommentsButton}>
            <Text style={styles.loadMoreCommentsButtonText}>
              {loadingComments ? 'Loading...' : 'Load More Comments'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const styles = StyleSheet.create({
    commentsSection: {
        backgroundColor: COLORS.primaryDarkGreyHex,
        padding: SPACING.space_15,
        borderRadius: BORDERRADIUS.radius_10,
        marginBottom: SPACING.space_20,
      },
      commentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.space_15,
      },
      commentsTitle: {
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_16,
        color: COLORS.primaryWhiteHex,
      },
      commentContainer: {
          backgroundColor: COLORS.primaryGreyHex,
          padding: SPACING.space_12,
          borderRadius: BORDERRADIUS.radius_8,
          marginBottom: SPACING.space_10,
          position: 'relative',
        },
        ellipsisButton: {
          position: 'absolute',
          top: SPACING.space_4,
          right: SPACING.space_4,
          padding: SPACING.space_4,
        },
        ellipsis: {
          color: COLORS.secondaryLightGreyHex,
          fontSize: FONTSIZE.size_16,
        },
        deleteDropdown: {
          position: 'absolute',
          top: SPACING.space_20,
          right: 0,
          backgroundColor: COLORS.secondaryDarkGreyHex,
          borderRadius: BORDERRADIUS.radius_4,
          shadowColor: COLORS.primaryBlackHex,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
        deleteButton: {
          padding: SPACING.space_10,
        },
        deleteButtonText: {
          color: COLORS.primaryWhiteHex,
          fontSize: FONTSIZE.size_12,
        },
        commentText: {
          color: COLORS.primaryWhiteHex,
          fontSize: FONTSIZE.size_14,
          fontFamily: FONTFAMILY.poppins_regular,
        },
        commentUserName: {
          fontFamily: FONTFAMILY.poppins_semibold,
          color: COLORS.secondaryLightGreyHex,
        },
        commentPageNumber: {
          color: COLORS.secondaryLightGreyHex,
          fontSize: FONTSIZE.size_12,
          marginLeft: SPACING.space_8,
        },
        commentActions: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: SPACING.space_8,
        },
        likeButton: {
          flexDirection: 'row',
          alignItems: 'center',
          marginRight: SPACING.space_15,
        },
        likeCount: {
          fontSize: FONTSIZE.size_12,
          marginLeft: SPACING.space_4,
        },
        replyButton: {
          paddingVertical: SPACING.space_4,
        },
        replyButtonText: {
          color: COLORS.secondaryLightGreyHex,
          fontSize: FONTSIZE.size_12,
          fontFamily: FONTFAMILY.poppins_medium,
        },
        loadMoreRepliesButton: {
          marginTop: SPACING.space_8,
        },
        loadMoreRepliesText: {
          color: COLORS.primaryOrangeHex,
          fontSize: FONTSIZE.size_12,
        },
        noCommentsText: {
          color: COLORS.secondaryLightGreyHex,
          fontStyle: 'italic',
          marginBottom: SPACING.space_15,
        },
        loadMoreIndicator: {
          marginTop: SPACING.space_10,
        },
        loadMoreCommentsButton: {
          backgroundColor: COLORS.primaryOrangeHex,
          paddingVertical: SPACING.space_10,
          borderRadius: BORDERRADIUS.radius_10,
          alignItems: 'center',
          marginTop: SPACING.space_15,
        },
        loadMoreCommentsButtonText: {
          fontFamily: FONTFAMILY.poppins_medium,
          fontSize: FONTSIZE.size_14,
          color: COLORS.primaryWhiteHex,
        },
        blurredText: {
            opacity: 0.5,
          },
          dropdownStyle: {
            backgroundColor: COLORS.primaryGreyHex,
            borderRadius: BORDERRADIUS.radius_8,
            width: 150,
            marginTop: SPACING.space_4,
          },
          dropdownItem: {
            paddingVertical: SPACING.space_10,
            paddingHorizontal: SPACING.space_15,
          },
          dropdownItemText: {
            color: COLORS.primaryWhiteHex,
            fontSize: FONTSIZE.size_14,
          },
          dropdownLabel: {
            color: COLORS.primaryWhiteHex,
          },
  });

  export default BuddyReadCommentsSection;