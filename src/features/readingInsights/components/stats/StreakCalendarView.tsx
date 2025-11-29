import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import instance from '../../../../services/axios';
import { COLORS, SPACING } from '../../../../theme/theme';
import { useStore } from '../../../../store/store';
import requests from '../../../../services/requests';

const StreakCalendarView = () => {
  const userDetails = useStore((state) => state.userDetails);
  const userId = userDetails[0].userId;
  const [markedDates, setMarkedDates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState('');
  
  // Initialized current month once on component mount
  useEffect(() => {
    const today = new Date();
    const formattedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(formattedMonth);
  }, []);

  //memoized fetch function to avoid recreation on each render
  const fetchStreakData = useCallback(async (month) => {
    if (!userId || !month) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const readingStreakLogsResponse = await instance(`${requests.fetchReadingStreakLogs}?timezone=${userTimeZone}&month=${month}`,{
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`
        },
      });
      const response = readingStreakLogsResponse.data;
      if (response.data && response.data.dates) {
        const newMarkedDates = {};
        
        response.data.dates.forEach(date => {
          newMarkedDates[date] = {
            selected: true,
            selectedColor: COLORS.primaryOrangeHex,
            selectedTextColor: COLORS.primaryWhiteHex,
          };
        });
        
        setMarkedDates(newMarkedDates);
      } else {
        setMarkedDates({});
      }
    } catch (err) {
      console.error('Error fetching streak data:', err);
      setError('Failed to load streak data');
      setMarkedDates({});
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch data when month changes or component mounts
  useEffect(() => {
    if (currentMonth && userId) {
      fetchStreakData(currentMonth);
    }
  }, [currentMonth, userId, fetchStreakData]);

  const handleMonthChange = useCallback((monthData) => {
    const newMonth = `${monthData.year}-${String(monthData.month).padStart(2, '0')}`;
    console.log('Month changed to:', newMonth);
    setCurrentMonth(newMonth);
  }, []);

  return (
    <View style={styles.calendarContainer}>      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
        </View>
      ) : (
        <Calendar
          minDate={'2025-06-01'}
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
          markedDates={markedDates}
          onDayPress={(day) => {
            console.log('Selected day', day.dateString);
          }}
          onMonthChange={handleMonthChange}
          current={currentMonth ? `${currentMonth}-01` : undefined}
        />
      )}
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
  loadingContainer: {
    alignSelf: 'center',
    padding: SPACING.space_8,
    borderRadius: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: SPACING.space_10,
  }
});

export default StreakCalendarView;