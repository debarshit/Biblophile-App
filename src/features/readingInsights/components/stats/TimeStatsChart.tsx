import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

interface TimeStatsChartProps {
  readingDurations: any[];
  timeFrame: string;
}

const TimeStatsChart: React.FC<TimeStatsChartProps> = ({ readingDurations, timeFrame }) => {
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, value: '', date: '' });
  const [chartWidth, setChartWidth] = useState(0);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const handleChartLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

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

  const formatChartLabel = (label: string) => {
    const [, month, day] = label.split('-');
    return `${Number(month)}/${Number(day)}`;
  };

  const adjustedLabels = labels.map((label, index) => {
    if (index === 0 || index === Math.floor(labels.length / 2) || index === labels.length - 1) {
      return formatChartLabel(label);
    }
    return '';
  });
  const verticalLabelProps = timeFrame === 'last-week'
    ? { fontSize: 10 }
    : { fontSize: 10, dx: -6 };

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Minutes Read in Last {timeFrame === 'last-week' ? '7 Days' : '30 Days'}</Text>
      <View style={styles.chartWrapper} onLayout={handleChartLayout}>
        {chartWidth > 0 && (
          <LineChart
            data={{
              labels: adjustedLabels,
              datasets: [{ data: dataPointsDurations }],
            }}
            width={chartWidth}
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
              propsForVerticalLabels: verticalLabelProps,
            }}
            bezier
            style={styles.chart}
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
        )}
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

const createStyles = (COLORS) => StyleSheet.create({
  statContainer: {
    backgroundColor: 'transparent',
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_8,
  },
  chartWrapper: {
    position: 'relative',
    width: '100%',
  },
  chart: {
    alignSelf: 'center',
    marginVertical: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_8,
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