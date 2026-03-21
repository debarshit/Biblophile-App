import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

interface BookAttributesChartProps {
  timeFrame: string;
}

// Sample data — replace with real API data
const FICTION_DATA = [
  { name: 'Fiction', count: 42, color: '#FF7E5F' },
  { name: 'Non-Fiction', count: 18, color: '#42D1D1' },
];

const LENGTH_BUCKETS = [
  { label: 'Short\n(<150 pg)', count: 8, color: '#FFBC42' },
  { label: 'Medium\n(150–350)', count: 26, color: '#FF7E5F' },
  { label: 'Long\n(350–600)', count: 18, color: '#42D1D1' },
  { label: 'Epic\n(600+)', count: 8, color: '#9C4DD4' },
];

const BookAttributesChart: React.FC<BookAttributesChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;

  const totalFiction = FICTION_DATA.reduce((s, f) => s + f.count, 0);
  const totalLength = LENGTH_BUCKETS.reduce((s, l) => s + l.count, 0);
  const allPageCounts = [80, 120, 200, 320, 450, 540, 720, 900]; // mock for avg
  const avgPages = Math.round(allPageCounts.reduce((a, b) => a + b, 0) / allPageCounts.length);

  const fictionPieData = FICTION_DATA.map(f => ({
    name: f.name,
    population: f.count,
    color: f.color,
    legendFontColor: COLORS.primaryWhiteHex,
    legendFontSize: 13,
  }));

  return (
    <View style={styles.statContainer}>

      {/* Fiction vs Non-Fiction */}
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
            {FICTION_DATA.map((f, i) => (
              <View key={i} style={styles.fictionRow}>
                <View style={[styles.dot, { backgroundColor: f.color }]} />
                <View>
                  <Text style={styles.fictionLabel}>{f.name}</Text>
                  <Text style={styles.fictionPct}>
                    {Math.round((f.count / totalFiction) * 100)}% · {f.count} books
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Length Breakdown */}
      <Text style={[styles.title, { marginTop: SPACING.space_20 }]}>Book Length</Text>
      <View style={styles.card}>
        <View style={styles.avgRow}>
          <Text style={styles.avgValue}>{avgPages}</Text>
          <Text style={styles.avgUnit}>avg pages</Text>
        </View>
        <View style={styles.lengthGrid}>
          {LENGTH_BUCKETS.map((b, i) => {
            const pct = Math.round((b.count / totalLength) * 100);
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