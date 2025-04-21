// import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable, TextInput } from 'react-native';
// import React, { useState, useEffect, useCallback } from 'react';
// import { Feather, Ionicons } from '@expo/vector-icons';
// import instance from '../../../services/axios';
// import requests from '../../../services/requests';

// interface Member {
//     name: string;
//     userId: string;
// }

// interface CurrentUser {
//     userId: string;
//     readingStatus: string,
//     currentPage: number;
// }

// interface Readalong {
//     readalong_id: number;
//     book_id: string;
//     book_title: string;
//     book_photo: string;
//     book_pages: number;
//     readalong_description: string;
//     start_date: string;
//     end_date: string;
//     max_members: number;
//     members: Member[];
//     host: Member;
//   }

// interface Comment {
//     comment_id: number;
//     comment_text: string;
//     page_number: number;
//     user_name: string;
//     user_id: string;
//     like_count: number;
//     created_at: string;
//     liked_by_user: boolean;
// }
// // -------------------------------------------------------------------------

// interface ReadalongCheckpointDetailsProps {
//     readalong: Readalong;
//     currentUser: CurrentUser;
//     isMember: boolean;
//     isHost: boolean;
//     checkpointId: string;
//     onBack: () => void;
// }

// const commentsLimit = 10; // Define the limit for pagination

// const ReadalongCheckpointDetails: React.FC<ReadalongCheckpointDetailsProps> = ({
//     readalong,
//     currentUser,
//     isMember,
//     isHost,
//     checkpointId,
//     onBack,
// }) => {
//     const [comments, setComments] = useState<Comment[]>([]);
//     const [loadingComments, setLoadingComments] = useState(false);
//     const [commentPage, setCommentPage] = useState(1);
//     const [hasMoreCommentsState, setHasMoreCommentsState] = useState(true);
//     const [sort, setSort] = useState<string>('created_at_asc');
//     const [newCommentText, setNewCommentText] = useState('');
//     const [newCommentPage, setNewCommentPage] = useState(1);
//     const [selectedCommentForDeletion, setSelectedCommentForDeletion] = useState<number | null>(null);
//     const [initialLoadError, setInitialLoadError] = useState<string | null>(null);


//     // --- Data Fetching ---
//     const fetchComments = useCallback(async (page: number, currentSort: string, appending: boolean = true) => {
//         if (loadingComments) return;

//         setLoadingComments(true);
//         if (!appending) {
//              setComments([]);
//              setCommentPage(1);
//              setHasMoreCommentsState(true);
//              setInitialLoadError(null);
//         }

//         try {
//             const response = await instance.get(`${requests.fetchReadalongComments}`, {
//                 params: {
//                     checkpoint_id: checkpointId,
//                     page: page,
//                     user_id: currentUser.userId,
//                     order_by: currentSort,
//                     limit: commentsLimit
//                 },
//             });

//             const fetchedData = response.data;

//             if (fetchedData.comments.length < commentsLimit) {
//                 setHasMoreCommentsState(false);
//             }

//             setComments(prevComments =>
//                 appending ? [...prevComments, ...fetchedData.comments] : fetchedData.comments
//             );
//             setCommentPage(page);

//         } catch (error) {
//             console.error("Error fetching comments:", error);
//             if (!appending) {
//                  setInitialLoadError("Failed to load comments.");
//                  setComments([]);
//             } else {
//                  console.warn("Failed to load more comments.");
//             }
//             setHasMoreCommentsState(false);
//         } finally {
//             setLoadingComments(false);
//         }
//     }, [checkpointId, currentUser.userId, loadingComments]);

//     useEffect(() => {
//         if (checkpointId && requests.fetchReadalongComments) {
//             fetchComments(1, sort, false);
//         }
//     }, [checkpointId, sort, fetchComments, requests?.fetchReadalongComments]);

//     const handleLoadMore = () => {
//         if (!loadingComments && hasMoreCommentsState) {
//             fetchComments(commentPage + 1, sort, true);
//         }
//     };

