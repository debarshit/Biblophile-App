import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import ReadingGoals from '../components/stats/ReadingGoals';
import HeaderBar from '../../../components/HeaderBar';
import { useAnalytics } from '../../../utils/analytics';
import StreakCalendarView from '../components/stats/StreakCalendarView';
import StreakAchievements from '../components/stats/StreakAchievements';
import { useStreak } from '../../../hooks/useStreak';
import ReminderSection from '../components/stats/ReminderSection';
import TimePicker from '../components/TimePicker';
import CommunitySection from '../components/stats/CommunitySection';
import TimeFramePicker from '../components/stats/TimeFramePicker';
import StatsTabs from '../components/stats/StatsTabs';
import PageStatsChart from '../components/stats/PageStatsChart';
import TimeStatsChart from '../components/stats/TimeStatsChart';
import EmotionStatsChart from '../components/stats/EmotionStatsChart';
import ProgressStatsChart from '../components/stats/ProgressStatsChart';

const StatScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagesRead, setPagesRead] = useState([]);
  const [readingDurations, setReadingDurations] = useState([]);
  const [userAverageEmotions, setUserAverageEmotions] = useState([]);
  const [readingStatusData, setReadingStatusData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('last-week');
  const [loading, setLoading] = useState(true);
  const [activeStat, setActiveStat] = useState('page-stats');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);

  const userDetails = useStore((state) => state.userDetails);
  const { currentStreak, maxStreak } = useStreak(userDetails[0]?.accessToken);
  const analytics = useAnalytics();

  const fetchLeaderboard = async () => {
    try {
      const readingStreakLeaderboardResponse = await instance.get(`${requests.fetchReadingStreakLeaderboard}?${userDetails[0].userId}`, {
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`
        },
      });
      const response = readingStreakLeaderboardResponse.data;
      if (Array.isArray(response.data)) {
        setLeaderboard(response.data);
      } else {
        console.error('Leaderboard data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const fetchPagesRead = async () => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await instance(`${requests.fetchPagesRead}?${userDetails[0].userId}&timeFrame=${timeFrame}&timezone=${userTimezone}`, {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
      });
      if (Array.isArray(response.data.data)) {
        setPagesRead(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pages read:', error);
    }
  };

  const fetchReadingDurations = async () => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await instance.get(`${requests.fetchReadingDurationGraph}?${userDetails[0].userId}&timeFrame=${timeFrame}&timezone=${userTimezone}`, {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
      });
      if (Array.isArray(response.data.data)) {
        setReadingDurations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reading durations:', error);
    }
  };

   const fetchAverageEmotionsByUser = async () => {
    try {
      const response = await instance.get(`${requests.fetchAverageEmotionsByUser}${userDetails[0].userId}&timeFrame=${timeFrame}`);
      setUserAverageEmotions(response.data.data.topEmotions);
    } catch (error) {
      console.error('Failed to fetch user emotions:', error);
    }
  };

  const fetchUserBooks = async () => {
    try {
      const response = await instance.get(requests.fetchUserBooks, {
        params: { userId: userDetails[0].userId, timeFrame: 'all-time' },
      });
      const books = response.data.data.userBooks;
      if (Array.isArray(books)) {
        setReadingStatusData(books);
      }
    } catch (error) {
      console.error('Failed to fetch user books:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    setUserAverageEmotions([]);
    setReadingStatusData([]);
    fetchLeaderboard();
    fetchPagesRead();
    fetchReadingDurations();
    fetchAverageEmotionsByUser();
    fetchUserBooks();
    setLoading(false);
  }, [timeFrame]);

  const renderItem = ({ item }) => {
    const isCurrentUser = item.UserId === userDetails[0].userId;
    const itemStyle = isCurrentUser ? [styles.itemContainer, styles.currentUserItem] : styles.itemContainer;
  
    return (
      <View style={itemStyle}>
        <Text style={styles.rank}>{item.Rank}</Text>
        <Text style={styles.username}>{item.UserName}</Text>
        <Text style={styles.streak}>{item.CurrentStreak} days</Text>
      </View>
    );
  };

  const handleReminderPress = () => {
    setDatePickerVisible(true);
  };

  // const navigateToMonthlyWrap = () => {
  //   // Navigation logic would go here
  //   console.log("Navigate to monthly wrap");
  // };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ScrollViewFlex}>
        {/* try insights or progress inplace of stats */}
        <HeaderBar showBackButton={true} title='Stats' /> 
        <ReadingGoals />
        
        {/* Monthly Wrap Link */}
        {/* <TouchableOpacity 
          style={styles.wrapButton}
          onPress={navigateToMonthlyWrap}>
          <Ionicons name="calendar-outline" size={24} color={COLORS.primaryWhiteHex} />
          <Text style={styles.wrapButtonText}>View Monthly Reading Wrap</Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primaryWhiteHex} />
        </TouchableOpacity> */}

        {/* <Text style={styles.title}>Reading Streak Leaderboard</Text>
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.Rank.toString()}
          contentContainerStyle={styles.listContainer}
        /> */}

        <StreakAchievements maxStreak={maxStreak} />
        <StreakCalendarView />
        
        <TimeFramePicker timeFrame={timeFrame} setTimeFrame={setTimeFrame} />
        <StatsTabs activeStat={activeStat} setActiveStat={setActiveStat} />
        
        {activeStat === 'page-stats' && (
          <PageStatsChart 
            pagesRead={pagesRead} 
            timeFrame={timeFrame}
            userDetails={userDetails}
            fetchPagesRead={fetchPagesRead}
            analytics={analytics}
          />
        )}
        
        {activeStat === 'time-stats' && (
          <TimeStatsChart 
            readingDurations={readingDurations} 
            timeFrame={timeFrame}
          />
        )}
        
        {activeStat === 'emotion-stats' && (
          <EmotionStatsChart 
            userAverageEmotions={userAverageEmotions} 
            timeFrame={timeFrame}
          />
        )}
        
        {activeStat === 'progress-stats' && (
          <ProgressStatsChart readingStatusData={readingStatusData} />
        )}

        {datePickerVisible && (
          <TimePicker
            visible={datePickerVisible}
            reminderTime={reminderTime}
            setReminderTime={setReminderTime}
            setDatePickerVisible={setDatePickerVisible}
          />
        )}

        <ReminderSection onReminderPress={handleReminderPress} />
        <CommunitySection currentStreak={currentStreak} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatScreen;

const styles = StyleSheet.create({
  ScrollViewFlex: { flexGrow: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    padding: SPACING.space_16,
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: SPACING.space_20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_8,
    marginBottom: SPACING.space_8,
  },
  rank: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    flex: 1,
  },
  username: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    flex: 3,
    textAlign: 'left',
  },
  streak: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    flex: 2,
    textAlign: 'right',
  },
  currentUserItem: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  loadingText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
  },
  wrapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    marginVertical: SPACING.space_16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  wrapButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    flex: 1,
    textAlign: 'center',
  },
});