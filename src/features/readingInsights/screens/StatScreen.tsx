import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
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
import StatsTabs, { StatTab } from '../components/stats/StatsTabs';
import PageStatsChart from '../components/stats/PageStatsChart';
import TimeStatsChart from '../components/stats/TimeStatsChart';
import EmotionStatsChart from '../components/stats/EmotionStatsChart';
import ProgressStatsChart from '../components/stats/ProgressStatsChart';
import BooksReadChart from '../components/stats/BooksReadChart';
import GenreBreakdownChart from '../components/stats/GenreBreakdownChart';
import RatingsDistributionChart from '../components/stats/RatingsDistributionChart';
import TopAuthorsChart from '../components/stats/TopAuthorsChart';
import FormatBreakdownChart from '../components/stats/FormatBreakdownChart';
import PublicationYearChart from '../components/stats/PublicationYearChart';
import BookAttributesChart from '../components/stats/BookAttributesChart';
import { useTheme } from '../../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const StatScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagesRead, setPagesRead] = useState([]);
  const [readingDurations, setReadingDurations] = useState([]);
  const [userAverageEmotions, setUserAverageEmotions] = useState([]);
  const [readingStatusData, setReadingStatusData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('last-week');
  const [loading, setLoading] = useState(true);
  const [activeStat, setActiveStat] = useState<StatTab>('page-stats');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);

  const navigation = useNavigation<any>();
  const userDetails = useStore((state) => state.userDetails);
  const { currentStreak, maxStreak } = useStreak(userDetails[0]?.accessToken);
  const analytics = useAnalytics();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

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
      const response = await instance(
        `${requests.fetchPagesRead}?${userDetails[0].userId}&timeFrame=${timeFrame}&timezone=${userTimezone}`,
        { headers: { Authorization: `Bearer ${userDetails[0].accessToken}` } },
      );
      if (Array.isArray(response.data.data)) setPagesRead(response.data.data);
    } catch (error) {
      console.error('Failed to fetch pages read:', error);
    }
  };

  const fetchReadingDurations = async () => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await instance.get(
        `${requests.fetchReadingDurationGraph}?${userDetails[0].userId}&timeFrame=${timeFrame}&timezone=${userTimezone}`,
        { headers: { Authorization: `Bearer ${userDetails[0].accessToken}` } },
      );
      if (Array.isArray(response.data.data)) setReadingDurations(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reading durations:', error);
    }
  };

  const fetchAverageEmotionsByUser = async () => {
    try {
      const response = await instance.get(
        `${requests.fetchAverageEmotionsByUser}${userDetails[0].userId}&timeFrame=${timeFrame}`,
      );
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
      if (Array.isArray(books)) setReadingStatusData(books);
    } catch (error) {
      console.error('Failed to fetch user books:', error);
    }
  };

  const getPreviousMonth = () => {
    const now = new Date();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const monthName = prevMonthDate.toLocaleString('default', { month: 'long' });
    const monthNumber = prevMonthDate.toLocaleString('default', { month: 'numeric' });
    const year = prevMonthDate.getFullYear();

    return { monthName, monthNumber, year };
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

  const navigateToMonthlyWrap = () => {
    const { monthNumber, monthName, year } = getPreviousMonth();
    navigation.navigate('MonthlyWrap', { monthNumber, monthName, year });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const renderChart = () => {
    switch (activeStat) {
      case 'page-stats':
        return (
          <PageStatsChart
            pagesRead={pagesRead}
            timeFrame={timeFrame}
            userDetails={userDetails}
            fetchPagesRead={fetchPagesRead}
            analytics={analytics}
          />
        );
      case 'time-stats':
        return <TimeStatsChart readingDurations={readingDurations} timeFrame={timeFrame} />;
      case 'emotion-stats':
        return <EmotionStatsChart userAverageEmotions={userAverageEmotions} timeFrame={timeFrame} />;
      case 'progress-stats':
        return <ProgressStatsChart readingStatusData={readingStatusData} />;
      case 'books-read':
        return <BooksReadChart timeFrame={timeFrame} />;
      case 'genres':
        return <GenreBreakdownChart timeFrame={timeFrame} />;
      case 'ratings':
        return <RatingsDistributionChart timeFrame={timeFrame} />;
      case 'authors':
        return <TopAuthorsChart timeFrame={timeFrame} />;
      case 'format':
        return <FormatBreakdownChart timeFrame={timeFrame} />;
      case 'publication':
        return <PublicationYearChart timeFrame={timeFrame} />;
      case 'book-attributes':
        return <BookAttributesChart timeFrame={timeFrame} />;
      default:
        return null;
    }
  };
  const { monthName, year } = getPreviousMonth();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* try insights or progress inplace of stats */}
        <HeaderBar showBackButton={true} title="Stats" />
        {/* Monthly Wrap Link */}
        <TouchableOpacity 
          style={styles.wrapButton}
          onPress={navigateToMonthlyWrap}>
          <Ionicons name="calendar-outline" size={24} color={COLORS.primaryWhiteHex} />
          <Text style={styles.wrapButtonText}>View {monthName} {year} Reading Wrap</Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primaryWhiteHex} />
        </TouchableOpacity>

        {/* <Text style={styles.title}>Reading Streak Leaderboard</Text>
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.Rank.toString()}
          contentContainerStyle={styles.listContainer}
        /> */}

        <StreakAchievements maxStreak={maxStreak} />
        <StreakCalendarView />

        <View style={styles.section}>
          <ReadingGoals />
        </View>

        <View style={styles.section}>
          <TimeFramePicker timeFrame={timeFrame} setTimeFrame={setTimeFrame} />
          <StatsTabs activeStat={activeStat} setActiveStat={setActiveStat} />
          <View style={styles.chartArea}>{renderChart()}</View>
        </View>

        {/* ── Social / Reminders ── */}
        <View style={styles.section}>
          <ReminderSection onReminderPress={() => setDatePickerVisible(true)} />
        </View>
        <View style={styles.section}>
          <CommunitySection currentStreak={currentStreak} />
        </View>

        {datePickerVisible && (
          <TimePicker
            visible={datePickerVisible}
            reminderTime={reminderTime}
            setReminderTime={setReminderTime}
            setDatePickerVisible={setDatePickerVisible}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatScreen;

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.space_16,
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
  section: {
    marginTop: SPACING.space_16,
  },
  chartArea: {
    marginTop: SPACING.space_8,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    // subtle inner glow
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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