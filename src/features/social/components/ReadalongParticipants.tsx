import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import ReadalongMembersList from './ReadalongMembersList';

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
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

  const fetchStatistics = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await instance.get(
        `${requests.fetchReadalongParticipants(readalongId)}?page=1&limit=1`, // Just fetch first page for statistics
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setParticipantsData(response.data.data);
    } catch (err: any) {
      setError('Failed to fetch reading statistics');
      console.error('Error fetching statistics:', err);
      Alert.alert('Error', 'Failed to load reading statistics');
    } finally {
      setLoading(false);
    }
  }, [readalongId, accessToken]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleViewAllMembers = () => {
    setModalVisible(true);
  };

  const renderStatisticsCard = () => {
    if (!participantsData?.statistics) return null;

    const { books_completed_percentage, avg_progress_percentage, avg_rating, total_members } = participantsData.statistics;

    return (
      <View style={styles.statisticsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Reading Statistics</Text>
          <TouchableOpacity 
            style={styles.viewAllButton} 
            onPress={handleViewAllMembers}
          >
            <Text style={styles.viewAllText}>View Members</Text>
            <FontAwesome name="chevron-right" size={12} color={COLORS.primaryOrangeHex} />
          </TouchableOpacity>
        </View>
        
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
        <Text style={styles.loadingText}>Loading reading statistics...</Text>
      </View>
    );
  }

  if (error && !participantsData) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-triangle" size={48} color={COLORS.primaryRedHex} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStatistics}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderStatisticsCard()}
      
      <ReadalongMembersList
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        readalongId={readalongId}
        accessToken={accessToken}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    paddingHorizontal: SPACING.space_15,
    paddingTop: SPACING.space_20,
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_15,
  },
  sectionTitle: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  viewAllText: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_20,
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
});

export default ReadalongParticipants;