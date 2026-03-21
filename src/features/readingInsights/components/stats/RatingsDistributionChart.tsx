import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

interface RatingsDistributionChartProps {
  timeFrame: string;
}

// Sample data — replace with real API data
const SAMPLE_RATINGS = [
  { stars: '⭐ 1', count: 2 },
  { stars: '⭐ 2', count: 5 },
  { stars: '⭐ 3', count: 14 },
  { stars: '⭐ 4', count: 22 },
  { stars: '⭐ 5', count: 17 },
];

const RatingsDistributionChart: React.FC<RatingsDistributionChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;

  const total = SAMPLE_RATINGS.reduce((s, r) => s + r.count, 0);
  const weightedSum = SAMPLE_RATINGS.reduce((s, r, i) => s + r.count * (i + 1), 0);
  const avgRating = (weightedSum / total).toFixed(1);

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Ratings Distribution</Text>

      <View style={styles.summaryRow}>
        <View style={styles.avgBox}>
          <Text style={styles.avgValue}>{avgRating}</Text>
          <Text style={styles.avgLabel}>Avg Rating</Text>
          <Text style={styles.avgStars}>{'★'.repeat(Math.round(Number(avgRating)))}</Text>
        </View>
        <View style={styles.barsContainer}>
          {SAMPLE_RATINGS.slice().reverse().map((r, i) => {
            const pct = total > 0 ? (r.count / total) * 100 : 0;
            const barWidth = Math.max(pct * 1.5, 4); // scale to max ~150
            return (
              <View key={i} style={styles.ratingRow}>
                <Text style={styles.starLabel}>{r.stars.split(' ')[1]}★</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.countLabel}>{r.count}</Text>
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