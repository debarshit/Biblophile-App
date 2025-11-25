import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';

interface TimeStatsChartProps {
  readingDurations: any[];
  timeFrame: string;
}

const TimeStatsChart: React.FC<TimeStatsChartProps> = ({ readingDurations, timeFrame }) => {
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, value: '', date: '' });

  if (!Array.isArray(readingDurations) || readingDurations.length === 0) {
    return (
      <View style={styles.statContainer}>
        <Text style={styles.title}>Minutes Read in Last {timeFrame === 'last-week' ? '7 Days' : '30 Days'}</Text>
        <Text style={styles.highlightText}>No data available</Text>
      </View>
    );
  }

  const labelCount = timeFrame === 'last-week' ? 7 : 30;
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const labels = [];
  const dataPointsDurations = Array(labelCount).fill(0);

  for (let i = labelCount - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString("en-CA", { timeZone: userTimezone }));
  }

  readingDurations.forEach(item => {
    const itemDate = new Date(item.dateRead).toLocaleDateString("en-CA", { timeZone: userTimezone });
    const index = labels.indexOf(itemDate);
    if (index !== -1) {
      dataPointsDurations[index] = item.duration / 60;
    }
  });

  const adjustedLabels = labels.map((label, index) => {
    if (index === 0 || index === Math.floor(labels.length / 2) || index === labels.length - 1) {
      return label;
    }
    return '';
  });

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Minutes Read in Last {timeFrame === 'last-week' ? '7 Days' : '30 Days'}</Text>
      <View>
        <LineChart
          data={{
            labels: adjustedLabels,
            datasets: [{ data: dataPointsDurations }],
          }}
          width={Dimensions.get('window').width - SPACING.space_16 * 2}
          height={220}
          yAxisLabel=""
          yAxisSuffix=" mins"
          withVerticalLines={false}
          withHorizontalLines={false}
          withInnerLines={false}
          chartConfig={{
            backgroundColor: COLORS.primaryDarkGreyHex,
            backgroundGradientFrom: COLORS.primaryDarkGreyHex,
            backgroundGradientTo: COLORS.primaryDarkGreyHex,
            decimalPlaces: 0,
            color: (opacity = 1) => "#42D1D1",
            labelColor: (opacity = 1) => COLORS.primaryWhiteHex,
            style: { borderRadius: BORDERRADIUS.radius_8 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.primaryBlackHex },
          }}
          bezier
          style={{
            marginVertical: SPACING.space_16,
            borderRadius: BORDERRADIUS.radius_8,
          }}
          onDataPointClick={(data) => {
            const { x, y, index } = data;
            const date = labels[index];
            setTooltipPos({
              x, y, visible: true,
              value: `${dataPointsDurations[index]} mins`,
              date: date,
            });
          }}
        />
        {tooltipPos.visible && (
          <View style={[styles.tooltip, { top: tooltipPos.y - 30, left: tooltipPos.x - 25 }]}>
            <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
            <Text style={styles.tooltipText}>{tooltipPos.date}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TimeStatsChart;

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
  tooltip: {
    position: 'absolute',
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
});