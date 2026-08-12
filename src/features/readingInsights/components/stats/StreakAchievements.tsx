import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

interface StreakAchievementsProps {
  maxStreak: number;
  currentStreak?: number;
  streakFreezes?: number;
}

const StreakAchievements: React.FC<StreakAchievementsProps> = ({
  maxStreak = 0,
  currentStreak = 0,
  streakFreezes = 0,
}) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.container}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Current</Text>
        <Text style={styles.statValue}>🔥 {currentStreak}d</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Best Streak</Text>
        <Text style={styles.statValue}>🏅 {maxStreak}d</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Freezes</Text>
        <Text style={[styles.statValue, styles.freezeValue]}>❄️ {streakFreezes}</Text>
      </View>
    </View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
    marginHorizontal: SPACING.space_16,
    marginVertical: SPACING.space_8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  statLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    color: COLORS.secondaryLightGreyHex,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.space_2,
  },
  statValue: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
  },
  freezeValue: {
    color: '#38BDF8',
  },
});

export default StreakAchievements;