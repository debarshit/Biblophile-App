import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable } from 'react-native'; // Import Pressable
import React, { useState, useEffect, useRef, useCallback } from 'react'; // Import useCallback
// Assuming React Navigation for actual screen navigation if needed elsewhere,
// but for list/details toggle, we use state within this component.
// import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; // Example icon for ellipsis
// Assuming your axios instance and requests object are accessible
import instance from '../../../services/axios';
import requests from '../../../services/requests';

// Import the new details component
import ReadalongCheckpointDetails from './ReadalongCheckpointDetails'; // Adjust path
import { useNavigation } from '@react-navigation/native';

// --- Interface Definitions (Ensure they are the same as used in Details component) ---
interface Member { name: string; userId: string; }
interface CurrentUser { userId: string; readingStatus: string, currentPage: number; }
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
interface Checkpoint {
    checkpoint_id: string; readalong_id: string; page_number: string; // Keep string here as per loader data
    discussion_prompt: string; discussion_date: string;
}
// -------------------------------------------------------------------------

interface ReadalongCheckpointsProps {
    // These props would typically come from the screen component using React Navigation
    // and potentially a data fetching hook or context, replacing the Remix loader.
    // For this example, we assume they are passed down.
    readalong?: Readalong;
    currentUser: CurrentUser;
    isMember: boolean;
    isHost: boolean;
    // Assuming requests object is accessible globally or imported
    // requests: { fetchreadalongCheckpoints: string, submitReadalongComment: string, toggleReadalongLike: string, deleteReadalongComment: string };
     // Add potential error prop from parent initial load if applicable
     initialLoadError?: string;
}

const checkpointsLimit = 10;

