import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { AntDesign } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { shareToplatform } from '../../../../utils/share';
import StatsStoryTemplate from '../../../../components/StatsStoryTemplate';

interface ProgressStatsChartProps {
  readingStatusData: any[];
}

const PIECOLORS = ['#FF7E5F', '#42D1D1', '#FFBC42', '#9C4DD4', '#45B69C'];

const ProgressStatsChart: React.FC<ProgressStatsChartProps> = ({ readingStatusData }) => {
  const screenWidth = Dimensions.get('window').width;
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [isSharing, setIsSharing] = useState(false);

  const storyRef = useRef<View>(null);

  if (!Array.isArray(readingStatusData) || readingStatusData.length === 0) {
    return (
      <View style={styles.statContainer}>
        <Text style={styles.title}>Reading Progress</Text>
        <Text style={styles.highlightText}>No reading status data available</Text>
      </View>
    );
  }

  const statusCounts = readingStatusData.reduce((acc, book) => {
    acc[book.Status] = (acc[book.Status] || 0) + 1;
    return acc;
  }, {});

  const data = Object.keys(statusCounts).map((key) => ({
    name: key,
    value: statusCounts[key],
  }));

  const sortedData = data.sort((a, b) => b.value - a.value);

  const chartData = sortedData.map((item, index) => ({
    name: item.name,
    population: item.value,
    color: PIECOLORS[index % PIECOLORS.length],
    legendFontColor: COLORS.primaryWhiteHex,
    legendFontSize: 15,
  }));

  const handleShare = async () => {
    if (!storyRef.current) return;
    try {
      setIsSharing(true);
      await new Promise(res => requestAnimationFrame(res));

      const uri = await captureRef(storyRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      await shareToplatform({
        platform: 'instagram-stories',
        content: {
          title: 'My Reading Progress',
          message: '',
          image: uri,
        },
        screenshotRef: storyRef,
      });
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsSharing(false);
    }
  };

  // Extracted so it renders identically both on-screen and in the story template
  const chartContent = (
    <>
      <Text style={styles.title}>Reading Progress</Text>
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
              <Text style={styles.labelText}>
                {item.name}: {item.population} {item.population === 1 ? 'book' : 'books'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  return (
    <View>
      {/* ── Visible UI ── */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        disabled={isSharing}
      >
        <AntDesign name="sharealt" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
        <Text style={styles.shareButtonText}>
          {isSharing ? 'Capturing…' : 'Share Stats'}
        </Text>
      </TouchableOpacity>

      <View style={styles.statContainer}>
        {chartContent}
      </View>

      {/* ── Off-screen story canvas ── */}
      <View style={styles.offscreen}>
        <StatsStoryTemplate
          ref={storyRef}
          title="Reading Progress"
        >
          {chartContent}
        </StatsStoryTemplate>
      </View>
    </View>
  );
};

export default ProgressStatsChart;

const createStyles = (COLORS) => StyleSheet.create({
  statContainer: {
    backgroundColor: 'transparent',
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: SPACING.space_4,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_15,
    backgroundColor: COLORS.primaryDarkGreyHex,
    marginBottom: SPACING.space_8,
  },
  shareButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
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
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
});