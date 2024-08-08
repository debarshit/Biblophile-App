import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../theme/theme';
import { useStore } from '../store/store';
import instance from '../services/axios';
import requests from '../services/requests';

const StatScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagesRead, setPagesRead] = useState([]);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, value: 0 });
  const [loading, setLoading] = useState(true);

  const userDetails = useStore((state: any) => state.userDetails);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await instance(requests.fetchReadingStreakLeaderboard + userDetails[0].userId);
        const data = response.data;
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchPagesRead() {
      try {
        const response = await instance(requests.fetchPagesRead + userDetails[0].userId);
        const data = response.data;
        setPagesRead(data);
      } catch (error) {
        console.error('Failed to fetch pages read:', error);
      }
    }

    fetchLeaderboard();
    fetchPagesRead();
  }, []);

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

  const renderLineChart = () => {
    const labels = [];
    const dataPoints = Array(7).fill(0);
  
    for (let i = 6; i >= 0; i--) {
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
            const { x, y, value } = data;
            setTooltipPos({ x, y, visible: true, value });
          }}
        />
        {tooltipPos.visible && (
          <View style={[styles.tooltip, { top: tooltipPos.y - 30, left: tooltipPos.x - 25 }]}>
            <Text style={styles.tooltipText}>{tooltipPos.value} pages</Text>
          </View>
        )}
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
    <View style={styles.container}>
      <Text style={styles.title}>Reading Streak Leaderboard</Text>
      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={(item) => item.Rank.toString()}
        contentContainerStyle={styles.listContainer}
      />
      <Text style={styles.title}>Pages Read in Last 7 Days</Text>
      <TouchableWithoutFeedback onPress={() => setTooltipPos({ ...tooltipPos, visible: false })}>
        {renderLineChart()}
      </TouchableWithoutFeedback>
    </View>
  );
};

export default StatScreen;

const styles = StyleSheet.create({
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
});