//     // --- Comment Actions ---
//     const handleCommentSubmit = async () => {
//         if (!newCommentText.trim() || !newCommentPage || !readalong?.readalong_id || !checkpointId || !currentUser?.userId) {
//             console.warn("Cannot submit comment: Missing data");
//             return;
//         }

//         const tempCommentId = Date.now();
//         const tempComment: Comment = {
//             comment_id: tempCommentId,
//             comment_text: newCommentText,
//             page_number: newCommentPage,
//             user_name: currentUser.userId,
//             user_id: currentUser.userId,
//             like_count: 0,
//             created_at: new Date().toISOString(),
//             liked_by_user: false,
//             // status: 'pending' // Optional: add a status for visual feedback
//         };
//         setComments(prevComments => [tempComment, ...prevComments]);
//         setNewCommentText('');
//         setNewCommentPage(1);
//         // setComments(prev => [tempComment, ...prev]); // Optimistic update

//         try {
//             const response = await instance.post(`${requests.submitReadalongComment}`, {
//                 comment_text: tempComment.comment_text,
//                 readalong_id: readalong.readalong_id,
//                 checkpoint_id: checkpointId,
//                 page_number: tempComment.page_number,
//                 user_id: currentUser.userId,
//             });

//             const data = response.data;

//             if (data.status === "success" && data.comment) {
//                 console.log("Comment posted successfully");
//                  setComments(prevComments => prevComments.map(c =>
//                       c.comment_id === tempCommentId ? data.comment : c
//                  ));
//                  if (sort === 'created_at_asc') {
//                       fetchComments(1, sort, false);
//                  }

//             } else {
//                 console.error("Failed to post comment:", data.message);
//                 // Revert optimistic update on failure
//                  setComments(prevComments => prevComments.filter(c => c.comment_id !== tempCommentId));
//                 // Optionally show an error message to the user
//             }
//         } catch (error) {
//             console.error("Error posting comment:", error);
//             // Revert optimistic update on network error
//             setComments(prevComments => prevComments.filter(c => c.comment_id !== tempCommentId));
//              // Optionally show an error message to the user
//         }
//     };

//     const toggleLike = async (commentId: number, userId: string) => {
//         const updateLikesRecursively = (commentsArr: Comment[]): Comment[] => {
//             return commentsArr.map((comment) => {
//                 if (comment.comment_id === commentId) {
//                     const updatedLikeCount = comment.liked_by_user ? comment.like_count - 1 : comment.like_count + 1;
//                     return {
//                         ...comment,
//                         liked_by_user: !comment.liked_by_user,
//                         like_count: updatedLikeCount,
//                     };
//                 }
//                 return comment;
//             });
//         };
//         setComments((prevComments) => updateLikesRecursively(prevComments));

//         try {
//              const response = await instance.post(`${requests.toggleReadalongLike}`, {
//                  comment_id: commentId,
//                  user_id: userId,
//              });

//              const data = response.data;

//              if (data.status === "error") {
//                  console.error("Failed to toggle like:", data.message);
//                  setComments((prevComments) => updateLikesRecursively(prevComments));
//              } else {
//                  console.log("Like toggled successfully:", data.status);
//              }

//         } catch (error) {
//             console.error("Error in toggleLike:", error);
//             setComments((prevComments) => updateLikesRecursively(prevComments));
//         }
//     };

//     const handleEllipsisClick = (commentId: number) => {
//         setSelectedCommentForDeletion(selectedCommentForDeletion === commentId ? null : commentId);
//     };

//     const handleDeleteComment = async (commentId: number, userId: string) => {
//         setComments((prevComments) => prevComments.filter((comment) => comment.comment_id !== commentId));
//         setSelectedCommentForDeletion(null);

//         try {
//             const response = await instance.post(`${requests.deleteReadalongComment}`, {
//                 comment_id: commentId,
//                 user_id: userId,
//             });