const ReadalongCheckpoints: React.FC<ReadalongCheckpointsProps> = ({
    readalong,
    currentUser,
    isMember,
    isHost,
    initialLoadError, // Receive initial load error from parent
    // requests // If passed as prop
}) => {
    // Navigation hook for potential screen-level navigation (e.g., creating new checkpoint screen)
    // const navigation = useNavigation<any>();

    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null); // Error for the checkpoints list fetch
    const [selectedCheckpointForUpdation, setSelectedCheckpointForUpdation] = useState<string | null>(null); // Ellipsis menu for checkpoint

    // --- State for managing the selected checkpoint for details view ---
    const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
    // --- State to hold the *details* of the selected checkpoint ---
    // This is needed if the Details component needs more than just the ID
    const [selectedCheckpointDetails, setSelectedCheckpointDetails] = useState<Checkpoint | null>(null);

    const navigation = useNavigation<any>();


     // Use useCallback to memoize fetchCheckpoints function
    const fetchCheckpoints = useCallback(async () => {
        // Prevent fetching if already loading, no more data, readalongId is missing, or a checkpoint is selected
        if (loading || !hasMore || !readalong?.readalong_id || selectedCheckpointId !== null) {
             if (!readalong?.readalong_id) console.warn("Readalong ID is missing, cannot fetch checkpoints.");
             if(selectedCheckpointId !== null) console.log("Checkpoint details view is open, skipping list fetch.");
             return;
        }

        setLoading(true);
        try {
            // Use your axios instance and requests object
            const response = await instance.get(`${requests.fetchreadalongCheckpoints}`, {
                params: {
                    userId: currentUser.userId,
                    offset,
                    limit: checkpointsLimit,
                    readalongId: readalong.readalong_id,
                },
            });

            const fetchedCheckpoints: Checkpoint[] = response.data;

            if (fetchedCheckpoints.length < checkpointsLimit) {
                setHasMore(false);
            }

            setCheckpoints(prevCheckpoints => {
                 // Ensure uniqueness when appending, although API pagination should handle this
                const prevCheckpointIds = new Set(prevCheckpoints.map(checkpoint => checkpoint.checkpoint_id));
                const uniqueCheckpoints = fetchedCheckpoints.filter(checkpoint => !prevCheckpointIds.has(checkpoint.checkpoint_id));
                return [...prevCheckpoints, ...uniqueCheckpoints];
            });

        } catch (error) {
            setError("Error fetching checkpoints.");
            console.error("Fetch checkpoints list error:", error);
            setHasMore(false); // Assume no more data on error
        } finally {
            setLoading(false);
        }
    }, [offset, currentUser.userId, readalong?.readalong_id, loading, hasMore, selectedCheckpointId]); // Dependencies

    // Effect for initial fetch and subsequent fetches when offset changes
    useEffect(() => {
         // Only fetch if readalong ID is available and no checkpoint is currently selected for details
         if (readalong?.readalong_id && selectedCheckpointId === null) {
            fetchCheckpoints();
         }
    }, [offset, readalong?.readalong_id, selectedCheckpointId, fetchCheckpoints]); // Include fetchCheckpoints in deps


    // Handler for FlatList reaching the end (Load More Checkpoints)
    const handleLoadMoreCheckpoints = () => {
        if (!loading && hasMore && selectedCheckpointId === null) { // Only load if not loading, has more, and list is visible
            setOffset(prevOffset => prevOffset + checkpointsLimit);
        }
    };

    // Handler for clicking a checkpoint item to view details
    const handleViewCheckpointDetails = (checkpoint: Checkpoint) => {
        setSelectedCheckpointId(checkpoint.checkpoint_id);
        setSelectedCheckpointDetails(checkpoint); // Store the checkpoint object if needed by details component
        setSelectedCheckpointForUpdation(null); // Close any open ellipsis menu in the list
    };

    // Handler for the back button in the details view
    const handleBackToList = () => {
        setSelectedCheckpointId(null);
        setSelectedCheckpointDetails(null); // Clear selected details
        // Optionally refetch the list if you think data might have changed (e.g., comments added)
        // setOffset(0);
        // setHasMore(true);
        // setCheckpoints([]);
        // fetchCheckpoints(); // This will be triggered by the useEffect when selectedCheckpointId becomes null and offset is reset
    };


    // Handler for ellipsis click on a checkpoint item (for Update)
    const handleEllipsisClick = (checkpointId: string) => {
        setSelectedCheckpointForUpdation(selectedCheckpointForUpdation === checkpointId ? null : checkpointId);
    };

    // Handler for updating a checkpoint (Navigates to a different screen)
    const handleUpdateCheckpoint = async (checkpointId: string) => {
         navigation.navigate('CreateReadalongCheckpoint', {
            readalong: readalong,
            currentUser: currentUser,
            isHost: isHost,
            checkpoint: {
              checkpointId: checkpointId,
              pageNumber: checkpoints.find(c => c.checkpoint_id === checkpointId)?.page_number || '0',
              description: checkpoints.find(c => c.checkpoint_id === checkpointId)?.discussion_prompt || '',
              date: checkpoints.find(c => c.checkpoint_id === checkpointId)?.discussion_date || '',
            },
          })
         setSelectedCheckpointForUpdation(null);
    };


    // Render function for each item in the FlatList
    const renderCheckpointItem = ({ item }: { item: Checkpoint }) => {
         const isSelected = item.checkpoint_id === selectedCheckpointForUpdation; // For update menu

        return (
            <Pressable
                 key={item.checkpoint_id} // Use key on the Pressable
                 style={styles.checkpointItem}
                 onPress={() => handleViewCheckpointDetails(item)} // View details on press
            >
                 <View style={styles.timelinePoint} /> {/* Placeholder dot */}
                 <View style={styles.checkpointContent}>
                     {/* Ellipsis button for hosts */}
                     {isHost && (
                         <Pressable
                             style={styles.checkpointEllipsis}
                             onPress={() => handleEllipsisClick(item.checkpoint_id)}
                         >
                             <Feather name="more-vertical" size={20} color="#a0aec0" />
                         </Pressable>
                     )}

                      {/* Update Menu (conditionally rendered) */}
                      {isHost && isSelected && (
                          <View style={styles.updateMenu}>
                              <Pressable
                                  onPress={() => handleUpdateCheckpoint(item.checkpoint_id)}
                                  style={styles.updateMenuItem}
                              >
                                  <Text style={styles.updateMenuItemText}>Update Checkpoint</Text>
                              </Pressable>
                          </View>
                      )}

                    <Text style={styles.checkpointDate}>{item.discussion_date}</Text>
                    <Text style={styles.checkpointPrompt}>{item.discussion_prompt}</Text>
                    <Text style={styles.checkpointPage}>Page: {item.page_number}</Text>
                 </View>
             </Pressable>
        );
    };

    // Component to render at the bottom of the list (for loading indicator)
    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#0000ff" /> {/* Use your theme color */}
                <Text style={styles.loadingText}>Loading more checkpoints...</Text>
            </View>
        );
    };

    // Component to render when the list is empty
    const renderEmpty = () => {
        // Only show empty message if not loading and no errors
        if (loading || error || initialLoadError) return null;
        return (
             <View style={styles.emptyList}>
                 <Text style={styles.emptyListText}>No checkpoints available.</Text>
             </View>
        );
    };

     // --- Main Render Logic ---

     // Handle initial load error from parent
     if (initialLoadError) {
          return (
              <View style={styles.centeredMessage}>
                  <Text style={styles.errorText}>{initialLoadError}</Text>
                  {/* Optionally add a retry button here if the parent error can be retried */}
              </View>
          );
     }

    // If a checkpoint is selected, render the details component
    if (selectedCheckpointId !== null && selectedCheckpointDetails !== null) {
        return (
            <ReadalongCheckpointDetails
                readalong={readalong!} // Pass readalong (asserting it's not null here)
                currentUser={currentUser}
                isMember={isMember}
                isHost={isHost}
                checkpointId={selectedCheckpointId}
                onBack={handleBackToList} // Pass the back handler
                // requests={requests} // Pass requests if needed
            />
        );
    }

    // If no checkpoint is selected and user is a member, render the list
    if (isMember) {
        return (
            <View style={styles.container}>
                {/* Optional: Display error message for list fetch */}
                {error && <Text style={styles.errorText}>{error}</Text>}

                <FlatList
                    data={checkpoints}
                    renderItem={renderCheckpointItem}
                    keyExtractor={(item) => item.checkpoint_id}
                    onEndReached={handleLoadMoreCheckpoints}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={styles.flatListContent}
                />
            </View>
        );
    }

    // If user is not a member and no checkpoint is selected, show not member message
    return (
        <View style={styles.centeredMessage}>
            <Text style={styles.notMemberText}>You must be a member to view checkpoints.</Text>
        </View>
    );
};


