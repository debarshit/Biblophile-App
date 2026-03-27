import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';

interface FormatBreakdownChartProps {
  timeFrame: string;
}

interface FormatItem {
  format: string;
  count: number;
  color: string;
  icon: string;
}

const FORMAT_META: Record<string, { color: string; icon: string }> = {
  paperback:  { color: '#FF7E5F', icon: '📖' },
  ebook:      { color: '#42D1D1', icon: '📱' },
  hardcover:  { color: '#FFBC42', icon: '📕' },
  audiobook:  { color: '#9C4DD4', icon: '🎧' },
};

const FORMAT_LABELS: Record<string, string> = {
  paperback:  'Paperback',
  ebook:      'Ebook',
  hardcover:  'Hardcover',
  audiobook:  'Audiobook',
};

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

const FormatBreakdownChart: React.FC<FormatBreakdownChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;
  const userDetails = useStore((state) => state.userDetails);

  const [formats, setFormats] = useState<FormatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

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
          `${requests.fetchFormatStats}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${userDetails[0].accessToken}` } },
        );

        const raw: { format: string; count: number }[] = response.data?.data?.items ?? [];
        const mapped: FormatItem[] = raw
          .filter(r => r.count > 0)
          .map(r => ({
            format: FORMAT_LABELS[r.format] ?? r.format,
            count:  r.count,
            color:  FORMAT_META[r.format]?.color ?? '#888888',
            icon:   FORMAT_META[r.format]?.icon  ?? '📚',
          }));
        setFormats(mapped);
      } catch (e) {
        console.error('Failed to fetch format stats:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  const total = formats.reduce((s, f) => s + f.count, 0);

  const pieData = formats.map(f => ({
    name:            f.format,
    population:      f.count,
    color:           f.color,
    legendFontColor: COLORS.primaryWhiteHex,
    legendFontSize:  13,
  }));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error || formats.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          {error ? 'Failed to load data.' : 'No format data yet.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Format Breakdown</Text>
      <View style={styles.card}>
        <PieChart
          data={pieData}
          width={screenWidth - SPACING.space_16 * 4}
          height={180}
          chartConfig={{ color: () => COLORS.primaryOrangeHex }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[50, 0]}
          hasLegend={false}
          absolute
        />
        <View style={styles.legendGrid}>
          {formats.map((f, i) => {
            const pct = Math.round((f.count / total) * 100);
            return (
              <View key={i} style={[styles.legendItem, { borderLeftColor: f.color }]}>
                <Text style={styles.legendIcon}>{f.icon}</Text>
                <Text style={styles.legendFormat}>{f.format}</Text>
                <Text style={styles.legendPct}>{pct}%</Text>
                <Text style={styles.legendCount}>{f.count} books</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default FormatBreakdownChart;

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
  card: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_16,
    alignItems: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_12,
    marginTop: SPACING.space_12,
    width: '100%',
  },
  legendItem: {
    width: '45%',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    borderLeftWidth: 3,
  },
  legendIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  legendFormat: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  legendPct: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    lineHeight: 26,
  },
  legendCount: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
  },
});