import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

interface GenreBreakdownChartProps {
  timeFrame: string;
}

const SAMPLE_GENRES = [
  { genre: 'Fantasy', count: 12 },
  { genre: 'Literary Fiction', count: 9 },
  { genre: 'Sci-Fi', count: 7 },
  { genre: 'Mystery', count: 5 },
  { genre: 'Non-Fiction', count: 4 },
  { genre: 'Romance', count: 3 },
];

const CHART_COLORS = ['#FF7E5F', '#42D1D1', '#FFBC42', '#9C4DD4', '#45B69C', '#F06292'];

const GenreBreakdownChart: React.FC<GenreBreakdownChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const screenWidth = Dimensions.get('window').width;
  const [view, setView] = useState<'bar' | 'pie'>('bar');

  const total = SAMPLE_GENRES.reduce((s, g) => s + g.count, 0);

  const barData = {
    labels: SAMPLE_GENRES.map(g => g.genre.length > 8 ? g.genre.slice(0, 8) + '…' : g.genre),
    datasets: [{ data: SAMPLE_GENRES.map(g => g.count) }],
  };

  const pieData = SAMPLE_GENRES.map((g, i) => ({
    name: g.genre,
    population: g.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
    legendFontColor: COLORS.primaryWhiteHex,
    legendFontSize: 13,
  }));

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Genre Breakdown</Text>

      {/* Toggle */}
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
                <View key={i} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>
                    {item.name}
                    <Text style={styles.legendPct}> — {Math.round(item.population / total * 100)}%</Text>
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