//             const result = response.data;

//             if (result.status === 'success') {
//                 console.log('Comment deleted successfully.');
//                 // UI is already updated optimistically, do nothing or show success toast
//             } else {
//                 console.error(result.message || 'Failed to delete comment.');
//                  // Revert optimistic update if API failed
//                  // This would require storing the comment before deleting, might be complex.
//                  // A simpler approach on API failure might be to refetch the current page
//                  fetchComments(commentPage, sort, false); // Refetch current page to sync state
//                  // Or just alert the user and leave the incorrect state (less ideal)
//                  alert(result.message || 'Failed to delete comment.');
//             }
//         } catch (error) {
//             console.error('Error deleting comment:', error);
//              // Revert optimistic update on network error
//              // Same logic as above, refetching is safer
//              fetchComments(commentPage, sort, false);
//              // Or alert user
//              alert('An error occurred while deleting the comment.');
//         }
//     };

//     // --- Sorting ---
//     const handleSortChange = (newSort: string) => {
//         setSort(newSort);
//         fetchComments(1, newSort, false);
//     };

//     // --- Render Item for FlatList ---
//     const renderCommentItem = ({ item }: { item: Comment }) => {
//          const isSelected = item.comment_id === selectedCommentForDeletion;
//          const shouldBlur = currentUser.currentPage < item.page_number;


//          return (
//             <View style={styles.commentContainer}>
//                  {/* Optional: User Avatar/Icon could go here */}
//                 <View style={styles.commentContent}>
//                      {/* Ellipsis button for host or comment owner */}
//                     {(isHost || item.user_id === currentUser.userId) && (
//                         <Pressable
//                             style={styles.commentEllipsis}
//                             onPress={() => handleEllipsisClick(item.comment_id)}
//                         >
//                             <Feather name="more-vertical" size={20} color="#a0aec0" />
//                         </Pressable>
//                     )}

//                     {/* Delete Menu (conditionally rendered) */}
//                      {(isHost || item.user_id === currentUser.userId) && isSelected && (
//                          <View style={styles.deleteMenu}>
//                              <Pressable
//                                  onPress={() => handleDeleteComment(item.comment_id, currentUser.userId)}
//                                  style={styles.deleteMenuItem}
//                              >
//                                  <Text style={styles.deleteMenuItemText}>Delete Comment</Text>
//                              </Pressable>
//                          </View>
//                      )}

//                     <Text style={styles.commentMeta}>
//                         <Text style={styles.commentUser}>{item.user_name}</Text>
//                         <Text style={styles.commentPage}> (Page {item.page_number})</Text>
//                          <Text style={styles.commentDate}> - {new Date(item.created_at).toLocaleDateString()}</Text>
//                     </Text>
//                      <Text style={[styles.commentText, shouldBlur && styles.blurredText]}>{item.comment_text}</Text>

//                     <View style={styles.commentActions}>
//                         <Pressable
//                             style={styles.likeButton}
//                             onPress={() => toggleLike(item.comment_id, currentUser.userId)}
//                         >
//                             {item.liked_by_user ? (
//                                 <Ionicons name="heart" size={20} color="#D17842" />
//                             ) : (
//                                 <Ionicons name="heart-outline" size={20} color="#52555A" />
//                             )}
//                             <Text style={styles.likeCount}>{item.like_count}</Text>
//                         </Pressable>
//                          {/* Reply button could go here */}
//                     </View>
//                 </View>
//             </View>
//         );
//     };

//      // --- Render Footer and Empty Components ---
//     const renderFooter = () => {
//         if (!loadingComments) return null;
//         return (
//             <View style={styles.loadingFooter}>
//                 <ActivityIndicator size="small" color="#0000ff" />
//                 <Text style={styles.loadingText}>Loading more comments...</Text>
//             </View>
//         );
//     };

//     const renderEmpty = () => {
//         if (loadingComments || initialLoadError) return null;
//         return (
//             <View style={styles.emptyList}>
//                 <Text style={styles.emptyListText}>No comments yet.</Text>
//             </View>
//         );
//     };

