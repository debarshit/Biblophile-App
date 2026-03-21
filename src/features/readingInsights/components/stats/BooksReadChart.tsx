import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

interface BooksReadChartProps {
  timeFrame: string;
}

// Sample data — replace with real API data
const SAMPLE_WEEKLY = [
  { label: 'Mon', count: 0 }, { label: 'Tue', count: 1 }, { label: 'Wed', count: 0 },
  { label: 'Thu', count: 1 }, { label: 'Fri', count: 0 }, { label: 'Sat', count: 2 },
  { label: 'Sun', count: 1 },
];

const SAMPLE_MONTHLY = [
  { label: 'Jan', count: 3 }, { label: 'Feb', count: 2 }, { label: 'Mar', count: 4 },
  { label: 'Apr', count: 1 }, { label: 'May', count: 5 }, { label: 'Jun', count: 3 },
  { label: 'Jul', count: 2 }, { label: 'Aug', count: 6 }, { label: 'Sep', count: 4 },
  { label: 'Oct', count: 3 }, { label: 'Nov', count: 5 }, { label: 'Dec', count: 2 },
];

const BooksReadChart: React.FC<BooksReadChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;

  const data = timeFrame === 'last-week' ? SAMPLE_WEEKLY : SAMPLE_MONTHLY;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{ data: data.map(d => d.count) }],
  };

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Books Finished</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{Math.round(total / data.length * 10) / 10}</Text>
          <Text style={styles.summaryLabel}>Avg / {timeFrame === 'last-week' ? 'day' : 'month'}</Text>
        </View>
      </View>
      <View style={styles.chartCard}>
        <BarChart
          data={chartData}
          width={screenWidth - SPACING.space_16 * 4}
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
    alignItems: 'center',
  },
});