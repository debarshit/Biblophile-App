import React, { useEffect, useState } from 'react';
import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import { useStore } from '../store/store';
import instance from '../services/axios';
import requests from '../services/requests';
import Ionicons from '@expo/vector-icons/Ionicons';

interface HeaderBarProps {
  title?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({title}) => {
  const navigation = useNavigation<any>();
  const [streak, setStreak] = useState(null);
  
  const userDetails = useStore((state: any) => state.userDetails);

  const fetchCurrentStreak = async () => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await instance(`${requests.fetchReadingStreak}?timezone=${userTimezone}`, {
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`,
        },
      });
      const data = response.data.data;
      if (data) {
        setStreak(data.currentStreak);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  };

  useEffect(() => {
    fetchCurrentStreak();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchCurrentStreak();
    }, [])
  );

  return (
    <View style={styles.HeaderContainer}>
      <Image
          source={{uri: "https://ik.imagekit.io/umjnzfgqh/biblophile/common_assets/logos/Biblophile%20logo%20-%20white.png"}}
          style={styles.Image}
        />
      <Text style={styles.HeaderText}>{title}</Text>
      {!title && <TouchableOpacity
        onPress={() => {
          navigation.navigate('Streaks');
        }}
      >
        <Text style={styles.StreakText}>{streak !== null && `Active Streak: ${streak} days`}</Text>
      </TouchableOpacity>}
      
      {/* Update Settings to Notifications */}
      <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>  
        <Ionicons name="notifications" size={24} color={COLORS.primaryWhiteHex} />
      </TouchableOpacity>
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