//     // --- Main Render ---

//      if (initialLoadError) {
//          return (
//              <View style={styles.centeredMessage}>
//                  <Text style={styles.errorText}>{initialLoadError}</Text>
//                  <Pressable style={styles.retryButton} onPress={() => fetchComments(1, sort, false)}>
//                      <Text style={styles.retryButtonText}>Retry</Text>
//                  </Pressable>
//              </View>
//          );
//      }

//     return (
//         <View style={styles.detailsContainer}>
//              {/* Back Button */}
//              <Pressable onPress={onBack} style={styles.backButton}>
//                  <Ionicons name="arrow-back" size={24} color="#ffffff" />
//                  <Text style={styles.backButtonText}>Back to Checkpoints</Text>
//              </Pressable>

//              {/* Checkpoint Prompt Display */}
//              {/* You need the checkpoint object itself here to display its prompt and page */}
//              {/* Assuming you pass the selected checkpoint object from the parent */}
//              {/* Example (if you passed 'selectedCheckpoint' object as prop): */}
//              {/*
//              <View style={styles.checkpointInfo}>
//                  <Text style={styles.checkpointPromptTitle}>Discussion Prompt:</Text>
//                  <Text style={styles.checkpointPromptText}>{selectedCheckpoint?.discussion_prompt}</Text>
//                  <Text style={styles.checkpointPromptPage}>(Page {selectedCheckpoint?.page_number})</Text>
//              </View>
//              */}
//              {/* If only checkpointId is passed, you might need to fetch checkpoint details here or rely on parent data */}
//              {/* For now, let's assume parent passes enough info or we just focus on comments */}


//              <View style={styles.commentsHeader}>
//                  <Text style={styles.commentsTitle}>Comments</Text>
//                  {/* Sort Dropdown (needs custom implementation in RN) */}
//                  {/* This is a simplified representation. You'll need a modal/popup */}
//                  <View>
//                      <Pressable onPress={() => { /* Open Sort Options Modal */ }} style={styles.sortButton}>
//                           <Feather name="filter" size={20} color="#a0aec0" /> {/* Use a suitable icon */}
//                           {/* <Text style={styles.sortButtonText}>Sort</Text> */}
//                      </Pressable>
//                       {/* Implement a modal/popup here to show sort options */}
//                       {/* When an option is selected, call handleSortChange */}
//                  </View>
//                  {/* Example basic sort buttons (instead of dropdown) */}
//                  {/* <View style={styles.sortButtonsContainer}>
//                       <Pressable onPress={() => handleSortChange('created_at_asc')}><Text style={sort === 'created_at_asc' && styles.activeSort}>Date Asc</Text></Pressable>
//                       <Pressable onPress={() => handleSortChange('created_at_desc')}><Text style={sort === 'created_at_desc' && styles.activeSort}>Date Desc</Text></Pressable>
//                  </View> */}
//              </View>


//             {isMember ? (
//                 <>
//                     <FlatList
//                         data={comments}
//                         renderItem={renderCommentItem}
//                         keyExtractor={(item) => item.comment_id.toString()} // Key must be string
//                         onEndReached={handleLoadMore}
//                         onEndReachedThreshold={0.5}
//                         ListFooterComponent={renderFooter}
//                         ListEmptyComponent={renderEmpty}
//                         // Add padding/margins to FlatList content if needed
//                         contentContainerStyle={styles.flatListContent}
//                     />

