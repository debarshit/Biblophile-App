import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';

interface BooksReadChartProps {
  timeFrame: string;
}

interface ChartPoint {
  label: string;
  count: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildLastWeekSkeleton(): { iso: string; label: string }[] {
  const result = [];
  const today  = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push({
      iso:   d.toISOString().split('T')[0],
      label: DAY_LABELS[d.getDay()],
    });
  }
  return result;
}

function buildLastMonthSkeleton(): { iso: string; label: string }[] {
  const result = [];
  const today  = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push({
      iso:   d.toISOString().split('T')[0],
      label: `${d.getDate()}`,  // day-of-month number
    });
  }
  return result;
}

// ── component ────────────────────────────────────────────────────────────────

const BooksReadChart: React.FC<BooksReadChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;
  const userDetails = useStore((state) => state.userDetails);

  const [points, setPoints]   = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const authHeader   = { Authorization: `Bearer ${userDetails[0].accessToken}` };

        if (timeFrame === 'last-week' || timeFrame === 'last-month') {
          // Build skeleton so every day has a 0-count slot
          const skeleton = timeFrame === 'last-week'
            ? buildLastWeekSkeleton()
            : buildLastMonthSkeleton();

          const from = skeleton[0].iso;
          const to   = skeleton[skeleton.length - 1].iso;
          const params = new URLSearchParams({ timezone: userTimezone, from, to, status: 'Read' });

          // fetchBooksFinishedByDay returns [{ date: 'yyyy-MM-dd', count: number }]
          const response = await instance.get(
            `${requests.fetchBooksFinishedByDay}?${params.toString()}`,
            { headers: authHeader },
          );

          const raw: { date: string; count: number }[] = response.data?.data ?? [];
          const countMap = new Map(raw.map(r => [r.date, r.count]));

          setPoints(skeleton.map(s => ({ label: s.label, count: countMap.get(s.iso) ?? 0 })));

        } else {
          // all-time → booksPerMonth for current year from overview
          const params = new URLSearchParams({ timezone: userTimezone });
          const response = await instance.get(
            `${requests.fetchReadingOverview}?${params.toString()}`,
            { headers: authHeader },
          );

          const monthly: { month: number; count: number }[] = response.data?.data?.booksPerMonth ?? [];
          setPoints(monthly.map(m => ({ label: MONTH_LABELS[m.month - 1], count: m.count })));
        }
      } catch (e) {
        console.error('Failed to fetch books finished data:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  const total    = points.reduce((s, p) => s + p.count, 0);
  const avgLabel = timeFrame === 'last-week' ? 'day' : 'month';
  const avg      = points.length > 0
    ? Math.round((total / points.length) * 10) / 10
    : 0;

  // Scale chart width so bars don't get too wide or too narrow
  const BAR_WIDTH   = 44;
  const chartWidth  = Math.max(
    screenWidth - SPACING.space_16 * 4,
    points.length * BAR_WIDTH,
  );

  const chartData = {
    labels:   points.map(p => p.label),
    datasets: [{ data: points.length > 0 ? points.map(p => p.count) : [0] }],
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Failed to load data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Books Finished</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{avg}</Text>
          <Text style={styles.summaryLabel}>Avg / {avgLabel}</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={chartData}
            width={chartWidth}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: COLORS.primaryDarkGreyHex,
              backgroundGradientTo: COLORS.primaryDarkGreyHex,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 126, 95, ${opacity})`,
              labelColor: () => COLORS.primaryWhiteHex,
              barPercentage: 0.6,
              style: { borderRadius: BORDERRADIUS.radius_8 },
            }}
            style={{ borderRadius: BORDERRADIUS.radius_8 }}
            showValuesOnTopOfBars
            fromZero
          />
        </ScrollView>
      </View>
    </View>
  );
};

export default BooksReadChart;

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
    marginBottom: SPACING.space_8,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.space_16,
    marginBottom: SPACING.space_8,
  },
  summaryBox: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_20,
    alignItems: 'center',
    minWidth: 100,
  },
  summaryValue: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
  },
  summaryLabel: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
  },
  chartCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    marginVertical: SPACING.space_8,
  },
});