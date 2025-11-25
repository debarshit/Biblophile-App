import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';

interface EmotionStatsChartProps {
  userAverageEmotions: any[];
  timeFrame: string;
}

const EmotionStatsChart: React.FC<EmotionStatsChartProps> = ({ userAverageEmotions, timeFrame }) => {
  const screenWidth = Dimensions.get('window').width;
  const PIECOLORS = ['#FF7E5F', '#42D1D1', '#FFBC42', '#9C4DD4', '#45B69C'];

  if (!Array.isArray(userAverageEmotions) || userAverageEmotions.length === 0) {
    return (
      <View style={styles.statContainer}>
        <Text style={styles.title}>Reading Emotions</Text>
        <Text style={styles.highlightText}>No emotions data available</Text>
      </View>
    );
  }

  const formattedEmotions = userAverageEmotions.map(emotion => ({
    ...emotion,
    AvgScore: parseFloat(emotion.AvgScore)
  }));

  const chartData = formattedEmotions.map((item, index) => ({
    name: item.Emotion,
    population: item.AvgScore,
    color: PIECOLORS[index % PIECOLORS.length],
    legendFontColor: COLORS.primaryWhiteHex,
    legendFontSize: 15,
  }));

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Reading Emotions</Text>
      <View style={styles.chartCard}>
        <PieChart
          data={chartData}
          width={screenWidth - SPACING.space_16 * 2}
          height={220}
          chartConfig={{
            color: () => COLORS.primaryOrangeHex,
            labelColor: () => COLORS.primaryWhiteHex,
          }}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"15"}
          center={[65, 0]}
          absolute
          hasLegend={false}
        />
        <View style={styles.labelsContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.labelRow}>
              <View style={[styles.colorBox, { backgroundColor: item.color }]} />
              <Text style={styles.labelText}>{item.name}: {item.population}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default EmotionStatsChart;

const styles = StyleSheet.create({
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
  highlightText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    textAlign: 'center',
    padding: SPACING.space_20,
  },
  chartCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    marginVertical: SPACING.space_16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  labelsContainer: {
    marginTop: SPACING.space_16,
    paddingHorizontal: SPACING.space_16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: BORDERRADIUS.radius_4,
    marginRight: SPACING.space_8,
  },
  labelText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
  },
});