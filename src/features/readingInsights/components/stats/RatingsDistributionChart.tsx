import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';

interface RatingsDistributionChartProps {
  timeFrame: string;
}

interface RatingBucket {
  rating: number; // 1–5 (rounded)
  count: number;
}

function timeFrameToFrom(timeFrame: string): string | undefined {
  const now = new Date();
  if (timeFrame === 'last-week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }
  if (timeFrame === 'last-month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }
  return undefined;
}

// Ensure all 5 star buckets always exist so the bar chart never looks sparse
function normaliseBuckets(raw: RatingBucket[]): RatingBucket[] {
  const map = new Map(raw.map(r => [r.rating, r.count]));
  return [1, 2, 3, 4, 5].map(star => ({ rating: star, count: map.get(star) ?? 0 }));
}

const RatingsDistributionChart: React.FC<RatingsDistributionChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const userDetails = useStore((state) => state.userDetails);

  const [buckets, setBuckets]         = useState<RatingBucket[]>([]);
  const [avgRating, setAvgRating]     = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const from = timeFrameToFrom(timeFrame);
        const params = new URLSearchParams({ timezone: userTimezone });
        if (from) params.set('from', from);

        const response = await instance.get(
          `${requests.fetchRatingStats}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${userDetails[0].accessToken}` } },
        );

        const raw: RatingBucket[]  = response.data?.data?.buckets      ?? [];
        const avg: number | null   = response.data?.data?.averageRating ?? null;

        setBuckets(normaliseBuckets(raw));
        setAvgRating(avg);
      } catch (e) {
        console.error('Failed to fetch rating stats:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  const total = buckets.reduce((s, b) => s + b.count, 0);
  const hasData = total > 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error || !hasData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          {error ? 'Failed to load data.' : 'No ratings yet.'}
        </Text>
      </View>
    );
  }

  const displayAvg  = avgRating !== null ? avgRating.toFixed(1) : '—';
  const filledStars = avgRating !== null ? Math.round(avgRating) : 0;

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Ratings Distribution</Text>

      <View style={styles.summaryRow}>
        {/* Average rating summary */}
        <View style={styles.avgBox}>
          <Text style={styles.avgValue}>{displayAvg}</Text>
          <Text style={styles.avgLabel}>Avg Rating</Text>
          <Text style={styles.avgStars}>{'★'.repeat(filledStars)}</Text>
        </View>

        {/* Per-star horizontal bars, highest first */}
        <View style={styles.barsContainer}>
          {[...buckets].reverse().map(b => {
            const pct = (b.count / total) * 100;
            return (
              <View key={b.rating} style={styles.ratingRow}>
                <Text style={styles.starLabel}>{b.rating}★</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.countLabel}>{b.count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default RatingsDistributionChart;

const createStyles = (COLORS: any) => StyleSheet.create({
  statContainer: {
    backgroundColor: 'transparent',
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_8,
  },
  centered: {
    paddingVertical: SPACING.space_36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_16,
    gap: SPACING.space_16,
    alignItems: 'center',
  },
  avgBox: {
    alignItems: 'center',
    width: 72,
  },
  avgValue: {
    fontSize: FONTSIZE.size_30,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
    lineHeight: 38,
  },
  avgLabel: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  avgStars: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    marginTop: 2,
  },
  barsContainer: {
    flex: 1,
    gap: SPACING.space_8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  starLabel: {
    width: 20,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    textAlign: 'right',
  },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: 5,
  },
  countLabel: {
    width: 24,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    textAlign: 'right',
  },
});