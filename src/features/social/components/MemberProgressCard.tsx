import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

interface MemberDetails {
  userId: string;
  name: string;
  bookPages: number;
  bookId: string;
}

interface Props {
  memberDetails: MemberDetails;
}

const MemberProgressCard: React.FC<Props> = ({ memberDetails }) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [readingStatus, setReadingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0]?.accessToken;

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const response = await instance.post(
          requests.fetchReadingStatus,
          { bookId: memberDetails.bookId, userId: memberDetails.userId },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setCurrentPage(response.data.currentPage || 0);
        setReadingStatus(response.data.status);
      } catch (error) {
        console.error('Error fetching member progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [memberDetails.bookId, memberDetails.userId]);

  const progress = memberDetails.bookPages > 0 ? (currentPage / memberDetails.bookPages) * 100 : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{memberDetails.name}</Text>
      {loading ? (
        <Text style={styles.progressText}>Loading progress...</Text>
      ) : (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressInner, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentPage}/{memberDetails.bookPages} pages ({progress.toFixed(0)}%)
          </Text>
          {readingStatus && <Text style={styles.statusText}>Status: {readingStatus}</Text>}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_8,
    width: '48%',
  },
  name: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_4,
    overflow: 'hidden',
    marginBottom: SPACING.space_4,
  },
  progressInner: {
    height: '100%',
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_4,
  },
  progressText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  statusText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
    marginTop: SPACING.space_4,
  },
});

export default MemberProgressCard;