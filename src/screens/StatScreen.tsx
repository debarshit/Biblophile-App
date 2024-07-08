import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../theme/theme';
import { useStore } from '../store/store';
import instance from '../services/axios';
import requests from '../services/requests';

const StatScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagesRead, setPagesRead] = useState([]);
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

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.rank}>{item.Rank}</Text>
      <Text style={styles.username}>{item.UserName}</Text>
      <Text style={styles.streak}>{item.CurrentStreak} days</Text>
    </View>
  );

  const renderBarChart = () => {
    const labels = ["Day Before", "Yesterday", "Today"];
    const bars = [0, 0, 0];

    pagesRead.forEach(item => {
      const dayDiff = Math.floor((new Date().getTime() - new Date(item.dateRead).getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff <= 2) {
        bars[2 - dayDiff] = item.pagesRead;
      }
    });

    return (
      <View style={styles.barChartContainer}>
        {bars.map((pages, index) => (
          <View key={index} style={styles.barContainer}>
            <Text style={styles.barValue}>{pages}</Text>
            <View style={[styles.bar, { height: pages * 10 }]} />
            <Text style={styles.barLabel}>{labels[index]}</Text>
          </View>
        ))}
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
      <Text style={styles.title}>Pages Read in Last 3 Days</Text>
      {renderBarChart()}
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
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: SPACING.space_16,
    marginTop: SPACING.space_16,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: SPACING.space_16,
    backgroundColor: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_8,
  },
  barLabel: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
  },
  barValue: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
  },
  noDataText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginTop: SPACING.space_16,
  },
});
