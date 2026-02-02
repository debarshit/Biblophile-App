import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Participant {
  userId: number;
  name: string;
  userName: string;
  progressPercentage: number;
  status: string;
  rating: number | null;
  isCurrentUser: boolean;
}

interface ParticipantsData {
  statistics: any;
  members: {
    data: Participant[];
    pagination: {
      currentPage: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  readalongId: number;
  accessToken: string;
}

const ReadalongMembersList: React.FC<Props> = ({ visible, onClose, readalongId, accessToken }) => {
  const [participantsData, setParticipantsData] = useState<ParticipantsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchParticipants = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    if (!accessToken) return;

    if (isRefresh) {
      setRefreshing(true);
      setCurrentPage(1);
    } else if (page > 1) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await instance.get(
        `${requests.fetchReadalongParticipants(readalongId)}?page=${page}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const newData = response.data.data;

      if (isRefresh || page === 1) {
        setParticipantsData(newData);
        setCurrentPage(1);
      } else {
        // Append new members to existing data
        setParticipantsData(prev => {
          if (!prev) return newData;
          return {
            ...newData,
            members: {
              ...newData.members,
              data: [...prev.members.data, ...newData.members.data]
            }
          };
        });
      }

      setCurrentPage(page);
    } catch (err: any) {
      setError('Failed to fetch participants');
      console.error('Error fetching participants:', err);
      Alert.alert('Error', 'Failed to load participants data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [readalongId, accessToken]);

  useEffect(() => {
    if (visible && !participantsData) {
      fetchParticipants(1);
    }
  }, [visible, fetchParticipants, participantsData]);

  const onRefresh = useCallback(() => {
    fetchParticipants(1, true);
  }, [fetchParticipants]);

  const loadMoreParticipants = useCallback(() => {
    if (participantsData?.members.pagination.hasNextPage && !loadingMore) {
      fetchParticipants(currentPage + 1);
    }
  }, [participantsData, currentPage, loadingMore, fetchParticipants]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Read':
        return '#4CAF50';
      case 'Currently reading':
        return COLORS.primaryOrangeHex;
      case 'Paused':
        return '#FFC107';
      case 'Did not finish':
        return COLORS.primaryRedHex;
      default:
        return COLORS.primaryLightGreyHex;
    }
  };

  const renderParticipant = ({ item }: { item: Participant }) => {
    const progressWidth = Math.max(item.progressPercentage, 5); // Minimum width for visibility

    return (
      <View style={[styles.participantCard, item.isCurrentUser && styles.currentUserCard]}>
        <View style={styles.participantHeader}>
          <View style={styles.participantInfo}>
            <Text style={[styles.participantName, item.isCurrentUser && styles.currentUserName]}>
              {item.name} {item.isCurrentUser && '(You)'}
            </Text>
            <Text style={styles.participantUsername}>@{item.userName}</Text>
          </View>
          <View style={styles.participantMeta}>
            {item.rating && (
              <View style={styles.ratingBadge}>
                <FontAwesome name="star" size={12} color={COLORS.primaryOrangeHex} />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              ({item.progressPercentage}%)
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${progressWidth}%`,
                  backgroundColor: item.isCurrentUser ? COLORS.primaryOrangeHex : COLORS.secondaryLightGreyHex 
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
        <Text style={styles.loadingText}>Loading more participants...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="users" size={48} color={COLORS.primaryLightGreyHex} />
      <Text style={styles.emptyText}>No participants found</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.modalHeader}>
      <View style={styles.headerLeft}>
        <Text style={styles.modalTitle}>All Members</Text>
        {participantsData?.members.pagination && (
          <Text style={styles.memberCount}>
            {participantsData.members.pagination.totalItems} members
          </Text>
        )}
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <FontAwesome name="times" size={20} color={COLORS.primaryLightGreyHex} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {renderHeader()}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
            <Text style={styles.loadingText}>Loading participants...</Text>
          </View>
        ) : error && !participantsData ? (
          <View style={styles.errorContainer}>
            <FontAwesome name="exclamation-triangle" size={48} color={COLORS.primaryRedHex} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchParticipants(1)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={participantsData?.members.data || []}
            keyExtractor={(item) => item.userId.toString()}
            renderItem={renderParticipant}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            onEndReached={loadMoreParticipants}
            onEndReachedThreshold={0.1}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primaryOrangeHex]}
                tintColor={COLORS.primaryOrangeHex}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            style={styles.listStyle}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryDarkGreyHex,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  memberCount: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    marginTop: SPACING.space_2,
  },
  closeButton: {
    padding: SPACING.space_8,
  },
  listStyle: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: SPACING.space_15,
    paddingBottom: SPACING.space_20,
    paddingTop: SPACING.space_10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    marginTop: SPACING.space_10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  errorText: {
    color: COLORS.primaryRedHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    textAlign: 'center',
    marginTop: SPACING.space_15,
    marginBottom: SPACING.space_20,
  },
  retryButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_24,
    borderRadius: BORDERRADIUS.radius_10,
  },
  retryButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  emptyText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    textAlign: 'center',
    marginTop: SPACING.space_15,
  },
  participantCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_10,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: COLORS.primaryOrangeHex,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_10,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  currentUserName: {
    color: COLORS.primaryOrangeHex,
  },
  participantUsername: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    marginTop: SPACING.space_2,
  },
  participantMeta: {
    alignItems: 'flex-end',
    gap: SPACING.space_8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
    gap: SPACING.space_4,
  },
  ratingText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  statusBadge: {
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
  },
  statusText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_medium,
    textAlign: 'center',
  },
  progressSection: {
    gap: SPACING.space_8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDERRADIUS.radius_4,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.space_20,
    gap: SPACING.space_10,
  },
});

export default ReadalongMembersList;