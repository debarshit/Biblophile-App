import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

const StreakWeeklyProgress = ({ currentStreak, latestUpdateTime, userDetails }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
  
  const getDayClasses = (dayIndex) => {
    if (!latestUpdateTime) return styles.day;

    const today = new Date();
    const currentDayIndex = today.getDay();
    const lastUpdateDate = new Date(latestUpdateTime);
    const lastUpdateDayIndex = lastUpdateDate.getDay();

    const weekStartIndex = 0;

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - currentDayIndex + weekStartIndex);

    const streakEndDayIndex = lastUpdateDayIndex;

    const fillStartDayIndex = Math.max(weekStartIndex, streakEndDayIndex - (currentStreak - 1));
    const fillEndDayIndex = Math.min(currentDayIndex, streakEndDayIndex);

    // Check if the current day index falls within the streak days
    if (dayIndex >= fillStartDayIndex && dayIndex <= fillEndDayIndex) {
      return styles.filledDay;
    }

    return styles.day;
  };

  const handleBuyNow = () => {
    Linking.openURL("https://shop.biblophile.com/shop/1/Bookmarks").catch(err =>
      console.error('An error occurred while opening the URL', err)
    );
  };

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressText}>
        <Text style={styles.infoText}>Progress for the week</Text>
        <TouchableOpacity onPress={() => setShowTooltip(!showTooltip)} style={styles.infoIconContainer}>
          <FontAwesome name="info-circle" style={styles.infoIcon} />
          {showTooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                Use our nfc bookmarks to maintain reading streak
              </Text>
              <TouchableOpacity onPress={handleBuyNow}>
                <Text style={styles.buyNowText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.streakInfo}>
        <Text style={styles.streakText}>🌟 {currentStreak}-Day Streak</Text>
      </View>
      <View style={styles.weekContainer}>
        {daysOfWeek.map((day, index) => (
          <View key={index} style={[styles.dayContainer, getDayClasses(index)]}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.greeting}>Hello, {userDetails[0].userName.split(' ')[0]}! Keep up the good work! 🎉</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  streakInfo: {
    alignItems: 'center',
    marginVertical: SPACING.space_10,
    zIndex: -1,
  },
  streakText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryOrangeHex,
  },
  progressContainer: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    margin: SPACING.space_12,
    zIndex: -1,
  },
  progressText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_8,
  },
  infoText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  infoIconContainer: {
    marginLeft: SPACING.space_10,
  },
  infoIcon: {
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
  },
  tooltip: {
    position: 'absolute',
    right: 0,
    top: 20,
    backgroundColor: COLORS.primaryBlackHex,
    padding: 10,
    borderRadius: 5,
    width: 200,
    zIndex: 5,
  },
  tooltipText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
  },
  buyNowText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryOrangeHex,
    textDecorationLine: 'underline',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.space_8,
  },
  dayContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  day: {
    backgroundColor: COLORS.primaryBlackHex,
  },
  filledDay: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  greeting: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginTop: SPACING.space_10,
    marginBottom: SPACING.space_4,
  },
});

export default StreakWeeklyProgress;