// --- Styles (Combined or separate, adjust as needed) ---
const styles = StyleSheet.create({
     container: {
         flex: 1,
         padding: 16,
         backgroundColor: '#1a202c', // Example background
     },
      flatListContent: {
          paddingBottom: 16, // Add some space at the bottom
      },
     checkpointItem: {
         flexDirection: 'row',
         marginBottom: 20,
     },
     timelinePoint: {
         width: 10,
         height: 10,
         borderRadius: 5,
         backgroundColor: '#ff7e1f', // Example primary orange
         marginTop: 6,
         marginRight: 10,
     },
     checkpointContent: {
         flex: 1,
         paddingLeft: 10,
         borderLeftWidth: 1,
         borderLeftColor: '#4a5568', // Example secondary light grey
         position: 'relative',
     },
     checkpointDate: {
         fontSize: 12,
         color: '#a0aec0',
         marginBottom: 4,
     },
     checkpointPrompt: {
         fontSize: 16,
         fontWeight: 'bold',
         color: '#ffffff',
         marginBottom: 4,
     },
     checkpointPage: {
         fontSize: 14,
         color: '#a0aec0',
     },
      checkpointEllipsis: {
          position: 'absolute',
          top: 0,
          right: 0,
          padding: 8,
          zIndex: 1,
      },
      updateMenu: {
          position: 'absolute',
          top: 20,
          right: 0,
          backgroundColor: '#4a5568', // Example background
          borderRadius: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 4,
          zIndex: 10,
      },
      updateMenuItem: {
          padding: 10,
      },
      updateMenuItemText: {
          color: '#ffffff',
          fontSize: 14,
      },
    loadingFooter: {
        padding: 10,
        alignItems: 'center',
    },
     loadingText: {
         marginTop: 8,
         color: '#a0aec0',
     },
    emptyList: {
        padding: 20,
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

     // --- Styles for Details View (can be kept separate or merged) ---
     detailsContainer: {
        flex: 1,
        backgroundColor: '#1a202c', // Example background
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
    sortButton: { // Styles for your custom sort button/modal trigger
        padding: 8, // Increase touch area
    },
     commentContainer: {
         flexDirection: 'row',
         marginBottom: 16,
         backgroundColor: '#2d3748', // Example background
         borderRadius: 8,
         padding: 12,
         position: 'relative', // For ellipsis menu positioning
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
      deleteMenu: { // Menu for deleting comments
          position: 'absolute',
          top: 28, // Adjust position
          right: 8,
          backgroundColor: '#4a5568', // Example background
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
          // Placeholder blur effect - see comment in Details component
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
        marginTop: 'auto', // Push to bottom
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
     postButtonText: {
         color: '#ffffff',
         fontSize: 14,
         fontWeight: 'bold',
     },
     notMemberContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
      }
});


export default ReadalongCheckpoints;