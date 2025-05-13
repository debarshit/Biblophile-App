import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { COLORS, SPACING } from '../../../theme/theme';

const StreakCalendarView = ({ currentStreak, latestUpdateTime }) => {
  const getMarkedDatesForStreak = () => {
    if (!latestUpdateTime || !currentStreak) return {};

    const markedDates = {};
    const endDate = new Date(latestUpdateTime);
    
    for (let i = 0; i < currentStreak; i++) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      markedDates[dateString] = {
        selected: true,
        selectedColor: COLORS.primaryOrangeHex,
        selectedTextColor: COLORS.primaryWhiteHex,
      };
    }

    return markedDates;
  };

  return (
    <View style={styles.calendarContainer}>
      <Calendar
        theme={{
          calendarBackground: COLORS.primaryGreyHex,
          textSectionTitleColor: COLORS.primaryWhiteHex,
          selectedDayBackgroundColor: COLORS.primaryOrangeHex,
          selectedDayTextColor: COLORS.primaryWhiteHex,
          todayTextColor: COLORS.primaryOrangeHex,
          dayTextColor: COLORS.primaryWhiteHex,
          monthTextColor: COLORS.primaryWhiteHex,
          arrowColor: COLORS.primaryOrangeHex,
          textDisabledColor: COLORS.primaryLightGreyHex,
        }}
        markedDates={getMarkedDatesForStreak()}
        onDayPress={(day) => {
          console.log('Selected day', day.dateString);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 15,
    padding: SPACING.space_15,
    margin: SPACING.space_15,
    overflow: 'hidden',
  },
});

export default StreakCalendarView;