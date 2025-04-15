import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import { CommentInputForm } from '../components/CommentInputForm';
import MemberProgressCard from '../components/MemberProgressCard';
import { Dropdown } from '../components/Dropdown';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the BuddyRead interface
interface Member {
  name: string;
  userId: string;
}

interface CurrentUser {
  userId: string | null;
  readingStatus: string | null;
  currentPage: number;
}

interface BuddyRead {
  buddy_read_id: number;
  book_id: string;
  book_title: string;
  book_photo: string;
  book_pages: number;
  buddy_read_description: string;
  start_date: string;
  end_date: string;
  max_members: number;
  members: Member[];
  host: Member;
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

interface BuddyReadDetailsRouteParams {
  buddyReadId: string;
}

interface Props {
  route: { params: BuddyReadDetailsRouteParams };
}

const BuddyReadsDetails: React.FC<Props> = ({ route }) => {
  const { buddyReadId } = route.params;
  const [buddyRead, setBuddyRead] = useState<BuddyRead | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ userId: null, readingStatus: null, currentPage: 0 });
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [commentPage, setCommentPage] = useState<number>(1);
  const [replyPages, setReplyPages] = useState<Record<number, number>>({});
  const [hasMoreReplies, setHasMoreReplies] = useState<Record<number, boolean>>({});
  const [memberDisplayCount, setMemberDisplayCount] = useState<number>(4);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [newReply, setNewReply] = useState<string>('');
  const [pageNumber, setPageNumber] = useState<number>(2); // Consider how to get the current page
  const [hasMoreCommentsState, setHasMoreCommentsState] = useState<boolean>(false);
  const [sort, setSort] = useState<string>('created_at_asc');
  const [description, setDescription] = useState<string>('Such empty! Much wow!');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedCommentForDeletion, setSelectedCommentForDeletion] = useState<number | null>(null);
  const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

  const fetchBuddyReadDetails = useCallback(async (currentSort: string = sort) => {
    setLoadingInitialData(true);
    setError(null);
    try {
      const buddyReadResponse = await instance.get(
        `${requests.fetchBuddyReadDetails}&buddy_read_id=${buddyReadId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const buddyReadData = buddyReadResponse.data;
      setBuddyRead(buddyReadData);
      setDescription(buddyReadData?.buddy_read_description || 'Such empty! Much wow!');

      let currentUserData: CurrentUser = { userId: null, readingStatus: null, currentPage: 0 };
      let isHostUser = false;
      let isMemberUser = false;
      let initialComments: Comment[] = [];
      let initialHasMoreComments = false;
      let initialHasMoreRepliesData: Record<number, boolean> = {};

      if (accessToken) {
        // Only fetch user-specific data if accessToken is available
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

        const currentUserReadingStatusResponse = await instance.post(
          requests.fetchReadingStatus,
          { bookId: buddyReadData?.book_id },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        currentUserData = {
          userId: currentUserReadingStatusResponse.data.userId,
          readingStatus: currentUserReadingStatusResponse.data.status,
          currentPage: currentUserReadingStatusResponse.data.currentPage || 0,
        };

        // Check if the current user is the host & member
        isHostUser = buddyReadData?.host?.userId == currentUserData.userId;
        isMemberUser = buddyReadData?.members?.some(member => member.userId == currentUserData.userId) || false;
      }

      setComments(initialComments);
      setHasMoreCommentsState(initialHasMoreComments);
      setHasMoreReplies(initialHasMoreRepliesData);
      setCurrentUser(currentUserData);
      setIsHost(isHostUser);
      setIsMember(isMemberUser);
    } catch (err: any) {
      setError('Failed to fetch Buddy Read details');
      console.error('Error fetching buddy read details:', err);
    } finally {
      setLoadingInitialData(false);
    }
  }, [buddyReadId, sort]);

  useEffect(() => {
    fetchBuddyReadDetails();
  }, [fetchBuddyReadDetails]);

  const handleSortChange = useCallback((newSort: string) => {
    setSort(newSort);
    setCommentPage(1); // Reset page on sort
    setComments([]); // Clear existing comments
    fetchBuddyReadDetails(newSort);
  }, [fetchBuddyReadDetails, setSort, setCommentPage, setComments]);

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const updateDescription = async () => {
    if (!accessToken || !buddyRead?.buddy_read_id || !currentUser.userId) {
      Alert.alert('Error', 'Not authorized or missing buddy read/user info.');
      return;
    }
    try {
      const response = await instance.post(
        requests.updateBuddyReadDescription,
        {
          userId: currentUser.userId,
          buddyReadId: buddyRead.buddy_read_id,
          description: description,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.message === 'Updated') {
        Alert.alert('Success', 'Description updated successfully!');
        setIsEditing(false);
        setBuddyRead(prev => prev ? { ...prev, buddy_read_description: description } : prev);
      } else {
        Alert.alert('Error', 'Failed to update description: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating description:', error);
      Alert.alert('Error', 'An error occurred while updating the description.');
    }
  };

  const loadMoreComments = async () => {
    if (loadingComments || !hasMoreCommentsState || !buddyRead?.buddy_read_id || !accessToken || !currentUser.userId) {
      return;
    }
    setLoadingComments(true);
    const nextPage = commentPage + 1;

    try {
      const response = await instance.get(
        `${requests.fetchComments}&buddy_read_id=${buddyRead.buddy_read_id}&page=${nextPage}&order_by=${sort}`,
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

  const handleCommentSubmit = async (parentCommentId?: number | null) => {
    if (!accessToken || !buddyRead?.buddy_read_id || !currentUser.userId) return;
    const commentText = parentCommentId ? newReply : newComment;

    try {
      const params = new URLSearchParams({
        comment_text: commentText,
        buddy_read_id: String(buddyRead.buddy_read_id),
        page_number: String(pageNumber), // Consider how to get the current page
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
        fetchBuddyReadDetails(sort); // Refresh comments
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

  const joinOrLeave = async () => {
    if (buddyRead?.buddy_read_id && currentUser.userId) {
      try {
        const response = await instance.post(
          requests.JoinLeaveBuddyReads,
          {
            buddyReadId: buddyRead.buddy_read_id.toString(),
            userId: currentUser.userId.toString(),
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.data.status === 'added' || response.data.status === 'removed') {
          console.log('User action performed');
          fetchBuddyReadDetails(); // Refresh details
        } else {
          Alert.alert('Error', response.data.message || 'Failed to perform action');
        }
      } catch (error) {
        console.error('Error in network:', error);
        Alert.alert('Error', 'Failed to perform action');
      }
    } else {
      Alert.alert('Info', 'Login to join the buddy read');
    }
  };

  const handleEllipsisClick = (commentId: number) => {
    setSelectedCommentForDeletion(commentId);
  };

  const handleDeleteComment = async (commentId: number) => {
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

  const loadMoreMembers = () => {
    setMemberDisplayCount((prevCount) => prevCount + 4);
  };

  const sharePage = async () => {
    if (buddyRead?.book_title) {
      try {
        const result = await Share.share({
          message: `Check out this buddy read for "${buddyRead.book_title}" on Biblophile! ${buddyRead.buddy_read_id}`,
        });

        if (result.action === Share.sharedAction) {
          console.log('Shared successfully');
        } else if (result.action === Share.dismissedAction) {
          console.log('Dismissed');
        }
      } catch (error: any) {
        Alert.alert(error.message);
      }
    }
  };

  if (loadingInitialData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error) {
    return <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!buddyRead) {
    return <View style={styles.notFoundContainer}><Text style={styles.notFoundText}>Buddy Read not found.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container} >
      <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity onPress={sharePage} style={styles.shareButton}>
          <FontAwesome name="share" size={25} color={COLORS.primaryOrangeHex} />
        </TouchableOpacity>
        <Text style={styles.title}>{buddyRead.book_title}</Text>
        <View style={styles.bookDetailsContainer}>
          <Image source={{ uri: buddyRead.book_photo }} style={styles.bookImage} />
          <View style={styles.buddyReadInfo}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isMember ? COLORS.primaryOrangeHex : buddyRead.members.length < buddyRead.max_members ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex,
                },
              ]}
              onPress={joinOrLeave}
              disabled={!isMember && buddyRead.members.length >= buddyRead.max_members}
            >
              <Text style={styles.actionButtonText}>
                {isMember ? 'Leave' : buddyRead.members.length < buddyRead.max_members ? 'Join' : 'Full'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Ends on:</Text> {buddyRead.end_date ? buddyRead.end_date : 'when everyone finishes'}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Max Members:</Text> {buddyRead.max_members}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Host:</Text> {buddyRead.host.name}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Description</Text>
          {isEditing ? (
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={handleDescriptionChange}
              multiline
            />
          ) : (
            <Text style={styles.descriptionText}>{description}</Text>
          )}

          {isHost && (
            <TouchableOpacity onPress={toggleEditing} style={styles.editButton}>
              <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          )}
          {isEditing && (
            <TouchableOpacity onPress={updateDescription} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        {isMember && (
          <>
            <View style={styles.membersContainer}>
              <Text style={styles.membersTitle}>Members:</Text>
              <View style={styles.membersGrid}>
                {buddyRead.members.slice(0, memberDisplayCount).map((member) => (
                  <MemberProgressCard
                    key={member.name}
                    memberDetails={{ userId: member.userId, name: member.name, bookPages: buddyRead.book_pages, bookId: buddyRead.book_id }}
                  />
                ))}
              </View>
              {memberDisplayCount < buddyRead.members.length && (
                <TouchableOpacity onPress={loadMoreMembers} style={styles.loadMoreButton}>
                  <Text style={styles.loadMoreButtonText}>Load More</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.commentsSection}>
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Comments</Text>
                <Dropdown
                  label={<FontAwesome6 name="sort-amount-down" size={20} color={COLORS.primaryWhiteHex} />}
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  errorText: {
    color: COLORS.primaryRedHex,
    fontSize: FONTSIZE.size_16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  notFoundText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollViewContainer: {
    paddingHorizontal: SPACING.space_15,
  },
  contentContainer: {
    paddingBottom: SPACING.space_30,
  },
  shareButton: {
    position: 'absolute',
    right: SPACING.space_15,
    top: SPACING.space_15,
    zIndex: 1,
  },
  title: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
    marginTop: SPACING.space_30,
  },
  bookDetailsContainer: {
    flexDirection: 'row',
    gap: SPACING.space_15,
    marginBottom: SPACING.space_20,
  },
  bookImage: {
    width: 120,
    height: 180,
    borderRadius: BORDERRADIUS.radius_8,
  },
  buddyReadInfo: {
    flex: 1,
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  infoText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  infoLabel: {
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.secondaryLightGreyHex,
  },
  descriptionContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_20,
  },
  descriptionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  descriptionText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    marginBottom: SPACING.space_15,
  },
  descriptionInput: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_10,
    marginBottom: SPACING.space_15,
    textAlignVertical: 'top',
  },
  editButton: {
    position: 'absolute',
    top: SPACING.space_15,
    right: SPACING.space_15,
  },
  editText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  saveButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
    marginTop: SPACING.space_10,
  },
  saveButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  membersContainer: {
    marginBottom: SPACING.space_20,
  },
  membersTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_10,
  },
  loadMoreButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
    marginTop: SPACING.space_15,
  },
  loadMoreButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
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
    color: COLORS.primaryLightGreyHex,
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

export default BuddyReadsDetails;