//                     {/* Comment Input Form */}
//                     <View style={styles.commentInputContainer}>
//                          <TextInput
//                              style={styles.commentTextInput}
//                              placeholder="Write a comment..."
//                              placeholderTextColor="#a0aec0"
//                              value={newCommentText}
//                              onChangeText={setNewCommentText}
//                              multiline={true} // Allow multiline input
//                          />
//                           {/* Optional: Input for page number */}
//                          <TextInput
//                             style={styles.commentPageInput}
//                             placeholder="Page"
//                             placeholderTextColor="#a0aec0"
//                             keyboardType="numeric"
//                             value={newCommentPage === 0 ? '' : newCommentPage.toString()}
//                             onChangeText={(text) => setNewCommentPage(parseInt(text) || 0)} // Parse to int, default to 0 if invalid
//                          />
//                          <Pressable
//                              style={styles.postButton}
//                              onPress={handleCommentSubmit}
//                              disabled={loadingComments || !newCommentText.trim() || !newCommentPage} // Disable if loading, text is empty or page is 0
//                          >
//                               <Text style={styles.postButtonText}>Post</Text>
//                          </Pressable>
//                     </View>
//                 </>
//             ) : (
//                  <View style={styles.centeredMessage}>
//                      <Text style={styles.notMemberText}>You must be a member to view and add comments.</Text>
//                  </View>
//             )}
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     detailsContainer: {
//         flex: 1, // Take up available space
//         backgroundColor: '#1a202c', // Example background
//         padding: 16,
//     },
//     backButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 16,
//     },
//     backButtonText: {
//         marginLeft: 8,
//         fontSize: 16,
//         color: '#ffffff',
//     },
//     checkpointInfo: {
//         marginBottom: 20,
//         paddingBottom: 10,
//         borderBottomWidth: 1,
//         borderBottomColor: '#4a5568',
//     },
//     checkpointPromptTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#ffffff',
//         marginBottom: 4,
//     },
//     checkpointPromptText: {
//          fontSize: 16,
//          color: '#a0aec0',
//          marginBottom: 4,
//     },
//     checkpointPromptPage: {
//          fontSize: 14,
//          color: '#a0aec0',
//          fontStyle: 'italic',
//     },
//     commentsHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 12,
//     },
//     commentsTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#ffffff',
//     },
//     sortButton: {
//         padding: 8, // Increase touch area
//     },
//      sortButtonsContainer: { // Example for basic sort buttons
//          flexDirection: 'row',
//          gap: 10, // Adjust spacing
//      },
//      activeSort: {
//          fontWeight: 'bold',
//          color: '#ff7e1f', // Highlight active sort
//      },
//     flatListContent: {
//         paddingBottom: 20, // Add padding at the bottom for the input form
//     },
//     commentContainer: {
//         flexDirection: 'row',
//         marginBottom: 16,
//         backgroundColor: '#2d3748', // Example background
//         borderRadius: 8,
//         padding: 12,
//         position: 'relative', // For ellipsis menu positioning
//     },
//      commentContent: {
//          flex: 1,
//      },
//      commentEllipsis: {
//          position: 'absolute',
//          top: 8,
//          right: 8,
//          padding: 4, // Increase touch area
//          zIndex: 1, // Ensure clickable
//      },
//      deleteMenu: {
//          position: 'absolute',
//          top: 28, // Adjust position
//          right: 8,
//          backgroundColor: '#4a5568', // Example background
//          borderRadius: 4,
//          shadowColor: '#000',
//          shadowOffset: { width: 0, height: 2 },
//          shadowOpacity: 0.3,
//          shadowRadius: 3,
//          elevation: 4,
//          zIndex: 10, // Ensure it's on top
//      },
//      deleteMenuItem: {
//          padding: 10,
//      },
//      deleteMenuItemText: {
//          color: '#ffffff',
//          fontSize: 14,
//      },
//     commentMeta: {
//         marginBottom: 4,
//     },
//     commentUser: {
//         fontWeight: 'bold',
//         color: '#a0aec0', // Example user name color
//     },
//     commentPage: {
//         fontSize: 12,
//         color: '#a0aec0',
//         fontStyle: 'italic',
//     },
//      commentDate: {
//          fontSize: 12,
//          color: '#a0aec0',
//      },
//     commentText: {
//         fontSize: 14,
//         color: '#ffffff', // Example comment text color
//         marginBottom: 8,
//     },
//      blurredText: {
//          // React Native doesn't have a direct 'filter: blur()' style
//          // You might need to use a library or overlay a semi-transparent view
//          // This is a placeholder - actual implementation needs more thought.
//          // A simple approach might be to show placeholder text or just hide.
//          color: 'transparent', // Hide text
//          textShadowColor: 'rgba(0, 0, 0, 0.5)', // Optional: add a shadow effect
//          textShadowOffset: {width: 1, height: 1},
//          textShadowRadius: 5,
//      },
//     commentActions: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     likeButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 4, // Increase touch area
//     },
//     likeCount: {
//         marginLeft: 4,
//         fontSize: 12,
//         color: '#a0aec0',
//     },
//     commentInputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingTop: 10,
//         borderTopWidth: 1,
//         borderTopColor: '#4a5568',
//         marginTop: 'auto', // Push to bottom
//     },
//     commentTextInput: {
//         flex: 1, // Take most of the space
//         backgroundColor: '#4a5568', // Example input background
//         borderRadius: 20,
//         paddingVertical: 8,
//         paddingHorizontal: 15,
//         marginRight: 8,
//         fontSize: 14,
//         color: '#ffffff', // Input text color
//         minHeight: 40, // Ensure visible height
//         maxHeight: 120, // Prevent it from growing too large
//     },
//      commentPageInput: {
//          width: 50, // Fixed width
//          backgroundColor: '#4a5568',
//          borderRadius: 20,
//          paddingVertical: 8,
//          paddingHorizontal: 5,
//          marginRight: 8,
//          fontSize: 14,
//          color: '#ffffff',
//          textAlign: 'center',
//      },
//     postButton: {
//         backgroundColor: '#ff7e1f', // Example orange
//         borderRadius: 20,
//         paddingVertical: 10,
//         paddingHorizontal: 15,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//      postButtonText: {
//          color: '#ffffff',
//          fontSize: 14,
//          fontWeight: 'bold',
//      },
//      loadingFooter: {
//          paddingVertical: 20,
//          alignItems: 'center',
//      },
//      loadingText: {
//          marginTop: 8,
//          color: '#a0aec0',
//      },
//      emptyList: {
//          paddingVertical: 20,
//          alignItems: 'center',
//      },
//      emptyListText: {
//          color: '#a0aec0',
//          fontSize: 16,
//      },
//       centeredMessage: {
//          flex: 1,
//          justifyContent: 'center',
//          alignItems: 'center',
//          padding: 20,
//       },
//       errorText: {
//          color: 'red',
//          textAlign: 'center',
//          fontSize: 16,
//          marginBottom: 10,
//       },
//        notMemberText: {
//           color: '#a0aec0',
//           textAlign: 'center',
//           fontSize: 16,
//        },
//        retryButton: {
//           marginTop: 10,
//           backgroundColor: '#ff7e1f',
//           borderRadius: 8,
//           paddingVertical: 10,
//           paddingHorizontal: 15,
//        },
//        retryButtonText: {
//           color: '#ffffff',
//           fontSize: 14,
//        }
// });

// export default ReadalongCheckpointDetails;

import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable, TextInput } from 'react-native';
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

