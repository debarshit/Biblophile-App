import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';

interface PublicationYearChartProps {
  timeFrame: string;
}

interface ScatterPoint {
  publicationYear: number;
  readYear: number;
  count: number;
}

interface DecadeBucket {
  decade: string;
  count: number;
  startYear: number;
}

// Map a publication year → decade label
function getDecadeLabel(year: number): string {
  if (year < 1950) return 'Pre-1950';
  const decadeStart = Math.floor(year / 10) * 10;
  return `${decadeStart}s`;
}

// Collapse scatter points into decade buckets, sorted chronologically
function buildDecadeBuckets(points: ScatterPoint[]): DecadeBucket[] {
  const map = new Map<string, DecadeBucket>();

  for (const p of points) {
    const label = getDecadeLabel(p.publicationYear);
    const startYear = label === 'Pre-1950' ? 0 : parseInt(label, 10);
    const existing = map.get(label);
    if (existing) {
      existing.count += p.count;
    } else {
      map.set(label, { decade: label, count: p.count, startYear });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.startYear - b.startYear);
}

const PublicationYearChart: React.FC<PublicationYearChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;

  const userDetails = useStore((state) => state.userDetails);

  const [points, setPoints] = useState<ScatterPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Map timeFrame → from/to date strings
        const now = new Date();
        let from: string | undefined;
        if (timeFrame === 'last-week') {
          const d = new Date(now);
          d.setDate(d.getDate() - 7);
          from = d.toISOString().split('T')[0];
        } else if (timeFrame === 'last-month') {
          const d = new Date(now);
          d.setMonth(d.getMonth() - 1);
          from = d.toISOString().split('T')[0];
        }
        // 'all-time' → no from param

        const params = new URLSearchParams({ timezone: userTimezone });
        if (from) params.set('from', from);

        const response = await instance.get(
          `${requests.fetchPublicationVsReadStats}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${userDetails[0].accessToken}` } },
        );

        const raw: ScatterPoint[] = response.data?.data?.points ?? [];
        setPoints(raw);
        console.log(response.data.data);
      } catch (e) {
        console.error('Failed to fetch publication vs read stats:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  const buckets = useMemo(() => buildDecadeBuckets(points), [points]);

  // Quick stats derived from raw scatter points
  const { oldest, newest, avgYear } = useMemo(() => {
    if (!points.length) return { oldest: '—', newest: '—', avgYear: '—' };
    const years = points.map(p => p.publicationYear);
    const total = points.reduce((sum, p) => sum + p.publicationYear * p.count, 0);
    const totalCount = points.reduce((sum, p) => sum + p.count, 0);
    return {
      oldest:  Math.min(...years).toString(),
      newest:  Math.max(...years).toString(),
      avgYear: totalCount ? Math.round(total / totalCount).toString() : '—',
    };
  }, [points]);

  const chartData = useMemo(() => ({
    labels:   buckets.map(b => b.decade),
    datasets: [{ data: buckets.map(b => b.count) }],
  }), [buckets]);

  const chartWidth = Math.max(
    screenWidth - SPACING.space_16 * 4,
    buckets.length * 64,
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error || !points.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          {error ? 'Failed to load data.' : 'No publication data yet.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Publication Era</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{oldest}</Text>
          <Text style={styles.statLabel}>Oldest Read</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, styles.avgValue]}>{avgYear}</Text>
          <Text style={[styles.statLabel, styles.avgLabel]}>Avg Year</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{newest}</Text>
          <Text style={styles.statLabel}>Newest Read</Text>
        </View>
      </View>

      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={chartData}
            width={chartWidth}
            height={230}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: COLORS.primaryDarkGreyHex,
              backgroundGradientTo: COLORS.primaryDarkGreyHex,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 188, 66, ${opacity})`,
              labelColor: () => COLORS.primaryWhiteHex,
              barPercentage: 0.65,
            }}
            style={{ borderRadius: BORDERRADIUS.radius_8 }}
            showValuesOnTopOfBars
            fromZero
            verticalLabelRotation={20}
          />
        </ScrollView>
        <Text style={styles.chartCaption}>Books read, grouped by publication decade</Text>
      </View>
    </View>
  );
};

export default PublicationYearChart;

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
    marginBottom: SPACING.space_12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_12,
    gap: SPACING.space_8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    color: '#FFBC42',
  },
  avgValue: {
    color: COLORS.primaryOrangeHex,
  },
  statLabel: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  avgLabel: {
    color: COLORS.primaryOrangeHex,
  },
  card: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    alignItems: 'center',
  },
  chartCaption: {
    marginTop: SPACING.space_8,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
});