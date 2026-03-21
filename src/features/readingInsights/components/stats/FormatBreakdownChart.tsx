import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

interface FormatBreakdownChartProps {
  timeFrame: string;
}

// Sample data — replace with real API data
const SAMPLE_FORMATS = [
  { format: 'Paperback', count: 18, icon: '📖' },
  { format: 'Ebook', count: 24, icon: '📱' },
  { format: 'Hardcover', count: 10, icon: '📕' },
  { format: 'Audiobook', count: 8, icon: '🎧' },
];

const CHART_COLORS = ['#FF7E5F', '#42D1D1', '#FFBC42', '#9C4DD4'];

const FormatBreakdownChart: React.FC<FormatBreakdownChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;

  const total = SAMPLE_FORMATS.reduce((s, f) => s + f.count, 0);

  const pieData = SAMPLE_FORMATS.map((f, i) => ({
    name: f.format,
    population: f.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
    legendFontColor: COLORS.primaryWhiteHex,
    legendFontSize: 13,
  }));

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
          {SAMPLE_FORMATS.map((f, i) => {
            const pct = Math.round((f.count / total) * 100);
            return (
              <View key={i} style={[styles.legendItem, { borderLeftColor: CHART_COLORS[i] }]}>
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