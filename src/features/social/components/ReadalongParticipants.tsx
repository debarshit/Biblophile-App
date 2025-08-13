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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

interface Participant {
  userId: number;
  name: string;
  userName: string;
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  status: string;
  rating: number | null;
  isCurrentUser: boolean;
}

interface Statistics {
  books_completed_percentage: number;
  avg_progress_percentage: number;
  avg_rating: number;
  total_members: number;
}

interface ParticipantsData {
  statistics: Statistics;
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
  readalongId: number;
}

const ReadalongParticipants: React.FC<Props> = ({ readalongId }) => {
  const [participantsData, setParticipantsData] = useState<ParticipantsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

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
    fetchParticipants(1);
  }, [fetchParticipants]);

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
        return COLORS.primaryGreenHex || '#4CAF50';
      case 'Currently reading':
        return COLORS.primaryOrangeHex;
      case 'Paused':
        return COLORS.primaryYellowHex || '#FFC107';
      case 'Did not finish':
        return COLORS.primaryRedHex;
      default:
        return COLORS.primaryLightGreyHex;
    }
  };

  const renderStatisticsCard = () => {
    if (!participantsData?.statistics) return null;

    const { books_completed_percentage, avg_progress_percentage, avg_rating, total_members } = participantsData.statistics;

    return (
      <View style={styles.statisticsContainer}>
        <Text style={styles.sectionTitle}>Reading Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{books_completed_percentage}%</Text>
            <Text style={styles.statLabel}>Books Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{avg_progress_percentage}%</Text>
            <Text style={styles.statLabel}>Avg Progress</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.ratingContainer}>
              <Text style={styles.statNumber}>{avg_rating || 'N/A'}</Text>
              {avg_rating > 0 && <FontAwesome name="star" size={16} color={COLORS.primaryOrangeHex} />}
            </View>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{total_members}</Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>
        </View>
      </View>
    );
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
              {item.currentPage} / {item.totalPages} pages ({item.progressPercentage}%)
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

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
        <Text style={styles.loadingText}>Loading participants...</Text>
      </View>
    );
  }

  if (error && !participantsData) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-triangle" size={48} color={COLORS.primaryRedHex} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchParticipants(1)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={participantsData?.members.data || []}
        keyExtractor={(item) => item.userId.toString()}
        renderItem={renderParticipant}
        ListHeaderComponent={renderStatisticsCard}
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  listContainer: {
    paddingHorizontal: SPACING.space_15,
    paddingBottom: SPACING.space_20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
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
    backgroundColor: COLORS.primaryBlackHex,
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
  statisticsContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_15,
    marginBottom: SPACING.space_20,
  },
  sectionTitle: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginBottom: SPACING.space_15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.primaryBlackHex,
    padding: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_10,
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
  },
  statLabel: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    textAlign: 'center',
    marginTop: SPACING.space_4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_4,
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

export default ReadalongParticipants;