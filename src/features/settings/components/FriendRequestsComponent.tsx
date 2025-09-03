import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import Mascot from '../../../components/Mascot';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

interface FriendRequest {
  sender_user_data: { userId: number; userName: string; userProfilePic: string | null; };
  status: string;
}

interface FriendRequestsComponentProps {
  onRequestCountChange?: (count: number) => void;
  initialCount?: number;
}

const ITEMS_PER_PAGE = 10;

const FriendRequestsComponent: React.FC<FriendRequestsComponentProps> = ({ onRequestCountChange, initialCount = 0 }) => {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<number>>(new Set());
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const userDetails = useStore((state: any) => state.userDetails);

  const fetchFriendRequests = async (page: number = 0, isLoadMore: boolean = false) => {
    if (isLoadMore && !hasMoreData) return;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const offset = page * ITEMS_PER_PAGE;
      const response = await instance.get(requests.fetchFriendRequests, {
        headers: { 'Authorization': `Bearer ${userDetails[0].accessToken}` },
        params: {
          limit: ITEMS_PER_PAGE,
          offset: offset
        }
      });

      if (response.status === 200) {
        const incomingRequests = response.data.data?.incomingRequests || [];
        
        if (isLoadMore) {
          // Append new requests to existing ones
          setFriendRequests(prev => [...prev, ...incomingRequests]);
        } else {
          // Replace existing requests (initial load or refresh)
          setFriendRequests(incomingRequests);
        }

        // Check if we have more data
        setHasMoreData(incomingRequests.length === ITEMS_PER_PAGE);
        
        // Update total count only on initial load
        if (!isLoadMore) {
          onRequestCountChange?.(response.data.data?.totalCount || incomingRequests.length);
        }
      }
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
      if (!isLoadMore) {
        Alert.alert('Error', 'Failed to load friend requests. Please try again.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (initialCount === 0) {
      setLoading(false);
      setFriendRequests([]);
      setHasMoreData(false);
      return;
    }
    fetchFriendRequests(0, false);
    setCurrentPage(0);
  }, [initialCount]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMoreData && friendRequests.length > 0) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchFriendRequests(nextPage, true);
    }
  }, [loadingMore, hasMoreData, currentPage, friendRequests.length]);

  const handleRefresh = useCallback(() => {
    setCurrentPage(0);
    setHasMoreData(true);
    fetchFriendRequests(0, false);
  }, []);

  const handleFriendRequestAction = async (senderUserId: number, action: 'confirm' | 'reject') => {
    if (processingRequests.has(senderUserId)) return;

    setProcessingRequests(prev => new Set([...prev, senderUserId]));

    try {
      const response = await instance.post(requests.confirmRejectFriend, 
        { sender_user_id: senderUserId, action }, 
        { headers: { Authorization: `Bearer ${userDetails[0].accessToken}` } }
      );

      if (response.status === 200) {
        setFriendRequests(prev => {
          const updated = prev.filter(req => req.sender_user_data.userId !== senderUserId);
          onRequestCountChange?.(updated.length);
          return updated;
        });
        Alert.alert('Success', action === 'confirm' ? 'Friend request accepted!' : 'Friend request rejected.');
      } else throw new Error('Failed to process request');
    } catch (error) {
      console.error(`Failed to ${action} friend request:`, error);
      Alert.alert('Error', `Failed to ${action} friend request. Please try again.`);
    } finally {
      setProcessingRequests(prev => {
        const updated = new Set(prev);
        updated.delete(senderUserId);
        return updated;
      });
    }
  };

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => {
    const { sender_user_data } = item;
    const isProcessing = processingRequests.has(sender_user_data.userId);

    return (
      <View style={styles.requestCard}>
        <View style={styles.userInfo}>
          <View style={styles.profilePicContainer}>
            {sender_user_data.userProfilePic ? (
              <Image source={{ uri: sender_user_data.userProfilePic }} style={styles.profilePic} />
            ) : (
              <View style={[styles.profilePic, styles.defaultProfilePic]}>
                <Text style={styles.defaultProfilePicText}>
                  {sender_user_data.userName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{sender_user_data.userName}</Text>
            <Text style={styles.requestText}>wants to be friends</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {['reject', 'confirm'].map(action => (
            <TouchableOpacity
              key={action}
              style={[styles.actionButton, action === 'reject' ? styles.rejectButton : styles.acceptButton]}
              onPress={() => handleFriendRequestAction(sender_user_data.userId, action as 'confirm' | 'reject')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
              ) : (
                <Text style={action === 'reject' ? styles.rejectButtonText : styles.acceptButtonText}>
                  {action === 'reject' ? 'Reject' : 'Accept'}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  if (loading && friendRequests.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
        <Text style={styles.loadingText}>Loading friend requests...</Text>
      </View>
    );
  }

  if (friendRequests.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Mascot emotion="sleeping" />
        <Text style={styles.emptyMessage}>No friend requests</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={friendRequests}
        keyExtractor={(item) => item.sender_user_data.userId.toString()}
        renderItem={renderFriendRequest}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        refreshing={loading && friendRequests.length > 0}
        onRefresh={handleRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.space_16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryGreyHex,
    marginTop: SPACING.space_12,
  },
  loadingMoreContainer: {
    paddingVertical: SPACING.space_16,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryGreyHex,
    marginTop: SPACING.space_8,
  },
  emptyContainer: {
    marginTop: SPACING.space_32,
    marginBottom: SPACING.space_36,
  },
  emptyMessage: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    textAlign: 'center',
    color: COLORS.primaryWhiteHex,
  },
  listContainer: {
    paddingTop: SPACING.space_16,
    paddingBottom: SPACING.space_16,
  },
  requestCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_12,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePicContainer: {
    marginRight: SPACING.space_12,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultProfilePic: {
    backgroundColor: COLORS.primaryOrangeHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultProfilePicText: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: 2,
  },
  requestText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryGreyHex,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.space_8,
  },
  actionButton: {
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: SPACING.space_8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  acceptButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  rejectButtonText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryGreyHex,
  },
  acceptButtonText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
});

export default FriendRequestsComponent;