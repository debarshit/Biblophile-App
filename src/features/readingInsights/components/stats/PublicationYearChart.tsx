import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

interface PublicationYearChartProps {
  timeFrame: string;
}

// Sample: books read grouped by their publication decade
const SAMPLE_PUB_DECADES = [
  { decade: 'Pre-1950', count: 3 },
  { decade: '1950s', count: 2 },
  { decade: '1960s', count: 1 },
  { decade: '1970s', count: 4 },
  { decade: '1980s', count: 6 },
  { decade: '1990s', count: 9 },
  { decade: '2000s', count: 11 },
  { decade: '2010s', count: 18 },
  { decade: '2020s', count: 14 },
];

// Oldest / newest / avg quick stats
const OLDEST = 1934;
const NEWEST = 2024;
const AVG_PUB_YEAR = 2007;

const PublicationYearChart: React.FC<PublicationYearChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;

  const chartData = {
    labels: SAMPLE_PUB_DECADES.map(d => d.decade),
    datasets: [{ data: SAMPLE_PUB_DECADES.map(d => d.count) }],
  };

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Publication Era</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{OLDEST}</Text>
          <Text style={styles.statLabel}>Oldest Read</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{AVG_PUB_YEAR}</Text>
          <Text style={[styles.statLabel, styles.avgLabel]}>Avg Year</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{NEWEST}</Text>
          <Text style={styles.statLabel}>Newest Read</Text>
        </View>
      </View>

      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={chartData}
            width={Math.max(screenWidth - SPACING.space_16 * 4, SAMPLE_PUB_DECADES.length * 60)}
            height={200}
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