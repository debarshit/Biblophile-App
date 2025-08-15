import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { useStreak } from '../../../hooks/useStreak';
import StreakCelebration from '../../../components/StreakCelebration';

const StreakWeeklyProgress = ({ userDetails }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);

  const {
    currentStreak,
    latestUpdateTime,
    updateStreak,
    loading,
  } = useStreak(userDetails[0]?.accessToken, null, handleCelebration);

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  // ✅ Check if the user has already logged for today
  const hasLoggedToday = useMemo(() => {
    if (!latestUpdateTime) return false;
    const today = new Date();
    const lastUpdate = new Date(latestUpdateTime);
    return (
      today.getFullYear() === lastUpdate.getFullYear() &&
      today.getMonth() === lastUpdate.getMonth() &&
      today.getDate() === lastUpdate.getDate()
    );
  }, [latestUpdateTime]);

  function handleCelebration(streakData) {
    setCelebrationData({
      currentStreak: streakData.currentStreak,
      isNewRecord: streakData.isNewRecord,
    });
    setShowStreakCelebration(true);
  }

  function handleCelebrationComplete() {
    setShowStreakCelebration(false);
    setCelebrationData(null);
  }

  function getDayClasses(dayIndex) {
    if (!latestUpdateTime) return styles.day;

    const today = new Date();
    const currentDayIndex = today.getDay();
    const lastUpdateDate = new Date(latestUpdateTime);
    const lastUpdateDayIndex = lastUpdateDate.getDay();

    const weekStartIndex = 0;
    const streakEndDayIndex = lastUpdateDayIndex;

    const fillStartDayIndex = Math.max(weekStartIndex, streakEndDayIndex - (currentStreak - 1));
    const fillEndDayIndex = Math.min(currentDayIndex, streakEndDayIndex);

    if (dayIndex >= fillStartDayIndex && dayIndex <= fillEndDayIndex) {
      return styles.filledDay;
    }

    return styles.day;
  }

  function handleBuyNow() {
    Linking.openURL("https://shop.biblophile.com/shop/1/Bookmarks").catch(err =>
      console.error('An error occurred while opening the URL', err)
    );
  }

  async function handleReadTodayPress() {
    if (hasLoggedToday) return;

    try {
      await updateStreak(handleCelebration);
    } catch (err) {
      Alert.alert("Error", "Could not update streak");
    }
  }

  return (
    <View style={styles.progressContainer}>
      <View style={styles.streakInfo}>
        <Text style={styles.streakText}>🌟 {currentStreak}-Day Streak</Text>
        <TouchableOpacity onPress={() => setShowTooltip(!showTooltip)} style={styles.infoIconContainer}>
          <FontAwesome name="info-circle" style={styles.infoIcon} />
          {showTooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                Use our NFC bookmarks for a physical experience!
              </Text>
              <TouchableOpacity onPress={handleBuyNow}>
                <Text style={styles.buyNowText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.weekContainer}>
        {daysOfWeek.map((day, index) => (
          <View key={index} style={[styles.dayContainer, getDayClasses(index)]}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.greeting}>
        Hello, {userDetails[0].userName.split(' ')[0]}! Keep up the good work! 🎉
      </Text>

      <TouchableOpacity
        style={[styles.readTodayButton, (hasLoggedToday || loading) && styles.readTodayButtonDisabled]}
        onPress={handleReadTodayPress}
        disabled={hasLoggedToday || loading}
      >
        <Text style={styles.readTodayText}>
          {hasLoggedToday ? "Already logged" : loading ? "Updating..." : "I read today"}
        </Text>
      </TouchableOpacity>

      <StreakCelebration
        visible={showStreakCelebration}
        streakCount={celebrationData?.currentStreak || 0}
        isNewRecord={celebrationData?.isNewRecord || false}
        onAnimationComplete={handleCelebrationComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  streakInfo: {
    alignContent: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
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
    zIndex: -5,
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
  readTodayButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_16,
    alignSelf: 'center',
    marginTop: SPACING.space_8,
  },
  readTodayButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  readTodayText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
});

export default StreakWeeklyProgress;