import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableWithoutFeedback, 
         ScrollView, TextInput, TouchableOpacity, 
         SafeAreaView,
         Platform} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import ReadingGoals from '../components/ReadingGoals';
import { Ionicons } from '@expo/vector-icons';
import CustomPicker, { PickerOption } from '../../../components/CustomPickerComponent';

const StatScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagesRead, setPagesRead] = useState([]);
  const [readingDurations, setReadingDurations] = useState([]);
  const [userAverageEmotions, setUserAverageEmotions] = useState([]);
  const [readingStatusData, setReadingStatusData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('last-week');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, value: '', date: '', chart: '' });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editPageCount, setEditPageCount] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [activeStat, setActiveStat] = useState('page-stats');

  const userDetails = useStore((state) => state.userDetails);

  const screenWidth = Dimensions.get('window').width;

  const PIECOLORS = ['#FF7E5F', '#42D1D1', '#FFBC42', '#9C4DD4', '#45B69C'];

  const timeFrameOptions: PickerOption[] = [
    { label: 'Last week', value: 'last-week', icon: 'calendar-today' },
    { label: 'Last month', value: 'last-month', icon: 'calendar-view-month' },
  ];

  // Fetch functions remain the same...
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
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`
        },
      });
      if (Array.isArray(response.data.data)) {
        setPagesRead(response.data.data);
      } else {
        console.error('Pages read data is not an array:', response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pages read:', error);
    }
  };

  const fetchReadingDurations = async () => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const readingDurationGraphResponse = await instance.get(`${requests.fetchReadingDurationGraph}?${userDetails[0].userId}&timeFrame=${timeFrame}&timezone=${userTimezone}`, {
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`
        },
      });
      const response = readingDurationGraphResponse.data;
      if (Array.isArray(response.data)) {
        setReadingDurations(response.data);
      } else {
        console.error('Reading durations data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch pages read:', error);
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
        params: {
          userId: userDetails[0].userId,
          timeFrame: 'all-time',
        },
      });
      const books = response.data.data.userBooks;
  
      if (Array.isArray(books)) {
        setReadingStatusData(books);
      } else {
        console.error('Books data is not an array:', books);
      }
    } catch (error) {
      console.error('Failed to fetch user books:', error);
    }
  };

  const handleSave = async () => {
    try {
      const updatedPageCount = parseInt(editPageCount, 10);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const updatePagesReadResponse = await instance.post(`${requests.updatePagesRead}?timezone=${userTimezone}`, {
        pageCount: updatedPageCount,
        date: selectedDate
      }, {
          headers: {
            Authorization: `Bearer ${userDetails[0].accessToken}`
          },
      });
      const response = updatePagesReadResponse.data;
      if (response.data.message === "Updated" || response.data.message === "Inserted") {
        alert('Page count updated successfully');
        setIsEditing(false);
        setTooltipPos({ ...tooltipPos, visible: false });
        fetchPagesRead();
      } else {
        console.error('Error updating page count:', response.data.message);
      }
    } catch (error) {
      console.error('Failed to update page count:', error);
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

  // Rest of rendering functions...
  const renderPagesLineChart = (timeDuration) => {
    if (!Array.isArray(pagesRead) || pagesRead.length === 0) {
      return <Text style={styles.highlightText}>No data available</Text>;
    }

    const labelCount = timeDuration === 'last-week' ? 7 : timeDuration === 'last-month' ? 30 : null;

    if (!labelCount) return <Text style={styles.highlightText}>Invalid time frame</Text>;

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const labels = [];
    const dataPoints = Array(labelCount).fill(0);
  
    for (let i = labelCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(
        date.toLocaleDateString("en-CA", { timeZone: userTimezone })  //'en-CA' for YYYY-MM-DD format
      );
    }
  
    pagesRead.forEach(item => {
      const itemDate = new Date(item.dateRead).toLocaleDateString("en-CA", { timeZone: userTimezone });
      const index = labels.indexOf(itemDate);
      if (index !== -1) {
        dataPoints[index] = item.pagesRead;
      }
    });
  
    // Adjust labels to show only first, middle, and last
    const adjustedLabels = labels.map((label, index) => {
      if (index === 0 || index === Math.floor(labels.length / 2) || index === labels.length - 1) {
        return label;
      }
      return '';
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];
  
    return (
      <View>
        <LineChart
          data={{
            labels: adjustedLabels,
            datasets: [
              {
                data: dataPoints,
              },
            ],
          }}
          width={Dimensions.get('window').width - SPACING.space_16 * 2}
          height={220}
          yAxisLabel=""
          yAxisSuffix=" pgs"
          withVerticalLines={false}
          withHorizontalLines={false}
          withInnerLines={false}
          chartConfig={{
            backgroundColor: COLORS.primaryDarkGreyHex,
            backgroundGradientFrom: COLORS.primaryDarkGreyHex,
            backgroundGradientTo: COLORS.primaryDarkGreyHex,
            decimalPlaces: 0,
            color: (opacity = 1) => COLORS.primaryOrangeHex,
            labelColor: (opacity = 1) => COLORS.primaryWhiteHex,
            style: {
              borderRadius: BORDERRADIUS.radius_8,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: COLORS.primaryBlackHex,
            },
          }}
          bezier
          style={{
            marginVertical: SPACING.space_16,
            borderRadius: BORDERRADIUS.radius_8,
          }}
          onDataPointClick={(data) => {
            const { x, y, index } = data;
            const date = labels[index];
            setSelectedDate(date);
            setEditPageCount(dataPoints[index].toString());
            setTooltipPos({
              x,
              y,
              visible: true,
              value: `${dataPoints[index]} pages`,
              date: date,
              chart: 'pages',
            });
            setIsEditing(false);
          }}
        />
        {tooltipPos.visible && tooltipPos.chart === 'pages' && (
          <View style={[styles.tooltip, { top: tooltipPos.y - 30, left: tooltipPos.x - 25 }]}>
          {isEditing ? (
            <View>
              <TextInput
                style={styles.input}
                value={editPageCount}
                onChangeText={(text) => setEditPageCount(text)}
                keyboardType="numeric"
              />
              <TouchableWithoutFeedback onPress={() => handleSave()}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableWithoutFeedback>
            </View>
          ) : (
            <View>
              <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
              <Text style={styles.tooltipText}>{tooltipPos.date}</Text>
              {selectedDate === yesterdayFormatted && (
                <TouchableWithoutFeedback onPress={() => setIsEditing(true)}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableWithoutFeedback>
              )}
            </View>
          )}
        </View>
        )}
      </View>
    );
  };

  const renderDurationLineChart = (timeDuration) => {
    if (!Array.isArray(pagesRead) || pagesRead.length === 0) {
      return <Text style={styles.highlightText}>No data available</Text>;
    }

    const labelCount = timeDuration === 'last-week' ? 7 : timeDuration === 'last-month' ? 30 : null;

    if (!labelCount) return <Text style={styles.highlightText}>Invalid time frame</Text>;

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const labels = [];
    const dataPointsDurations = Array(labelCount).fill(0);
  
    for (let i = labelCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(
        date.toLocaleDateString("en-CA", { timeZone: userTimezone })  //'en-CA' for YYYY-MM-DD format
      );
    }
  
    readingDurations.forEach(item => {
      const itemDate = new Date(item.dateRead).toLocaleDateString("en-CA", { timeZone: userTimezone });
      const index = labels.indexOf(itemDate);
      if (index !== -1) {
        dataPointsDurations[index] = item.duration / 60; // Convert seconds to minutes
      }
    });
  
    // Adjust labels to show only first, middle, and last
    const adjustedLabels = labels.map((label, index) => {
      if (index === 0 || index === Math.floor(labels.length / 2) || index === labels.length - 1) {
        return label;
      }
      return '';
    });
  
    return (
      <View>
        <LineChart
          data={{
            labels: adjustedLabels,
            datasets: [
              {
                data: dataPointsDurations,
              },
            ],
          }}
          width={Dimensions.get('window').width - SPACING.space_16 * 2}
          height={220}
          yAxisLabel=""
          yAxisSuffix=" mins"
          withVerticalLines={false}
          withHorizontalLines={false}
          withInnerLines={false}
          chartConfig={{
            backgroundColor: COLORS.primaryDarkGreyHex,
            backgroundGradientFrom: COLORS.primaryDarkGreyHex,
            backgroundGradientTo: COLORS.primaryDarkGreyHex,
            decimalPlaces: 0,
            color: (opacity = 1) => "#42D1D1",
            labelColor: (opacity = 1) => COLORS.primaryWhiteHex,
            style: {
              borderRadius: BORDERRADIUS.radius_8,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: COLORS.primaryBlackHex,
            },
          }}
          bezier
          style={{
            marginVertical: SPACING.space_16,
            borderRadius: BORDERRADIUS.radius_8,
          }}
          onDataPointClick={(data) => {
            const { x, y, index } = data;
            const date = labels[index];
            setSelectedDate(date);
            setTooltipPos({
              x,
              y,
              visible: true,
              value: `${dataPointsDurations[index]} mins`,
              date: date,
              chart: 'duration',
            });
            setIsEditing(false);
          }}
        />
        {tooltipPos.visible && tooltipPos.chart === 'duration' && (
          <View style={[styles.tooltip, { top: tooltipPos.y - 30, left: tooltipPos.x - 25 }]}>
            <View>
              <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
              <Text style={styles.tooltipText}>{tooltipPos.date}</Text>
            </View>
        </View>
        )}
      </View>
    );
  };

  const renderPieChart = () => {
    if (!Array.isArray(userAverageEmotions) || userAverageEmotions.length === 0) {
      return <Text style={styles.highlightText}>No emotions data available</Text>;
    }
  
    const formattedEmotions = userAverageEmotions.map(emotion => ({
      ...emotion,
      AvgScore: parseFloat(emotion.AvgScore)
    }));


    const chartData = formattedEmotions.map((item, index) => ({
      name: item.Emotion,
      population: item.AvgScore,
      color: PIECOLORS[index % PIECOLORS.length],
      legendFontColor: COLORS.primaryWhiteHex,
      legendFontSize: 15,
    }));

    return (
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
              <Text style={styles.labelText}>{item.name}: {item.population}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderReadingStatusChart = () => {
    if (!Array.isArray(readingStatusData) || readingStatusData.length === 0) {
      return <Text style={styles.highlightText}>No reading status data available</Text>;
    }

    const statusCounts = readingStatusData.reduce((acc, book) => {
      acc[book.Status] = (acc[book.Status] || 0) + 1;
      return acc;
    }, {});

    const data = Object.keys(statusCounts).map((key) => ({
      name: key,
      value: statusCounts[key],
    }));

    // Sort data in descending order based on value
    const sortedData = data.sort((a, b) => b.value - a.value);

    const chartData = sortedData.map((item, index) => ({
      name: item.name,
      population: item.value,
      color: PIECOLORS[index % PIECOLORS.length],
      legendFontColor: COLORS.primaryWhiteHex,
      legendFontSize: 15,
    }));

    return (
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
              <Text style={styles.labelText}>{item.name}: {item.population} {item.population === 1 ? 'book' : 'books'}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // const navigateToMonthlyWrap = () => {
  //   // Navigation logic would go here
  //   console.log("Navigate to monthly wrap");
  // };

  // New tab navigation component
  const renderStatsTabs = () => {
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeStat === 'page-stats' ? styles.activeTab : null]}
          onPress={() => setActiveStat('page-stats')}>
          <Ionicons name="book-outline" size={24} color={activeStat === 'page-stats' ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex} />
          <Text style={[styles.tabText, activeStat === 'page-stats' ? styles.activeTabText : null]}>Page Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeStat === 'time-stats' ? styles.activeTab : null]}
          onPress={() => setActiveStat('time-stats')}>
          <Ionicons name="time-outline" size={24} color={activeStat === 'time-stats' ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex} />
          <Text style={[styles.tabText, activeStat === 'time-stats' ? styles.activeTabText : null]}>Time Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeStat === 'emotion-stats' ? styles.activeTab : null]}
          onPress={() => setActiveStat('emotion-stats')}>
          <Ionicons name="heart-outline" size={24} color={activeStat === 'emotion-stats' ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex} />
          <Text style={[styles.tabText, activeStat === 'emotion-stats' ? styles.activeTabText : null]}>Emotions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeStat === 'progress-stats' ? styles.activeTab : null]}
          onPress={() => setActiveStat('progress-stats')}>
          <Ionicons name="stats-chart-outline" size={24} color={activeStat === 'progress-stats' ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex} />
          <Text style={[styles.tabText, activeStat === 'progress-stats' ? styles.activeTabText : null]}>Progress</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
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
        
        {/* Time Frame Picker */}
        <View style={styles.statusDropdown}>
          <Text style={styles.label}>Time frame: </Text>
          <View style={styles.pickerContainer}>
            {Platform.OS === 'ios' ? (
              <CustomPicker
                options={timeFrameOptions}
                selectedValue={timeFrame}
                onValueChange={(value) => setTimeFrame(value)}
              />
            ) : (
              <Picker
                selectedValue={timeFrame}
                style={styles.picker}
                onValueChange={(itemValue) => setTimeFrame(itemValue)}
                dropdownIconColor={COLORS.primaryWhiteHex}
              >
                <Picker.Item label="Last week" value="last-week" />
                <Picker.Item label="Last month" value="last-month" />
              </Picker>
            )}
          </View>
        </View>

        {/* Tab Navigation */}
        {renderStatsTabs()}
        
        {/* Content based on selected tab */}
        {activeStat === 'page-stats' && (
          <View style={styles.statContainer}>
            <Text style={styles.title}>Pages Read in Last {timeFrame === 'last-week' ? '7 Days' : '30 Days'}</Text>
            <TouchableWithoutFeedback onPress={() => setTooltipPos({ ...tooltipPos, visible: false })}>
              {renderPagesLineChart(timeFrame)}
            </TouchableWithoutFeedback>
          </View>
        )}
        
        {activeStat === 'time-stats' && (
          <View style={styles.statContainer}>
            <Text style={styles.title}>Minutes Read in Last {timeFrame === 'last-week' ? '7 Days' : '30 Days'}</Text>
            {renderDurationLineChart(timeFrame)}
          </View>
        )}
        
        {activeStat === 'emotion-stats' && (
          <View style={styles.statContainer}>
            <Text style={styles.title}>Reading Emotions</Text>
            {renderPieChart()}
          </View>
        )}
        
        {activeStat === 'progress-stats' && (
          <View style={styles.statContainer}>
            <Text style={styles.title}>Reading Progress</Text>
            {renderReadingStatusChart()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatScreen;

const styles = StyleSheet.create({
  ScrollViewFlex: {
    flexGrow: 1,
  },
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
  tooltip: {
    position: 'absolute',
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  highlightText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    textAlign: 'center',
    padding: SPACING.space_20,
  },
  statusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.space_12,
  },
  label: {
    marginRight: SPACING.space_8,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
  },
  pickerContainer: {
    borderRadius: BORDERRADIUS.radius_8,
    width: 200,
  },
  picker: {
    width: '100%',
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
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
  input: {
    height: 40,
    borderColor: COLORS.secondaryLightGreyHex,
    borderWidth: 1,
    borderRadius: BORDERRADIUS.radius_8,
    paddingHorizontal: SPACING.space_8,
    color: COLORS.primaryWhiteHex,
    backgroundColor: COLORS.primaryGreyHex,
    marginBottom: SPACING.space_8,
  },
  saveButton: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    textAlign: 'center',
  },
  editButton: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    textAlign: 'center',
  },
  // New styles for improved UI
  chartCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    marginVertical: SPACING.space_16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    marginVertical: SPACING.space_16,
    padding: SPACING.space_4,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_10,
    flexDirection: 'column',
  },
  activeTab: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_8,
  },
  tabText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    marginTop: SPACING.space_4,
  },
  activeTabText: {
    color: COLORS.primaryOrangeHex,
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
  statContainer: {
    backgroundColor: 'transparent',
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_8,
  },
});