// Types
interface Member {
    name: string;
    userId: string;
}

interface CurrentUser {
    userId: string;
    readingStatus: string;
    currentPage: number;
}

interface Readalong {
    readalong_id: number;
    book_id: string;
    book_title: string;
    book_photo: string;
    book_pages: number;
    readalong_description: string;
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
const useComments = (checkpointId: string, currentUser: CurrentUser) => {
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
            const response = await instance.get(requests.fetchReadalongComments, {
                params: {
                    checkpoint_id: checkpointId,
                    page,
                    user_id: currentUser.userId,
                    order_by: currentSort,
                    limit: COMMENTS_LIMIT
                }
            });

            const fetchedData = response.data;
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
            comment.comment_id === commentId ? { ...comment, ...updatedComment } : comment
        ));
    }, []);

    const deleteComment = useCallback((commentId: number) => {
        setComments(prev => prev.filter(comment => comment.comment_id !== commentId));
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
    const shouldBlur = currentUser.currentPage < comment.page_number;
    const canDelete = isHost || comment.user_id === currentUser.userId;
    
    const formattedDate = useMemo(() => {
        return new Date(comment.created_at).toLocaleDateString();
    }, [comment.created_at]);

    return (
        <View style={styles.commentContainer}>
            <View style={styles.commentContent}>
                {canDelete && (
                    <Pressable
                        style={styles.commentEllipsis}
                        onPress={() => setShowDeleteMenu(prev => !prev)}
                    >
                        <Feather name="more-vertical" size={20} color="#a0aec0" />
                    </Pressable>
                )}

                {canDelete && showDeleteMenu && (
                    <View style={styles.deleteMenu}>
                        <Pressable
                            onPress={() => {
                                onDeleteComment(comment.comment_id);
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
                    <Text style={styles.commentPage}> (Page {comment.page_number})</Text>
                    <Text style={styles.commentDate}> - {formattedDate}</Text>
                </Text>
                
                <Text style={[styles.commentText, shouldBlur && styles.blurredText]}>
                    {comment.comment_text}
                </Text>

                <View style={styles.commentActions}>
                    <Pressable
                        style={styles.likeButton}
                        onPress={() => onToggleLike(comment.comment_id)}
                    >
                        {comment.liked_by_user ? (
                            <Ionicons name="heart" size={20} color="#D17842" />
                        ) : (
                            <Ionicons name="heart-outline" size={20} color="#52555A" />
                        )}
                        <Text style={styles.likeCount}>{comment.like_count}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
});

// CommentForm Component
const CommentForm = memo(({ 
    onSubmit, 
    isLoading 
}: { 
    onSubmit: (text: string, pageNumber: number) => void, 
    isLoading: boolean 
}) => {
    const [commentText, setCommentText] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    
    const isValid = commentText.trim() !== '' && pageNumber > 0;
    
    const handleSubmit = () => {
        if (isValid) {
            onSubmit(commentText, pageNumber);
            setCommentText('');
            setPageNumber(1);
        }
    };
    
    return (
        <View style={styles.commentInputContainer}>
            <TextInput
                style={styles.commentTextInput}
                placeholder="Write a comment..."
                placeholderTextColor="#a0aec0"
                value={commentText}
                onChangeText={setCommentText}
                multiline={true}
            />
            
            <TextInput
                style={styles.commentPageInput}
                placeholder="Page"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={pageNumber === 0 ? '' : pageNumber.toString()}
                onChangeText={(text) => setPageNumber(parseInt(text) || 0)}
            />
            
            <Pressable
                style={[styles.postButton, !isValid && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isLoading || !isValid}
            >
                <Text style={styles.postButtonText}>Post</Text>
            </Pressable>
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
    } = useComments(checkpointId, currentUser);
    
    const handleToggleLike = useCallback(async (commentId: number) => {
        // Optimistic update
        const commentToUpdate = comments.find(c => c.comment_id === commentId);
        if (!commentToUpdate) return;
        
        const willBeLiked = !commentToUpdate.liked_by_user;
        const newLikeCount = commentToUpdate.like_count + (willBeLiked ? 1 : -1);
        
        updateComment(commentId, {
            liked_by_user: willBeLiked,
            like_count: newLikeCount
        });

        try {
            const response = await instance.post(requests.toggleReadalongLike, {
                comment_id: commentId,
                user_id: currentUser.userId,
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
            const response = await instance.post(requests.deleteReadalongComment, {
                comment_id: commentId,
                user_id: currentUser.userId,
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
        if (!text.trim() || !pageNumber || !readalong?.readalong_id || !checkpointId) {
            return;
        }

        const tempId = Date.now();
        const tempComment: Comment = {
            comment_id: tempId,
            comment_text: text,
            page_number: pageNumber,
            user_name: currentUser.userId, // Will be replaced with actual name from API
            user_id: currentUser.userId,
            like_count: 0,
            created_at: new Date().toISOString(),
            liked_by_user: false
        };
        
        addComment(tempComment);

        try {
            const response = await instance.post(requests.submitReadalongComment, {
                comment_text: text,
                readalong_id: readalong.readalong_id,
                checkpoint_id: checkpointId,
                page_number: pageNumber,
                user_id: currentUser.userId,
            });

            const data = response.data;

            if (data.status === "success" && data.comment) {
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
    }, [readalong?.readalong_id, checkpointId, currentUser.userId, addComment, deleteComment, sort, handleSortChange]);

    const renderFooter = useCallback(() => {
        if (!pagination.loading) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#0000ff" />
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
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
                <Text style={styles.backButtonText}>Back to Checkpoints</Text>
            </Pressable>

            {/* Comments Header with Sort Button */}
            <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Comments</Text>
                <View>
                    <Pressable style={styles.sortButton}>
                        <Feather name="filter" size={20} color="#a0aec0" />
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
                        keyExtractor={(item) => item.comment_id.toString()}
                        onEndReached={comments.length > 0 ? handleLoadMore : undefined}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={renderEmpty}
                        contentContainerStyle={styles.flatListContent}
                    />

                    <CommentForm 
                        onSubmit={handleCommentSubmit}
                        isLoading={pagination.loading}
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
        backgroundColor: '#1a202c',
        padding: 16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#ffffff',
    },
    commentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    commentsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    sortButton: {
        padding: 8,
    },
    flatListContent: {
        paddingBottom: 20,
    },
    commentContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#2d3748',
        borderRadius: 8,
        padding: 12,
        position: 'relative',
    },
    commentContent: {
        flex: 1,
    },
    commentEllipsis: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4,
        zIndex: 1,
    },
    deleteMenu: {
        position: 'absolute',
        top: 28,
        right: 8,
        backgroundColor: '#4a5568',
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
        zIndex: 10,
    },
    deleteMenuItem: {
        padding: 10,
    },
    deleteMenuItemText: {
        color: '#ffffff',
        fontSize: 14,
    },
    commentMeta: {
        marginBottom: 4,
    },
    commentUser: {
        fontWeight: 'bold',
        color: '#a0aec0',
    },
    commentPage: {
        fontSize: 12,
        color: '#a0aec0',
        fontStyle: 'italic',
    },
    commentDate: {
        fontSize: 12,
        color: '#a0aec0',
    },
    commentText: {
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 8,
    },
    blurredText: {
        color: 'transparent',
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
        padding: 4,
    },
    likeCount: {
        marginLeft: 4,
        fontSize: 12,
        color: '#a0aec0',
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#4a5568',
        marginTop: 'auto',
    },
    commentTextInput: {
        flex: 1,
        backgroundColor: '#4a5568',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 8,
        fontSize: 14,
        color: '#ffffff',
        minHeight: 40,
        maxHeight: 120,
    },
    commentPageInput: {
        width: 50,
        backgroundColor: '#4a5568',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 5,
        marginRight: 8,
        fontSize: 14,
        color: '#ffffff',
        textAlign: 'center',
    },
    postButton: {
        backgroundColor: '#ff7e1f',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#4a5568',
        opacity: 0.7,
    },
    postButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    loadingFooter: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        color: '#a0aec0',
    },
    emptyList: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyListText: {
        color: '#a0aec0',
        fontSize: 16,
    },
    centeredMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 10,
    },
    notMemberText: {
        color: '#a0aec0',
        textAlign: 'center',
        fontSize: 16,
    },
    retryButton: {
        marginTop: 10,
        backgroundColor: '#ff7e1f',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 14,
    }
});

export default ReadalongCheckpointDetails;