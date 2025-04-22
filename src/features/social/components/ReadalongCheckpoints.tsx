import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Feather } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import ReadalongCheckpointDetails from './ReadalongCheckpointDetails'; // Adjust path
import { useNavigation } from '@react-navigation/native';
import { BORDERRADIUS, COLORS, FONTSIZE, SPACING } from '../../../theme/theme';

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
    readalong?: Readalong;
    currentUser: CurrentUser;
    isMember: boolean;
    isHost: boolean;
    initialLoadError?: string;
}

const checkpointsLimit = 10;

const ReadalongCheckpoints: React.FC<ReadalongCheckpointsProps> = ({
    readalong,
    currentUser,
    isMember,
    isHost,
    initialLoadError,
}) => {
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCheckpointForUpdation, setSelectedCheckpointForUpdation] = useState<string | null>(null);
    const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
    const [selectedCheckpointDetails, setSelectedCheckpointDetails] = useState<Checkpoint | null>(null);

    const navigation = useNavigation<any>();

    const fetchCheckpoints = useCallback(async () => {
        if (loading || !hasMore || !readalong?.readalong_id || selectedCheckpointId !== null) {
             if (!readalong?.readalong_id) console.warn("Readalong ID is missing, cannot fetch checkpoints.");
             if(selectedCheckpointId !== null) console.log("Checkpoint details view is open, skipping list fetch.");
             return;
        }

        setLoading(true);
        try {
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
                const prevCheckpointIds = new Set(prevCheckpoints.map(checkpoint => checkpoint.checkpoint_id));
                const uniqueCheckpoints = fetchedCheckpoints.filter(checkpoint => !prevCheckpointIds.has(checkpoint.checkpoint_id));
                return [...prevCheckpoints, ...uniqueCheckpoints];
            });

        } catch (error) {
            setError("Error fetching checkpoints.");
            console.error("Fetch checkpoints list error:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [offset, currentUser.userId, readalong?.readalong_id, loading, hasMore, selectedCheckpointId]);

    useEffect(() => {
         // Only fetch if readalong ID is available and no checkpoint is currently selected for details
         if (readalong?.readalong_id && selectedCheckpointId === null) {
            fetchCheckpoints();
         }
    }, [offset, readalong?.readalong_id, selectedCheckpointId, fetchCheckpoints]);

    const handleLoadMoreCheckpoints = () => {
        if (!loading && hasMore && selectedCheckpointId === null) {
            setOffset(prevOffset => prevOffset + checkpointsLimit);
        }
    };

    const handleViewCheckpointDetails = (checkpoint: Checkpoint) => {
        setSelectedCheckpointId(checkpoint.checkpoint_id);
        setSelectedCheckpointDetails(checkpoint);
        setSelectedCheckpointForUpdation(null);
    };

    const handleBackToList = () => {
        setSelectedCheckpointId(null);
        setSelectedCheckpointDetails(null);
        // Optionally refetch the list if you think data might have changed (e.g., comments added)
        // setOffset(0);
        // setHasMore(true);
        // setCheckpoints([]);
        // fetchCheckpoints(); // This will be triggered by the useEffect when selectedCheckpointId becomes null and offset is reset
    };

    const handleEllipsisClick = (checkpointId: string) => {
        setSelectedCheckpointForUpdation(selectedCheckpointForUpdation === checkpointId ? null : checkpointId);
    };

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

    const renderCheckpointItem = ({ item }: { item: Checkpoint }) => {
         const isSelected = item.checkpoint_id === selectedCheckpointForUpdation;

        return (
            <Pressable
                 key={item.checkpoint_id}
                 style={styles.checkpointItem}
                 onPress={() => handleViewCheckpointDetails(item)}
            >
                 <View style={styles.timelinePoint} />
                 <View style={styles.checkpointContent}>
                     {isHost && (
                         <Pressable
                             style={styles.checkpointEllipsis}
                             onPress={() => handleEllipsisClick(item.checkpoint_id)}
                         >
                             <Feather name="more-vertical" size={20} color="#a0aec0" />
                         </Pressable>
                     )}

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

    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
                <Text style={styles.loadingText}>Loading more checkpoints...</Text>
            </View>
        );
    };

    const renderEmpty = () => {
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

    if (selectedCheckpointId !== null && selectedCheckpointDetails !== null) {
        return (
            <ReadalongCheckpointDetails
                readalong={readalong!}
                currentUser={currentUser}
                isMember={isMember}
                isHost={isHost}
                checkpointId={selectedCheckpointId}
                onBack={handleBackToList}
            />
        );
    }

    if (isMember) {
        return (
            <View style={styles.container}>
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

    return (
        <View style={styles.centeredMessage}>
            <Text style={styles.notMemberText}>You must be a member to view checkpoints.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.space_16,
        backgroundColor: COLORS.primaryDarkGreyHex,
    },
    flatListContent: {
        paddingBottom: SPACING.space_16,
    },
    checkpointItem: {
        flexDirection: 'row',
        marginBottom: SPACING.space_20,
    },
    timelinePoint: {
        width: 10,
        height: 10,
        borderRadius: BORDERRADIUS.radius_4,
        backgroundColor: COLORS.primaryOrangeHex,
        marginTop: SPACING.space_4,
        marginRight: SPACING.space_10,
    },
    checkpointContent: {
        flex: 1,
        paddingLeft: SPACING.space_10,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.secondaryLightGreyHex,
        position: 'relative',
    },
    checkpointDate: {
        fontSize: FONTSIZE.size_12,
        color: COLORS.secondaryLightGreyHex,
        marginBottom: SPACING.space_4,
    },
    checkpointPrompt: {
        fontSize: FONTSIZE.size_16,
        fontWeight: 'bold',
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_4,
    },
    checkpointPage: {
        fontSize: FONTSIZE.size_14,
        color: COLORS.secondaryLightGreyHex,
    },
    checkpointEllipsis: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: SPACING.space_8,
        zIndex: 1,
    },
    updateMenu: {
        position: 'absolute',
        top: SPACING.space_20,
        right: 0,
        backgroundColor: COLORS.primaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_4,
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
        zIndex: 10,
    },
    updateMenuItem: {
        padding: SPACING.space_10,
    },
    updateMenuItemText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
    },
    loadingFooter: {
        padding: SPACING.space_10,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.space_8,
        color: COLORS.secondaryLightGreyHex,
    },
    emptyList: {
        padding: SPACING.space_20,
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
    color: COLORS.primaryRedHex,
    textAlign: 'center',
    fontSize: FONTSIZE.size_16,
    marginBottom: SPACING.space_10,
    },
    notMemberText: {
        color: COLORS.secondaryLightGreyHex,
        textAlign: 'center',
        fontSize: FONTSIZE.size_16,
    },
});


export default ReadalongCheckpoints;