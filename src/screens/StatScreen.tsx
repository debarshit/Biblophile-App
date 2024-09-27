import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions, TouchableWithoutFeedback, ScrollView, TextInput } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../theme/theme';
import { useStore } from '../store/store';
import instance from '../services/axios';
import requests from '../services/requests';

const StatScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagesRead, setPagesRead] = useState([]);
  const [userAverageEmotions, setUserAverageEmotions] = useState([]);
  const [readingStatusData, setReadingStatusData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('last-week');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, value: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editPageCount, setEditPageCount] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const userDetails = useStore((state: any) => state.userDetails);

  const screenWidth = Dimensions.get('window').width;

  const PIECOLORS = ['#D17842', '#CD4349', '#3DCDA5', '#F9C74F', '#577590'];

  const fetchLeaderboard = async () => {
    try {
      const response = await instance.get(requests.fetchReadingStreakLeaderboard + userDetails[0].userId);
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
      const response = await instance.get(`${requests.fetchPagesRead}${userDetails[0].userId}&timeFrame=${timeFrame}&timezone=${userTimezone}`);
      if (Array.isArray(response.data)) {
        setPagesRead(response.data);
      } else {
        console.error('Pages read data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch pages read:', error);
    }
  };

  const fetchAverageEmotionsByUser = async () => {
    try {
      const response = await instance.get(`${requests.fetchAverageEmotionsByUser}${userDetails[0].userId}&timeFrame=${timeFrame}`);
      setUserAverageEmotions(response.data.topEmotions);
    } catch (error) {
      console.error('Failed to fetch user emotions:', error);
    }
  };

  const fetchUserBooks = async () => {
    try {
      const response = await instance.post(`${requests.fetchUserBooks}&timeFrame=${timeFrame}`, {userId: userDetails[0].userId});
      const books = response.data.userBooks;
  
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
      const response = await instance.post(`${requests.updatePagesRead}`, {
        userId: userDetails[0].userId,
        pageCount: updatedPageCount,
        date: selectedDate
      });
  
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

  const renderLineChart = (timeDuration) => {
    if (!Array.isArray(pagesRead)) {
      return <Text style={styles.highlightText}>No data available</Text>;
    }

    let labelCount;
    if (timeDuration === 'last-week') {
      labelCount = 7; 
    } else if (timeDuration === 'last-month') {
      labelCount = 30; 
    } else {
      return <Text style={styles.highlightText}>Invalid time frame</Text>;
    }

    const labels = [];
    const dataPoints = Array(labelCount).fill(0);
  
    for (let i = labelCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toISOString().split('T')[0]);
    }
  
    pagesRead.forEach(item => {
      const itemDate = new Date(item.dateRead).toISOString().split('T')[0];
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
            });
            setIsEditing(false);
          }}
        />
        {tooltipPos.visible && (
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
      <View style={{ marginVertical: SPACING.space_16, borderRadius: BORDERRADIUS.radius_8, backgroundColor: COLORS.primaryDarkGreyHex, }}>
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
      <View style={{ marginVertical: SPACING.space_16, borderRadius: BORDERRADIUS.radius_8, backgroundColor: COLORS.primaryDarkGreyHex, }}>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
      <View style={styles.container}>
        <Text style={styles.title}>Reading Streak Leaderboard</Text>
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.Rank.toString()}
          contentContainerStyle={styles.listContainer}
        />
        <View style={styles.statusDropdown}>
          <Text style={styles.label}>Time frame: </Text>
          <Picker
              selectedValue={timeFrame}
              style={styles.picker}
              onValueChange={(itemValue) => setTimeFrame(itemValue)}
          >
              <Picker.Item label="Last week" value="last-week" />
              <Picker.Item label="Last month" value="last-month" />

          </Picker>
          </View>
        <Text style={styles.title}>Pages Read in Last {timeFrame === 'last-week' ? '7 Days' : '30 Days'}</Text>
        <TouchableWithoutFeedback onPress={() => setTooltipPos({ ...tooltipPos, visible: false })}>
          {renderLineChart(timeFrame)}
        </TouchableWithoutFeedback>
        <Text style={styles.title}>Prefer books which evoke</Text>
        {renderPieChart()}
        <Text style={styles.title}>Reading Progress</Text>
        {renderReadingStatusChart()}
      </View>
    </ScrollView>
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
  },
  statusDropdown: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
},
label: {
    marginRight: SPACING.space_8,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_20,
    marginBottom: SPACING.space_12,
},
picker: {
    width: '50%',
    padding: SPACING.space_8,
    borderColor: COLORS.secondaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    backgroundColor: COLORS.primaryGreyHex,
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
});
