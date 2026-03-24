import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';

interface GenreBreakdownChartProps {
  timeFrame: string;
}

interface GenreItem {
  genreId: number;
  genreName: string;
  count: number;
}

const CHART_COLORS = ['#FF7E5F', '#42D1D1', '#FFBC42', '#9C4DD4', '#45B69C', '#F06292', '#64B5F6', '#FFD54F'];

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

const GenreBreakdownChart: React.FC<GenreBreakdownChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;
  const userDetails = useStore((state) => state.userDetails);

  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'bar' | 'pie'>('bar');

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
          `${requests.fetchGenreStats}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${userDetails[0].accessToken}` } },
        );

        const raw: GenreItem[] = response.data?.data?.items ?? [];
        setGenres(raw.filter(g => g.count > 0));
      } catch (e) {
        console.error('Failed to fetch genre stats:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  const total = genres.reduce((s, g) => s + g.count, 0);

  // Bar chart truncates long genre names
  const barData = useMemo(() => ({
    labels:   genres.map(g => g.genreName.length > 8 ? g.genreName.slice(0, 8) + '…' : g.genreName),
    datasets: [{ data: genres.map(g => g.count) }],
  }), [genres]);

  const pieData = useMemo(() =>
    genres.map((g, i) => ({
      name: g.genreName,
      population: g.count,
      color: CHART_COLORS[i % CHART_COLORS.length],
      legendFontColor: COLORS.primaryWhiteHex,
      legendFontSize: 13,
    })),
  [genres, COLORS]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error || genres.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          {error ? 'Failed to load data.' : 'No genre data yet.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Genre Breakdown</Text>

      <View style={styles.toggle}>
        {(['bar', 'pie'] as const).map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.toggleBtn, view === v && styles.toggleBtnActive]}
            onPress={() => setView(v)}
          >
            <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
              {v === 'bar' ? 'Bar' : 'Pie'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.chartCard}>
        {view === 'bar' ? (
          <BarChart
            data={barData}
            width={screenWidth - SPACING.space_16 * 4}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: COLORS.primaryDarkGreyHex,
              backgroundGradientTo: COLORS.primaryDarkGreyHex,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(66, 209, 209, ${opacity})`,
              labelColor: () => COLORS.primaryWhiteHex,
              barPercentage: 0.55,
            }}
            style={{ borderRadius: BORDERRADIUS.radius_8 }}
            showValuesOnTopOfBars
            fromZero
            verticalLabelRotation={30}
          />
        ) : (
          <>
            <PieChart
              data={pieData}
              width={screenWidth - SPACING.space_16 * 4}
              height={200}
              chartConfig={{ color: () => COLORS.primaryOrangeHex }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[50, 0]}
              hasLegend={false}
              absolute
            />
            <View style={styles.legendContainer}>
              {pieData.map((item, i) => (
                <View key={genres[i].genreId} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {item.name}
                    <Text style={styles.legendPct}>
                      {' '}— {total > 0 ? Math.round((item.population / total) * 100) : 0}%
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default GenreBreakdownChart;

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
  toggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.space_12,
    gap: SPACING.space_8,
  },
  toggleBtn: {
    paddingVertical: SPACING.space_4,
    paddingHorizontal: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_20,
    borderWidth: 1,
    borderColor: COLORS.secondaryLightGreyHex,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderColor: COLORS.primaryOrangeHex,
  },
  toggleText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  toggleTextActive: {
    color: COLORS.primaryWhiteHex,
  },
  chartCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    marginVertical: SPACING.space_8,
    alignItems: 'center',
  },
  legendContainer: {
    marginTop: SPACING.space_12,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.space_8,
  },
  legendText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    flexShrink: 1,
  },
  legendPct: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
  },
});