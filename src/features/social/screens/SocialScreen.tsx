import { StyleSheet, Text } from 'react-native';
import React from 'react';
import Swiper from "react-native-screens-swiper";
import NewsFeed from './NewsFeed';
import buddyReadsIndex from './BuddyReadsIndex';
import ReadAlongsIndex from './ReadAlongsIndex';
import BookClubsIndex from './BookClubsIndex';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDERRADIUS, COLORS } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';

const SocialScreen = () => {
  const data = [
    {
        tabLabel: 'News Feed',
        component: NewsFeed,
    },
    {
        tabLabel: 'buddy Reads',
        component: buddyReadsIndex,
        props: {}, // (optional) additional props
    },
    {
        tabLabel: 'Read Alongs',
        component: ReadAlongsIndex,
        props: {}, // (optional) additional props
    },
    {
      tabLabel: 'BookClubs',
      component: BookClubsIndex,
      props: {}, // (optional) additional props
  },
  ];

  return (
    <SafeAreaView style={styles.ScreenContainer} >
      {/* App Header */}
      <HeaderBar title="" />

      {/* Swipable Screens */}
      <Swiper
        data={data}
        style={styles}
      />
    </SafeAreaView>
  )
};

export default SocialScreen;

const styles = StyleSheet.create({
  pillButton: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
  },
  pillActive: {
      backgroundColor: COLORS.primaryOrangeHex,
  },
  pillLabel: {
      color: COLORS.secondaryLightGreyHex,
  },
  activeLabel: {
      color: COLORS.primaryWhiteHex,
  },
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
});