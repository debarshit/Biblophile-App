import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';

interface BookAttributesChartProps {
  timeFrame: string;
}

interface FictionItem {
  name: string;
  count: number;
  color: string;
}

interface LengthBucket {
  label: string;
  count: number;
  color: string;
}

const FICTION_COLORS: Record<string, string> = {
  fiction:     '#FF7E5F',
  'non-fiction': '#42D1D1',
};

const LENGTH_COLORS: Record<string, string> = {
  'short (<150)':    '#FFBC42',
  'medium (150–299)': '#FF7E5F',
  'long (300–499)':  '#42D1D1',
  'very long (500+)': '#9C4DD4',
  'unknown':         '#888888',
};

// Display labels matching the backend's pageLengthBucket() output
const LENGTH_DISPLAY: Record<string, string> = {
  'short (<150)':     'Short\n(<150 pg)',
  'medium (150–299)': 'Medium\n(150–299)',
  'long (300–499)':   'Long\n(300–499)',
  'very long (500+)': 'Epic\n(500+)',
  'unknown':          'Unknown',
};

// Map timeFrame string → from date string (to= is omitted = today)
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
  return undefined; // all-time
}

const BookAttributesChart: React.FC<BookAttributesChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;
  const userDetails = useStore((state) => state.userDetails);

  const [fictionData, setFictionData]   = useState<FictionItem[]>([]);
  const [lengthBuckets, setLengthBuckets] = useState<LengthBucket[]>([]);
  const [avgPages, setAvgPages]         = useState<number | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const from = timeFrameToFrom(timeFrame);
        const params = new URLSearchParams({ timezone: userTimezone });
        if (from) params.set('from', from);
        const authHeader = { Authorization: `Bearer ${userDetails[0].accessToken}` };

        const [filteredRes, lengthRes] = await Promise.all([
          // Fiction/non-fiction split — reuse getFilteredStats with bookType grouping
          // We call it twice: once for fiction, once for non-fiction
          instance.get(`${requests.fetchFilteredStats}?${params.toString()}`, { headers: authHeader }),
          instance.get(`${requests.fetchLengthStats}?${params.toString()}`, { headers: authHeader }),
        ]);

        // --- Fiction vs Non-Fiction ---
        // fetchFilteredStats returns booksCount for the whole slice.
        // We need two calls: one filtered to fiction, one to non-fiction.
        const [fictionRes, nonFictionRes] = await Promise.all([
          instance.get(
            `${requests.fetchFilteredStats}?${params.toString()}&bookType=fiction`,
            { headers: authHeader },
          ),
          instance.get(
            `${requests.fetchFilteredStats}?${params.toString()}&bookType=non-fiction`,
            { headers: authHeader },
          ),
        ]);

        const fictionCount    = fictionRes.data?.data?.booksCount ?? 0;
        const nonFictionCount = nonFictionRes.data?.data?.booksCount ?? 0;

        const newFictionData: FictionItem[] = [];
        if (fictionCount > 0)    newFictionData.push({ name: 'Fiction',     count: fictionCount,    color: FICTION_COLORS['fiction'] });
        if (nonFictionCount > 0) newFictionData.push({ name: 'Non-Fiction', count: nonFictionCount, color: FICTION_COLORS['non-fiction'] });
        setFictionData(newFictionData);

        // --- Length buckets ---
        const rawBuckets: { label: string; count: number }[] = lengthRes.data?.data?.buckets ?? [];
        const buckets: LengthBucket[] = rawBuckets
          .filter(b => b.label !== 'unknown' && b.count > 0)
          .map(b => ({
            label: LENGTH_DISPLAY[b.label] ?? b.label,
            count: b.count,
            color: LENGTH_COLORS[b.label] ?? '#888888',
          }));
        setLengthBuckets(buckets);
        setAvgPages(lengthRes.data?.data?.averagePages ?? null);

      } catch (e) {
        console.error('Failed to fetch book attributes:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  const totalFiction = fictionData.reduce((s, f) => s + f.count, 0);
  const totalLength  = lengthBuckets.reduce((s, b) => s + b.count, 0);

  const fictionPieData = fictionData.map(f => ({
    name:            f.name,
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

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Failed to load data.</Text>
      </View>
    );
  }

  const hasFiction = fictionData.length > 0;
  const hasLength  = lengthBuckets.length > 0;

  if (!hasFiction && !hasLength) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No book data yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.statContainer}>

      {/* Fiction vs Non-Fiction */}
      {hasFiction && (
        <>
          <Text style={styles.title}>Fiction vs Non-Fiction</Text>
          <View style={styles.card}>
            <View style={styles.halfPieRow}>
              <PieChart
                data={fictionPieData}
                width={screenWidth / 2}
                height={160}
                chartConfig={{ color: () => COLORS.primaryOrangeHex }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="10"
                center={[20, 0]}
                hasLegend={false}
                absolute
              />
              <View style={styles.fictionLegend}>
                {fictionData.map((f, i) => (
                  <View key={i} style={styles.fictionRow}>
                    <View style={[styles.dot, { backgroundColor: f.color }]} />
                    <View>
                      <Text style={styles.fictionLabel}>{f.name}</Text>
                      <Text style={styles.fictionPct}>
                        {totalFiction > 0 ? Math.round((f.count / totalFiction) * 100) : 0}% · {f.count} books
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </>
      )}

      {/* Length Breakdown */}
      {hasLength && (
        <>
          <Text style={[styles.title, { marginTop: SPACING.space_20 }]}>Book Length</Text>
          <View style={styles.card}>
            {avgPages !== null && (
              <View style={styles.avgRow}>
                <Text style={styles.avgValue}>{avgPages}</Text>
                <Text style={styles.avgUnit}>avg pages</Text>
              </View>
            )}
            <View style={styles.lengthGrid}>
              {lengthBuckets.map((b, i) => {
                const pct = totalLength > 0 ? Math.round((b.count / totalLength) * 100) : 0;
                return (
                  <View key={i} style={[styles.lengthBox, { borderTopColor: b.color, borderTopWidth: 3 }]}>
                    <Text style={[styles.lengthPct, { color: b.color }]}>{pct}%</Text>
                    <Text style={styles.lengthCount}>{b.count} books</Text>
                    <Text style={styles.lengthLabel}>{b.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}

    </View>
  );
};

export default BookAttributesChart;

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
  card: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_8,
  },
  halfPieRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fictionLegend: {
    flex: 1,
    gap: SPACING.space_16,
    paddingLeft: SPACING.space_8,
  },
  fictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fictionLabel: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  fictionPct: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: SPACING.space_8,
    marginBottom: SPACING.space_16,
  },
  avgValue: {
    fontSize: FONTSIZE.size_30,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
  },
  avgUnit: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
  },
  lengthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.space_8,
  },
  lengthBox: {
    flex: 1,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_8,
    alignItems: 'center',
  },
  lengthPct: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
  },
  lengthCount: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginTop: 2,
  },
  lengthLabel: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
    marginTop: 2,
  },
});