import React, { useEffect, useState } from 'react';
import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import { useStore } from '../store/store';
import instance from '../services/axios';
import requests from '../services/requests';
import GradientBGIcon from './GradientBGIcon';
import ProfilePic from './ProfilePic';

interface HeaderBarProps {
  title?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({navigation, route}: any, {title}) => {

  navigation = useNavigation();

  const [streak, setStreak] = useState(null);

  const userDetails = useStore((state: any) => state.userDetails);

  useEffect(() => {
    async function fetchCurrentStreak() {
      try {
        const response = await instance.post(requests.fetchReadingStreak, {
          userId: userDetails[0].userId,
        });
        const data = response.data;
        if (data.message === 1) {
          setStreak(data.currentStreak);
        }
      } catch (error) {
        console.error('Error fetching streak:', error);
      }
    }
  
    fetchCurrentStreak();
  }, [streak]);

    // This useFocusEffect will run each time the component comes into focus
    useFocusEffect(
      React.useCallback(() => {
        async function fetchCurrentStreak() {
          try {
            const response = await instance.post(requests.fetchReadingStreak, {
              userId: userDetails[0].userId,
            });
            const data = response.data;
            if (data.message === 1) {
              setStreak(data.currentStreak);
            }
          } catch (error) {
            console.error('Error fetching streak:', error);
          }
        }
      
        fetchCurrentStreak();
      }, [])
  );

  return (
    <View style={styles.HeaderContainer}>
      {/* <GradientBGIcon
        name="menufold"
        color={COLORS.primaryLightGreyHex}
        size={FONTSIZE.size_16}
      /> */}
      <Image
          source={{uri: "https://ik.imagekit.io/umjnzfgqh/biblophile/common_assets/logos/Biblophile%20logo%20-%20white.png"}}
          style={styles.Image}
        />
      <Text style={styles.HeaderText}>{title}</Text>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('Streaks');
        }}
      >
        <Text style={styles.StreakText}>{streak !== null && `Active Streak: ${streak} days`}</Text>
      </TouchableOpacity>
      <ProfilePic />
    </View>
  );
};

const styles = StyleSheet.create({
  HeaderContainer: {
    padding: SPACING.space_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  StreakText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
  },
  Image: {
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
});

export default HeaderBar;
