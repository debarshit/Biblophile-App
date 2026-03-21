import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

interface TopAuthorsChartProps {
  timeFrame: string;
}

// Sample data — replace with real API data
const SAMPLE_AUTHORS = [
  { author: 'Brandon Sanderson', count: 8 },
  { author: 'Ursula K. Le Guin', count: 6 },
  { author: 'Terry Pratchett', count: 5 },
  { author: 'Robin Hobb', count: 4 },
  { author: 'N.K. Jemisin', count: 3 },
  { author: 'Tamsyn Muir', count: 2 },
];

const TopAuthorsChart: React.FC<TopAuthorsChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const maxCount = SAMPLE_AUTHORS[0].count;

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Top Authors</Text>
      <View style={styles.card}>
        {SAMPLE_AUTHORS.map((item, i) => {
          const pct = (item.count / maxCount) * 100;
          const isTop = i === 0;
          return (
            <View key={i} style={styles.row}>
              <Text style={[styles.rank, isTop && styles.rankTop]}>#{i + 1}</Text>
              <View style={styles.nameAndBar}>
                <View style={styles.nameRow}>
                  <Text style={[styles.authorName, isTop && styles.authorNameTop]} numberOfLines={1}>
                    {item.author}
                  </Text>
                  <Text style={[styles.bookCount, isTop && styles.bookCountTop]}>
                    {item.count} {item.count === 1 ? 'book' : 'books'}
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%` },
                      isTop && styles.barFillTop,
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default TopAuthorsChart;

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
    gap: SPACING.space_12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_12,
  },
  rank: {
    width: 28,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  rankTop: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
  },
  nameAndBar: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_4,
  },
  authorName: {
    flex: 1,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
  },
  authorNameTop: {
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
  },
  bookCount: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginLeft: SPACING.space_8,
  },
  bookCountTop: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  barBg: {
    height: 6,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.secondaryLightGreyHex,
    borderRadius: 3,
  },
  barFillTop: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
});