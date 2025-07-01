import { StyleSheet } from 'react-native';
import React from 'react';
import Swiper from "react-native-screens-swiper";
import NewsFeed from './NewsFeed';
import buddyReadsIndex from './BuddyReadsIndex';
import ReadAlongsIndex from './ReadAlongsIndex';
import BookClubsIndex from './BookClubsIndex';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDERRADIUS, COLORS } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';

const SocialScreen = ({ route }) => {
  const { initialTab } = route.params || {};

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
    // {
    //   tabLabel: 'Book Clubs',
    //   component: BookClubsIndex,
    //   props: {}, // (optional) additional props
    // },
  ];

  const initialIndex = data.findIndex(item => item.tabLabel === initialTab);

  return (
    <SafeAreaView style={styles.ScreenContainer} >
      {/* App Header */}
      <HeaderBar title="" />

      {/* Swipable Screens */}
      <Swiper
        data={data}
        style={styles}
        index={initialIndex >= 0 ? initialIndex : 0}
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