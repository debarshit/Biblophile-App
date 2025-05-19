import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

const StreakAchievements = ({ maxStreak }) => {
  return (
    <View style={styles.achievements}>
      <Text style={styles.sectionTitle}>Highest Streak:</Text>
      <Text style={styles.maxStreak}>🏅 {maxStreak}-day Streak</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  achievements: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 15,
    padding: SPACING.space_15,
    margin: SPACING.space_15,
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  maxStreak: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
  },
});

export default StreakAchievements;